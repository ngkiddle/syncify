// Live audio sync: the browser sends loudness frames, this turns them into light states
// (same rules as segments.js) and feeds them to the bridge within its command budget.

// Hue's guidance is ~10 light commands/sec over REST; raise to experiment with the Bridge Pro.
const cmdsPerSec = Number(process.env.HUE_CMDS_PER_SEC) || 10;
const maxInFlight = 3;
const { toV2State } = require('./hueClient');

var hueapi = undefined;
var lights = {};        // id -> {state, dirty, lastSent}
var prevBri = 0;
var xy = rgbToXY();
var timer = undefined;
var inFlight = 0;
var stats = {frames: 0, sent: 0, failed: 0};

function frame(api, frameLights, bri, options) {
  hueapi = api;
  stats.frames++;

  // same color-change rule as segments.js
  const briDif = prevBri - bri;
  if (bri > 115 || briDif < -15 || briDif > 15) {
    xy = rgbToXY();
  }
  prevBri = bri;

  var state = undefined;
  if (options.brightnessShift && !options.colorShift) {
    state = {bri: bri, on: true};
  } else if (!options.brightnessShift && options.colorShift) {
    state = {xy: xy, on: true};
  } else if (options.brightnessShift && options.colorShift) {
    state = {bri: bri, xy: xy, on: true};
  }

  // drop lights that are no longer synced
  Object.keys(lights).forEach(id => {
    if (!frameLights.includes(id)) delete lights[id];
  });
  if (state === undefined) return;
  frameLights.forEach(id => {
    const l = lights[id] || (lights[id] = {lastSent: 0});
    l.state = state;
    l.dirty = true;
  });
  start();
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
  if (timer === undefined) return;
  clearInterval(timer);
  clearInterval(statsTimer);
  timer = undefined;
  statsTimer = undefined;
  lights = {};
  console.log('live sync stopped');
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

module.exports = { frame, stop };
