// Minimal Hue CLIP API v2 client (works with the Hue Bridge Pro and the v2 square bridge).
// v2 is HTTPS-only, authenticates with the `hue-application-key` header, and identifies
// lights by UUID instead of the numeric ids of the old v1 API.
const https = require('https');
const fetch = require('node-fetch');

const deviceType = 'syncify#server';

// Bridges serve a certificate signed by the Signify private CA, so Node can't verify it
// without the Hue root cert. We're talking to a LAN device by IP, so accept it.
const agent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

class HueError extends Error {
  constructor(message, type) {
    super(message);
    this.type = type;
  }
}

async function request(ip, path, { method = 'GET', appKey, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (appKey) {
    headers['hue-application-key'] = appKey;
  }
  const response = await fetch(`https://${ip}${path}`, {
    method,
    headers,
    agent,
    timeout: 5000,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const desc = json.errors && json.errors.length ? json.errors.map(e => e.description).join('; ') : response.statusText;
    throw new HueError(`Hue ${method} ${path} failed (${response.status}): ${desc}`, response.status);
  }
  return json;
}

// Cloud discovery. It's rate limited, so a 429 here is common when refreshing a lot.
async function discoverBridges() {
  const response = await fetch('https://discovery.meethue.com/', { timeout: 5000 });
  if (response.status !== 200) {
    throw new HueError(`Bridge discovery failed (${response.status})`, response.status);
  }
  const found = await response.json();
  return Promise.all(found.map(async b => {
    const config = await getBridgeConfig(b.internalipaddress).catch(() => ({}));
    return {
      ip: b.internalipaddress,
      id: b.id,
      name: config.name || 'Hue Bridge',
      model: config.modelid,
    };
  }));
}

// Unauthenticated config: name, bridgeid, modelid (BSB003 = Bridge Pro), swversion.
async function getBridgeConfig(ip) {
  return request(ip, '/api/0/config');
}

// Pairing still goes through /api. The link button must have been pressed within
// the last 30 seconds, otherwise the bridge answers with error type 101.
async function createAppKey(ip) {
  const result = await request(ip, '/api', {
    method: 'POST',
    body: { devicetype: deviceType, generateclientkey: true },
  });
  const entry = result[0] || {};
  if (entry.error) {
    throw new HueError(entry.error.description, entry.error.type);
  }
  return { appKey: entry.success.username, clientKey: entry.success.clientkey };
}

function connect(ip, appKey) {
  return {
    ip,
    appKey,

    async getLights() {
      const result = await request(ip, '/clip/v2/resource/light', { appKey });
      return result.data;
    },

    // Rooms list their member devices in `children`; lights point at their device via `owner`
    async getRooms() {
      const result = await request(ip, '/clip/v2/resource/room', { appKey });
      return result.data;
    },

    setLight(id, state) {
      return request(ip, `/clip/v2/resource/light/${id}`, { method: 'PUT', appKey, body: state });
    },
  };
}

// Translate the v1-style state the sync workers send ({on, bri 1-254, xy [x, y]})
// into a v2 light body ({on: {on}, dimming: {brightness 0-100}, color: {xy: {x, y}}}).
function toV2State(state) {
  const body = {};
  if ('on' in state) {
    body.on = { on: state.on };
  }
  if ('bri' in state) {
    body.dimming = { brightness: Math.min(100, Math.max(1, (state.bri / 254) * 100)) };
  }
  if ('xy' in state) {
    body.color = { xy: { x: state.xy[0], y: state.xy[1] } };
  }
  return body;
}

module.exports = { HueError, discoverBridges, getBridgeConfig, createAppKey, connect, toV2State };
