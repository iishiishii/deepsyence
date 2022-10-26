import React from 'react';
import ReactDOM from 'react-dom';
import Model from './components/Model';
import './styles/index.css';
import NiiVue from './niivue'

ReactDOM.render(
    <React.StrictMode>
                <NiiVue />
    </React.StrictMode>,
    document.getElementById('app')
);

