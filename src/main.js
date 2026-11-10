import './ui/styles.css';

import { initializeOverlayPanel } from './ui/overlay-panel.js';

function initializeApplication() {
    console.log('Chicago CPS Map Explorer initialized.');

    initializeOverlayPanel();
}

initializeApplication();