import { expose } from "threads/worker"
const thrd = require("threads");
const fetch = require('node-fetch');

expose (async function segments(segments, progress, trackDur, t, lights) {
  var d = new Date();
  var latency = d.getTime() - t;
  var compensate = progress + latency;
  while (!(compensate in segments)){
    compensate++;
  }
  var ms = compensate;

  while(ms <= trackDur && ms in segments){
    var dur = segments[ms].duration;
    var bri = segments[ms].loudness;
    for (var i = 0; i < lights.length; i++){
      await changeBri(lights[i], bri);
    }
    sleep(dur);
    ms += dur;
    console.log("Sec:   " + ms/1000 + "  \t|   Brightness:   " + (bri));
  }
  console.log("=============== FELL OUT OF SEGMENT LOOP ================")
  return;
});

  
const changeBri = async (id, bri) => {
  const response = await fetch('http://localhost:3000/api/setLight', {
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

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

export default sync