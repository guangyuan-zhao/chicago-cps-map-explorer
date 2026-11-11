
const API_BASE = 'https://api.cps.edu/maps/';

const layers = [
    { mapName: 'BOUNDARY_ES', year: 2026 },
    { mapName: 'BOUNDARY_HS', year: 2026 },
    { mapName: 'TIER', year: 2027 },
    { mapName: 'SCHOOL', year: 2027 },
    { mapName: 'NETWORK_ES', year: 2023 }
];

function collectCoordinates(geometry, result = []) {

    if (!geometry) return result;

    if (geometry.type === 'GeometryCollection') {

        geometry.geometries.forEach(item =>
            collectCoordinates(item, result)
        );

    } else {

        function traverse(value) {

            if (
                Array.isArray(value) &&
                typeof value[0] === 'number'
            ) {
                result.push(value);
                return;
            }

            if (Array.isArray(value)) {
                value.forEach(traverse);
            }

        }

        traverse(geometry.coordinates);

    }

    return result;
}

async function inspectLayer(layer) {

    const url = new URL('CPS/GeoJSON', API_BASE);

    url.searchParams.set('mapName', layer.mapName);
    url.searchParams.set('year', layer.year);

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    const feature = data.features?.[0];

    if (!feature) return;

    const coordinates = collectCoordinates(feature.geometry);

    const xs = coordinates.map(c => c[0]);
    const ys = coordinates.map(c => c[1]);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    console.log(`\n========== ${layer.mapName} ==========`);
    console.log('Year:', layer.year);
    console.log('Coordinate sample:', coordinates.slice(0, 3));
    console.log('Coordinate count:', coordinates.length);

    console.log('Coordinate bounds:', {
        minX,
        maxX,
        minY,
        maxY
    });

    console.log('First feature properties:');
    console.dir(feature.properties, { depth: 1 });

    if (layer.mapName === 'SCHOOL') {
        console.log('GeoJSON Point coordinates:', feature.geometry.coordinates);

        console.log('School Lat/Long attributes:', {
            latitude: feature.properties.Lat,
            longitude: feature.properties.Long
        });
    }

}

async function main() {

    for (const layer of layers) {
        await inspectLayer(layer);
    }

}

main().catch(console.error);
