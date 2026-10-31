// this comment tells babel to convert jsx to calls to a function called jsx instead of React.createElement
/** @jsxImportSource @emotion/react */
import {css} from '@emotion/react'

const global = css`
  @import url('https://fonts.googleapis.com/css?family=Ubuntu&display=swap');
  body{
      margin:0px;
      padding: 0px;
      background-image: linear-gradient(45deg, DarkMagenta, Coral);
      background-attachment: fixed;
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
  .App{
    padding-bottom: 150px;
  }
  .centerH{
    display: block;
    margin: auto;
    width: 50%;
  }
  .player{
    border: 1px solid white;
    padding: 2%;
    border-radius: 15px;
    background-color: rgba(255,255,255,.5);
    box-shadow: 5px 5px 20px rgb(255,255,255) inset;
    backdrop-filter: blur(10px); 
    z-index: 100;
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
    position: relative;
    z-index: 1;
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
  .titlebar-lights{
    display: grid;
    gap: 2px;
    grid-template-columns: 83% 7.5% 1px 7.5%;
    border-bottom: 2px solid rgb(33,33,33);
    padding-left: 3%;
    padding-top: 2%;
    padding-bottom: 2%;
    font-size: 14pt;
    font-weight: bold;
  }
  .room-list{
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: flex-start;
    gap: 20px;
    width: 90%;
    margin: 20px auto 0;
  }
  .room-list .option-menu{
    width: 300px;
    margin: 0;
  }
  .room-list .titlebar{
    grid-template-columns: 1fr auto;
    padding-right: 3%;
    padding-bottom: 2%;
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
  .hub{
    position: absolute;
    padding: 5px;
    top: 2px;
  }
  .hub:hover{
    background-fill: white;
    background-color: white;
    border-radius: 24px;
    filter: invert(1);
    cursor: pointer;
  }
  .refresh-icon{
    position: absolute;
    padding: 5px;
    top: 2px;
  }
  .refresh-icon:hover{
    background: white;
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
    div{
      margin-top: 3px;
    }
    display: grid;
    grid-template-columns: 5% 95%;
    padding-bottom: 0%;
    font-size: 12pt;
    text-align: center;
    margin: auto;
    margin-bottom: 8%;
  }
  #db .noUi-connect, #speed .noUi-connect{
    background: rgb(33,33,33);
  }
  
  #db .noUi-handle, #speed .noUi-handle{
    cursor: grab;
    border-radius: 24px;
    background: rgba(255,255,255,1);
  }
  #db .noUi-tooltip, #speed .noUi-tooltip{
    background: rgba(255,255,255,.5);
    box-shadow: 5px 5px 20px rgb(255,255,255) inset;
    border-radius: 24px;
    color: rgb(33,33,33);
  }
  .__1hv1669 > div{
    z-index: 100;
    border: 1px solid white;
    border-radius: 15px;
    background-color: rgba(255,255,255,.5);
    box-shadow: 5px 5px 20px rgb(255,255,255) inset;
    backdrop-filter: blur(10px); 
  }
  .PlayerRSWP{
    position: relative;
    z-index: 99;
  }
  ._DevicesRSWP > div{
    position: absolute;
    z-index: 100;
    right: -1010%;
    top: 75%;
  }
  /* phones: full-width cards stacked with tight spacing instead of the fixed 500px desktop layout */
  @media (max-width: 600px){
    .App{
      padding-bottom: 60px;
    }
    .centerH{
      width: auto;
      margin-left: 8px;
      margin-right: 8px;
    }
    img.centerH{
      width: 45% !important;
      margin: 8px auto 0;
    }
    .option-menu{
      width: auto;
      margin-top: 10px;
    }
    /* keep the end handles and their tooltips inside the card */
    .db-slider{
      margin-left: 9%;
      margin-right: 9%;
    }
    .room-list{
      width: auto;
      gap: 10px;
      margin: 10px 8px 0;
    }
    .room-list .option-menu{
      width: 100%;
      margin: 0;
    }
  }
`;

export {global}