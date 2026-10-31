import React from 'react';
// this comment tells babel to convert jsx to calls to a function called jsx instead of React.createElement
/** @jsxImportSource @emotion/react */
import {css} from '@emotion/react'
import {useSelector, useDispatch} from 'react-redux';
import Nouislider from "nouislider-react";
import "nouislider/distribute/nouislider.css";
import {refreshDb, setEntertainmentArea, setColorInterval, setSyncedColor} from './../actions';
import {setStaticColors} from './../hue.js';
import PALETTES from './../palettes.js';
import HueOption from './hueOptions.js'
import PalettePicker from './palettePicker.js'

// Shared by the computer page and the phone remote; liveAudio is the page's own first row
function SyncOptions({liveAudio, entertainment}){
  const options = useSelector(state => state.options);
  const lights = useSelector(state => state.lights);
  const dispatch = useDispatch();

  // color sync off: palette taps set fixed colors on the synced lights
  const applyStatic = async (paletteId, shuffle) => {
    const ids = lights.filter(l => l.sync).map(l => l.id);
    const palette = Object.assign({shuffle: shuffle}, PALETTES[paletteId]);
    dispatch(setSyncedColor(await setStaticColors(ids, palette)));
  };

  return (
    <div className="option-menu">
      <div className="titlebar">
        <div>Sync Options</div>
        {optionGlyph}
      </div>
      {liveAudio}
      <div css={row}>
        <div css={css`line-height: 1.8; font-size: 14pt;`}>Entertainment Area</div>
        {entertainment.streaming ? (
          <select
            value={options.entertainmentArea}
            onChange={e => dispatch(setEntertainmentArea(e.target.value))}
            css={css`
              font: inherit;
              font-size: 12pt;
              color: rgb(33,33,33);
              background: rgba(255,255,255,.5);
              border: 1px solid white;
              border-radius: 8px;
              padding: 2px 6px;`}>
            <option value="">Off (REST only)</option>
            {entertainment.areas.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.channels})</option>
            ))}
          </select>
        ) : (
          <div css={css`font-size: 11pt;`} title="Streaming needs a key that is only issued when pairing">
            Re-pair hub to enable
          </div>
        )}
      </div>
      <HueOption
        tag="Change Bulb Colors"
        checked={options.colorShift}
        last={false}
      />
      {!options.colorShift && (
      <div>
        <div className="db-info" css={css`margin-top: 2%; margin-bottom: 1%;`}>
          {hubinfo}
          <div>Tap a palette to set static colors (tap again for new ones).</div>
        </div>
        <PalettePicker selected={options.palette} shuffle={options.shuffle} onPick={applyStatic}/>
      </div>
      )}
      {options.colorShift && (
      <div>
        <PalettePicker selected={options.palette} shuffle={options.shuffle}/>
        <div className="db-slider">
          <div className="db-info">
            {hubinfo}
            <div>Minimum time between color changes.</div>
          </div>
          <Nouislider id="speed"
            range = {{min: 0.2, max: 8}}
            start = {[options.colorInterval]}
            orientation = "horizontal"
            tooltips = {[{to: v => `${Number(v).toFixed(1)}s`, from: v => parseFloat(v)}]}
            connect = {[true, false]}
            step = {0.1}
            onUpdate = {(values) => {
              dispatch(setColorInterval(parseFloat(values[0])))
            }}
          />
        </div>
      </div>
      )}
      <HueOption
        tag="Change Bulb Brightness"
        checked={options.brightnessShift}
        last={!options.brightnessShift}
      />
      {options.brightnessShift && (
      <div className="db-slider">
        <div className="db-info">
          {hubinfo}
          <div>Adjust the decibel thresholds for brightness changes.</div>
        </div>
        <Nouislider id="db"
          range = {{min: -35, max: 0}}
          start = {[options.dbLow, options.dbHigh]}
          orientation = "horizontal"
          tooltips = {true}
          connect = {true}
          step = {1}
          onUpdate = {async (index) => {
            await dispatch(refreshDb(index))
          }}
        />
      </div>
      )}
    </div>
  )
}

export const row = css`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  padding: 2%;
  border-bottom: 1px solid rgb(33,33,33);`;

const optionGlyph = <svg className='icon' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 9c.552 0 1 .449 1 1s-.448 1-1 1-1-.449-1-1 .448-1 1-1zm0-2c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm-9 4c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm18 0c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm-9-6c.343 0 .677.035 1 .101v-3.101c0-.552-.447-1-1-1s-1 .448-1 1v3.101c.323-.066.657-.101 1-.101zm9 4c.343 0 .677.035 1 .101v-7.101c0-.552-.447-1-1-1s-1 .448-1 1v7.101c.323-.066.657-.101 1-.101zm0 10c-.343 0-.677-.035-1-.101v3.101c0 .552.447 1 1 1s1-.448 1-1v-3.101c-.323.066-.657.101-1 .101zm-18-10c.343 0 .677.035 1 .101v-7.101c0-.552-.447-1-1-1s-1 .448-1 1v7.101c.323-.066.657-.101 1-.101zm9 6c-.343 0-.677-.035-1-.101v7.101c0 .552.447 1 1 1s1-.448 1-1v-7.101c-.323.066-.657.101-1 .101zm-9 4c-.343 0-.677-.035-1-.101v3.101c0 .552.447 1 1 1s1-.448 1-1v-3.101c-.323.066-.657.101-1 .101z"/></svg>
export const hubinfo = <svg className="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fillRule="evenodd" clipRule="evenodd"><path d="M12 0c6.623 0 12 5.377 12 12s-5.377 12-12 12-12-5.377-12-12 5.377-12 12-12zm0 1c6.071 0 11 4.929 11 11s-4.929 11-11 11-11-4.929-11-11 4.929-11 11-11zm.5 17h-1v-9h1v9zm-.5-12c.466 0 .845.378.845.845 0 .466-.379.844-.845.844-.466 0-.845-.378-.845-.844 0-.467.379-.845.845-.845z"/></svg>

export default SyncOptions
