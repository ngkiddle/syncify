import React from 'react';
// this comment tells babel to convert jsx to calls to a function called jsx instead of React.createElement
/** @jsx jsx */
import { css, jsx } from '@emotion/react'
const bulbSVG = require('./../images/lightbulb.svg');

function Lightbulb({id, name, color, state, bri}){
    const rgb = xyBriToRgb(color[0], color[1], bri)
    console.log(rgb)
    const rgbString = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`


    const container = css`border: 4px solid ${rgbString}; border-radius: 20px; width: 20%; display: inline-block; margin: 1%;`;
    const svgStyle = css`margin: 5px;`;
    const nameStyle = css`color: ${rgbString}; float: left; margin: 5px;`;
    const stateStyle = css`color: ${rgbString}; float: right; display: inline-block; margin: 5px;`;
    return(
        <div css={container}>
            <img src={bulbSVG} alt={name}/>
            <div css={nameStyle}>{name}</div>
            <div css={stateStyle}>{state}</div>
        </div>
    )
}

function xyBriToRgb(x, y, bri){
    var z = 1.0 - x - y;
    var Y = bri / 255.0; // Brightness of lamp
    var X = (Y / y) * x;
    var Z = (Y / y) * z;
    var r = X * 1.612 - Y * 0.203 - Z * 0.302;
    var g = -X * 0.509 + Y * 1.412 + Z * 0.066;
    var b = X * 0.026 - Y * 0.072 + Z * 0.962;
    r = r <= 0.0031308 ? 12.92 * r : (1.0 + 0.055) * Math.pow(r, (1.0 / 2.4)) - 0.055;
    g = g <= 0.0031308 ? 12.92 * g : (1.0 + 0.055) * Math.pow(g, (1.0 / 2.4)) - 0.055;
    b = b <= 0.0031308 ? 12.92 * b : (1.0 + 0.055) * Math.pow(b, (1.0 / 2.4)) - 0.055;
    var maxValue = Math.max(r,g,b);
    r /= maxValue;
    g /= maxValue;
    b /= maxValue;
    r = Math.round(r * 255); if (r < 0) { r = 0; }
    g = Math.round(g * 255); if (g < 0) { g = 0; }
    b = Math.round(b * 255); if (b < 0) { b = 0; }
    return {
        r :r,
        g :g,
        b :b
    }
}
export default Lightbulb;