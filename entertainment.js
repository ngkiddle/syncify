// Hue Entertainment API streaming: DTLS over UDP 2100 to the bridge, updating every light
// in an entertainment area in one packet. Unlike REST there is no per-command rate limit,
// but the bridge drops the session if it doesn't hear from us for ~10s.
const { dtls } = require('node-dtls-client');

const sendHz = 50;
const smoothingMs = 80;     // eases each 200ms loudness frame instead of hard steps
var colorFadeMs = 80;       // set from the color change speed slider
const retryMs = 5000;
const defaultXY = [0.3127, 0.3290];

var session = undefined;
var starting = false;
var lastFailure = 0;

// lightId -> channel ids for an area, plus the API so we can stop it later
async function mapChannels(api, config) {
  const [lights, services] = await Promise.all([api.getLights(), api.getEntertainmentServices()]);
  const lightByDevice = {};
  lights.forEach(l => { lightByDevice[l.owner.rid] = l.id; });
  const deviceByService = {};
  services.forEach(s => { deviceByService[s.id] = s.owner.rid; });

  const channelsByLight = {};
  config.channels.forEach(ch => {
    ch.members.forEach(m => {
      const lightId = lightByDevice[deviceByService[m.service.rid]];
      if (lightId === undefined) return;
      (channelsByLight[lightId] = channelsByLight[lightId] || []).push(ch.channel_id);
    });
  });
  return channelsByLight;
}

// Starts streaming to an area if it isn't already. Returns the session once ready, or
// undefined while connecting or unavailable (callers fall back to REST meanwhile).
function ensure(api, areaId) {
  if (session && session.areaId === areaId) return session.ready ? session : undefined;
  if (session) stop();
  if (starting || !api.clientKey || Date.now() - lastFailure < retryMs) return undefined;

  starting = true;
  start(api, areaId)
    .catch(err => {
      lastFailure = Date.now();
      console.error('entertainment stream failed to start: ' + err.message);
      stop();
    })
    .finally(() => { starting = false; });
  return undefined;
}

async function start(api, areaId) {
  const configs = await api.getEntertainmentConfigs();
  const config = configs.find(c => c.id === areaId);
  if (!config) throw Error('entertainment area not found: ' + areaId);

  const [channelsByLight, appId] = await Promise.all([mapChannels(api, config), api.getApplicationId()]);
  await api.setEntertainmentAction(areaId, 'start');

  session = {
    api: api,
    areaId: areaId,
    name: config.metadata.name,
    channelsByLight: channelsByLight,
    channels: {},       // channelId -> {target: [x, y, bri], current: [x, y, bri]}
    sequence: 0,
    ready: false,
    socket: undefined,
    timer: undefined,
  };
  const s = session;

  s.socket = dtls.createSocket({
    type: 'udp4',
    address: api.ip,
    port: 2100,
    psk: { [appId || api.appKey]: Buffer.from(api.clientKey, 'hex') },
    cipherSuites: ['TLS_PSK_WITH_AES_128_GCM_SHA256'],
    timeout: 3000,
  });

  await new Promise((resolve, reject) => {
    s.socket.on('connected', resolve);
    s.socket.on('error', reject);
  });
  s.socket.on('error', err => console.error('entertainment stream error: ' + err.message));
  s.socket.on('close', () => {
    if (session === s) {
      console.log('entertainment stream closed by bridge');
      lastFailure = Date.now();
      stop();
    }
  });

  s.ready = true;
  s.timer = setInterval(() => send(s), 1000 / sendHz);
  console.log(`entertainment stream started: "${s.name}" (${Object.keys(channelsByLight).length} lights, ` +
    `${config.channels.length} channels)`);
}

// Light ids the active stream controls; the rest stay on the REST queue
function lightIds() {
  return session && session.ready ? Object.keys(session.channelsByLight) : [];
}

// state uses the same v1-style shape as REST: {bri 1-254, xy [x, y], on}
function setLight(lightId, state) {
  if (!session || !session.ready) return;
  (session.channelsByLight[lightId] || []).forEach(chId => {
    const ch = session.channels[chId] || (session.channels[chId] = {
      target: [defaultXY[0], defaultXY[1], 1],
      current: [defaultXY[0], defaultXY[1], 0],
    });
    if (state.xy) {
      ch.target[0] = state.xy[0];
      ch.target[1] = state.xy[1];
    }
    if ('bri' in state) {
      ch.target[2] = state.bri / 254;
    }
  });
}

function send(s) {
  const alpha = 1 - Math.exp(-(1000 / sendHz) / smoothingMs);
  const colorAlpha = 1 - Math.exp(-(1000 / sendHz) / colorFadeMs);
  const ids = Object.keys(s.channels);
  if (ids.length === 0) return;

  const header = Buffer.concat([
    Buffer.from('HueStream', 'ascii'),
    Buffer.from([0x02, 0x00]),              // API version 2.0
    Buffer.from([s.sequence]),
    Buffer.from([0x00, 0x00]),              // reserved
    Buffer.from([0x01]),                    // color space: XY + brightness
    Buffer.from([0x00]),                    // reserved
    Buffer.from(s.areaId, 'ascii'),         // entertainment configuration id (36 chars)
  ]);
  s.sequence = (s.sequence + 1) & 0xff;

  const body = Buffer.alloc(ids.length * 7);
  ids.forEach((chId, i) => {
    const ch = s.channels[chId];
    // x, y fade at the color speed; brightness stays tight to the music
    ch.current[0] += (ch.target[0] - ch.current[0]) * colorAlpha;
    ch.current[1] += (ch.target[1] - ch.current[1]) * colorAlpha;
    ch.current[2] += (ch.target[2] - ch.current[2]) * alpha;
    const o = i * 7;
    body.writeUInt8(Number(chId), o);
    body.writeUInt16BE(Math.round(clamp01(ch.current[0]) * 0xffff), o + 1);
    body.writeUInt16BE(Math.round(clamp01(ch.current[1]) * 0xffff), o + 3);
    body.writeUInt16BE(Math.round(clamp01(ch.current[2]) * 0xffff), o + 5);
  });
  s.socket.send(Buffer.concat([header, body]));
}

function setColorFade(ms) {
  colorFadeMs = ms;
}

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

function stop() {
  const s = session;
  session = undefined;
  if (!s) return;
  clearInterval(s.timer);
  if (s.socket) {
    try { s.socket.close(); } catch (err) { /* already closed */ }
  }
  s.api.setEntertainmentAction(s.areaId, 'stop')
    .catch(err => console.log('entertainment stop failed: ' + err.message));
  if (s.ready) console.log(`entertainment stream stopped: "${s.name}"`);
}

module.exports = { ensure, lightIds, setLight, setColorFade, stop };
