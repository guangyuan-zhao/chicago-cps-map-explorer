
const API_BASE = 'https://api.cps.edu/maps/';

const testLayers = [
    { mapName: 'BOUNDARY_ES', year: 2026 },
    { mapName: 'BOUNDARY_HS', year: 2026 },
    { mapName: 'TIER', year: 2027 },
    { mapName: 'SCHOOL', year: 2027 },
    { mapName: 'NETWORK_ES', year: 2023 },

    // New overlay datasets to inspect
    { mapName: 'COMMUNITY', year: 2020 },
    { mapName: 'ZIP', year: 2020 },
    { mapName: 'SAFE', year: 2023 },
    { mapName: 'BOUNDARY_CS', year: 2023 },
    { mapName: 'HOUSE', year: 2021 },
    { mapName: 'SENATE', year: 2021 },
    { mapName: 'CONGRESSIONAL', year: 2021 },
    { mapName: 'WARD', year: 2024 },
    { mapName: 'LSC', year: 2022 }
];

async function inspectLayer({ mapName, year }) {

    const url = new URL('CPS/GeoJSON', API_BASE);

    url.searchParams.set('mapName', mapName);
    url.searchParams.set('year', year);

    console.log(`\nInspecting ${mapName} (${year})...`);

    try {

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}: ${response.statusText}`
            );
        }

        const data = await response.json();

        console.log('Response type:', data.type);
        console.log('Top-level keys:', Object.keys(data));

        const features = data.features || [];

        const geometryTypes = [
            ...new Set(
                features
                    .map(feature => feature.geometry?.type)
                    .filter(Boolean)
            )
        ];

        console.log('Feature count:', features.length);
        console.log('Geometry types:', geometryTypes);

        if (features.length > 0) {

            console.log(
                'Sample properties:',
                features[0].properties
            );

            console.log(
                'Sample geometry:',
                features[0].geometry?.type
            );

        } else {
            console.log('No GeoJSON features found.');
            console.dir(data, { depth: 2 });
        }

        return {
            mapName,
            year,
            success: true,
            featureCount: features.length,
            geometryTypes
        };

    } catch (error) {

        console.error(`Failed: ${mapName}`, error.message);

        return {
            mapName,
            year,
            success: false,
            error: error.message
        };

    }
}

async function main() {

    const results = [];

    for (const layer of testLayers) {
        results.push(await inspectLayer(layer));
    }

    console.log('\n========== SUMMARY ==========');

    console.table(results);
}

main();
