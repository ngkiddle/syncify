// Keeps sync settings (options + which lights are synced) shared between the computer page and
// the phone remote through the server, and relays player commands to the computer.
const clientId = Math.random().toString(36).slice(2);

// actions that change shared settings; anything else stays local to the page
const shared = ['TOGGLE SYNC', 'TOGGLE ROOM SYNC', 'TOGGLE BRIGHTNESS', 'TOGGLE COLOR', 'REFRESH DB',
    'SET ENTERTAINMENT AREA', 'SET PALETTE', 'SET COLOR INTERVAL', 'TOGGLE SHUFFLE'];

var lastSent = undefined;       // serialized settings last pushed or applied, to avoid echo loops
var lastSettings = undefined;
var pushTimer = undefined;
var events = undefined;

function snapshot(state){
    const sync = {};
    state.lights.forEach(l => { sync[l.id] = l.sync; });
    return {options: state.options, sync: sync};
}

function push(state){
    const settings = snapshot(state);
    const serialized = JSON.stringify(settings);
    // sliders re-fire onUpdate when a remote change moves them; don't bounce that back
    if (serialized === lastSent) return;
    lastSent = serialized;
    lastSettings = settings;
    fetch('/api/settings', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(Object.assign({clientId: clientId}, settings))
    }).catch(() => {});
}

const settingsMiddleware = store => next => action => {
    const result = next(action);
    if (shared.includes(action.type)){
        // debounce so dragging a slider sends one update, not dozens
        clearTimeout(pushTimer);
        pushTimer = setTimeout(() => push(store.getState()), 150);
    }
    // freshly loaded lights default to synced; reapply the shared choices
    if (action.type === 'REFRESH LIGHTS' && lastSettings){
        store.dispatch({type: 'APPLY REMOTE SETTINGS', payload: lastSettings});
    }
    return result;
};

function apply(store, settings){
    lastSettings = settings;
    store.dispatch({type: 'APPLY REMOTE SETTINGS', payload: settings});
    // what the store now holds, so the slider echo above is recognised as already sent
    lastSent = JSON.stringify(snapshot(store.getState()));
}

// host: the computer page, which plays music and carries out commands
function connect(store, {host, onStatus, onCommand}){
    if (events) events.close();
    events = new EventSource('/api/events');
    events.onmessage = e => {
        const msg = JSON.parse(e.data);
        if (msg.type === 'hello'){
            if (msg.settings){
                apply(store, msg.settings);
            } else if (host){
                push(store.getState());
            }
            onStatus && onStatus(msg.status || {});
        } else if (msg.type === 'settings' && msg.from !== clientId){
            apply(store, msg.settings);
        } else if (msg.type === 'status'){
            onStatus && onStatus(msg.status);
        } else if (msg.type === 'command' && host){
            onCommand && onCommand(msg.command);
        }
    };
    return () => events.close();
}

function sendStatus(status){
    fetch('/api/status', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(status)
    }).catch(() => {});
}

function sendCommand(command){
    return fetch('/api/command', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({command: command})
    });
}

export {
    settingsMiddleware,
    connect,
    sendStatus,
    sendCommand
}
