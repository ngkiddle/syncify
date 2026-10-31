// this comment tells babel to convert jsx to calls to a function called jsx instead of React.createElement
/** @jsxImportSource @emotion/react */
import { css, Global } from '@emotion/react'
import { useState, useEffect, useRef } from 'react';
import { useCookies } from 'react-cookie';

import {global} from './css.js';
import { getBridges, establishConnection, getLights, getEntertainmentAreas} from "./hue.js";
import {connectSpotify, hash, getSpotifyTokens, refreshSpotifyTokens, extractLightId, takeOverPlayback, pause} from './spotify.js';
import * as audioSync from './audioSync.js';
import {logToServer} from './remoteLog.js';

import SpotifyPlayer from 'react-spotify-web-playback';
import drawBlob from './blob.js';

import {useSelector, useDispatch, useStore} from 'react-redux';
import {connect, sendStatus} from './remoteSync.js';
import {refreshBridges, refreshLights, toggleBridgeOK, selectBridge, setSyncedColor} from './actions';

import Room, {groupByRoom} from './components/room.js';
import SyncOptions, {row, hubinfo} from './components/syncOptions.js';
import Bridge from './components/bridge.js'
const syncify = require('./images/Syncify.svg').default;

function App() {
  const lights = useSelector(state => state.lights);
  const options = useSelector(state => state.options);
  const bridges = useSelector(state => state.bridges);
  const bridge = useSelector(state => state.bridge);
  const bridgeOK = useSelector(state => state.bridgeOK);

  const dispatch = useDispatch();

  const [hue, setHue, removeHue] = useCookies([]);
  const [spotifyAccess, setSpotifyAccess] = useCookies(['spotify_access']);
  const [spotifyRefresh, setSpotifyRefresh] = useCookies(['spotify_refresh']);
  const [token, setToken] = useState("");
  const [liveSync, setLiveSync] = useState(false);
  const [level, setLevel] = useState(null);
  const [entertainment, setEntertainment] = useState({streaming: false, areas: []});

  // entertainment areas come from the Hue app; reload them whenever the lights load
  useEffect(() => {
    if (lights.length !== 0){
      getEntertainmentAreas().then(setEntertainment);
    }
  },[lights.length]);

  const changingHub = useRef(false);
  const tookOver = useRef(undefined);

  // the audio loop reads the latest options/lights every frame
  const live = useRef({});
  live.current = {options: options, lights: lights};

  // phone remote: share settings through the server and carry out its player commands
  const store = useStore();
  const reported = useRef({});
  const commandHandler = useRef(() => {});
  useEffect(() => connect(store, {host: true, onCommand: cmd => commandHandler.current(cmd)}), []);
  useEffect(() => { sendStatus({liveSync: liveSync}); }, [liveSync]);

  commandHandler.current = (cmd) => {
    const labels = {play: 'Play', pause: 'Pause', next: 'Next Track', previous: 'Previous Track'};
    if (cmd === 'stopLive'){
      if (liveSync) toggleLiveSync();
      return;
    }
    const button = labels[cmd] && document.querySelector(`[aria-label="${labels[cmd]}"]`);
    if (button){
      button.click();
    } else {
      logToServer(`remote command "${cmd}" ignored: player button not found`, 'warn');
    }
  };

  const toggleLiveSync = async () => {
    if (liveSync){
      audioSync.stop();
      setLiveSync(false);
      setLevel(null);
      return;
    }
    try {
      await audioSync.start({
        getOptions: () => live.current.options,
        getLights: () => extractLightId(live.current.lights),
        onLevel: setLevel,
        onColor: xy => dispatch(setSyncedColor(xy)),
        onEnded: () => { setLiveSync(false); setLevel(null); }
      });
      setLiveSync(true);
    } catch (err) {
      logToServer('live audio capture not started: ' + err.message, 'warn');
    }
  }

  useEffect(() => {
    newSpotConnect();
  },[token]);
  useEffect(() => {
      conBridge();
  },[bridge]);

  const newSpotConnect = async () => {
    if("spotify_access" in spotifyAccess && spotifyAccess.spotify_access !== "undefined"){
      setToken(spotifyAccess.spotify_access);
    }
    else{
      if("spotify_refresh" in spotifyRefresh && spotifyRefresh.spotify_refresh !== "undefined"){
        const renewSpotConnect = async () => {
          var access_token = await refreshSpotifyTokens(spotifyRefresh.spotify_refresh)
          setSpotifyAccess('spotify_access', access_token.access_token, {path: '/', maxAge: 3500})
          // use the new token, not the expired cookie value from this render
          setToken(access_token.access_token)
          logToServer('Spotify access token refreshed')
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
    // while changing hubs the removed cookie can still be visible here, so don't reconnect to it
    if(!changingHub.current && "hueBridge" in hue && "ip" in hue.hueBridge && "username" in hue.hueBridge){
        if(await establishConnection(hue.hueBridge)){
          dispatch(selectBridge(hue.hueBridge))
          dispatch(toggleBridgeOK(true))
          var l = await getLights();
          dispatch(refreshLights(l));
        }
        else{
          // cached bridge/key no longer valid (e.g. swapped bridges), so pair again
          removeHue('hueBridge', {path: '/'})
          getBridges().then(b => {
            dispatch(refreshBridges(b))
          });
        }
      }
      else{
        if("ip" in bridge && "username" in bridge && "name" in bridge){
          changingHub.current = false;
          setHue('hueBridge', bridge, {path: '/'})
          dispatch(toggleBridgeOK(true))
          if(await establishConnection(bridge)){
            dispatch(refreshLights(await getLights()));
          }
        }
        else{
          // only hit the cloud discovery service when we don't know a bridge IP yet
          getBridges().then(b => {
            dispatch(refreshBridges(b))
          });
        }
      }
    } 

  useEffect(() => {
    drawBlob();
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
            syncExternalDevice={false}
            persistDeviceSelection={false}
            name="Syncify"
            callback={(State) => {
              audioSync.setPlaying(State.isPlaying);
              if (State.track && (State.track.name !== reported.current.track || State.isPlaying !== reported.current.playing)){
                reported.current = {track: State.track.name, playing: State.isPlaying};
                sendStatus(reported.current);
              }
              if (State.type === 'track_update'){
                logToServer(`now playing "${State.track.name}"`);
              }
              if (State.errorType){
                logToServer(`Spotify player ${State.errorType}: ${State.error}`, 'error');
              }
              // once the in-page device is ready, make it the active device
              if (State.status === 'READY' && State.deviceId && tookOver.current !== State.deviceId){
                tookOver.current = State.deviceId;
                takeOverPlayback(token, State.deviceId)
                  .catch(err => logToServer('Spotify takeover failed: ' + err.message, 'error'));
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
              key={b.ip}
              name={b.name}
              ip={b.ip}
              connected={bridgeOK} 
              index={i}/>
            )}
          </div>
        </div>
     )}
      
      {bridgeOK && (
        <div className="centerH">
          <SyncOptions entertainment={entertainment} liveAudio={(
            <div css={row}>
              <div css={css`line-height: 1.8; font-size: 14pt;`}>
                Live Audio
                {liveSync && (
                  <span css={css`font-size: 11pt; margin-left: 10px;`}>
                    {level === null || level === -Infinity ? 'silent' : `${Math.round(level)} dB`}
                  </span>
                )}
              </div>
              <div className="btn" css={css`margin-top: 0; padding: 2px 12px;`} onClick={toggleLiveSync}>
                {liveSync ? 'Stop' : 'Start'}
              </div>
            </div>
          )}/>
        </div>
      )}

      {lights.length !== 0 && (
        <div className="centerH">
          <div className="option-menu">
            <div className='titlebar-lights' css={css`border-bottom: none;`}>
              <div>Lights</div>
              <div title={"Change Hubs.\nCurrent: " + bridge.name}
                onClick={async () => {
                  pause();
                  if (liveSync) toggleLiveSync();
                  changingHub.current = true;
                  await removeHue('hueBridge', {path: '/'})
                  await dispatch(refreshLights([]))
                  await dispatch(refreshBridges([]))
                  await dispatch(toggleBridgeOK(false))
                  await dispatch(selectBridge({}))

                }}>
              {hubButton}
              </div>
              <div css={css`background: black;`}></div>
              <div title="Refresh Lights"
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
          </div>
        </div>
      )}
      {lights.length !== 0 && (
        <div className="room-list">
          {groupByRoom(lights).map(r => <Room key={r.room.id} room={r.room} lights={r.lights}/>)}
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
const hubButton = <svg className="hub" xmlns="http://www.w3.org/2000/svg" width="24" viewBox="0 0 24 24"><path d="M 12 2.163 C 15.204 2.163 15.584 2.175 16.85 2.233 C 20.102 2.381 21.621 3.924 21.769 7.152 C 21.827 8.417 21.838 8.797 21.838 12.001 C 21.838 15.206 21.826 15.585 21.769 16.85 C 21.62 20.075 20.105 21.621 16.85 21.769 C 15.584 21.827 15.206 21.839 12 21.839 C 8.796 21.839 8.416 21.827 7.151 21.769 C 3.891 21.62 2.38 20.07 2.232 16.849 C 2.174 15.584 2.162 15.205 2.162 12 C 2.162 8.796 2.175 8.417 2.232 7.151 C 2.381 3.924 3.896 2.38 7.151 2.232 C 8.417 2.175 8.796 2.163 12 2.163 Z M 12 0 C 8.741 0 8.333 0.014 7.053 0.072 C 2.695 0.272 0.273 2.69 0.073 7.052 C 0.014 8.333 0 8.741 0 12 C 0 15.259 0.014 15.668 0.072 16.948 C 0.272 21.306 2.69 23.728 7.052 23.928 C 8.333 23.986 8.741 24 12 24 C 15.259 24 15.668 23.986 16.948 23.928 C 21.302 23.728 23.73 21.31 23.927 16.948 C 23.986 15.668 24 15.259 24 12 C 24 8.741 23.986 8.333 23.928 7.053 C 23.732 2.699 21.311 0.273 16.949 0.073 C 15.668 0.014 15.259 0 12 0 Z M 12 5.838 C 8.597 5.838 5.838 8.597 5.838 12 C 5.838 15.403 8.597 18.163 12 18.163 C 15.403 18.163 18.162 15.404 18.162 12 C 18.162 8.597 15.403 5.838 12 5.838 Z M 12 16 C 9.791 16 8 14.21 8 12 C 8 9.791 9.791 8 12 8 C 14.209 8 16 9.791 16 12 C 16 14.21 14.209 16 12 16 Z"/><circle cx="8.972" cy="19.581" r="0.928"/><circle cx="14.972" cy="19.581" r="0.928"/><circle cx="11.972" cy="19.581" r="0.928"/></svg>
const hub = <svg className="icon" xmlns="http://www.w3.org/2000/svg" width="24" viewBox="0 0 24 24"><path d="M 12 2.163 C 15.204 2.163 15.584 2.175 16.85 2.233 C 20.102 2.381 21.621 3.924 21.769 7.152 C 21.827 8.417 21.838 8.797 21.838 12.001 C 21.838 15.206 21.826 15.585 21.769 16.85 C 21.62 20.075 20.105 21.621 16.85 21.769 C 15.584 21.827 15.206 21.839 12 21.839 C 8.796 21.839 8.416 21.827 7.151 21.769 C 3.891 21.62 2.38 20.07 2.232 16.849 C 2.174 15.584 2.162 15.205 2.162 12 C 2.162 8.796 2.175 8.417 2.232 7.151 C 2.381 3.924 3.896 2.38 7.151 2.232 C 8.417 2.175 8.796 2.163 12 2.163 Z M 12 0 C 8.741 0 8.333 0.014 7.053 0.072 C 2.695 0.272 0.273 2.69 0.073 7.052 C 0.014 8.333 0 8.741 0 12 C 0 15.259 0.014 15.668 0.072 16.948 C 0.272 21.306 2.69 23.728 7.052 23.928 C 8.333 23.986 8.741 24 12 24 C 15.259 24 15.668 23.986 16.948 23.928 C 21.302 23.728 23.73 21.31 23.927 16.948 C 23.986 15.668 24 15.259 24 12 C 24 8.741 23.986 8.333 23.928 7.053 C 23.732 2.699 21.311 0.273 16.949 0.073 C 15.668 0.014 15.259 0 12 0 Z M 12 5.838 C 8.597 5.838 5.838 8.597 5.838 12 C 5.838 15.403 8.597 18.163 12 18.163 C 15.403 18.163 18.162 15.404 18.162 12 C 18.162 8.597 15.403 5.838 12 5.838 Z M 12 16 C 9.791 16 8 14.21 8 12 C 8 9.791 9.791 8 12 8 C 14.209 8 16 9.791 16 12 C 16 14.21 14.209 16 12 16 Z"/><circle cx="8.972" cy="19.581" r="0.928"/><circle cx="14.972" cy="19.581" r="0.928"/><circle cx="11.972" cy="19.581" r="0.928"/></svg>

export default App
