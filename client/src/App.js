// this comment tells babel to convert jsx to calls to a function called jsx instead of React.createElement
/** @jsx jsx */
import { css, jsx, Global } from '@emotion/react'
import React, { useState, useEffect } from 'react';
import * as $ from "jquery";
import SpotifyPlayer from 'react-spotify-web-playback';
import { useCookies } from 'react-cookie';

import Lightbulb from './components/lightbulbs.js';
import HueOptions from './components/hueOptions.js'

function App() {
  const [hue, setHue] = useCookies(['bridge']);
  const [spotifyAccess, setSpotifyAccess] = useCookies(['spotify_access']);
  const [spotifyRefresh, setSpotifyRefresh] = useCookies(['spotify_refresh']);
  const [bridgeOK, setBridgeOK] = useState(false);
  const [token, setToken] = useState("");
  const [lights, setLights] = useState([]);
  const [options, setOptions] = useState({brightnessOnly: false,
                                          brightnessThreshold: -28,
                                          colorScheme: 0,
                                          });

  const toggle = () => {
    if(options.brightnessOnly){
      setOptions({brightnessOnly: false,
                  brightnessThreshold: options.brightnessThreshold,
                  colorScheme: options.colorScheme,})
    }
    else{
      setOptions({brightnessOnly: true,
        brightnessThreshold: options.brightnessThreshold,
        colorScheme: options.colorScheme,})
    }
  }

  useEffect(() => {
    if("spotify_access" in spotifyAccess && spotifyAccess.spotify_access !== "undefined"){
      setToken(spotifyAccess.spotify_access);
    }
    else{
      if("spotify_refresh" in spotifyRefresh && spotifyRefresh.spotify_refresh !== "undefined"){
        const renewSpotConnect = async () => {
          var access_token = await refreshSpotifyTokens(spotifyRefresh.spotify_refresh)         
          setSpotifyAccess('spotify_access', access_token.access_token, {path: '/', maxAge: 3500})
          setToken(spotifyAccess.spotify_access)
        }
        renewSpotConnect()
      }
      else{
        const newSpotConnect = async () => {
          var _code = await hash();
          if(_code){
            var _tokens = await getSpotifyTokens(_code);
            var access_token = _tokens.access_token;
            var refresh_token = _tokens.refresh_token;
            if (access_token) {
              setToken(access_token)
              setSpotifyAccess('spotify_access', access_token, {path: '/', maxAge: 3500})
              setSpotifyRefresh('spotify_refresh', refresh_token, {path: '/'})
              window.location.search = ""
            }
          }
        }
        newSpotConnect();
      }
    }
    if("bridge" in hue && "ip" in hue.bridge && "username" in hue.bridge){
      if(establishConnection(hue)){
        setBridgeOK(true);
      }
    }
  },[]);

  return (
    <div className="App">
       <Global styles={global}/>
      <header className="App-header">
        <h1>Syncify</h1>
        {!token && (
          <button
            onClick={async () => {await connectSpotify()}}
            className="btn centerH btn--loginApp-link"
            styles={css`top: 10%;`}
          >
            Login to Spotify
          </button>
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
                callback={(State) => {analysis(State, token, options)}}
                // uris={['spotify:artist:1HUSv86hnnIK5uUivIFmVM']}
                styles={{
                  height: '80px',
                  activeColor: 'GhostWhite',
                  bgColor: '',
                  color: 'GhostWhite',
                  loaderColor: '#F0FFF0',
                  trackArtistColor: 'GhostWhite',
                  trackNameColor: 'GhostWhite',
                  sliderColor: 'DarkMagenta',
                  sliderHandleColor: 'GhostWhite',
                  sliderHeight: 5,
                  sliderHandleBorderRadius: 7
                }}
          />
          </div>
        )}
        {!bridgeOK && (
        <button className="btn centerH btn--loginApp-link"
                styles={css`width: 10%;`}
                onClick={async () => {
                  const newBridgeCookie = await connectBridge();
                  setHue('bridge', newBridgeCookie, {path: '/'});
                  setBridgeOK(true);
                }}>
            Connect Hue Bridge
        </button>)}
        
        {bridgeOK && (
        <HueOptions tag="Brightness Only" toggle={toggle} checked={options.brightnessOnly}/>)}

        {lights && (
          lights.map((l, i) => <Lightbulb key={i} {...l}/>)
        )}

        {bridgeOK && (
        <button className="btn centerH btn--loginApp-link"
                onClick={async () => {
                  const l = await getLights();
                  setLights(l);
                }}>
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
      background-image: linear-gradient(45deg, DarkMagenta, Coral);
      width: 100%;
      height: 100%;
      color: GhostWhite;
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
    border: 1px solid GhostWhite;
  }
  .btn{
    border: 2px solid GhostWhite;
    border-radius: 5px;
    color: GhostWhite;
    text-decoration: none;
    padding: 5px;
    background-color: rgba(0,0,0,0);
    text-align: center;
    width: 13%;
    margin-top:1%;
    font-size: 12pt;
  }`;
  
function analysis(state, token, options) {
  var d = new Date();
  var t = d.getTime();
  var progress = state.progressMs;
  var trackDur = state.track.durationMs;
  console.log(state)
  $.ajax({
    url: "https://api.spotify.com/v1/audio-analysis/" + state.track.id,
    type: "GET",
    beforeSend: (xhr) => {
      xhr.setRequestHeader("Authorization", "Bearer " + token);
    },
    success: (res) => {
      if (state.isPlaying === false){
        sendSegments( 
          {0: {duration: 1, loudness: 1}},
          {0: {duration: 1, tempo: 1}},
          progress, trackDur, t, options
        );
      }
      else{
        const segments = createSegmentData(res.segments);
        const sections = createSectionData(res.sections);
        console.log(segments)
        console.log(sections)
        sendSegments(segments, sections, progress, trackDur, t, options);
      }
    },
    error: (err) => {
      console.log(err);
      
    }
  });  
}

const authEndpoint = 'https://accounts.spotify.com/authorize';
  const clientId = "00687daa92064794bc08458536d97d0d";
  const clientSec = "ec8206638bbc49ab8f68bae07ed8eae2"
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

async function connectSpotify(){
  window.location = `${authEndpoint}?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes.join("%20")}&state=34fFs29kd09`
}

const hash = async() => {
  const code = window.location.search
  .substring(1)
  .split("&")
  .reduce(function(initial, item) {
    if (item) {
      var parts = item.split("=");
      initial[parts[0]] = decodeURIComponent(parts[1]);
    }
    // window.location.search = "";
    return initial;
  }, {});
  return code.code;
}  

async function getSpotifyTokens(code){
  const res = $.ajax(
    {
      method: "POST",
      url: "https://accounts.spotify.com/api/token",
      data: {
        "grant_type":    "authorization_code",
        "code":          code,
        "redirect_uri":  redirectUri,
        "client_secret": clientSec,
        "client_id":     clientId,
      },
      success: function(result) {
        console.log(result);
        return result
      },
    }
  );
  return res;
}

async function refreshSpotifyTokens(refresh_token){
  const result = $.ajax(
    {
      method: "POST",
      url: "https://accounts.spotify.com/api/token",
      data: {
        "grant_type":   "refresh_token",
        "refresh_token": refresh_token,
        "redirect_uri":  redirectUri,
        "client_secret": clientSec,
        "client_id":     clientId,
      },
      success: function(result) {
        return result;
      },
    }
  );
  console.log(result);
  return result;
}

async function connectBridge(){
  const response = await fetch('/api/discBridges');
  const body = await response.json();
  if(body.connected){
    const newBridgeCookie = { name: body.bridge.name,
                              username: body.bridge.username,
                              ip: body.bridge.ip
                            };
    return newBridgeCookie;
  }
  if (response.status !== 200) throw Error(body.message);
};

async function establishConnection(hue){
    const response = await fetch('/api/bridgeAuth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bridge: hue.bridge }),
    });
    const body = await response;
    if (body.status === 200){
      return true
    }
    else{
      return false;
    }
    //post the data to server
}

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
  return l;
};

const sendSegments = async (segments, sections, progress, trackDur, t, options) => {
  const response = await fetch('/api/sendAnalysis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      segments: segments,
      sections: sections,
      progress: progress,
      trackDur: trackDur,
      time: t,
      options: options}),
  });
  const body = await response.text();
  console.log(body)
  //post the data to server
}

function createSegmentData(segs){
  var segments = {};
  var prevDur = 0;
  var prevStart = 0;
  for (var i = 0; i < segs.length; i++){
    var seg = segs[i];
    var dur = Math.round(seg.duration*1000);
    var start = prevStart + prevDur;
    var db = Math.round(((1 - (Math.min(Math.max(seg.loudness_max, -28), 0) / -28)) * 253) +1)
    segments[start] = {duration: dur, loudness: db};
    prevDur = dur;
    prevStart = start;
  }
  return segments;
}

function createSectionData(sects){
  var sections = {};
  var prevDur = 0;
  var prevStart = 0;
  for (var i = 0; i < sects.length; i++){
    var sect = sects[i];
    var dur = Math.round(sect.duration*1000);
    var start = prevStart + prevDur;
    var tempo = sect.tempo;
    sections[start] = {duration: dur, tempo: tempo};
    prevDur = dur;
    prevStart = start;
  }
  return sections;
}

export default App
