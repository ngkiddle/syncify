// Live log viewer: mirrors console output (server + forwarded browser logs) to
// http://localhost:5000/logs over server-sent events.
const util = require('util');

const history = [];
const clients = new Set();
const maxHistory = 500;

function push(level, args) {
  const line = {
    time: new Date().toISOString().slice(11, 23),
    level: level,
    text: util.format(...args),
  };
  history.push(line);
  if (history.length > maxHistory) history.shift();
  const msg = `data: ${JSON.stringify(line)}\n\n`;
  clients.forEach(res => res.write(msg));
}

// Wrap console so every existing console.log/error call also goes to the stream
['log', 'info', 'warn', 'error'].forEach(level => {
  const original = console[level].bind(console);
  console[level] = (...args) => {
    original(...args);
    push(level, args);
  };
});

const page = `<!doctype html>
<html><head><meta charset="utf-8"><title>Syncify Logs</title>
<style>
  body{margin:0;background:#1e1e1e;color:#ddd;font:13px/1.5 Consolas,monospace}
  header{position:sticky;top:0;background:#333;padding:6px 12px;display:flex;gap:12px;align-items:center}
  #log{padding:8px 12px;white-space:pre-wrap;word-break:break-word}
  .warn{color:#e5c07b}.error{color:#ef6b73}.browser{color:#61afef}.t{color:#777}
</style></head>
<body><header><b>Syncify logs</b>
<label><input type="checkbox" id="follow" checked> follow</label>
<input id="filter" placeholder="filter">
<button onclick="log.innerHTML=''">clear</button><span id="status"></span></header>
<div id="log"></div>
<script>
  const log = document.getElementById('log');
  const filter = document.getElementById('filter');
  function add(l){
    const div = document.createElement('div');
    div.className = l.level + (l.text.startsWith('[browser]') ? ' browser' : '');
    div.innerHTML = '<span class="t">' + l.time + '</span> ';
    div.appendChild(document.createTextNode(l.text));
    div.hidden = filter.value && !l.text.includes(filter.value);
    log.appendChild(div);
    if (document.getElementById('follow').checked) window.scrollTo(0, document.body.scrollHeight);
  }
  filter.oninput = () => [...log.children].forEach(d => d.hidden = filter.value && !d.textContent.includes(filter.value));
  const es = new EventSource('/api/logs');
  es.onmessage = e => add(JSON.parse(e.data));
  es.onopen = () => status.textContent = 'connected';
  es.onerror = () => status.textContent = 'disconnected (retrying)';
</script></body></html>`;

function attach(app) {
  app.get('/logs', (req, res) => res.send(page));

  app.get('/api/logs', (req, res) => {
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' });
    res.flushHeaders();
    history.forEach(line => res.write(`data: ${JSON.stringify(line)}\n\n`));
    clients.add(res);
    req.on('close', () => clients.delete(res));
  });

  // Browser-side events, so Spotify/client problems show up next to server logs
  app.post('/api/clientLog', (req, res) => {
    const level = ['warn', 'error'].includes(req.body.level) ? req.body.level : 'log';
    console[level]('[browser] ' + req.body.message);
    res.send({ ok: true });
  });
}

module.exports = { attach };
