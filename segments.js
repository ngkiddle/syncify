import { expose } from "threads/worker"
const thrd = require("threads");
const fetch = require('node-fetch');

expose (async function segments(segments, progress, trackDur, t) {
  var d = new Date();
  var latency = d.getTime() - t;
  var compensate = progress + latency;
  while (!(compensate in segments)){
    compensate++;
  }
  var ms = compensate;
  var prevBri = 1;
  var xy = rgbToXY();
  while(ms <= trackDur && ms in segments){
    var dur = segments[ms].duration;
    var bri = segments[ms].loudness;
    // xy = rgbToXY();
    await changeBri(1, bri);
    await changeBri(2, bri);
    await changeBri(3, bri);
    sleep(dur);
    ms += dur;
    prevBri = bri;
    console.log("Sec:   " + ms/1000 + "  \t|   Brightness:   " + (bri));
  }
  console.log("=============== FELL OUT OF SEGMENT LOOP ================")
  return;
});

  
const changeBri = async (id, bri, xy) => {
  const response = await fetch('http://localhost:3000/api/setLight', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: id,
                            state: {bri: bri, xy: xy} }),
  });
  //post the data to server
}

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

function rgbToXY(){
  let red = Math.random() % 255;
  let green = Math.random() % 255;
  let blue = Math.random() % 255;

  let redC =  (red / 255)
  let greenC = (green / 255)
  let blueC = (blue / 255)
  // console.log(redC, greenC , blueC)


  let redN = (redC > 0.04045) ? Math.pow((redC + 0.055) / (1.0 + 0.055), 2.4): (redC / 12.92)
  let greenN = (greenC > 0.04045) ? Math.pow((greenC + 0.055) / (1.0 + 0.055), 2.4) : (greenC / 12.92)
  let blueN = (blueC > 0.04045) ? Math.pow((blueC + 0.055) / (1.0 + 0.055), 2.4) : (blueC / 12.92)
  // console.log(redN, greenN, blueN)

  let X = redN * 0.664511 + greenN * 0.154324 + blueN * 0.162028;
  let Y = redN * 0.283881 + greenN * 0.668433 + blueN * 0.047685;
  let Z = redN * 0.000088 + greenN * 0.072310 + blueN * 0.986039;
  // console.log(X, Y, Z)

  let x = X / (X + Y + Z);

  let y = Y / (X + Y + Z);

  X = x * 65536 
  Y = y * 65536

  return [x, y];
}

export default sync