const initState = {
    colorShift: true,
    colorScheme: 0,
    brightnessShift: true,
    brightnessThreshold: -28
    };

const optionsReducer = (state = initState, action) => {
    switch(action.type){
        case 'TOGGLE BRIGHTNESS':
           return {... state, brightnessShift: !(state.brightnessShift)}
        case 'TOGGLE COLOR':
            return {... state, colorShift: !(state.colorShift)}
        default:
            return state;
    }
}

export default optionsReducer