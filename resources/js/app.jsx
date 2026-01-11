import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import Game from './components/Game';

if (document.getElementById('app')) {
    createRoot(document.getElementById('app')).render(
        <React.StrictMode>
            <Game />
        </React.StrictMode>
    );
}
