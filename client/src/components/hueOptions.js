import React from 'react';
// this comment tells babel to convert jsx to calls to a function called jsx instead of React.createElement
/** @jsxImportSource @emotion/react */
import { css, jsx } from '@emotion/react'
import Switch from 'react-ios-switch';
import {useDispatch} from 'react-redux';
import {toggleBrightness, toggleColor} from './../actions';

function HueOption({tag, checked}){
    const dispatch = useDispatch();
    const grid =  css`
        display: grid;
        grid-template-columns: 90% 10%;
        padding: 3%;`;
    const item = css`
        line-height: 2;
        font-size: 14pt;`;

    return (
        <div css={grid}>
            <div css={item}>{tag}</div>
            <Switch
                checked={checked}
                onColor={"rgb(139, 0, 139)"}
                onChange={() => {
                    tag === "Change Bulb Colors" ? 
                    dispatch(toggleColor()) : dispatch(toggleBrightness())
                }}
            />
        </div>
    )
}

export default HueOption