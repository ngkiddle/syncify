
export const bridgeReducer = (state = {}, action) => {
    switch(action.type){
        case 'SELECT BRIDGE':
           return action.payload
        case 'UPDATE BRIDGE':
            return
        default:
            return state;
    }
}

export const bridgeOKReducer = (state = false, action) => {
    switch(action.type){
        case 'TOGGLE BRIDGE OK':
            if(state === action.payload){
                return state;
            }
            else{
                return !state;
            }
        default:
            return state;
    }
}

