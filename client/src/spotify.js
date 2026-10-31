import * as $ from "jquery";
import {sendSegments} from "./hue.js";
import {logToServer} from "./remoteLog.js";

var segmentsCur = {};

async function analysis(state, token, options, lights) {
    var d = new Date();
    var t = d.getTime();
    var progress = state.progressMs;
    var trackDur = state.track.durationMs;
    console.log(state)
    logToServer(`player ${state.type}: "${state.track.name}" playing=${state.isPlaying} progress=${progress}ms, ` +
        `synced lights=${extractLightId(lights).length}, color=${options.colorShift} bri=${options.brightnessShift}`);
    if(!state.track.id){
        return;
    }
    if(!(state.track.id in segmentsCur)){
        $.ajax({
            url: "https://api.spotify.com/v1/audio-analysis/" + state.track.id,
            type: "GET",
            beforeSend: (xhr) => {
            xhr.setRequestHeader("Authorization", "Bearer " + token);
            },
            success: async (res) => {
            logToServer(`audio-analysis OK: ${res.segments.length} segments`);
            segmentsCur[state.track.id] = res.segments;
            const l = extractLightId(lights)
            if (state.isPlaying === false){
                sendSegments(
                {0: false},
                progress, trackDur, t, options, l
                );
            }
            else{
                const segments = createSegmentData(res.segments, options.dbHigh, options.dbLow);
                console.log(segments)
                return (await sendSegments(segments, progress, trackDur, t, options, l));
            }
            },
            error: (err) => {
                logToServer(`audio-analysis FAILED for track ${state.track.id}: HTTP ${err.status} ${err.responseText}`, 'error');
                return (false);
            }
        });
    }
    else{
        const l = extractLightId(lights)
            if (state.isPlaying === false){
                sendSegments(
                {0: false},
                progress, trackDur, t, options, l
                );
            }
            else{
                const segments = createSegmentData(segmentsCur[state.track.id], options.dbHigh, options.dbLow);
                console.log(segments)
                return (await sendSegments(segments, progress, trackDur, t, options, l));
            }
    }
}

const authEndpoint = 'https://accounts.spotify.com/authorize';
const clientId = "00687daa92064794bc08458536d97d0d";
const clientSec = "ec8206638bbc49ab8f68bae07ed8eae2"
// Check if we're on localhost - Spotify requires exact match for redirect URI
const redirectUri = 'https://127.0.0.1:3000';

const scopes = [
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-read-email",
    "user-read-private",
    "app-remote-control",
    "streaming",
    "user-modify-playback-state",
    "user-read-recently-played"
];

async function connectSpotify(){
window.location = `${authEndpoint}?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes.join("%20")}&state=34fFs29kd09`
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

function createSegmentData(segs, dbHigh, dbLow){
    var segments = {};
    var prevDur = 0;
    var prevStart = 0;
    for (var i = 0; i < segs.length; i++){
        var seg = segs[i];
        var dur = Math.round(seg.duration*1000);
        var start = prevStart + prevDur;
        var db = Math.round(((1 - (Math.min(Math.max(seg.loudness_max, dbLow), dbHigh) / dbLow)) * 253) +1)
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

// Makes the in-page Syncify player the active Spotify device, picking up whatever was
// playing last (paused) so its play button works without choosing a device first.
async function takeOverPlayback(token, deviceId){
    const api = (path, init) => fetch('https://api.spotify.com/v1' + path, Object.assign({
        headers: {Authorization: 'Bearer ' + token, 'Content-Type': 'application/json'}
    }, init));

    // transferring keeps the current/last session's track and position. Right after the
    // player is ready Spotify may not know the new device yet (500/404), so retry briefly.
    var transfer = undefined;
    for (var attempt = 0; attempt < 5; attempt++){
        if (attempt > 0){
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
        transfer = await api('/me/player', {
            method: 'PUT',
            body: JSON.stringify({device_ids: [deviceId], play: false})
        });
        if (transfer.ok || (transfer.status !== 404 && transfer.status < 500)){
            break;
        }
    }
    if (transfer.ok){
        const current = await api('/me/player');
        if (current.status === 200){
            const state = await current.json();
            if (state.item){
                logToServer(`Syncify is now the Spotify device, ready to resume "${state.item.name}"`);
                return true;
            }
        }
    }

    // no session to transfer: cue up the most recently played track instead
    const recent = await api('/me/player/recently-played?limit=1');
    if (!recent.ok){
        logToServer(`nothing to resume (recently-played HTTP ${recent.status}` +
            (recent.status === 401 || recent.status === 403 ? '; log in to Spotify again to grant access)' : ')'), 'warn');
        return false;
    }
    const item = ((await recent.json()).items || [])[0];
    if (!item){
        return false;
    }
    const context = item.context && item.context.uri;
    const body = context && context.indexOf(':artist:') < 0
        ? {context_uri: context, offset: {uri: item.track.uri}}
        : {uris: [item.track.uri]};
    const play = await api('/me/player/play?device_id=' + deviceId, {method: 'PUT', body: JSON.stringify(body)});
    if (play.ok){
        // the API can only cue by starting playback, so pause straight away
        await api('/me/player/pause?device_id=' + deviceId, {method: 'PUT'});
        logToServer(`Syncify is now the Spotify device, cued up "${item.track.name}"`);
        return true;
    }
    return false;
}

function pause(){
    var element = document.querySelector('[aria-label="Pause"]');
    if(element !== null){
      element.click();
    }
    return;
  }

export {
    analysis,
    connectSpotify,
    hash,
    getSpotifyTokens,
    refreshSpotifyTokens,
    createSegmentData,
    extractLightId,
    createSectionData,
    takeOverPlayback,
    pause
}