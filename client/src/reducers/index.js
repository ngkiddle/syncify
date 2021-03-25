import lightsReducer from './lights';
import optionsReducer from './options';
import bridgesReducer from './bridges';
import {bridgeReducer, bridgeOKReducer} from './bridge';


import {combineReducers} from 'redux';

const allReducers = combineReducers({
    lights: lightsReducer,
    options: optionsReducer,
    bridges: bridgesReducer,
    bridge: bridgeReducer,
    bridgeOK: bridgeOKReducer
});

export default allReducers