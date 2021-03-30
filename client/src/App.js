// this comment tells babel to convert jsx to calls to a function called jsx instead of React.createElement
/** @jsxImportSource @emotion/react */
import { css, jsx, Global } from '@emotion/react'
import React, { useState, useEffect } from 'react';
import * as $ from "jquery";
import { useCookies } from 'react-cookie';

import SpotifyPlayer from 'react-spotify-web-playback';
import Nouislider from 'react-nouislider';

import {useSelector, useDispatch} from 'react-redux';
import {refreshBridges, refreshLights, toggleBridgeOK, selectBridge} from './actions';

import Lightbulb from './components/lightbulbs.js';
import HueOption from './components/hueOptions.js'
import Bridge from './components/bridge.js'
const syncify = require('./images/Syncify.svg');



function App() {
  const lights = useSelector(state => state.lights);
  const options = useSelector(state => state.options);
  const bridges = useSelector(state => state.bridges);
  const bridge = useSelector(state => state.bridge);
  const bridgeOK = useSelector(state => state.bridgeOK);

  const dispatch = useDispatch();

  const [hue, setHue] = useCookies(['bridge']);
  const [spotifyAccess, setSpotifyAccess] = useCookies(['spotify_access']);
  const [spotifyRefresh, setSpotifyRefresh] = useCookies(['spotify_refresh']);
  const [token, setToken] = useState("");

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
              setToken(access_token);
              setSpotifyAccess('spotify_access', access_token, {path: '/', maxAge: 3500});
              setSpotifyRefresh('spotify_refresh', refresh_token, {path: '/'});
              window.location.search = "";
            }
          }
        }
        newSpotConnect();
      }
    }
    
    const getBulbs = async () => {
      
    }
  const conBridge = async () => {
    if("bridge" in hue && "ip" in hue.bridge && "username" in hue.bridge){
        if(await establishConnection(hue)){
          dispatch(selectBridge(hue))
          dispatch(toggleBridgeOK(true))
          var l = await getLights();
          dispatch(refreshLights(l));
        }
      }
      else{
        if("ip" in bridge && "username" in bridge && "name" in bridge){
          setHue('bridge', bridge, {path: '/'})
          dispatch(toggleBridgeOK(true))
          await establishConnection(bridge);
          var l = await getLights();
          dispatch(refreshLights(l));
        }
        var b = getBridges().then(b => {
          dispatch(refreshBridges(b))
        });
      }
    } 
    conBridge();
  },[bridge]);

  return (
    <div className="App">
      <Global styles={global}/>
      <img className="centerH" css={css`width: 30%`} src={syncify} alt="Syncify"/>
      {!token && (
        <button
          onClick={async () => {await connectSpotify()}}
          className="btn centerH"
          styles={css`top: 10%;`}
        >
          Login to Spotify
        </button>
      )}
      {token && (
        <div className="centerH player" styles={css`height: 50%; width: 100%; top: 10%;`}>
        <SpotifyPlayer
              token={token}
              autoPlay={false}
              magnifySliderOnHover={true}
              syncExternalDevice={true}
              syncExternalDeviceInterval={1}
              persistDeviceSelection={true}
              name="Syncify"
              callback={(State) => {analysis(State, token, options, lights)}}
              styles={{
                height: '80px',
                activeColor: 'GhostWhite',
                bgColor: 'rgba(255,255,255,0)',
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
        <div className="option-menu">
          {bridges.map((b) => <Bridge key={b.config.name} name={b.config.name} ip={b.ipaddress} connected={bridgeOK}/>)}
        </div>
     )}
      
      {bridgeOK && (
        <div className="centerH">
          <h2>Sync Options</h2>
          <div className="option-menu">
            <HueOption 
              tag="Change Bulb Colors" 
              checked={options.colorShift}
            />
            <HueOption 
              tag="Change Bulb Brightness" 
              checked={options.brightnessShift}
            />
            <Nouislider 
              range = {{min: -35, max: 0}}
              start = {[-28, 0]}
              orientation = "horizontal"
              connect = {true}
            />
          </div>
        </div>
      )}

      {lights.length !== 0 && (
        <div className="centerH">
          <h2>Lights</h2>
          <div className="option-menu">
            {lights.map((li, i) => <Lightbulb key={li.name} {...li}/>)}
          </div>
        </div>
      )}

      {bridgeOK &&  (
      <button className="btn centerH"
              onClick={async () => {
                var l = await getLights();
                dispatch(refreshLights(l));
              }}>
          Refresh Lights
      </button>)}
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
  h2{
    text-align: center;
    margin-bottom: .5%;
    margin-top: 5%;
  }
  .centerH{
    display: block;
    margin: auto;
    width: 50%;
  }
  .player{
    border: 1px solid GhostWhite;
    box-shadow: 5px 5px;
    padding: 2%;
    background-color: rgba(255,255,255,.1);
    border-radius: 15px;
  }
  .btn{
    border: 2px solid GhostWhite;
    border-radius: 5px;
    color: GhostWhite;
    text-decoration: none;
    padding: 5px;
    background-color: rgba(255,255,255,.1);
    text-align: center;
    width: 13%;
    margin-top:3%;
    font-size: 12pt;
    box-shadow: 5px 5px
  }
  .option-menu{
    margin: auto;
    width: 500px;
    border: 1px solid GhostWhite;
    border-radius: 10px;
    margin-top: 0%;
    background-color: rgba(255,255,255,.1);
    box-shadow: 5px 5px;
  }`;
  
function analysis(state, token, options, lights) {
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
      const l = extractLightId(lights)
      if (state.isPlaying === false){ 
        sendSegments( 
          {0: {duration: 1, loudness: 1}},
          progress, trackDur, t, options, l
        );
      }
      else{
        const segments = createSegmentData(res.segments);
        console.log(segments)
        sendSegments(segments, progress, trackDur, t, options, l);
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
  const redirectUri = window.location.origin;
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

async function getBridges(){
  const response = await fetch('/api/discAllBridges');
  const body = await response.json();
  if(body.bridges){
    return body.bridges;
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
    if(!("xy" in b.data.state)){
      continue;
    }
    bulb['id'] = b.data.id;
    bulb['name'] = b.data.name;
    bulb['color'] = b.data.state.xy;
    bulb['bri'] = b.data.state.bri;
    bulb['sync'] = true;
    bulb['index'] = i;
    var on = "off";
    if (b.data.state.on){
      on = "on";
    }
    bulb['state'] = on;
    l.push(bulb);
  }
  return l;
};

const sendSegments = async (segments, sections, progress, trackDur, t, options, lights) => {
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
      options: options,
      lights: lights}),
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

function extractLightId(lights){
  var l = [];
  for (var i = 0; i < lights.length; i++){
    if(lights[i].sync){
      l.push(lights[i].id);
    }
  }
  return l;
}

export default App
