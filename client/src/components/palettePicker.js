import React from 'react';
// this comment tells babel to convert jsx to calls to a function called jsx instead of React.createElement
/** @jsxImportSource @emotion/react */
import {css} from '@emotion/react'
import {useDispatch} from 'react-redux';
import {setPalette, toggleShuffle} from './../actions';
import PALETTES from './../palettes.js';

// onPick(paletteId, shuffleOn) runs after a palette or shuffle tap (used for static colors)
function PalettePicker({selected, shuffle, onPick}){
    const dispatch = useDispatch();

    const row = (active) => css`
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 10px;
        align-items: center;
        padding: 1% 2%;
        cursor: pointer;
        border-bottom: 1px solid rgb(33,33,33);
        background-color: ${active ? 'rgba(255,255,255,.45)' : 'transparent'};
        font-weight: ${active ? 'bold' : 'normal'};
        &:hover{ background-color: rgba(255,255,255,.3); }`;
    const item = css`line-height: 1.8; font-size: 12pt; padding-left: 3%;`;
    const swatches = css`display: flex; gap: 4px;`;
    const swatch = (color) => css`
        width: 16px;
        height: 16px;
        border-radius: 8px;
        border: 1px solid white;
        background: ${color};`;
    // same look as the hub/refresh icon buttons; filled when shuffle is on
    const shuffleBtn = (on) => css`
        display: flex;
        padding: 3px;
        border-radius: 24px;
        border: 1px solid ${on ? 'rgb(33,33,33)' : 'transparent'};
        background-color: ${on ? 'rgb(33,33,33)' : 'transparent'};
        fill: ${on ? 'white' : 'rgb(33,33,33)'};
        &:hover{ background-color: white; fill: rgb(33,33,33); }`;
    // conic gradient stands in for "any color" on the Random preset
    const rainbow = 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)';

    return (
        <div>
            {Object.keys(PALETTES).map(id => (
                <div key={id} css={row(id === selected)} onClick={() => {
                    dispatch(setPalette(id));
                    onPick && onPick(id, Boolean(shuffle[id]));
                }}>
                    <div css={item}>{PALETTES[id].name}</div>
                    <div css={swatches}>
                        {PALETTES[id].colors.length === 0
                            ? <div css={swatch(rainbow)}/>
                            : PALETTES[id].colors.map(c => <div key={c} css={swatch(c)}/>)}
                    </div>
                    <div
                        css={shuffleBtn(Boolean(shuffle[id]))}
                        title={shuffle[id] ? 'Shuffled: each light picks its own color' : 'Synced: all lights share one color'}
                        onClick={e => {
                            e.stopPropagation();
                            dispatch(setPalette(id));
                            dispatch(toggleShuffle(id));
                            onPick && onPick(id, !shuffle[id]);
                        }}>
                        {shuffleIcon}
                    </div>
                </div>
            ))}
        </div>
    )
}

const shuffleIcon = <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path d="M18 9v-3c-1 0-3.308-.188-4.506 2.216l-4.218 8.461c-1.015 2.036-3.094 3.323-5.37 3.323h-3.906v-2h3.906c1.517 0 2.903-.858 3.58-2.216l4.218-8.461c1.356-2.721 3.674-3.323 6.296-3.323v-3l6 4-6 4zm-9.463 1.324l1.117-2.242c-1.235-2.479-2.899-4.082-5.748-4.082h-3.906v2h3.906c2.872 0 3.644 2.343 4.631 4.324zm15.463 8.676l-6-4v3c-3.78 0-4.019-1.238-5.141-3.476l-1.118 2.237c1.18 2.311 2.159 3.239 6.259 3.239v3l6-4z"/></svg>

export default PalettePicker
