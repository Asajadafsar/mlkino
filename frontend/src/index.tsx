import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import axios from 'axios';
import {installCsrf} from './Core/Csrf';
import {installPanelVersionCheck} from './Core/PanelVersion';

installCsrf(axios);


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
installPanelVersionCheck(undefined, () => root.render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
));
