// Live audio sync: the browser sends loudness frames, this turns them into light states
// (same rules as segments.js) and feeds them to the bridge within its command budget.

// Hue's guidance is ~10 light commands/sec over REST; raise to experiment with the Bridge Pro.
const cmdsPerSec = Number(process.env.HUE_CMDS_PER_SEC) || 10;
const maxInFlight = 3;
const { toV2State } = require('./hueClient');
const entertainment = require('./entertainment');

var hueapi = undefined;
var lights = {};        // id -> {state, dirty, lastSent}
var prevBri = 0;
var xy = rgbToXY();
var timer = undefined;
var inFlight = 0;
var stats = {frames: 0, sent: 0, failed: 0};
var lastColorChange = 0;
var paletteIndex = -1;
var shuffled = {};      // id -> {xy, index}: per-light colors when shuffle is on

// palette: {colors: ['#RRGGBB', ...], maxBri?, shuffle?} from the client; empty colors = random.
// With shuffle each light picks its own palette color; otherwise they all share one.
function frame(api, frameLights, bri, options, palette) {
  hueapi = api;
  stats.frames++;
  const shuffle = Boolean(palette && palette.shuffle);

  // same color-change rule as segments.js, held back by the color change speed slider
  const now = Date.now();
  const intervalMs = (Number(options.colorInterval) || 0) * 1000;
  const briDif = prevBri - bri;
  const changeColor = (bri > 115 || briDif < -15 || briDif > 15) && now - lastColorChange >= intervalMs;
  if (changeColor) {
    const next = nextColor(palette, paletteIndex);
    xy = next.xy;
    paletteIndex = next.index;
    lastColorChange = now;
  }
  prevBri = bri;

  if (shuffle) {
    frameLights.forEach(id => {
      if (changeColor || !shuffled[id]) {
        shuffled[id] = nextColor(palette, shuffled[id] ? shuffled[id].index : -1);
      }
    });
  } else {
    shuffled = {};
  }

  if (palette && palette.maxBri) {
    bri = Math.max(1, Math.round(bri * palette.maxBri));
  }
  // slower color changes also fade in more gently on streamed lights
  entertainment.setColorFade(Math.min(1500, Math.max(80, intervalMs * 0.4)));

  const stateFor = lightXY => {
    if (options.brightnessShift && !options.colorShift) {
      return {bri: bri, on: true};
    } else if (!options.brightnessShift && options.colorShift) {
      return {xy: lightXY, on: true};
    } else if (options.brightnessShift && options.colorShift) {
      return {bri: bri, xy: lightXY, on: true};
    }
    return undefined;
  };
  if (stateFor(xy) === undefined) return;

  // lights in the chosen entertainment area are streamed; the rest use REST
  const streamed = new Set();
  if (options.entertainmentArea) {
    if (entertainment.ensure(api, options.entertainmentArea)) {
      entertainment.lightIds().forEach(id => streamed.add(id));
    }
  } else {
    entertainment.stop();
  }

  // drop lights that are no longer synced or are now streamed
  Object.keys(lights).forEach(id => {
    if (!frameLights.includes(id) || streamed.has(id)) delete lights[id];
  });
  const colors = {};
  frameLights.forEach(id => {
    const lightXY = shuffle ? shuffled[id].xy : xy;
    const state = stateFor(lightXY);
    if (state.xy) colors[id] = state.xy;
    if (streamed.has(id)) {
      entertainment.setLight(id, state);
      return;
    }
    queue(id, state);
  });
  start();
  // lets the UI tint each synced light's switch with the color it's being sent
  return options.colorShift ? colors : undefined;
}

// merge into any unsent state so a brightness-only frame doesn't drop a pending static color
function queue(id, state) {
  const l = lights[id] || (lights[id] = {lastSent: 0});
  l.state = l.dirty ? Object.assign({}, l.state, state) : state;
  l.dirty = true;
}

// Static colors when color sync is off: one palette color for every light, or (shuffle)
// a separate one per light. They then hold while brightness keeps following the music.
function applyStatic(api, lightIds, palette) {
  hueapi = api;
  const streamed = new Set(entertainment.lightIds());
  const shared = nextColor(palette, paletteIndex);
  paletteIndex = shared.index;
  const colors = {};
  lightIds.forEach(id => {
    const pick = palette && palette.shuffle ? nextColor(palette, shuffled[id] ? shuffled[id].index : -1) : shared;
    shuffled[id] = pick;
    colors[id] = pick.xy;
    if (streamed.has(id)) {
      entertainment.setLight(id, {xy: pick.xy});
    } else {
      queue(id, {xy: pick.xy, on: true});
    }
  });
  start();
  return colors;
}

