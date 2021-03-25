const bridgesReducer = (state = [], action) => {
    switch(action.type){
        case 'REFRESH BRIDGES':
            return action.payload
        default:
            return state;
    }
}

export default bridgesReducer
