
async function getBridges(){
    const response = await fetch('/api/discAllBridges');
    const body = await response.json();
    if(body.bridges){
      return body.bridges;
    }
    if (response.status !== 200) throw Error(body.message);
  };
  
async function establishConnection(hue){
    const response = await fetch('/api/bridgeAuth', 
    {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bridge: hue.bridge }),
    });
    const body = await response;
    if (body.status === 200){
        return true
    }
    else{
        return false;
    }
    //post the data to server
  }
  
async function getLights(){
    const response = await fetch('/api/allLights');
    const body = await response.json();
    if (response.status !== 200) throw Error(body.message);
    var l = [];
    for (var i = 0; i < body.length; i++){
        var b = body[i];
        var bulb = {};
        if(!("xy" in b.data.state)){
            continue;
        }
        bulb['id'] = b.data.id;
        bulb['name'] = b.data.name;
        bulb['color'] = b.data.state.xy;
        bulb['bri'] = b.data.state.bri;
        bulb['sync'] = true;
        bulb['index'] = i;
        var on = "off";
        if (b.data.state.on){
            on = "on";
        }
        bulb['state'] = on;
        l.push(bulb);
    }
    return l;
};
  
const sendSegments = async (segments, progress, trackDur, t, options, lights) => {
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
    const body = await response.text();
    console.log(body)
    //post the data to server
  }
  


export {
    getBridges,
    establishConnection,
    getLights,
    sendSegments
}