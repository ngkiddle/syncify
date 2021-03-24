import React from 'react';
// this comment tells babel to convert jsx to calls to a function called jsx instead of React.createElement
/** @jsx jsx */
import { css, jsx } from '@emotion/react'
import Switch from 'react-ios-switch';

function HueOptions({tag, toggle, checked}){
    const center = css`
    display: block;
    margin: auto;
    width: 500px;
    border: 1px solid GhostWhite;
    margin-top: 5%;
    `;
    return (
        <div css={center}>
            <HueOption tag={tag} toggle={toggle} checked={checked} />
                
        </div>
    )
}

function HueOption({tag, toggle, checked}){
    const grid =  css`
        display: grid;
        grid-template-columns: 75% 25%;
        padding: 3%;
    `
    const item = css`line-height: 2; font-size: 14pt;`;

    return (
        <div css={grid}>
            <div css={item}>{tag}</div>
            <Switch
                checked={checked}
                onColor={"rgb(139, 0, 139)"}
                onChange={toggle}
            />
        </div>
    )
}

export default HueOptions