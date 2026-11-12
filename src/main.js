import './ui/styles.css';

import { initializeMap } from './map/map.js';

import {
    geocodeCPSAddress,
    webMercatorToWGS84
} from './cps/cps-api.js';

import { initializeOverlayPanel } from './ui/overlay-panel.js';

import {
    toggleOverlay,
    clearAllOverlays
} from './overlays/overlay-manager.js';

import { lookupProperty } from './property/property-lookup.js';

import {
    renderPropertyInformation,
    renderPropertyMessage
} from './property/property-panel.js';


async function main() {

    try {

        console.log('Initializing Chicago CPS Map Explorer...');

        // Initialize Google Maps.
        const map = await initializeMap();

        console.log('Google Maps initialized successfully.');

        // Keep track of the currently selected property marker.
        let propertyMarker = null;

        // Initialize overlay controls.
        initializeOverlayPanel({

            onToggle: async (overlayId, enabled) => {

                try {

                    await toggleOverlay(map, overlayId, enabled);

                } catch (error) {

                    console.error(
                        `Failed to toggle overlay "${overlayId}":`,
                        error
                    );

                    const { overlayConfig } =
                        await import('./overlays/overlay-config.js');

                    const overlay = overlayConfig.find(
                        item => item.id === overlayId
                    );

                    if (overlay) {
                        overlay.enabled = false;
                    }

                    const checkbox = document.querySelector(
                        `[data-overlay-id="${overlayId}"]`
                    );

                    if (checkbox) {
                        checkbox.checked = false;
                    }

                }

            },

            onClear: () => {
                clearAllOverlays();
            }

        });

        console.log('Overlay controls initialized successfully.');


        // ==========================================
        // Residential property search
        // ==========================================

        const addressInput = document.getElementById('address-input');
        const searchButton = document.getElementById('search-button');

        async function searchProperty() {

            const address = addressInput.value.trim();

            if (!address) {
                renderPropertyMessage(
                    'Please enter a Chicago residential address.'
                );
                return;
            }

            searchButton.disabled = true;
            searchButton.textContent = 'Searching...';

            renderPropertyMessage(
                'Searching for address and CPS information...'
            );

            try {

                // Step 1: Geocode the address.
                const geocodeResult = await geocodeCPSAddress(address);

                const candidates = geocodeResult.candidates ?? [];

                if (candidates.length === 0) {
                    throw new Error(
                        'No matching address found. Please check the address and try again.'
                    );
                }

                // Step 2: Select the best candidate.
                const bestCandidate = candidates[0];

                if (bestCandidate.score < 80) {

                    const confirmed = window.confirm(
                        `The closest address match is:\n\n` +
                        `${bestCandidate.address}\n\n` +
                        `Match score: ${bestCandidate.score}\n\n` +
                        `Do you want to continue?`
                    );

                    if (!confirmed) return;
                }

                // Step 3: Convert Web Mercator to WGS84.
                const coordinates = webMercatorToWGS84(
                    bestCandidate.location.x,
                    bestCandidate.location.y
                );

                // Step 4: Retrieve CPS geographic information.
                const propertyResult = await lookupProperty(
                    coordinates.longitude,
                    coordinates.latitude
                );

                // Step 5: Update the property information panel.
                renderPropertyInformation(
                    bestCandidate.address,
                    propertyResult
                );

                // Step 6: Update the Google Maps marker.
                const position = {
                    lat: coordinates.latitude,
                    lng: coordinates.longitude
                };

                if (propertyMarker) {
                    propertyMarker.map = null;
                }

                const { AdvancedMarkerElement } =
                    await google.maps.importLibrary('marker');

                propertyMarker = new AdvancedMarkerElement({
                    map,
                    position,
                    title: bestCandidate.address
                });

                // Center map on selected property.
                map.panTo(position);
                map.setZoom(16);

                console.log('Property search successful.');
                console.log('Selected address:', bestCandidate.address);
                console.log('Property information:', propertyResult);

            } catch (error) {

                console.error('Property search failed:', error);

                renderPropertyMessage(error.message);

            } finally {

                searchButton.disabled = false;
                searchButton.textContent = 'Search';

            }

        }

        // Search button click.
        searchButton.addEventListener('click', searchProperty);

        // Allow Enter key to trigger search.
        addressInput.addEventListener('keydown', event => {

            if (event.key === 'Enter') {
                searchProperty();
            }

        });

        console.log('Property search initialized successfully.');

    } catch (error) {

        console.error(
            'Application initialization failed:',
            error
        );

    }

}

main();
