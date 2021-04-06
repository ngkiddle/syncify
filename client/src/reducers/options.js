const initState = {
    colorShift: true,
    colorScheme: 0,
    brightnessShift: true,
    dbHigh: 0,
    dbLow: -28
    };

const optionsReducer = (state = initState, action) => {
    switch(action.type){
        case 'TOGGLE BRIGHTNESS':
           return {...state, brightnessShift: !(state.brightnessShift)}
        case 'TOGGLE COLOR':
            return {...state, colorShift: !(state.colorShift)}
        case 'REFRESH DB':
           return {...state, dbHigh: action.payload[1], dbLow: action.payload[0]}
        default:
            return state;
    }
}

export default optionsReducer