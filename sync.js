import { expose } from "threads/worker"
const v3 = require('node-hue-api').v3;
const fetch = require('node-fetch');

expose (async function sync(segments, bridge) {
  var dur = segments[0].duration;
  var bri = segments[0].loudness;
  // const api = await v3.api.createLocal(bridge.ip).connect(bridge.username);
  for (var i = 0; i < segments.length; i++){
    dur = segments[i].duration;
    bri = segments[i].loudness;
    await changeBri(1, bri);
    await changeBri(2, bri);
    await changeBri(3, bri);
    // console.log("id:\t" + 2 + "\tbri:\t" + bri)
    // const result1 = await api.lights.setLightState(1, {bri: bri})
    // const result2 = await api.lights.setLightState(2, {bri: bri})
    // const result3 = await api.lights.setLightState(3, {bri: bri})
    // console.log(result1 + ", " + result2 + ", " + result3)
    sleep(dur);
  }
});

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}
  
const changeBri = async (id, bri) => {
  // console.log("id:\t" + id + "\tbri:\t" + bri)
  const response = await fetch('http://localhost:3000/api/changeBrightness', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: id,
                            state: {bri: bri} }),
  });
  // const body = await response.text();
  // console.log(response)
  //post the data to server
}

export default sync