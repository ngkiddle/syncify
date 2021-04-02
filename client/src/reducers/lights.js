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
        case 'REFRESH LIGHTS':
            return action.payload
        default:
            return state;
    }
}

export default lightsReducer