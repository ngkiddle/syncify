import { expose } from "threads/worker"
const thrd = require("threads");

expose(async function sections(sections, progress, trackDur, t, lights, threads){
    var d = new Date();
    var latency = d.getTime() - t;
    var compensate = progress + latency;
    while (!(compensate in sections)){
        compensate--;
    }
    var ms = compensate;
    var adjust= progress + latency - compensate;
    var lag = true;
    console.log(threads)

    // console.log("threads.sections !== undefined === " + threads.sections !== undefined)
    while(ms <= trackDur && ms in sections){
      var dur = sections[ms].duration;
      var tempo = sections[ms].tempo;
      threads.bpm = await thrd.spawn(new thrd.Worker("./tempo.js"));
      threads.bpm(tempo, lights, threads);      
      console.log("Sec:   " + ms/1000 + "  \t|   Tempo:   " + tempo)
      if (lag){
        sleep(dur - adjust);
        lag = false;
      }
      else{
        sleep(dur);
      }
      if(threads.bpm !== undefined){
        await thrd.Thread.terminate(threads.bpm);
      }
      ms += dur;
    }
    console.log("=============== FELL OUT OF SECTIONS LOOP ================")
    thrd.Thread.terminate(threads.bpm);

  });

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}