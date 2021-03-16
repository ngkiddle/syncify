const express = require('express');
const bodyParser = require('body-parser');
const disc = require('./discoverBridges');
const app = express();
const v3 = require('node-hue-api').v3;
const discovery = require('node-hue-api').discovery;
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


var bridge = undefined;

// Get a bridge and create a user
app.get('/api/discBridges', (req, res) => {
    disc.discoverAndCreateUser().then(b => {
        bridge = b;
        console.log("bridge: " + bridge)
        if (bridge){
            res.send({ connected: true });
        }
        else{
            res.send({ connected: false });
        }
    })
    .catch(err => {
        console.log(err)
    })
});

// get lights on a bridge
app.get('/api/allLights', (req, res) => {
    discovery.nupnpSearch().then(searchResults => {
        const host = bridge.ip;
        console.log("connected to: " + host)
        return v3.api.createLocal(host).connect(bridge.username);
    })
    .then(api => {
        const lightsAll = api.lights.getAll()
        return lightsAll;
    })
    .then(allLights => {
        // Display the details of the lights we got back
        console.log(JSON.stringify(allLights, null, 2));
        // Iterate over the light objects showing details
        allLights.forEach(light => {
        console.log(light.toStringDetailed());
        res.send(allLights);

    });
    })
    .catch(err => {
        console.error(err);
    });
});


app.post('/api/red', (req, res) => {
    console.log(req.body);
    res.send(
        `I received your POST request. This is what you sent me: ${req.body.post}`,
    );
});

app.listen(port, () => console.log(`Listening on port ${port}`));