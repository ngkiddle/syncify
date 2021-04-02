import React from 'react';
// this comment tells babel to convert jsx to calls to a function called jsx instead of React.createElement
/** @jsxImportSource @emotion/react */
import {css} from '@emotion/react';
import Switch from 'react-ios-switch';
import {useDispatch} from 'react-redux';
import {toggleLight} from './../actions';

function Lightbulb({id, name, bri, color, sync, toggle, index}){
    const rgb = xyBriToRgb(color[0], color[1], bri)
    const rgbString = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
    const dispatch = useDispatch();

    const grid =  css`
    display: grid;
    grid-template-columns: 90% 10%;
    padding: 3%;`;
    const item = css`line-height: 2; font-size: 14pt;`;
    
    return (
        <div css={grid}>
            <div css={item}>{name}</div>
            <Switch
                checked={sync}
                onColor={rgbString}
                onChange={() => {dispatch(toggleLight(id))}}
            />
        </div>
    );
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