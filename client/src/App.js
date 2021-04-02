// this comment tells babel to convert jsx to calls to a function called jsx instead of React.createElement
/** @jsxImportSource @emotion/react */
import { css, Global } from '@emotion/react'
import { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';

import {global} from './css.js';
import { getBridges, establishConnection, getLights} from "./hue.js";
import {analysis, connectSpotify, hash, getSpotifyTokens, refreshSpotifyTokens} from './spotify.js';

import SpotifyPlayer from 'react-spotify-web-playback';
import Nouislider from 'react-nouislider';
import DrawBlob, {generatePoints} from 'blob-animated';

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
          await connectSpotify()
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
  },[token]);

  useEffect(() => {
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
            if(await establishConnection(bridge)){
              dispatch(refreshLights(await getLights()));
            }
          }
          getBridges().then(b => {
            dispatch(refreshBridges(b))
          });
        }
      } 
      conBridge();
  },[bridge]);

  useEffect(() => {
    const Blob = new DrawBlob({
      canvas: document.getElementById('blob'),
      speed: 1500,
      scramble: 0.9,
      vectors: generatePoints({ sides: 4 }),
      color: '#ff66cc',
      colorFunction: (ctx) => {
        const gradient = ctx.createLinearGradient(0,0, 1024,1024);
  
        // Add three color stops
        gradient.addColorStop(.3, 'HotPink');
        // gradient.addColorStop(.5, 'cyan');
        gradient.addColorStop(1, 'Aqua');
        return gradient;
      }
    })
  },[])

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
        <div className="option-menu" css={css`margin-top: 2%;`}>
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

export default App
