// import React, { useEffect, useState } from "react";
// import { spotifyGetAccessToken, spotifyHttpGET } from "./spotify";
// import SpotifyPlayer from 'react-spotify-web-playback';

// import {
//     Switch,
//     Route,
//     NavLink,
//     Redirect,
//     Link,
//     useParams,
//     useRouteMatch,
//     useHistory
//   } from 'react-router-dom';
// this comment tells babel to convert jsx to calls to a function called jsx instead of React.createElement
/** @jsx jsx */
import { css, jsx, Global } from '@emotion/core'


import React, { Component } from "react";
// import hash from "./hash";
import logo from "./logo.svg";
import * as $ from "jquery";
import SpotifyPlayer from 'react-spotify-web-playback';
// import "./App.css";
export const authEndpoint = 'https://accounts.spotify.com/authorize';
// Replace with your app's client ID, redirect URI and desired scopes
const clientId = "00687daa92064794bc08458536d97d0d";
const redirectUri = "http://localhost:3000/";
const scopes = [
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-read-email",
  "user-read-private",
  "app-remote-control",
  "streaming",
  "user-modify-playback-state"
];
// Get the hash of the url
const hash = window.location.hash
  .substring(1)
  .split("&")
  .reduce(function(initial, item) {
    if (item) {
      var parts = item.split("=");
      initial[parts[0]] = decodeURIComponent(parts[1]);
    }
    return initial;
  }, {});
window.location.hash = "";
class App extends Component {
  constructor() {
    super();
    this.state = {
      token: null
    }
  }
  componentDidMount() {
    // Set token
    let _token = hash.access_token;
    if (_token) {
      // Set token
      this.setState({
        token: _token
      });
    }
  }
render() {
  return (
    <div className="App">
       <Global styles={css`
              @import url('https://fonts.googleapis.com/css?family=Ubuntu&display=swap');
              body{
                  margin:0px;
                  padding: 0px;
                  background-color: LightSlateGrey;
                  width: 100%;
                  height: 100%;
                  color: HoneyDew;
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
              .center {
                margin: 0;
                position: absolute;
                top: 50%;
                left: 50%;
                -ms-transform: translate(-50%, -50%);
                transform: translate(-50%, -50%);
              }
              .btn{
                border: 2px solid HoneyDew;
                border-radius: 5px;
                color: HoneyDew;
                text-decoration: none;
                padding: 5px;
              }
      `}/>
      <header className="App-header">
      <h1>Syncify</h1>
      {!this.state.token && (
        <a
          className="btn center btn--loginApp-link"
          href={`${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join("%20")}&response_type=token&show_dialog=true`}
        >
          Login to Spotify
        </a>
      )}
      {this.state.token && (
        <div className="center" styles={css`height: 50%; width: 100%;`}>
        <SpotifyPlayer
              token={this.state.token}
              autoPlay={true}
              magnifySliderOnHover={true}
              uris={['spotify:artist:6HQYnRM4OzToCYPpVBInuU']}
              styles={{
                height: '35%',
                activeColor: '#F0FFF0',
                bgColor: '#F0FFF0',
                color: '#778899',
                loaderColor: '#F0FFF0',
                sliderColor: '#778899',
                trackArtistColor: '#778899',
                trackNameColor: '#778899',
                sliderColor: '#F0FFF0',
                sliderHandleColor: '#F0FFF0',
                sliderHeight: 5,
                sliderHandleBorderRadius: 7
              }}
        />
        </div>
      )}
      </header>
    </div>
  );
  }
}
export default App;
