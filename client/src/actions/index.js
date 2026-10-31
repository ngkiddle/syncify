export const toggleLight = (id) => {
    return {
        type: 'TOGGLE SYNC',
        payload: id
    }
}

export const toggleRoom = (roomId, sync) => {
    return {
        type: 'TOGGLE ROOM SYNC',
        payload: {roomId: roomId, sync: sync}
    }
}

export const setSyncedColor = (colors) => {
    return {
        type: 'SET SYNCED COLOR',
        payload: colors
    }
}

export const toggleShuffle = (paletteId) => {
    return {
        type: 'TOGGLE SHUFFLE',
        payload: paletteId
    }
}

export const refreshLights = (lights) => {
    return {
        type: 'REFRESH LIGHTS',
        payload: lights
    }
}

export const toggleBrightness = () => {
    return {
        type: 'TOGGLE BRIGHTNESS'
    }
}

export const toggleColor = () => {
    return {
        type: 'TOGGLE COLOR'
    }
}

export const refreshBridges = (bridges) => {
    return {
        type: 'REFRESH BRIDGES',
        payload: bridges
    }
}

export const selectBridge = (bridge) => {
    return {
        type: 'SELECT BRIDGE',
        payload: bridge
    }
}

export const toggleBridgeOK = (ok) => {
    return {
        type: 'TOGGLE BRIDGE OK',
        payload: ok
    }
}

export const setEntertainmentArea = (id) => {
    return {
        type: 'SET ENTERTAINMENT AREA',
        payload: id
    }
}

export const setPalette = (id) => {
    return {
        type: 'SET PALETTE',
        payload: id
    }
}

export const setColorInterval = (seconds) => {
    return {
        type: 'SET COLOR INTERVAL',
        payload: seconds
    }
}

export const refreshDb = (db) => {
    return {
        type: 'REFRESH DB',
        payload: db
    }
}