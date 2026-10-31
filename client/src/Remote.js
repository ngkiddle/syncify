// this comment tells babel to convert jsx to calls to a function called jsx instead of React.createElement
/** @jsxImportSource @emotion/react */
import { css, Global } from '@emotion/react'
import { useState, useEffect } from 'react';
import {useSelector, useDispatch, useStore} from 'react-redux';

import {global} from './css.js';
import drawBlob from './blob.js';
import { getLights, getEntertainmentAreas } from './hue.js';
import { refreshLights } from './actions';
import { connect, sendCommand } from './remoteSync.js';
import Room, {groupByRoom} from './components/room.js';
import SyncOptions, {row} from './components/syncOptions.js';
const syncify = require('./images/Syncify.svg').default;

// Phone remote: same sync settings and room switches as the computer page, plus player
// controls carried out by the computer. No Spotify player or audio capture runs here.
function Remote() {
  const lights = useSelector(state => state.lights);
  const dispatch = useDispatch();
  const store = useStore();

  const [locked, setLocked] = useState(undefined);   // undefined while checking
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [status, setStatus] = useState({});
  const [entertainment, setEntertainment] = useState({streaming: false, areas: []});

  useEffect(() => {
    drawBlob();
    fetch('/api/settings').then(res => {
      if (res.status === 401){
        setLocked(true);
      } else {
        setLocked(false);
      }
    });
  },[]);

  useEffect(() => {
    if (locked !== false) return;
    getLights().then(l => dispatch(refreshLights(l || [])));
    getEntertainmentAreas().then(setEntertainment);
    return connect(store, {host: false, onStatus: setStatus});
  },[locked]);

  const unlock = async () => {
    const res = await fetch('/api/remote/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({pin: pin})
    });
    const body = await res.json();
    if (body.ok){
      setPinError('');
      setLocked(false);
    } else {
      setPinError(body.error || 'Wrong PIN');
    }
  };

  const button = css`margin-top: 0; padding: 4px 14px; min-width: 44px;`;
  const item = css`line-height: 1.8; font-size: 14pt;`;

  return (
    <div className="App">
      <Global styles={global}/>
      <img className="centerH" css={css`width: 30%; max-width: 240px;`} src={syncify} alt="Syncify"/>

      {locked === true && (
        <div className="centerH">
          <div className="option-menu">
            <div className="titlebar"><div>Enter PIN</div></div>
            <div css={row}>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => { if (e.key === 'Enter') unlock(); }}
                placeholder="6-digit PIN"
                css={css`
                  font: inherit;
                  font-size: 16pt;
                  width: 70%;
                  color: rgb(33,33,33);
                  background: rgba(255,255,255,.5);
                  border: 1px solid white;
                  border-radius: 8px;
                  padding: 4px 8px;`}/>
              <div className="btn" css={button} onClick={unlock}>Unlock</div>
            </div>
            {pinError && <div css={css`padding: 2% 3%; font-size: 12pt;`}>{pinError}</div>}
            <div css={css`padding: 2% 3%; font-size: 11pt;`}>The PIN is shown in the Syncify server log on the computer.</div>
          </div>
        </div>
      )}

      {locked === false && (
        <div>
          <div className="centerH">
            <div className="option-menu">
              <div className="titlebar"><div>Now Playing</div></div>
              <div css={row}>
                <div css={item}>{status.track || 'Nothing playing'}</div>
              </div>
              <div css={css`display: flex; gap: 10px; justify-content: center; padding: 3%;`}>
                <div className="btn" css={button} onClick={() => sendCommand('previous')}>⏮</div>
                <div className="btn" css={button} onClick={() => sendCommand(status.playing ? 'pause' : 'play')}>
                  {status.playing ? '⏸' : '▶'}
                </div>
                <div className="btn" css={button} onClick={() => sendCommand('next')}>⏭</div>
              </div>
            </div>
          </div>

          <div className="centerH">
            <SyncOptions entertainment={entertainment} liveAudio={(
              <div css={row}>
                <div css={item}>
                  Live Audio
                  <span css={css`font-size: 11pt; margin-left: 10px;`}>
                    {status.liveSync ? 'running' : 'start it on the computer'}
                  </span>
                </div>
                {status.liveSync && (
                  <div className="btn" css={button} onClick={() => sendCommand('stopLive')}>Stop</div>
                )}
              </div>
            )}/>
          </div>

          {lights.length !== 0 && (
            <div className="room-list">
              {groupByRoom(lights).map(r => <Room key={r.room.id} room={r.room} lights={r.lights}/>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Remote
