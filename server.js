const express = require('express');
const bodyParser = require('body-parser');
const disc = require('./discoverBridges');
const app = express();
const v3 = require('node-hue-api').v3;
const discovery = require('node-hue-api').discovery;
const thrd = require("threads");
const port = process.env.PORT || 5000;

var hueapi = undefined;
var bridge = undefined;
var segments = undefined;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Get a bridge and create a user
app.get('/api/discAllBridges', (req, res) => {
    disc.discoverBridge().then(b => {
        bridges = b;
        console.log(bridges)
        if (bridges){
            for(var i = 0; i < bridges.length; i++){
                bridges[i]['index'] = i;
            }
            res.send({ bridges: bridges });
        }
        else{
            res.send({ bridges: false });
        }
    })
    .catch(err => {
        console.log(err)
    })
});

app.post('/api/connectBridge', (req, res) => {
    const ip = req.body.ip;
    console.log(ip)
    disc.discoverAndCreateUser(ip).then(b => {
        bridge = b;
        console.log("bridge: " + bridge)
        if (bridge){
            v3.api.createLocal(bridge.ip).connect(bridge.username).then(api =>{
                hueapi = api;
                res.send({ connected: true,
                    bridge: bridge });
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

    bridge = req.body.bridge;
    v3.api.createLocal(bridge.ip).connect(bridge.username).then(api =>{
        hueapi = api;
        res.send(
            `I received your POST request. This is what you sent me: ${req.body.post}`,
        );
    })
});

// get lights on a bridge
app.get('/api/allLights', (req, res) => {
    console.log(hueapi)
    console.log(bridge)
    if(bridge === undefined || hueapi === undefined){
        res.send({connected: false})
        return
    }
    hueapi.lights.getAll().then( lights => {
        // Iterate over the light objects showing details
        lights.forEach(light => {
            console.log(light.toStringDetailed());
        });
        res.send(lights);
    })
});

//change a light's state
app.post('/api/setLight', (req, res) => {
    const id = req.body.id;
    const state = req.body.state;
    const result = hueapi.lights.setLightState(id, state);
    res.send(result)
});

//recieve spotify analysis data
app.post('/api/sendAnalysis', (req, res) => {
    if(bridge === undefined || hueapi === undefined){
        res.send({connected: false})
    }
    const segs = req.body.segments;
    const progress = req.body.progress;
    const trackDur = req.body.trackDur;
    const t = req.body.time;
    const options = req.body.options;
    const lights = req.body.lights;
    console.log(options)
    if(segs['0'] === false){
        terminateThreads()
    }

    const syncPls = async (segs, progress, trackDur, t, options, lights) => {
        terminateThreads();
        segments = await thrd.spawn(new thrd.Worker("./segments.js"));
        thrd.Thread.events(segments).subscribe(event => console.log("Thread event:", event))
        await segments(segs, progress, trackDur, t, lights, options);
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
