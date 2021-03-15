// this comment tells babel to convert jsx to calls to a function called jsx instead of React.createElement
/** @jsx jsx */
import { css, jsx, Global } from '@emotion/core'
// import {discoverAndCreateUser} from './discover.js'

import {React, Component } from "react";
import * as $ from "jquery";
import SpotifyPlayer from 'react-spotify-web-playback';
export const authEndpoint = 'https://accounts.spotify.com/authorize';
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


const v3 = require('node-hue-api').v3;
const discovery = require('node-hue-api').discovery;
const hueApi = v3.api;


const appName = 'syncify-hue';
const deviceName = 'awaited-bridge';

async function discoverBridge() {
  const discoveryResults = await discovery.nupnpSearch();

  if (discoveryResults.length === 0) {
    console.error('Failed to resolve any Hue Bridges');
    return null;
  } else {
    // Ignoring that you could have more than one Hue Bridge on a network as this is unlikely in 99.9% of users situations
    return discoveryResults[0].ipaddress;
  }
}

async function discoverAndCreateUser() {
  const ipAddress = await discoverBridge();

  // Create an unauthenticated instance of the Hue API so that we can create a new user
  const unauthenticatedApi = await hueApi.createLocal(ipAddress).connect();
  
  let createdUser;
  try {
    createdUser = await unauthenticatedApi.users.createUser(appName, deviceName);
    console.log('*******************************************************************************\n');
    console.log('User has been created on the Hue Bridge. The following username can be used to\n' +
                'authenticate with the Bridge and provide full local access to the Hue Bridge.\n' +
                'YOU SHOULD TREAT THIS LIKE A PASSWORD\n');
    console.log(`Hue Bridge User: ${createdUser.username}`);
    console.log(`Hue Bridge User Client Key: ${createdUser.clientkey}`);
    console.log('*******************************************************************************\n');

    // Create a new API instance that is authenticated with the new user we created
    const authenticatedApi = await hueApi.createLocal(ipAddress).connect(createdUser.username);

    // Do something with the authenticated user/api
    const bridgeConfig = await authenticatedApi.configuration.getConfiguration();
    console.log(`Connected to Hue Bridge: ${bridgeConfig.name} :: ${bridgeConfig.ipaddress}`);

  } catch(err) {
    if (err.getHueErrorType() === 101) {
      console.error('The Link button on the bridge was not pressed. Please press the Link button and try again.');
    } else {
      console.error(`Unexpected Error: ${err.message}`);
    }
  }
}

discoverAndCreateUser();

const global = css`
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
`;

function analysis(state, token) {
  console.log(state)
  if (state.play === false){
    console.log("black")
  }
  else{
    $.ajax({
      url: "https://api.spotify.com/v1/audio-analysis/" + state.track.id,
      type: "GET",
      beforeSend: (xhr) => {
        xhr.setRequestHeader("Authorization", "Bearer " + token);
      },
      success: (res) => {
        console.log(res);
        let duration = res.track.duration
        let segments = res.segments.map(segment => {
          return {
            start: segment.start / duration,
            duration: segment.duration / duration,
            loudness: 1 - (Math.min(Math.max(segment.loudness_max, -35), 0) / -35)
          }
        })

        let min = Math.min(...segments.map(s => s.loudness))
        let max = Math.max(...segments.map(s => s.loudness))
        let levels = []
        console.log(segments)
        for (let i = 0.000; i < 1; i += 0.001) {
          let s = segments.find(segment => {
            return i <= segment.start + segment.duration
          })
          let loudness = Math.round((s.loudness / max) * 100) / 100
          levels.push(loudness)

        }

      },
      error: (err) => {
        console.log(err);
      }
  });
      // curl -X 
      // "GET" + "https://api.spotify.com/v1/audio-analysis/" + state.track -H
      // "Accept: application/json" -H
      // "Content-Type: application/json"  -H
      // "Authorization: Bearer " + token
      

    }
}
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
       <Global styles={global}/>
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
              syncExternalDevice={true}
              name="Syncify"
              callback={(State) => analysis(State, this.state.token)}
              uris={['spotify:artist:0L8ExT028jH3ddEcZwqJJ5']}
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
