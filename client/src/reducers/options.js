const initState = {
    colorShift: true,
    colorScheme: 0,
    brightnessShift: true,
    dbHigh: 0,
    dbLow: -28,
    entertainmentArea: '',
    palette: 'concert',
    colorInterval: 1.0,     // minimum seconds between color changes
    shuffle: {}             // paletteId -> true: each light picks its own palette color
    };

const optionsReducer = (state = initState, action) => {
    switch(action.type){
        case 'TOGGLE BRIGHTNESS':
           return {...state, brightnessShift: !(state.brightnessShift)}
        case 'TOGGLE COLOR':
            return {...state, colorShift: !(state.colorShift)}
        case 'REFRESH DB':
           return {...state, dbHigh: action.payload[1], dbLow: action.payload[0]}
        case 'SET ENTERTAINMENT AREA':
            return {...state, entertainmentArea: action.payload}
        case 'SET PALETTE':
            return {...state, palette: action.payload}
        case 'SET COLOR INTERVAL':
            return {...state, colorInterval: action.payload}
        case 'APPLY REMOTE SETTINGS':
            return {...state, ...action.payload.options}
        case 'TOGGLE SHUFFLE':
            return {...state, shuffle: {...state.shuffle, [action.payload]: !state.shuffle[action.payload]}}
        default:
            return state;
    }
}

export default optionsReducer