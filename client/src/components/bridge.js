import React from 'react';
// this comment tells babel to convert jsx to calls to a function called jsx instead of React.createElement
/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import {getBridges, getLights} from './../hue.js';

import {useSelector, useDispatch} from 'react-redux';
import {refreshLights, selectBridge, toggleBridgeOK} from './../actions';

function Bridge({ip, name, connected, index}){
  const bridges = useSelector(state => state.bridges);
  const dispatch = useDispatch();

  if (connected){
      return null;
  }

  var grid = undefined;
  if(index === bridges.length-1){
    grid =  css`
    display: grid;
    grid-template-columns: 90% 10%;
    padding-top: 1%;
    padding-bottom: 1%;`;
  }
  else{
    grid =  css`
    display: grid;
    grid-template-columns: 90% 10%;
    padding-top: 1%;
    padding-bottom: 1%;
    border-bottom: 1px solid rgb(33,33,33);`;
  }
  const item = css`
    line-height: 2.2;
    font-size: 14pt;
    padding-left: 3%;`;
  const btn = css `
    width: 27px;
    height: 27px;
    `

  return (
      <div css={grid}>
          <div css={item}>{name} @ {ip}</div>
          <div
              className="btn"
              css={btn} 
              onClick={async () => {
                  const res = await connectBridge(ip);
                  if(res){
                    dispatch(toggleBridgeOK(true))
                    dispatch(selectBridge(res))
                    dispatch(refreshLights(getLights));
                  }
                  alert("Error: please press button on Hue Hub first.")
              }}
          >{connect}</div>
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

const connect = <svg className="connect-icon" width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd"><path d="M2.598 9h-1.055c1.482-4.638 5.83-8 10.957-8 6.347 0 11.5 5.153 11.5 11.5s-5.153 11.5-11.5 11.5c-5.127 0-9.475-3.362-10.957-8h1.055c1.443 4.076 5.334 7 9.902 7 5.795 0 10.5-4.705 10.5-10.5s-4.705-10.5-10.5-10.5c-4.568 0-8.459 2.923-9.902 7zm12.228 3l-4.604-3.747.666-.753 6.112 5-6.101 5-.679-.737 4.608-3.763h-14.828v-1h14.826z"/></svg>

export default Bridge