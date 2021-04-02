import * as $ from "jquery";
import {sendSegments} from "./hue.js";

function analysis(state, token, options, lights) {
    var d = new Date();
    var t = d.getTime();
    var progress = state.progressMs;
    var trackDur = state.track.durationMs;
    console.log(state)
    $.ajax({
        url: "https://api.spotify.com/v1/audio-analysis/" + state.track.id,
        type: "GET",
        beforeSend: (xhr) => {
        xhr.setRequestHeader("Authorization", "Bearer " + token);
        },
        success: (res) => {
        const l = extractLightId(lights)
        if (state.isPlaying === false){ 
            sendSegments( 
            {0: {duration: 1, loudness: 1}},
            progress, trackDur, t, options, l
            );
        }
        else{
            const segments = createSegmentData(res.segments);
            console.log(segments)
            sendSegments(segments, progress, trackDur, t, options, l);
        }
        },
        error: (err) => {
        console.log(err);
        }
    });  
}

const authEndpoint = 'https://accounts.spotify.com/authorize';
const clientId = "00687daa92064794bc08458536d97d0d";
const clientSec = "ec8206638bbc49ab8f68bae07ed8eae2"
const redirectUri = window.location.origin;
const scopes = [
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-read-email",
    "user-read-private",
    "app-remote-control",
    "streaming",
    "user-modify-playback-state"
];

async function connectSpotify(){
window.location = `${authEndpoint}?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes.join("%20")}&state=34fFs29kd09`
}

const hash = async() => {
const code = window.location.search
.substring(1)
.split("&")
.reduce(function(initial, item) {
    if (item) {
    var parts = item.split("=");
    initial[parts[0]] = decodeURIComponent(parts[1]);
    }
    // window.location.search = "";
    return initial;
}, {});
return code.code;
}  

async function getSpotifyTokens(code){
const res = $.ajax(
    {
    method: "POST",
    url: "https://accounts.spotify.com/api/token",
    data: {
        "grant_type":    "authorization_code",
        "code":          code,
        "redirect_uri":  redirectUri,
        "client_secret": clientSec,
        "client_id":     clientId,
    },
    success: function(result) {
        console.log(result);
        return result
    },
    }
);
return res;
}

async function refreshSpotifyTokens(refresh_token){
const result = $.ajax(
    {
    method: "POST",
    url: "https://accounts.spotify.com/api/token",
    data: {
        "grant_type":   "refresh_token",
        "refresh_token": refresh_token,
        "redirect_uri":  redirectUri,
        "client_secret": clientSec,
        "client_id":     clientId,
    },
    success: function(result) {
        return result;
    },
    }
);
console.log(result);
return result;
}

function createSegmentData(segs){
    var segments = {};
    var prevDur = 0;
    var prevStart = 0;
    for (var i = 0; i < segs.length; i++){
        var seg = segs[i];
        var dur = Math.round(seg.duration*1000);
        var start = prevStart + prevDur;
        var db = Math.round(((1 - (Math.min(Math.max(seg.loudness_max, -28), 0) / -28)) * 253) +1)
        segments[start] = {duration: dur, loudness: db};
        prevDur = dur;
        prevStart = start;
    }
    return segments;
}

function extractLightId(lights){
    var l = [];
    for (var i = 0; i < lights.length; i++){
      if(lights[i].sync){
        l.push(lights[i].id);
      }
    }
    return l;
}

function createSectionData(sects){
    var sections = {};
    var prevDur = 0;
    var prevStart = 0;
    for (var i = 0; i < sects.length; i++){
        var sect = sects[i];
        var dur = Math.round(sect.duration*1000);
        var start = prevStart + prevDur;
        var tempo = sect.tempo;
        sections[start] = {duration: dur, tempo: tempo};
        prevDur = dur;
        prevStart = start;
    }
    return sections;
}

export {
    analysis,
    connectSpotify,
    hash,
    getSpotifyTokens,
    refreshSpotifyTokens, 
    createSegmentData,
    extractLightId,
    createSectionData
}