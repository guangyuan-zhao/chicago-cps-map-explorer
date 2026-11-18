
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
 * Match an attendance boundary to the corresponding
 * detailed school record using its school ID.
 */
function enrichSchool(boundaryProperties, schoolRecords) {

    if (!boundaryProperties) return null;

    const schoolId = String(
        boundaryProperties.SCHOOL_ID ?? ''
    );

    const school = schoolRecords.find(record =>
        String(record.School_ID ?? '') === schoolId
    );

    return {

        // Original attendance-boundary information.
        ...boundaryProperties,

        // Detailed school information.
        schoolDetails: school ? {
            name: school.UnitName || school.Short_Name || null,
            address: school.Address || null,
            schoolId: school.School_ID || null,
            gradesServed:
                school.Grades_Short || school.Grades || null,
            governance: school.Governance || null,
            boundaryType: school.Boundary || null,
            openStatus: school.Open_Status || null
        } : null

    };
}

/**
 * Retrieve property-related CPS geographic information.
 */
export async function lookupProperty(longitude, latitude) {

    const [
        elementaryData,
        highSchoolData,
        tierData,
        schoolData
    ] = await Promise.all([

        getPropertyDataset('BOUNDARY_ES', 2026),
        getPropertyDataset('BOUNDARY_HS', 2026),
        getPropertyDataset('TIER', 2027),
        getPropertyDataset('SCHOOL', 2027)

    ]);

    const schoolRecords = schoolData.features.map(
        feature => feature.properties ?? {}
    );

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

        elementary: enrichSchool(
            elementaryFeature?.properties ?? null,
            schoolRecords
        ),

        middleSchool: enrichSchool(
            middleFeature?.properties ?? null,
            schoolRecords
        ),

        highSchool: enrichSchool(
            highSchoolFeature?.properties ?? null,
            schoolRecords
        ),

        tier: tierFeature?.properties ?? null

    };
}
