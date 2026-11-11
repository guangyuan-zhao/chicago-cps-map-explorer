
import {
  setOptions,
  importLibrary,
} from '@googlemaps/js-api-loader';

let mapInstance = null;

export async function initializeMap() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Google Maps API key is missing. Check your .env.local file.'
    );
  }

  setOptions({
    key: apiKey,
    v: 'weekly',
  });

  const { Map } = await importLibrary('maps');

  const mapElement = document.getElementById('map');

  if (!mapElement) {
    throw new Error('Map container #map was not found.');
  }

  mapInstance = new Map(mapElement, {
    center: {
      lat: 41.8781,
      lng: -87.6298,
    },
    zoom: 10,
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true,
    mapId: 'DEMO_MAP_ID',
  });

  return mapInstance;
}

export function getMap() {
  return mapInstance;
}
