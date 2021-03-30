import { expose } from "threads/worker"
const fetch = require('node-fetch');

expose (async function bpm(tempo, lights, threads){
    console.log(threads)
  // console.log("threads.sections !== undefined && threads.bpm !== undefined === " + threads.sections !== undefined && threads.bpm !== undefined)
    while(true){
        var xy = rgbToXY();
        for (var i = 0; i < lights.length; i++){
          await changeColor(lights[i], xy);
        }
        sleep(60/tempo * 1000)
    }
})

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