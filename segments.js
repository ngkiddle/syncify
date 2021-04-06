import { expose } from "threads/worker"
const thrd = require("threads");
const fetch = require('node-fetch');

expose (async function segments(segments, progress, trackDur, t, lights, options) {
  var d = new Date();
  var latency = d.getTime() - t;
  var compensate = progress + latency;
  while (!(compensate in segments)){
    compensate++;
  }
  var ms = compensate;
  var xy = rgbToXY();
  var prevBri = 0;
  var lastLag = 0;
  while(ms <= trackDur && ms in segments){
    var startDate = new Date();
    var startT = startDate.getTime();
    var dur = segments[ms].duration;
    var bri = segments[ms].loudness;
    var briDif = prevBri - bri;
    if(bri > 115 || briDif < -15 || briDif > 15){
      xy = rgbToXY();
    }
    for (var i = 0; i < lights.length; i++){
      if(options.brightnessShift && !(options.colorShift)){
        await changeBri(lights[i], bri);
      }
      else if (!(options.brightnessShift) && options.colorShift){
        await changeColor(lights[i], xy)
      }
      else if (options.brightnessShift && options.colorShift){
        await changeColorAndBrightness(lights[i], bri, xy);
      }
      else{
        return;
      }
    }
    console.log("Sec:   " + ms/1000 + "    \t|   Brightness:   " + (bri));
    var endDate = new Date();
    var endT = endDate.getTime();
    var lag = endT - startT;
    sleep(dur - lastLag);
    lastLag = lag;
    ms += dur;
  }
  console.log("=============== FELL OUT OF SEGMENT LOOP ================")
  return;
});

  
const changeBri = async (id, bri) => {
  const response = await fetch('http://localhost:5000/api/setLight', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: id,
      state: {bri: bri} 
    })
  });
}
const changeColor = async (id, xy) => {
  const response = await fetch('http://localhost:5000/api/setLight', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: id,
      state: {xy: xy} 
    })
  });
}
const changeColorAndBrightness = async (id, bri, xy) => {
  const response = await fetch('http://localhost:5000/api/setLight', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: id,
      state: {bri: bri, xy: xy} 
    })
  });
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
  X = x * 65536 
  Y = y * 65536

  return [x, y];
}

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}
