// Live audio analysis: captures shared tab/system audio, measures loudness with the
// Web Audio API and streams brightness frames to the server for the lights.
import {logToServer} from "./remoteLog.js";

const frameMs = 200;            // roughly Spotify's average segment length
const silentWarnMs = 5000;

var stream = undefined;
var audioCtx = undefined;
var analyser = undefined;
var buffer = undefined;
var timer = undefined;
var playing = true;
var silentSince = undefined;
var warnedSilent = false;
var warnedOffline = false;

// getOptions/getLights are read every frame so toggles and the dB slider apply live
async function start({getOptions, getLights, onLevel, onEnded}){
    stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,    // Chrome requires video to be requested; we drop it right away
        audio: {echoCancellation: false, noiseSuppression: false, autoGainControl: false},
        selfBrowserSurface: 'include',
        systemAudio: 'include',
    });
    stream.getVideoTracks().forEach(t => t.stop());
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0){
        stream = undefined;
        throw Error('No audio was shared. Pick this tab (or Entire screen) and turn on "Share audio".');
    }
    audioTracks[0].addEventListener('ended', () => {
        stop();
        onEnded();
    });

    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    buffer = new Float32Array(analyser.fftSize);
    audioCtx.createMediaStreamSource(stream).connect(analyser);
    logToServer(`live audio capture started: "${audioTracks[0].label}"`);

    silentSince = Date.now();
    warnedSilent = false;
    warnedOffline = false;
    timer = setInterval(() => tick(getOptions(), getLights(), onLevel), frameMs);
}

function tick(options, lights, onLevel){
    analyser.getFloatTimeDomainData(buffer);
    var peak = 0;
    for (var i = 0; i < buffer.length; i++){
        peak = Math.max(peak, Math.abs(buffer[i]));
    }
    const db = peak > 0 ? 20 * Math.log10(peak) : -Infinity;
    onLevel(db);

    if (db > -60){
        silentSince = Date.now();
    }
    else if (playing && !warnedSilent && Date.now() - silentSince > silentWarnMs){
        warnedSilent = true;
        logToServer('live audio is silent while playing. If you shared this tab, the protected Spotify audio may be ' +
            'blocked; stop and share "Entire screen" with "Share system audio" instead.', 'warn');
    }

    if (!playing || lights.length === 0){
        return;
    }
    // same loudness -> brightness mapping as createSegmentData, using the dB slider range
    const dbLow = Number(options.dbLow);
    const dbHigh = Number(options.dbHigh);
    const clamped = Math.min(Math.max(db, dbLow), dbHigh);
    const bri = Math.round(((1 - (clamped / dbLow)) * 253) + 1);

    fetch('/api/liveFrame', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({bri: bri, lights: lights, options: options})
    })
    .then(res => res.json())
    .then(body => {
        if (body.connected === false && !warnedOffline){
            warnedOffline = true;
            logToServer('live frame rejected: server is not connected to the bridge (reload the page)', 'warn');
        }
    })
    .catch(() => {});
}

function stop(){
    if (timer !== undefined){
        clearInterval(timer);
        timer = undefined;
    }
    if (stream !== undefined){
        stream.getTracks().forEach(t => t.stop());
        stream = undefined;
    }
    if (audioCtx !== undefined){
        audioCtx.close();
        audioCtx = undefined;
    }
    fetch('/api/liveStop', {method: 'POST'}).catch(() => {});
    logToServer('live audio capture stopped');
}

// called from the Spotify player so paused music doesn't dim everything to minimum
function setPlaying(isPlaying){
    if (isPlaying !== playing){
        playing = isPlaying;
        if (!playing){
            fetch('/api/liveStop', {method: 'POST'}).catch(() => {});
        }
    }
}

export {
    start,
    stop,
    setPlaying
}
