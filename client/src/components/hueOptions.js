import React from 'react';
// this comment tells babel to convert jsx to calls to a function called jsx instead of React.createElement
/** @jsxImportSource @emotion/react */
import {css} from '@emotion/react'
import Switch from 'react-ios-switch';
import {useDispatch} from 'react-redux';
import {toggleBrightness, toggleColor} from './../actions';

function HueOption({tag, checked, last}){
    const dispatch = useDispatch();
    var grid = undefined
    if(last){
        grid =  css`
            display: grid;
            grid-template-columns: 90% 10%;
            padding: 2%;`;
    }
    else{
        grid =  css`
            display: grid;
            grid-template-columns: 90% 10%;
            padding: 2%;
            border-bottom: 1px solid rgb(33,33,33);`;
    }

    const item = css`line-height: 1.8; font-size: 14pt;`;
    
    return (
        <div css={grid}>
            <div css={item}>{tag}</div>
            <Switch
                checked={checked}
                onColor={"rgb(33, 33, 33)"}
                onChange={() => {
                    tag === "Change Bulb Colors" ? 
                    dispatch(toggleColor()) : dispatch(toggleBrightness())
                }}
            />
        </div>
    )
}

export default HueOption