
const API_BASE = 'https://api.cps.edu/maps/';

const layers = [
  { mapName: 'BOUNDARY_ES', year: 2026 },
  { mapName: 'BOUNDARY_HS', year: 2026 },
  { mapName: 'TIER', year: 2027 },
  { mapName: 'SCHOOL', year: 2027 },
  { mapName: 'NETWORK_ES', year: 2023 },
];

function collectCoordinates(geometry, result = []) {
  if (!geometry) return result;

  if (geometry.type === 'GeometryCollection') {
    geometry.geometries.forEach(g => collectCoordinates(g, result));
    return result;
  }

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

  const geometryCounts = {};
  const propertyValues = {};
  const allCoordinates = [];

  for (const feature of data.features ?? []) {
    const geometryType = feature.geometry?.type ?? 'null';

    geometryCounts[geometryType] =
      (geometryCounts[geometryType] ?? 0) + 1;

    allCoordinates.push(
      ...collectCoordinates(feature.geometry)
    );

    // Collect selected categorical properties.
    const keys = {
      BOUNDARY_ES: ['GRADE_CAT', 'LAYER'],
      BOUNDARY_HS: ['GRADE_CAT', 'SCH_TYPE'],
      TIER: ['Tier'],
      SCHOOL: ['Governance', 'Boundary', 'Grade_Cat', 'Open_Status'],
      NETWORK_ES: ['NetworkNum'],
    }[layer.mapName] ?? [];

    for (const key of keys) {
      const value = feature.properties?.[key] ?? '(missing)';

      propertyValues[key] ??= {};
      propertyValues[key][value] =
        (propertyValues[key][value] ?? 0) + 1;
    }
  }

  const xs = allCoordinates.map(c => c[0]);
  const ys = allCoordinates.map(c => c[1]);

  console.log(`\n========== ${layer.mapName} ==========`);
  console.log('Year:', layer.year);
  console.log('Feature count:', data.features?.length);
  console.log('Geometry types:', geometryCounts);
  console.log('Coordinate count:', allCoordinates.length);

  if (allCoordinates.length) {
    console.log('Complete dataset bounds:', {
      minLongitude: Math.min(...xs),
      maxLongitude: Math.max(...xs),
      minLatitude: Math.min(...ys),
      maxLatitude: Math.max(...ys),
    });
  }

  console.log('Property distributions:');
  console.dir(propertyValues, { depth: null });
}

async function main() {
  for (const layer of layers) {
    await inspectLayer(layer);
  }
}

main().catch(error => {
  console.error('Validation failed:', error);
  process.exitCode = 1;
});
