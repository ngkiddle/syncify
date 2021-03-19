// this comment tells babel to convert jsx to calls to a function called jsx instead of React.createElement
/** @jsx jsx */
import { css, jsx, Global } from '@emotion/react'
import React, { useState, useEffect } from 'react';
import * as $ from "jquery";
import SpotifyPlayer from 'react-spotify-web-playback';
import Lightbulb from './components/lightbulbs.js';
import { useCookies } from 'react-cookie';


function App() {
  const [hue, setHue] = useCookies(['bridge']);
  const [spotify, setSpotify] = useCookies(['spotify']);
  const [bridgeOK, setBridgeOK] = useState(false);
  const [token, setToken] = useState("");
  const [lights, setLights] = useState([]);

  useEffect(() => {
    // Set token
    if("token" in spotify){
      setToken(spotify.token);
    }

    let _token = hash.access_token; 
    if (_token) {
      setToken(_token)
      setSpotify('token', _token, {path: '/', maxAge: 3500})
      
    }
    if("bridge" in hue && "ip" in hue.bridge && "username" in hue.bridge){
      const conBridge = async () => {
        const response = await fetch('/api/bridgeAuth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bridge: hue.bridge }),
        });
        const body = await response.text();
        setBridgeOK(true);
        //post the data to server
      }
      conBridge();
    }
  },[]);

  async function connectBridge(){
    const response = await fetch('/api/discBridges');
    const body = await response.json();
    setBridgeOK(body.connected);
    if(body.connected){
      const newBridgeCookie = { name: body.bridge.name,
                                username: body.bridge.username,
                                ip: body.bridge.ip
                              };
      setHue('bridge', newBridgeCookie, {path: '/'});
    }
    if (response.status !== 200) throw Error(body.message);
    return body;
  };
  
  async function getLights(){
    const response = await fetch('/api/allLights');
    const body = await response.json();
    if (response.status !== 200) throw Error(body.message);
    var l = [];
    for (var i = 0; i < body.length; i++){
      var b = body[i];
      var bulb = {};
      bulb['id'] = b.data.id;
      bulb['name'] = b.data.name;
      bulb['color'] = b.data.state.xy;
      bulb['bri'] = b.data.state.bri;
      var on = "off";
      if (b.data.state.on){
        on = "on";
      }
      bulb['state'] = on;
      l.push(bulb);
    }
    setLights(l);
    return l;
  };

  return (
    <div className="App">
       <Global styles={global}/>
      <header className="App-header">
        <h1>Syncify</h1>
        {!token && (
          <a
            className="btn centerH btn--loginApp-link"
            styles={css`top: 10%;`}
            href={`${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join("%20")}&response_type=token&show_dialog=true`}
          >
            Login to Spotify
          </a>
        )}
        {token && (
          <div className="centerH" styles={css`height: 50%; width: 100%; top: 10%`}>
          <SpotifyPlayer
                token={token}
                autoPlay={false}
                magnifySliderOnHover={true}
                syncExternalDevice={true}
                syncExternalDeviceInterval={1}
                persistDeviceSelection={true}
                name="Syncify"
                callback={(State) => {
                          analysis(State, token)
                          // if (analyzeSync){
                          //   await Thread.terminate(analyzeSync);
                          // }
                          // const analyzeSync = await spawn(new Worker("./sync.js"));
                          // const updated = await analyzeSync(State)
                          // Thread.events(analyzeSync).subscribe(event => console.log("Thread event:", event))

                          // await Thread.terminate(analyzeSync);
                        }}
                uris={['spotify:artist:1HUSv86hnnIK5uUivIFmVM']}
                styles={{
                  height: '35%',
                  activeColor: '#F0FFF0',
                  bgColor: '#F0FFF0',
                  color: '#778899',
                  loaderColor: '#F0FFF0',
                  trackArtistColor: '#778899',
                  trackNameColor: '#778899',
                  sliderColor: '#F0FFF0',
                  sliderHandleColor: '#F0FFF0',
                  sliderHeight: 5,
                  sliderHandleBorderRadius: 7
                }}
          />
          </div>
        )}
        {!bridgeOK && (
        <button className="btn centerH btn--loginApp-link"
                styles={css`width: 10%;`}
                onClick={async () => await connectBridge()}>
            Connect Hue Bridge
        </button>)}
        
        {/* {bridgeOK && (
        <div>
            Connected to {hue.bridge.name} : {hue.bridge.ip}
        </div>)} */}

        {lights && (
          lights.map((l, i) => <Lightbulb key={i} {...l}/>)
        )}

  

        {bridgeOK && (
        <button className="btn centerH btn--loginApp-link"
                onClick={async () => await getLights()}>
            Get Lights
        </button>)}
      </header>
    </div>
  );
}

const global = css`
  @import url('https://fonts.googleapis.com/css?family=Ubuntu&display=swap');
  body{
      margin:0px;
      padding: 0px;
      background-color: LightSlateGrey;
      width: 100%;
      height: 100%;
      color: HoneyDew;
  }
  html{
      font-family: 'Ubuntu', sans-serif; 
      width: 100%;
      height: 100%;
      margin: 0%;
      padding: 0%;
  }
  h1{
      margin-left: 3%; 
  }
  .centerH{
    display: block;
    margin: auto;
    width: 50%;
    border: 3px solid green;
  }
  .btn{
    border: 2px solid HoneyDew;
    border-radius: 5px;
    color: HoneyDew;
    text-decoration: none;
    padding: 5px;
    background-color: rgba(0,0,0,0);
    text-align: center;
    width: 13%;
    margin-top:1%;
    font-size: 12pt;
  }`;
  
const authEndpoint = 'https://accounts.spotify.com/authorize';
const clientId = "00687daa92064794bc08458536d97d0d";
const redirectUri = "http://localhost:3000/";
const scopes = [
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-read-email",
  "user-read-private",
  "app-remote-control",
  "streaming",
  "user-modify-playback-state"
];
// Get the hash of the url
const hash = window.location.hash
  .substring(1)
  .split("&")
  .reduce(function(initial, item) {
    if (item) {
      var parts = item.split("=");
      initial[parts[0]] = decodeURIComponent(parts[1]);
    }
    return initial;
  }, {});
window.location.hash = "";

function analysis(state, token) {
  console.log(state)
  $.ajax({
    url: "https://api.spotify.com/v1/audio-analysis/" + state.track.id,
    type: "GET",
    beforeSend: (xhr) => {
      xhr.setRequestHeader("Authorization", "Bearer " + token);
    },
    success: (res) => {
      if (state.isPlaying === false){
        sendSegments([{start: 0, duration: 1, loudness: 1}]);
      }
      else{
        let segments = res.segments.map(segment => {
          return {
            start: segment.start,
            duration: segment.duration *1000,
            loudness: ((1 - (Math.min(Math.max(segment.loudness_max, -20), 0) / -20)) * 253) +1
          }
        })
        // console.log(segments);
        sendSegments(segments);
      }
    },
    error: (err) => {
      console.log(err);
    }
  });  
}

const sendSegments = async (segments) => {
  const response = await fetch('/api/sendSegments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ segments: segments }),
  });
  const body = await response.text();
  console.log(body)
  //post the data to server
}

export default App;
