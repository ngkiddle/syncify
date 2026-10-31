const lightsReducer = (state = [], action) => {
    switch(action.type){
        case 'TOGGLE SYNC':
           return state.map(l => {
                if (l.id === action.payload){
                    return {...l, sync: !l.sync}
                }
                console.log(l)
                return l;
            })
        case 'TOGGLE ROOM SYNC':
            return state.map(l => l.room.id === action.payload.roomId ? {...l, sync: action.payload.sync} : l)
        case 'SET SYNCED COLOR':
            // payload is {lightId: [x, y]} from live sync; unsynced lights keep their color
            return state.map(l => l.sync && action.payload[l.id] ? {...l, color: action.payload[l.id]} : l)
        case 'APPLY REMOTE SETTINGS':
            return state.map(l => l.id in action.payload.sync ? {...l, sync: action.payload.sync[l.id]} : l)
        case 'REFRESH LIGHTS':
            return action.payload
        default:
            return state;
    }
}

export default lightsReducer