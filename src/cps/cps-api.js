
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
