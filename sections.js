import { expose } from "threads/worker"
const thrd = require("threads");

expose(async function sections(sections, progress, trackDur, t){
    var d = new Date();
    var latency = d.getTime() - t;
    var compensate = progress + latency;
    while (!(compensate in sections)){
        compensate--;
    }
    var ms = compensate;
    var adjust= progress + latency - compensate;
    var lag = true;
    while(ms <= trackDur && ms in sections){
      var dur = sections[ms].duration;
      var tempo = sections[ms].tempo;
      const bpm = await thrd.spawn(new thrd.Worker("./tempo.js"));
      bpm(tempo);      
      console.log("Sec:   " + ms/1000 + "  \t|   Tempo:   " + tempo)
      if (lag){
        sleep(dur -adjust);
        lag = false;
      }
      else{
        sleep(dur);
      }
      if(bpm !== undefined){
        await thrd.Thread.terminate(bpm);
      }
      ms += dur;
    }
    console.log("=============== FELL OUT OF SECTIONS LOOP ================")
});

  
function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}