function start() {
  if (timer !== undefined) return;
  console.log(`live sync started (${cmdsPerSec} light commands/sec budget)`);
  timer = setInterval(tick, 1000 / cmdsPerSec);
  statsTimer = setInterval(logStats, 5000);
}

var statsTimer = undefined;
function logStats() {
  const synced = Object.keys(lights).length;
  const perLight = synced ? (synced / cmdsPerSec).toFixed(1) : 0;
  console.log(`live sync: ${stats.frames} frames, ${stats.sent} commands sent, ${stats.failed} failed in 5s ` +
    `(${synced} lights, each refreshed ~every ${perLight}s)`);
  stats = {frames: 0, sent: 0, failed: 0};
}

// send the stalest pending light state, one command per tick
function tick() {
  if (hueapi === undefined || inFlight >= maxInFlight) return;
  var next = undefined;
  Object.keys(lights).forEach(id => {
    const l = lights[id];
    if (l.dirty && (next === undefined || l.lastSent < lights[next].lastSent)) next = id;
  });
  if (next === undefined) return;

  const l = lights[next];
  l.dirty = false;
  l.lastSent = Date.now();
  inFlight++;
  hueapi.setLight(next, toV2State(l.state))
    .then(() => { stats.sent++; })
    .catch(err => {
      stats.failed++;
      console.log('live sync light command failed: ' + err.message);
    })
    .finally(() => { inFlight--; });
}

function stop() {
  entertainment.stop();
  if (timer === undefined) return;
  clearInterval(timer);
  clearInterval(statsTimer);
  timer = undefined;
  statsTimer = undefined;
  lights = {};
  console.log('live sync stopped');
}

// {xy, index}: a palette color other than the previous index, or random without a palette
function nextColor(palette, previous) {
  if (!palette || !palette.colors || palette.colors.length === 0) {
    return {xy: rgbToXY(), index: -1};
  }
  var i = Math.floor(Math.random() * palette.colors.length);
  if (palette.colors.length > 1 && i === previous) {
    i = (i + 1) % palette.colors.length;
  }
  return {xy: hexToXY(palette.colors[i]), index: i};
}

// sRGB hex -> CIE xy using the same gamma and wide-gamut matrix as rgbToXY
function hexToXY(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const lin = c => {
    c = c / 255;
    return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
  };
  const r = lin((n >> 16) & 0xff);
  const g = lin((n >> 8) & 0xff);
  const b = lin(n & 0xff);
  const X = r * 0.664511 + g * 0.154324 + b * 0.162028;
  const Y = r * 0.283881 + g * 0.668433 + b * 0.047685;
  const Z = r * 0.000088 + g * 0.072310 + b * 0.986039;
  const sum = X + Y + Z;
  return sum === 0 ? [0.3127, 0.3290] : [X / sum, Y / sum];
}

function rgbToXY(){
  let red = Math.random() % 255;
  let green = Math.random() % 255;
  let blue = Math.random() % 255;

  let redC =  (red / 255)
  let greenC = (green / 255)
  let blueC = (blue / 255)

  let redN = (redC > 0.04045) ? Math.pow((redC + 0.055) / (1.0 + 0.055), 2.4): (redC / 12.92)
  let greenN = (greenC > 0.04045) ? Math.pow((greenC + 0.055) / (1.0 + 0.055), 2.4) : (greenC / 12.92)
  let blueN = (blueC > 0.04045) ? Math.pow((blueC + 0.055) / (1.0 + 0.055), 2.4) : (blueC / 12.92)

  let X = redN * 0.664511 + greenN * 0.154324 + blueN * 0.162028;
  let Y = redN * 0.283881 + greenN * 0.668433 + blueN * 0.047685;
  let Z = redN * 0.000088 + greenN * 0.072310 + blueN * 0.986039;

  let x = X / (X + Y + Z);
  let y = Y / (X + Y + Z);

  return [x, y];
}

module.exports = { frame, applyStatic, stop };
