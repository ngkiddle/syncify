const express = require('express');
const bodyParser = require('body-parser');
const logStream = require('./logStream');
const hue = require('./hueClient');
const liveSync = require('./liveSync');
const app = express();
const thrd = require("threads");
const port = process.env.PORT || 5000;

var hueapi = undefined;
var bridge = undefined;
var segments = undefined;

app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
logStream.attach(app);

// Log every API call except the per-segment light commands and the log stream itself
app.use('/api', (req, res, next) => {
    if (!['/setLight', '/logs', '/clientLog', '/liveFrame'].includes(req.path)) {
        console.log(`${req.method} /api${req.path}`);
    }
    next();
});

// Find bridges on the network
app.get('/api/discAllBridges', async (req, res) => {
    try {
        const bridges = await hue.discoverBridges();
        bridges.forEach((b, i) => { b.index = i; });
        console.log(bridges);
        res.send({ bridges: bridges });
    } catch (err) {
        console.log(err.message);
        res.send({ bridges: [], error: err.message });
    }
});

// Pair with a bridge (link button must be pressed first)
app.post('/api/connectBridge', async (req, res) => {
    const ip = req.body.ip;
    console.log("press link button on device with ip: " + ip);
    try {
        const { appKey } = await hue.createAppKey(ip);
        const config = await hue.getBridgeConfig(ip);
        hueapi = hue.connect(ip, appKey);
        // `username` holds the v2 application key so the client's cookie format is unchanged
        bridge = { ip: ip, name: config.name, model: config.modelid, username: appKey };
        res.send({ connected: true, bridge: bridge });
    } catch (err) {
        if (err.type === 101) {
            console.error('The Link button on the bridge was not pressed. Please press the Link button and try again.');
        } else {
            console.error(`Unexpected Error: ${err.message}`);
        }
        res.send({ connected: false, error: err.message });
    }
});

// Check that a bridge at a manually entered IP is reachable
app.post('/api/connectHue', async (req, res) => {
    const { ipAddress } = req.body;
    if (!ipAddress) {
        return res.status(400).json({ success: false, error: 'IP address is required' });
    }
    try {
        const config = await hue.getBridgeConfig(ipAddress);
        res.json({
            success: true,
            bridgeInfo: { ip: ipAddress, name: config.name, id: config.bridgeid, model: config.modelid }
        });
    } catch (err) {
        console.error('Hue bridge connection error:', err.message);
        res.status(500).json({
            success: false,
            error: 'Could not reach a Hue bridge at that address. Verify it is powered on and the IP is correct.'
        });
    }
});

// Reconnect with a bridge + application key cached by the client
app.post('/api/bridgeAuth', async (req, res) => {
    const cached = req.body.bridge;
    const api = hue.connect(cached.ip, cached.username);
    try {
        // Cheap authenticated call to prove the key is still valid on this bridge
        await api.getLights();
        hueapi = api;
        bridge = cached;
        res.send({ connected: true });
    } catch (err) {
        console.log('Cached bridge rejected:', err.message);
        res.status(401).send({ connected: false, error: err.message });
    }
});

// get lights on a bridge
app.get('/api/allLights', async (req, res) => {
    if(bridge === undefined || hueapi === undefined){
        res.send({connected: false})
        return
    }
    try {
        const [lights, rooms] = await Promise.all([hueapi.getLights(), hueapi.getRooms()]);
        const roomByDevice = {};
        rooms.forEach(room => {
            room.children.forEach(child => {
                roomByDevice[child.rid] = { id: room.id, name: room.metadata.name };
            });
        });
        res.send(lights.map(light => ({
            id: light.id,
            name: light.metadata.name,
            room: roomByDevice[light.owner.rid] || { id: 'none', name: 'Other' },
            on: light.on.on,
            // v2 brightness is 0-100; the client renders swatches on v1's 0-254 scale
            bri: light.dimming ? Math.round(light.dimming.brightness * 2.54) : 254,
            xy: light.color ? [light.color.xy.x, light.color.xy.y] : undefined,
        })));
    } catch (err) {
        console.log(err.message);
        res.send({connected: false})
    }
});

//change a light's state
app.post('/api/setLight', (req, res) => {
    if(hueapi === undefined){
        res.send({connected: false})
        return
    }
    const id = req.body.id;
    const state = hue.toV2State(req.body.state);
    // Don't make the sync worker wait on the bridge round trip
    hueapi.setLight(id, state).catch(err => console.log(err.message));
    res.send({ok: true})
});

// live audio sync: one loudness frame from the browser's audio analysis
app.post('/api/liveFrame', (req, res) => {
    if(hueapi === undefined){
        res.send({connected: false})
        return
    }
    liveSync.frame(hueapi, req.body.lights, req.body.bri, req.body.options);
    res.send({connected: true})
});

app.post('/api/liveStop', (req, res) => {
    liveSync.stop();
    res.send({ok: true})
});

//recieve spotify analysis data
app.post('/api/sendAnalysis', (req, res) => {
    if(bridge === undefined || hueapi === undefined){
        res.send({connected: false})
        return
    }
    const segs = req.body.segments;
    const progress = req.body.progress;
    const trackDur = req.body.trackDur;
    const t = req.body.time;
    const options = req.body.options;
    const lights = req.body.lights;
    console.log(options)
    res.send({connected: true})
    if(segs['0'] === false){
        terminateThreads()
        return
    }

    const syncPls = async (segs, progress, trackDur, t, options, lights) => {
        terminateThreads();
        try {
            console.log(`sync start: ${Object.keys(segs).length} segments, ${lights.length} lights, progress ${progress}ms`);
            segments = await thrd.spawn(new thrd.Worker("./segments.js"));
            thrd.Thread.events(segments).subscribe(event => {
                if (event.type !== 'message') console.log("Thread event:", event.type);
            })
            await segments(segs, progress, trackDur, t, lights, options);
        } catch (err) {
            console.error('sync worker failed:', err.message);
        }
        terminateThreads();
    }
    syncPls(segs, progress, trackDur, t, options, lights);
});

async function terminateThreads(){
    if (segments !== undefined){
        thrd.Thread.terminate(segments);
        segments = undefined;
        console.log("KILLED SEGMENTS")
    }
}

app.use(express.static('client/build'));

// const startUrl = "http://localhost:5000/" || './client/build/index.html';
// nw.Window.open(startUrl, {}, function(win) {});

  // Express serve up index.html file if it doesn't recognize route
  const path = require('path');
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });

app.listen(port, () => console.log(`Listening on port ${port}`));
