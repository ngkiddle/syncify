const express = require('express');
const bodyParser = require('body-parser');
const disc = require('./discoverBridges');
const app = express();
const v3 = require('node-hue-api').v3;
const discovery = require('node-hue-api').discovery;
const thrd = require("threads");
const port = process.env.PORT || 5000;
var hueapi = {}
var sync = undefined;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


var bridge = undefined;

// Get a bridge and create a user
app.get('/api/discBridges', (req, res) => {
    disc.discoverAndCreateUser().then(b => {
        bridge = b;
        console.log("bridge: " + bridge)
        if (bridge){
            res.send({ connected: true,
                       bridge: bridge });
            v3.api.createLocal(bridge.ip).connect(bridge.username).then(api =>{
                hueapi = api;
            })
        }
        else{
            res.send({ connected: false });
        }
    })
    .catch(err => {
        console.log(err)
    })
});
// recieve client cached bridge and connect
app.post('/api/bridgeAuth', (req, res) => {
    console.log(req.body);
    res.send(
        `I received your POST request. This is what you sent me: ${req.body.post}`,
    );
    bridge = req.body.bridge;
    v3.api.createLocal(bridge.ip).connect(bridge.username).then(api =>{
        hueapi = api;
    })
});

// get lights on a bridge
app.get('/api/allLights', (req, res) => {
    hueapi.lights.getAll().then( lights => {
        // Iterate over the light objects showing details
        lights.forEach(light => {
            console.log(light.toStringDetailed());
        });
        res.send(lights);
    })
});

//change a light's brightness
app.post('/api/changeBrightness', (req, res) => {
    const id = req.body.id;
    const state = req.body.state;
    // console.log(id + " : " + state.bri)
    const result = hueapi.lights.setLightState(id, state);
    // console.log(result);
    res.send(result)
});

//recieve spotify segment data
app.post('/api/sendSegments', (req, res) => {
    const segs = req.body.segments;
    const progress = req.body.progress;
    const trackDur = req.body.trackDur;
    const t = req.body.time;
    const syncPls = async (segs, progress, trackDur, t) => {
        if (sync !== undefined){
            thrd.Thread.terminate(sync);
        }
        sync = await thrd.spawn(new thrd.Worker("./sync.js"));
        const result = await sync(segs, progress, trackDur, t);
        await thrd.Thread.terminate(sync);
        sync = undefined;
        res.send(result)
    }
    syncPls(segs, progress, trackDur, t);
});


app.listen(port, () => console.log(`Listening on port ${port}`));