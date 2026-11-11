
import './ui/styles.css';

import { initializeMap } from './map/map.js';
import { getCPSGeoJSON } from './cps/cps-api.js';

async function main() {
  try {
    console.log('Initializing Chicago CPS Map Explorer...');

    // Initialize Google Maps.
    const map = await initializeMap();

    console.log('Google Maps initialized successfully.');

    // Test browser access to the CPS API.
    console.log('Testing CPS API access...');

    const geoJSON = await getCPSGeoJSON('BOUNDARY_ES', 2026);

    console.log('CPS API connection successful.');
    console.log('Elementary boundary features:', geoJSON.features.length);
    console.log('Sample feature:', geoJSON.features[0]);

  } catch (error) {
    console.error('Application initialization failed:', error);
  }
}

main();
