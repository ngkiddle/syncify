import { expose } from "threads/worker"
const fetch = require('node-fetch');

expose (async function sync(segments, progress, trackDur, t) {
  console.log(segments)
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
    await changeBri(1, bri);
    await changeBri(2, bri);
    await changeBri(3, bri);
    sleep(dur);
    ms += dur;
    console.log("Sec:   " + ms/1000 + "\t|   Brightness:   " + (bri))
  }
  console.log("=============== FELL OUT OF WHILE LOOP ================")
});

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}
  
const changeBri = async (id, bri) => {
  const response = await fetch('http://localhost:3000/api/changeBrightness', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: id,
                            state: {bri: bri} }),
  });
  //post the data to server
}

export default sync