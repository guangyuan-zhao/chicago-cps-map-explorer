import './ui/styles.css';

import { initializeMap } from './map/map.js';

import {
    geocodeCPSAddress,
    webMercatorToWGS84,
    reverseGeocodeCoordinates,
    getCPSAddressSuggestions
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

        // Load the modern Google Maps marker library.
        const { AdvancedMarkerElement } =
            await google.maps.importLibrary('marker');

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

        // Test CPS address suggestions.
        console.log('Testing CPS address suggestions...');

        const suggestions = await getCPSAddressSuggestions(
            '42 W Madi'
        );

        console.log('CPS address suggestions:');
        console.dir(suggestions, { depth: null });

        // ==========================================
        // Residential property search
        // ==========================================

        const addressInput = document.getElementById('address-input');
        const searchButton = document.getElementById('search-button');


        // ==========================================
        // Address autocomplete
        // ==========================================

        const suggestionsContainer = document.getElementById(
            'address-suggestions'
        );

        let selectedAddressSuggestion = null;
        let activeSuggestionIndex = -1;
        let suggestionsTimer = null;
        let suggestionsRequestId = 0;

        function hideAddressSuggestions() {
            suggestionsContainer.replaceChildren();
            suggestionsContainer.hidden = true;
            activeSuggestionIndex = -1;
        }

        function selectAddressSuggestion(suggestion) {
            addressInput.value = suggestion.text;
            selectedAddressSuggestion = suggestion;
            hideAddressSuggestions();
        }

        function renderAddressSuggestions(suggestions) {

            suggestionsContainer.replaceChildren();

            const addressSuggestions = suggestions.filter(
                suggestion => !suggestion.isCollection
            );

            if (addressSuggestions.length === 0) {
                hideAddressSuggestions();
                return;
            }

            addressSuggestions.forEach((suggestion, index) => {

                const button = document.createElement('button');

                button.type = 'button';
                button.className = 'address-suggestion-item';
                button.textContent = suggestion.text;
                button.setAttribute('role', 'option');

                button.addEventListener('click', () => {
                    selectAddressSuggestion(suggestion);
                });

                suggestionsContainer.appendChild(button);

            });

            activeSuggestionIndex = -1;
            suggestionsContainer.hidden = false;
        }

        addressInput.addEventListener('input', () => {

            const address = addressInput.value.trim();

            selectedAddressSuggestion = null;

            clearTimeout(suggestionsTimer);

            const requestId = ++suggestionsRequestId;

            if (address.length < 3) {
                hideAddressSuggestions();
                return;
            }

            suggestionsTimer = setTimeout(async () => {

                try {

                    const suggestions =
                        await getCPSAddressSuggestions(address);

                    // Ignore outdated responses.
                    if (requestId !== suggestionsRequestId) return;

                    renderAddressSuggestions(suggestions);

                } catch (error) {

                    console.error(
                        'Address suggestions failed:',
                        error
                    );

                    hideAddressSuggestions();

                }

            }, 300);

        });

        addressInput.addEventListener('keydown', event => {

            const suggestionButtons = [
                ...suggestionsContainer.querySelectorAll(
                    '.address-suggestion-item'
                )
            ];

            if (event.key === 'ArrowDown' && suggestionButtons.length > 0) {
                event.preventDefault();

                activeSuggestionIndex =
                    (activeSuggestionIndex + 1) % suggestionButtons.length;

            } else if (
                event.key === 'ArrowUp' &&
                suggestionButtons.length > 0
            ) {
                event.preventDefault();

                activeSuggestionIndex =
                    activeSuggestionIndex <= 0
                    ? suggestionButtons.length - 1
                    : activeSuggestionIndex - 1;

            } else if (event.key === 'Enter') {

                if (
                    !suggestionsContainer.hidden &&
                    activeSuggestionIndex >= 0 &&
                    suggestionButtons[activeSuggestionIndex]
                ) {
                    event.preventDefault();

                    selectAddressSuggestion({
                        text: suggestionButtons[activeSuggestionIndex].textContent
                    });

                } else {
                    searchProperty();
                }

            } else if (event.key === 'Escape') {
                hideAddressSuggestions();
            }

            suggestionButtons.forEach((button, index) => {
                button.classList.toggle(
                    'is-active',
                    index === activeSuggestionIndex
                );
            });

        });

        document.addEventListener('click', event => {

            if (!event.target.closest('.search-container')) {
                hideAddressSuggestions();
            }

        });

        async function searchProperty() {

            const address = (
                selectedAddressSuggestion?.text ||
                addressInput.value.trim()
            );

            hideAddressSuggestions();

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


        // ==========================================
        // Map-click property lookup
        // ==========================================

        map.addListener('click', async event => {

            if (!event.latLng) return;

            const latitude = event.latLng.lat();
            const longitude = event.latLng.lng();

            console.log('Map location selected:', {
                latitude,
                longitude
            });

            renderPropertyMessage(
                'Retrieving CPS information for selected location...'
            );

            try {

                // Retrieve CPS geographic information and street address.
                const [propertyResult, addressResult] = await Promise.all([

                    lookupProperty(longitude, latitude),

                    reverseGeocodeCoordinates(latitude, longitude)

                ]);

                const selectedAddress =
                    addressResult?.address || 'Selected map location';

                console.log('Reverse geocoding result:', addressResult);

                // Remove the previous marker.
                if (propertyMarker) {
                    propertyMarker.map = null;
                }

                // Place a marker at the clicked location.
                propertyMarker = new AdvancedMarkerElement({
                    map,
                    position: {
                        lat: latitude,
                        lng: longitude
                    },
                    title: selectedAddress
                });

                // Update the property information panel.
                renderPropertyInformation(
                    selectedAddress,
                    propertyResult
                );

                console.log('Map-click property lookup successful.');
                console.log('Property information:', propertyResult);

            } catch (error) {

                console.error(
                    'Map-click property lookup failed:',
                    error
                );

                renderPropertyMessage(
                    'Unable to retrieve CPS information for this location.'
                );

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
