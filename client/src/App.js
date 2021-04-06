// this comment tells babel to convert jsx to calls to a function called jsx instead of React.createElement
/** @jsxImportSource @emotion/react */
import { css, Global } from '@emotion/react'
import { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';

import {global} from './css.js';
import { getBridges, establishConnection, getLights} from "./hue.js";
import {analysis, connectSpotify, hash, getSpotifyTokens, refreshSpotifyTokens} from './spotify.js';

import SpotifyPlayer from 'react-spotify-web-playback';
import Nouislider from "nouislider-react";
import "nouislider/distribute/nouislider.css";
import DrawBlob, {generatePoints} from 'blob-animated';

import {useSelector, useDispatch} from 'react-redux';
import {refreshBridges, refreshLights, toggleBridgeOK, selectBridge, refreshDb} from './actions';

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
    newSpotConnect();
  },[token]);
  useEffect(() => {
      conBridge();
  },[bridge, bridgeOK]);

  const newSpotConnect = async () => {
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
        renewSpotConnect();
      }
      else{
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
    }
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
          if(await establishConnection(bridge)){
            dispatch(refreshLights(await getLights()));
          }
        }
        getBridges().then(b => {
          dispatch(refreshBridges(b))
        });
      }
    } 

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
            callback={async (State) => {
              const result = await analysis(State, spotifyAccess.spotify_access, options, lights);
              console.log(result)
              if (result === false){
                if ('spotify_access' in spotifyAccess){
                  conBridge();
                }
                else if (result === true){
                  newSpotConnect();
                }
              }
            }}
            styles={{
              height: '80px',
              activeColor: 'rgb(33,33,33)',
              bgColor: 'rgba(255,255,255,0)',
              altColor: 'rgba(255,255,255,.5)',
              color: 'rgb(33,33,33)',
              loaderColor: 'rgb(33,33,33)',
              trackArtistColor: 'rgb(33,33,33)',
              trackNameColor: 'rgb(33,33,33)',
              sliderColor: 'rgb(33,33,33)',
              sliderTrackColor:'rgb(255,255,255)',
              sliderHandleColor: 'rgb(33,33,33)',
              sliderHeight: 5,
              sliderHandleBorderRadius: 8
            }}
          />
        </div>
      )}

      {!bridgeOK && (
        <div>
          <div className="infobar option-menu">
            {hubinfo}
            <div>Press the button on your hub, then hit the corresponding connect button below.</div>
          </div>
          <div className="option-menu" css={css`margin-top: 2%;`}>
            <div className="titlebar">
              <div>Hue Hubs</div>
              {hub}
            </div>
            {bridges.map((b, i) => <Bridge 
              key={b.config.name} 
              name={b.config.name} 
              ip={b.ipaddress} 
              connected={bridgeOK} 
              index={i}/>
            )}
          </div>
        </div>
     )}
      
      {bridgeOK && (
        <div className="centerH">
          <div className="option-menu">
            <div className="titlebar">
              <div>Sync Options</div>
              {optionGlyph}
            </div>
            <HueOption 
              tag="Change Bulb Colors" 
              checked={options.colorShift}
              last={false}
            />
            <HueOption 
              tag="Change Bulb Brightness" 
              checked={options.brightnessShift}
              last={false}
            />
            <div className="db-slider">
              <div className="db-info">
                {hubinfo}
                <div>Adjust the decibel thresholds for brightness changes.</div>
              </div>
              <Nouislider id="db"
                range = {{min: -35, max: 0}}
                start = {[-28, 0]}
                orientation = "horizontal"
                tooltips = {true}
                connect = {true}
                step = {1}
                onUpdate = {async (index) => {
                  console.log(index)
                  await dispatch(refreshDb(index))
                }}
              />
            </div>
          </div>
        </div>
      )}

      {lights.length !== 0 && (
        <div className="centerH">
          <div className="option-menu">
            <div className='titlebar'>
              <div>Lights</div>
              <div
                onClick={async () => {
                  var l = await getLights();
                  if (l === false){
                    conBridge();
                  }
                  else{
                    dispatch(refreshLights(l));
                  }
                }}>
                {refresh}
              </div>
            </div>
            {lights.map((li, i) => <Lightbulb key={li.name} {...li}/>)}
          </div>
        </div>
      )}

      {bridgeOK && lights.length === 0 && (
      <div className="btn centerH" css={css`width: 13%;`}
              onClick={async () => {
                var l = await getLights();
                if (l === false){
                  conBridge();
                }
                else{
                  dispatch(refreshLights(l));
                }
              }}>
          Get Lights
      </div>)}
    </div>
  );
}
const refresh = <svg className='refresh-icon' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M13.5 2c-5.288 0-9.649 3.914-10.377 9h-3.123l4 5.917 4-5.917h-2.847c.711-3.972 4.174-7 8.347-7 4.687 0 8.5 3.813 8.5 8.5s-3.813 8.5-8.5 8.5c-3.015 0-5.662-1.583-7.171-3.957l-1.2 1.775c1.916 2.536 4.948 4.182 8.371 4.182 5.797 0 10.5-4.702 10.5-10.5s-4.703-10.5-10.5-10.5z"/></svg>
const optionGlyph = <svg className='icon' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 9c.552 0 1 .449 1 1s-.448 1-1 1-1-.449-1-1 .448-1 1-1zm0-2c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm-9 4c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm18 0c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm-9-6c.343 0 .677.035 1 .101v-3.101c0-.552-.447-1-1-1s-1 .448-1 1v3.101c.323-.066.657-.101 1-.101zm9 4c.343 0 .677.035 1 .101v-7.101c0-.552-.447-1-1-1s-1 .448-1 1v7.101c.323-.066.657-.101 1-.101zm0 10c-.343 0-.677-.035-1-.101v3.101c0 .552.447 1 1 1s1-.448 1-1v-3.101c-.323.066-.657.101-1 .101zm-18-10c.343 0 .677.035 1 .101v-7.101c0-.552-.447-1-1-1s-1 .448-1 1v7.101c.323-.066.657-.101 1-.101zm9 6c-.343 0-.677-.035-1-.101v7.101c0 .552.447 1 1 1s1-.448 1-1v-7.101c-.323.066-.657.101-1 .101zm-9 4c-.343 0-.677-.035-1-.101v3.101c0 .552.447 1 1 1s1-.448 1-1v-3.101c-.323.066-.657.101-1 .101z"/></svg>
const hub = <svg className="icon" xmlns="http://www.w3.org/2000/svg" width="24" viewBox="0 0 24 24"><path d="M 12 2.163 C 15.204 2.163 15.584 2.175 16.85 2.233 C 20.102 2.381 21.621 3.924 21.769 7.152 C 21.827 8.417 21.838 8.797 21.838 12.001 C 21.838 15.206 21.826 15.585 21.769 16.85 C 21.62 20.075 20.105 21.621 16.85 21.769 C 15.584 21.827 15.206 21.839 12 21.839 C 8.796 21.839 8.416 21.827 7.151 21.769 C 3.891 21.62 2.38 20.07 2.232 16.849 C 2.174 15.584 2.162 15.205 2.162 12 C 2.162 8.796 2.175 8.417 2.232 7.151 C 2.381 3.924 3.896 2.38 7.151 2.232 C 8.417 2.175 8.796 2.163 12 2.163 Z M 12 0 C 8.741 0 8.333 0.014 7.053 0.072 C 2.695 0.272 0.273 2.69 0.073 7.052 C 0.014 8.333 0 8.741 0 12 C 0 15.259 0.014 15.668 0.072 16.948 C 0.272 21.306 2.69 23.728 7.052 23.928 C 8.333 23.986 8.741 24 12 24 C 15.259 24 15.668 23.986 16.948 23.928 C 21.302 23.728 23.73 21.31 23.927 16.948 C 23.986 15.668 24 15.259 24 12 C 24 8.741 23.986 8.333 23.928 7.053 C 23.732 2.699 21.311 0.273 16.949 0.073 C 15.668 0.014 15.259 0 12 0 Z M 12 5.838 C 8.597 5.838 5.838 8.597 5.838 12 C 5.838 15.403 8.597 18.163 12 18.163 C 15.403 18.163 18.162 15.404 18.162 12 C 18.162 8.597 15.403 5.838 12 5.838 Z M 12 16 C 9.791 16 8 14.21 8 12 C 8 9.791 9.791 8 12 8 C 14.209 8 16 9.791 16 12 C 16 14.21 14.209 16 12 16 Z"/><circle cx="8.972" cy="19.581" r="0.928"/><circle cx="14.972" cy="19.581" r="0.928"/><circle cx="11.972" cy="19.581" r="0.928"/></svg>
const hubinfo = <svg className="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fillRule="evenodd" clipRule="evenodd"><path d="M12 0c6.623 0 12 5.377 12 12s-5.377 12-12 12-12-5.377-12-12 5.377-12 12-12zm0 1c6.071 0 11 4.929 11 11s-4.929 11-11 11-11-4.929-11-11 4.929-11 11-11zm.5 17h-1v-9h1v9zm-.5-12c.466 0 .845.378.845.845 0 .466-.379.844-.845.844-.466 0-.845-.378-.845-.844 0-.467.379-.845.845-.845z"/></svg>

export default App
