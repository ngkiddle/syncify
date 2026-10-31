// Forwards browser console errors, uncaught exceptions and failed API calls to the
// server's /logs page, so they can be followed outside of DevTools.
import * as $ from "jquery";

const endpoint = '/api/clientLog';
const originalFetch = window.fetch.bind(window);
const recent = {};

function send(message, level){
    // drop exact repeats within 5s so a failing loop doesn't flood the log
    const now = Date.now();
    if (recent[message] && now - recent[message] < 5000) return;
    recent[message] = now;
    originalFetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({message: message, level: level || 'log'})
    }).catch(() => {});
}

function logToServer(message, level){
    console.log(message);
    send(message, level);
}

function describe(arg){
    if (arg instanceof Error) return arg.stack || arg.message;
    if (typeof arg === 'object') {
        try { return JSON.stringify(arg); } catch (e) { return String(arg); }
    }
    return String(arg);
}

['error', 'warn'].forEach(level => {
    const original = console[level].bind(console);
    console[level] = (...args) => {
        original(...args);
        send(`console.${level}: ` + args.map(describe).join(' '), level);
    };
});

window.addEventListener('error', e => {
    send(`uncaught: ${e.message} at ${e.filename}:${e.lineno}`, 'error');
});
window.addEventListener('unhandledrejection', e => {
    send(`unhandled rejection: ${describe(e.reason)}`, 'error');
});

// fetch is used by our API calls and the Spotify player SDK
window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    const method = (init && init.method) || 'GET';
    try {
        const response = await originalFetch(input, init);
        if (!response.ok && !url.includes(endpoint)) {
            send(`fetch ${method} ${url} -> HTTP ${response.status}`, 'error');
        }
        return response;
    } catch (err) {
        send(`fetch ${method} ${url} -> network error: ${err.message}`, 'error');
        throw err;
    }
};

// jQuery is used for the Spotify Web API calls
$(document).ajaxError((event, xhr, settings) => {
    send(`ajax ${settings.type} ${settings.url} -> HTTP ${xhr.status} ${(xhr.responseText || '').slice(0, 300)}`, 'error');
});

export { logToServer };
