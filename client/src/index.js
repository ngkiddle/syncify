import './remoteLog';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import Remote from './Remote';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import allReducers from './reducers';
import { settingsMiddleware } from './remoteSync';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
let store = createStore(
  allReducers,
  composeEnhancers(applyMiddleware(settingsMiddleware))
);

// /remote is the phone control page; everything else is the full app on the computer
const isRemote = window.location.pathname.replace(/\/$/, '') === '/remote';

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      {isRemote ? <Remote/> : <App/>}
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);
