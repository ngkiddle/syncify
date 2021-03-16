// this comment tells babel to convert jsx to calls to a function called jsx instead of React.createElement
/** @jsx jsx */
import { css, jsx, Global } from '@emotion/react'
import React, { useState, useEffect } from 'react';
import * as $ from "jquery";
import SpotifyPlayer from 'react-spotify-web-playback';
import Lightbulb from './components/lightbulbs.js';

function App() {
  const [bridge, setBridge] = useState(false);
  const [token, setToken] = useState("");
  const [lights, setLights] = useState([]);

  useEffect(() => {
    // Set token
    let _token = hash.access_token; 
    if (_token) {
      setToken(_token)
    }
  },[]);
    // this.getLights()
    //   .then(res => console.log(res))
    //   .catch(err => console.log(err));

    // this.connectBridgeWithLights()
    //   .then(res => this.setState({ response: res.express }))
    //   .catch(err => console.log(err));

    // this.connectBridge()
    // .then(res => {_bridge = res.express; console.log("hey: " + res.express) })
    // .catch(err => console.log(err))

  // connectBridgeWithLights = async () => {
  //   const response = await fetch('/api/discBridges');
  //   const body = await response.json();
  //   console.log(body)
  //   if (response.status !== 200) throw Error(body.message);
  //   console.log("LIGHTS")
  //   response = await fetch('/api/allLights');
  //   body = await response.json();
  //   console.log(body)
  //   if (response.status !== 200) throw Error(body.message);
    
  //   return body;
  // }

  async function connectBridge(){
    const response = await fetch('/api/discBridges');
    const body = await response.json();
    console.log(body)
    setBridge(body.connected);
    if (response.status !== 200) throw Error(body.message);
    
    return body;
  };
  
  async function getLights(){
    const response = await fetch('/api/allLights');
    const body = await response.json();
    console.log(body)
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
      console.log(bulb);
    }
    setLights(l);
    return l;
  };

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
                autoPlay={true}
                magnifySliderOnHover={true}
                syncExternalDevice={true}
                name="Syncify"
                callback={(State) => analysis(State, token)}
                uris={['spotify:artist:0L8ExT028jH3ddEcZwqJJ5']}
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
        {!bridge && (
        <button className="btn centerH btn--loginApp-link"
                styles={css`width: 10%;`}
                onClick={async () => await connectBridge()}>
            Connect Hue Bridge
        </button>)}
        {lights && (
          lights.map((l, i) => <Lightbulb key={i} {...l}/>)
        )}
        {bridge && (
        <button className="btn  btn--loginApp-link"
                onClick={async () => await getLights()}>
            Get Lights
        </button>)}
      </header>
    </div>
  );
}
//bubbles.map((b, i) => <Bubble key={i} {...b} />)
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
  if (state.play === false){
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
        console.log(res);
        let duration = res.track.duration
        let segments = res.segments.map(segment => {
          return {
            start: segment.start / duration,
            duration: segment.duration / duration,
            loudness: 1 - (Math.min(Math.max(segment.loudness_max, -35), 0) / -35)
          }
        })

        let min = Math.min(...segments.map(s => s.loudness))
        let max = Math.max(...segments.map(s => s.loudness))
        let levels = []
        console.log(segments)
        for (let i = 0.000; i < 1; i += 0.001) {
          let s = segments.find(segment => {
            return i <= segment.start + segment.duration
          })
          let loudness = Math.round((s.loudness / max) * 100) / 100
          levels.push(loudness)

        }

      },
      error: (err) => {
        console.log(err);
      }
    });  
  }
}

export default App;
