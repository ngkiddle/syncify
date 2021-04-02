// this comment tells babel to convert jsx to calls to a function called jsx instead of React.createElement
/** @jsxImportSource @emotion/react */
import {css} from '@emotion/react'

const global = css`
  @import url('https://fonts.googleapis.com/css?family=Ubuntu&display=swap');
  body{
      margin:0px;
      padding: 0px;
      background-image: linear-gradient(45deg, DarkMagenta, Coral);
      width: 100%;
      height: 100%;
      color: GhostWhite;
  }
  html{
      font-family: 'Ubuntu', sans-serif; 
      width: 100%;
      height: 100%;
      margin: 0%;
      padding: 0%;
  }
  h1{
      margin-left: 3%; 
  }
  h2{
    text-align: center;
    margin-bottom: .5%;
    margin-top: 5%;
  }
  .centerH{
    display: block;
    margin: auto;
    width: 50%;
  }
  .player{
    border: 1px solid white;
    box-shadow: 5px 5px;
    padding: 2%;
    border-radius: 15px;
    background-color: rgba(0,0,0,.2);
    box-shadow: 5px 5px 20px rgb(0,0,0) inset;
  }
  .btn{
    border: 2px solid white;
    border-radius: 8px;
    color: rgba(255, 255, 255, 1);
    text-decoration: none;
    padding: 5px;
    text-align: center;
    width: 13%;
    margin-top:3%;
    font-size: 14pt;
    background-color: rgba(0,0,0,.2);
    box-shadow: 5px 5px 10px rgb(0,0,0) inset;
  }
  .option-menu{
    margin: auto;
    width: 500px;
    border: 1px solid white;
    border-radius: 15px;
    margin-top: 0%;
    background-color: rgba(0,0,0,.2);
    box-shadow: 5px 5px 20px rgb(0,0,0) inset;
  }`;

export {global}