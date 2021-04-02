import React from 'react';
// this comment tells babel to convert jsx to calls to a function called jsx instead of React.createElement
/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import {getLights} from './../hue.js';
import global from './../css.js';

import {useDispatch} from 'react-redux';
import {refreshLights, selectBridge, toggleBridgeOK} from './../actions';

function Bridge({ip, name, connected}){
    const dispatch = useDispatch();

    if (connected){
        return null;
    }

    const item = css`line-height: 1.8; font-size: 14pt;`;
    const grid =  css`
    display: grid;
    grid-template-columns: 70% 30%;
    padding: 3%;`

    return (
        <div css={grid}>
            <div css={item}>{name} @ {ip}</div>
            <button 
                className="btn" 
                onClick={async () => {
                    const res = await connectBridge(ip);
                    console.log(res)
                    dispatch(toggleBridgeOK(true))
                    dispatch(selectBridge(res))
                    dispatch(refreshLights(getLights));
                }}
            >Connect</button>
        </div>
    )
}

async function connectBridge(ip){
    const response = await fetch('/api/connectBridge', {
        method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ip: ip })
    });
    const body = await response.json();
    if(body.connected){
      
      return body.bridge;
    }
    if (response.status !== 200) throw Error(body.message);
  };

export default Bridge