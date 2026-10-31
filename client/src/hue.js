
async function getBridges(){
    const response = await fetch('/api/discAllBridges');
    const body = await response.json();
    if (body.error) console.log("Bridge discovery: " + body.error);
    return body.bridges || [];
  };
  
async function establishConnection(hue){
    const response = await fetch('/api/bridgeAuth', 
    {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bridge: hue }),
    });
    return response.status === 200;
  }
  
async function getLights(){
    const response = await fetch('/api/allLights');
    const body = await response.json();
    if(body.connected === false){
        return false;
    }
    if (response.status !== 200) throw Error(body.message);

    var l = [];
    for (var i = 0; i < body.length; i++){
        var b = body[i];
        // only color-capable lights can be synced
        if(!b.xy){
            continue;
        }
        var bulb = {};
        bulb['id'] = b.id;
        bulb['name'] = b.name;
        bulb['room'] = b.room;
        bulb['color'] = b.xy;
        bulb['bri'] = b.bri;
        bulb['sync'] = true;
        bulb['index'] = l.length;
        bulb['state'] = b.on ? "on" : "off";
        l.push(bulb);
    }
    return l;
};
  
async function getEntertainmentAreas(){
    const response = await fetch('/api/entertainmentAreas');
    const body = await response.json();
    if(body.connected === false){
        return {streaming: false, areas: []};
    }
    return body;
};

// lightIds get static colors from the palette ({colors, shuffle}); resolves {lightId: [x, y]}
async function setStaticColors(lightIds, palette){
    const response = await fetch('/api/staticColors', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({lights: lightIds, palette: palette})
    });
    const body = await response.json();
    return body.colors || {};
};

async function sendSegments (segments, progress, trackDur, t, options, lights){
    const response = await fetch('/api/sendAnalysis', 
    {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            segments: segments,
            progress: progress,
            trackDur: trackDur,
            time: t,
            options: options,
            lights: lights}),
    });
    const body = await response.json();
    if(body.connected === false){
        return false;
    }
    else{
        return true;
    }
    //post the data to server
  }
  


export {
    getBridges,
    establishConnection,
    getLights,
    getEntertainmentAreas,
    setStaticColors,
    sendSegments
}
