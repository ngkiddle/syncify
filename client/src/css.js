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
    background-color: rgba(255,255,255,.5);
    box-shadow: 5px 5px 20px rgb(255,255,255) inset;
    backdrop-filter: blur(10px); 
  }
  .btn{
    border: 1px solid white;
      border-radius: 8px;
      color: rgb(33,33,33);
      text-decoration: none;
      padding: 5px;
      text-align: center;
      margin-top:3%;
      font-size: 14pt;
      background-color: rgba(255,255,255,.5);
      box-shadow: 5px 5px 15px rgb(255,255,255) inset;
      backdrop-filter: blur(10px);
      cursor: pointer;

  }
  .btn:hover{
    border: 1px solid white;
    border-radius: 8px;
    color: rgb(33,33,33);
    text-decoration: none;
    padding: 5px;
    text-align: center;
    margin-top:3%;
    font-size: 14pt;
    background-color: rgba(255,255,255,.8);
    box-shadow: 5px 5px 5px rgb(255,255,255) inset;
    backdrop-filter: blur(10px);
    cursor: pointer;
    filter: invert(1);
  }
  .option-menu{
    margin: auto;
    color: rgb(33,33,33);
    width: 500px;
    border: 1px solid white;
    border-radius: 15px;
    margin-top: 3%;
    background-color: rgba(255,255,255,.5);
    box-shadow: 5px 5px 20px rgb(255,255,255) inset;
    backdrop-filter: blur(10px); 
  }
  .titlebar{
    display: grid;
    grid-template-columns: 90% 10%;
    border-bottom: 2px solid rgb(33,33,33);
    padding-left: 3%;
    padding-top: 2%;
    padding-bottom: 0%;
    font-size: 14pt;
    font-weight: bold;

  }
  .infobar{
    display: grid;
    grid-template-columns: 10% 90%;
    padding-bottom: 0%;
    font-size: 12pt;
    text-align: center;
    margin: auto;
    padding: 1%;
    color: rgb(33,33,33);
    border: 1px solid white;
    border-radius: 15px;
    margin-top: 3%;
    background-color: rgba(255,255,255,.5);
    box-shadow: 5px 5px 20px rgb(255,255,255) inset;
    backdrop-filter: blur(10px); 
  }
  .icon{
    margin-bottom: 8px;
  }
  .refresh-icon{
    margin-bottom: 3px;
  }
  .refresh-icon:hover{
    font-weight: bold;
    margin-bottom: 3px;
    background: white;
    padding: 3px;
    padding-left: 2px;
    border-radius: 24px;
    filter: invert(1);
    cursor: pointer;
  }
  .db-slider{
    margin-top: 1%;
    margin-bottom: 12%;
    margin-right: 5%;
    margin-left: 5%;
    height: 40px;
  }
  .db-info{
    display: grid;
    grid-template-columns: 10% 90%;
    padding-bottom: 0%;
    font-size: 12pt;
    text-align: center;
    margin: auto;
    margin-bottom: 8%;
  }
  #db .noUi-connect{
    background: rgb(33,33,33);
  }
  
  #db .noUi-handle{
    cursor: grab;
    border-radius: 24px;
    background: rgba(255,255,255,1);
  }
  #db .noUi-tooltip{
    background: rgba(255,255,255,.5);
    box-shadow: 5px 5px 20px rgb(255,255,255) inset;
    border-radius: 24px;
    color: rgb(33,33,33);
  }
`;

export {global}