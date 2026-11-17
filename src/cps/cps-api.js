
const CPS_API_BASE_URL = 'https://api.cps.edu/maps/';

/**
 * Generic CPS API request.
 */
async function cpsRequest(endpoint, params = {}) {
    const url = new URL(endpoint, CPS_API_BASE_URL);

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.set(key, String(value));
        }
    });

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `CPS API error: ${response.status} ${response.statusText}`
        );
    }

    return response.json();
}

/**
 * Retrieve all available CPS map metadata.
 */
export async function getCPSMapsList() {
    return cpsRequest('CPS/MapsList');
}

/**
 * Retrieve geographic data for a particular CPS map.
 */
export async function getCPSGeoJSON(mapName, year, options = {}) {
    const data = await cpsRequest('CPS/GeoJSON', {
        mapName,
        year,
        ...options
    });

    if (
        data.type !== 'FeatureCollection' ||
        !Array.isArray(data.features)
    ) {
        throw new Error(
            `Invalid GeoJSON response for ${mapName}, year ${year}.`
        );
    }

    return data;
}

/**
 * Retrieve CPS school attendance boundaries.
 */
export async function getCPSSchoolBoundaries(year, options = {}) {
    return cpsRequest('CPS/SchoolBoundariesGeoJSON', {
        year,
        ...options
    });
}

/**
 * Geocode a residential address using CPS.
 */
export async function geocodeCPSAddress(address) {
    return cpsRequest('Geocoder/AddressGeocode', {
        address
    });
}

/**
 * Convert Web Mercator (EPSG:3857) coordinates
 * into WGS84 longitude/latitude (EPSG:4326).
 */
export function webMercatorToWGS84(x, y) {

    const R = 6378137;

    const longitude = (x / R) * (180 / Math.PI);

    const latitude =
        (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2)
        * (180 / Math.PI);

    return {
        longitude,
        latitude
    };
}

/**
 * Reverse geocode WGS84 coordinates using Google Maps.
 * Returns the most specific available street address.
 */
export async function reverseGeocodeCoordinates(
    latitude,
    longitude
) {

    const { Geocoder } =
        await google.maps.importLibrary('geocoding');

    const geocoder = new Geocoder();

    const response = await geocoder.geocode({
        location: {
            lat: latitude,
            lng: longitude
        }
    });

    if (!response.results?.length) {
        return null;
    }

    // Prefer a precise street address over a neighborhood
    // or other general geographic description.
    const streetAddress = response.results.find(result =>
        result.types.includes('street_address')
    );

    const bestResult = streetAddress || response.results[0];

    return {
        address: bestResult.formatted_address,
        placeId: bestResult.place_id,
        resultTypes: bestResult.types,
        locationType: bestResult.geometry.location_type
    };
}
