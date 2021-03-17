import SpotifyPlayer from 'react-spotify-web-playback';
import { expose } from "threads/worker"

expose (async function analysis(state, token) {
    console.log(state)
    if (state.isPlaying === false){
      console.log("black")
    }
    else{
      $.ajax({
        url: "https://api.spotify.com/v1/audio-analysis/" + state.track.id,
        type: "GET",
        beforeSend: (xhr) => {
          xhr.setRequestHeader("Authorization", "Bearer " + token);
        },
        success: (res) => {
          let segments = res.segments.map(segment => {
            return {
              start: segment.start,
              duration: segment.duration *1000,
              loudness: ((1 - (Math.min(Math.max(segment.loudness_max, -35), 0) / -35)) * 253) +1
            }
          })
          console.log(segments)
          var dur = segments[0].duration;
          var bri = segments[0].loudness;
          for (var i = 0; i < segments.length; i++){
            dur = segments[i].duration;
            bri = segments[i].loudness;
            // var start = segments[i].start;
            changeBri(1, bri);
            changeBri(2, bri);
            changeBri(3, bri);
            sleep(dur);
          }
        },
        error: (err) => {
          console.log(err);
        }
      });  
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
    const response = await fetch('/api/lightBrigtness', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: id,
                             state: {bri: bri} }),
    });
    const body = await response.text();
    //post the data to server
  }

export default analysis