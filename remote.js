// Remote control over the home network: shared sync settings, live updates to every open
// page (server-sent events), player commands relayed to the computer, and a PIN for any
// device other than this computer.
const fs = require('fs');
const crypto = require('crypto');

const pinFile = __dirname + '/.remote-pin';
const maxAttempts = 5;
const lockoutMs = 60 * 1000;

var settings = undefined;   // {options, sync: {lightId: bool}} - undefined until the computer page posts
var status = {};            // {track, playing, liveSync} reported by the computer page
const clients = new Set();
var failures = 0;
var lockedUntil = 0;

function loadPin() {
  try {
    return fs.readFileSync(pinFile, 'utf8').trim();
  } catch (err) {
    const pin = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    fs.writeFileSync(pinFile, pin);
    return pin;
  }
}
const pin = loadPin();

// The API server only listens on localhost, so remote devices arrive through the dev server's
// proxy, which appends the real client address as the last X-Forwarded-For entry.
function isLocal(req) {
  const forwarded = (req.headers['x-forwarded-for'] || '').split(',').map(s => s.trim()).filter(Boolean);
  const ip = forwarded.length ? forwarded[forwarded.length - 1] : req.socket.remoteAddress;
  return ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip);
}

function hasPin(req) {
  const match = (req.headers.cookie || '').match(/(?:^|;\s*)syncify_pin=(\d+)/);
  const given = match ? match[1] : '';
  return given.length === pin.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(pin));
}

function broadcast(event) {
  const msg = `data: ${JSON.stringify(event)}\n\n`;
  clients.forEach(res => res.write(msg));
}

// Calls onIdle once no page (computer tab or phone remote) has been connected for idleMinutes.
// The countdown also runs from startup, in case the page is never opened.
var idleTimer = undefined;
var idleConfig = {minutes: 0, onIdle: undefined};

function startIdleCountdown() {
  clearTimeout(idleTimer);
  if (!idleConfig.minutes || !idleConfig.onIdle) return;
  idleTimer = setTimeout(() => {
    if (clients.size === 0) {
      console.log(`no Syncify pages open for ${idleConfig.minutes} minutes, shutting down`);
      idleConfig.onIdle();
    }
  }, idleConfig.minutes * 60 * 1000);
}

function attach(app, {idleMinutes, onIdle} = {}) {
  console.log(`remote control PIN: ${pin}`);
  idleConfig = {minutes: idleMinutes, onIdle: onIdle};
  startIdleCountdown();

  app.post('/api/remote/login', (req, res) => {
    if (Date.now() < lockedUntil) {
      return res.status(429).send({ok: false, error: 'Too many attempts, wait a minute.'});
    }
    if (String(req.body.pin) !== pin) {
      failures++;
      if (failures >= maxAttempts) {
        failures = 0;
        lockedUntil = Date.now() + lockoutMs;
        console.log('remote login locked for a minute after repeated wrong PINs');
      }
      return res.status(401).send({ok: false, error: 'Wrong PIN'});
    }
    failures = 0;
    res.cookie('syncify_pin', pin, {httpOnly: true, secure: true, sameSite: 'strict', maxAge: 365 * 24 * 3600 * 1000});
    console.log('remote device logged in');
    res.send({ok: true});
  });

  // everything else under /api needs the PIN unless it comes from this computer
  app.use('/api', (req, res, next) => {
    if (req.path === '/remote/login' || isLocal(req) || hasPin(req)) return next();
    res.status(401).send({ok: false, needsPin: true});
  });

  app.get('/api/settings', (req, res) => res.send({settings: settings, status: status}));

  app.post('/api/settings', (req, res) => {
    settings = {options: req.body.options, sync: req.body.sync};
    broadcast({type: 'settings', settings: settings, from: req.body.clientId});
    res.send({ok: true});
  });

  app.post('/api/status', (req, res) => {
    status = Object.assign(status, req.body);
    broadcast({type: 'status', status: status});
    res.send({ok: true});
  });

  // play / pause / next / previous / stopLive, carried out by the computer page
  app.post('/api/command', (req, res) => {
    broadcast({type: 'command', command: req.body.command});
    res.send({ok: true});
  });

  app.get('/api/events', (req, res) => {
    // no-transform stops the dev server's compression from buffering the stream
    res.set({'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive'});
    res.flushHeaders();
    res.write(`data: ${JSON.stringify({type: 'hello', settings: settings, status: status})}\n\n`);
    clients.add(res);
    clearTimeout(idleTimer);
    req.on('close', () => {
      clients.delete(res);
      if (clients.size === 0) startIdleCountdown();
    });
  });
}

module.exports = { attach, isLocal };
