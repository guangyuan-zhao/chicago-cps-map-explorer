
import { booleanPointInPolygon, point } from '@turf/turf';

import { getCPSGeoJSON } from '../cps/cps-api.js';

// Cache datasets independently of the visible map overlays.
const propertyDatasetCache = new Map();

async function getPropertyDataset(mapName, year) {

    const key = `${mapName}_${year}`;

    if (!propertyDatasetCache.has(key)) {

        const request = getCPSGeoJSON(mapName, year);

        propertyDatasetCache.set(key, request);

        try {
            return await request;
        } catch (error) {
            propertyDatasetCache.delete(key);
            throw error;
        }
    }

    return propertyDatasetCache.get(key);
}


/**
 * Extract Polygon and MultiPolygon geometries,
 * including those nested inside GeometryCollections.
 */
function flattenPolygonFeatures(feature) {

    const results = [];

    function extract(geometry, properties) {

        if (!geometry) return;

        if (geometry.type === 'GeometryCollection') {

            geometry.geometries.forEach(child => {
                extract(child, properties);
            });

            return;
        }

        if (
            geometry.type === 'Polygon' ||
            geometry.type === 'MultiPolygon'
        ) {

            results.push({
                type: 'Feature',
                properties: { ...properties },
                geometry
            });

        }
    }

    extract(feature.geometry, feature.properties ?? {});

    return results;
}

/**
 * Find the polygon containing a geographic point.
 */
function findContainingFeature(geoJSON, longitude, latitude) {

    const searchPoint = point([longitude, latitude]);

    for (const feature of geoJSON.features ?? []) {

        const polygonFeatures = flattenPolygonFeatures(feature);

        for (const polygonFeature of polygonFeatures) {

            if (
                booleanPointInPolygon(
                    searchPoint,
                    polygonFeature
                )
            ) {
                return polygonFeature;
            }

        }
    }

    return null;
}

/**
 * Retrieve property-related CPS geographic information.
 */
export async function lookupProperty(longitude, latitude) {

    const [elementaryData, highSchoolData, tierData] =
        await Promise.all([

            getPropertyDataset('BOUNDARY_ES', 2026),
            getPropertyDataset('BOUNDARY_HS', 2026),
            getPropertyDataset('TIER', 2027)

        ]);

    // Elementary boundary.
    const elementaryFeature = findContainingFeature(
        {
            ...elementaryData,
            features: elementaryData.features.filter(
                feature =>
                    feature.properties?.GRADE_CAT === 'ES'
            )
        },
        longitude,
        latitude
    );

    // Middle-school boundary.
    const middleFeature = findContainingFeature(
        {
            ...elementaryData,
            features: elementaryData.features.filter(
                feature =>
                    feature.properties?.GRADE_CAT === 'MS'
            )
        },
        longitude,
        latitude
    );

    // High-school boundary.
    const highSchoolFeature = findContainingFeature(
        highSchoolData,
        longitude,
        latitude
    );

    // CPS Tier.
    const tierFeature = findContainingFeature(
        tierData,
        longitude,
        latitude
    );

    return {

        coordinates: {
            longitude,
            latitude
        },

        elementary: elementaryFeature?.properties ?? null,

        middleSchool: middleFeature?.properties ?? null,

        highSchool: highSchoolFeature?.properties ?? null,

        tier: tierFeature?.properties ?? null

    };
}
