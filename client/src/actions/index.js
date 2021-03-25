export const toggleLight = (id) => {
    return {
        type: 'TOGGLE SYNC',
        payload: id
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