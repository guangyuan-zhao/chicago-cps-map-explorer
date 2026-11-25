
import { overlayConfig } from './overlay-config.js';
import { getCPSGeoJSON } from '../cps/cps-api.js';

// Cache downloaded datasets by map name and year.
const datasetCache = new Map();

// Keep each displayed overlay independent.
const activeLayers = new Map();
const activeNetworkMarkers = new Map();

// Distinct colors for CPS tier categories.
const tierColors = {
    '1': '#F4CCCC',
    '2': '#FCE5CD',
    '3': '#FFF2CC',
    '4': '#D9EAD3'
};

/**
 * Download a CPS dataset, using the cache when available.
 */
async function getCachedDataset(mapName, year) {

    const cacheKey = `${mapName}_${year}`;

    if (!datasetCache.has(cacheKey)) {

        const request = getCPSGeoJSON(mapName, year);

        datasetCache.set(cacheKey, request);

        try {
            const data = await request;
            return data;
        } catch (error) {
            // Allow a failed request to be retried.
            datasetCache.delete(cacheKey);
            throw error;
        }
    }

    return datasetCache.get(cacheKey);
}

/**
 * Recursively flatten GeometryCollections.
 *
 * This ensures that individual geometries inside a
 * GeometryCollection can be rendered independently.
 */
function flattenGeometry(geometry, properties, output) {

    if (!geometry) return;

    if (geometry.type === 'GeometryCollection') {

        geometry.geometries.forEach(childGeometry => {
            flattenGeometry(childGeometry, properties, output);
        });

        return;
    }

    output.push({
        type: 'Feature',
        properties: { ...properties },
        geometry
    });
}

/**
 * Convert a GeoJSON FeatureCollection into a collection
 * without GeometryCollection geometries.
 */
function normalizeGeoJSON(data) {

    const features = [];

    for (const feature of data.features) {

        flattenGeometry(
            feature.geometry,
            feature.properties ?? {},
            features
        );
    }

    return {
        type: 'FeatureCollection',
        features
    };
}

/**
 * Apply an overlay's property filter.
 */
function filterGeoJSON(data, filter) {

    if (!filter) return data;

    const filteredFeatures = data.features.filter(feature => {

        return Object.entries(filter).every(([key, value]) => {

            return String(feature.properties?.[key]) === String(value);

        });

    });

    return {
        type: 'FeatureCollection',
        features: filteredFeatures
    };
}

/**
 * Generate Google Maps styling for an overlay.
 */

function getOverlayStyle(overlay) {
    return feature => {
        const isTier = overlay.styleBy === 'Tier';
        const geometryType = feature.getGeometry()?.getType();
        const isLine =
            geometryType === 'LineString' ||
            geometryType === 'MultiLineString';

        const strokeColor = isTier
            ? feature.getProperty('strokeColor') || overlay.color
            : overlay.color;

        const strokeOpacity = isTier
            ? Number(feature.getProperty('strokeOpacity') ?? 0.9)
            : isLine
                ? overlay.opacity
                : 0.9;

        const strokeWeight = isTier
            ? Number(feature.getProperty('strokeWeight') ?? 1)
            : isLine
                ? 3
                : 1.5;

        if (isLine) {
            return {
                strokeColor,
                strokeOpacity,
                strokeWeight,
                clickable: true
            };
        }

        const fillColor = isTier
            ? feature.getProperty('fillColor') || overlay.color
            : overlay.color;

        const fillOpacity = isTier
            ? Number(feature.getProperty('fillOpacity') ?? overlay.opacity)
            : overlay.opacity;

        return {
            fillColor,
            fillOpacity,
            strokeColor,
            strokeOpacity,
            strokeWeight,
            clickable: true
        };
    };
}

/**
 * Show Tier hover information
 */
function addTierHoverInteraction(map, layer) {

    const infoWindow = new google.maps.InfoWindow({
        disableAutoPan: true
    });

    layer.addListener('mouseover', event => {

        const tier = event.feature.getProperty('Tier');
        const tierName =
            event.feature.getProperty('NameSm') || `Tier ${tier}`;

        const content = document.createElement('div');
        content.textContent = tierName;

        infoWindow.setContent(content);
        infoWindow.setPosition(event.latLng);
        infoWindow.open({
            map
        });

    });

    layer.addListener('mouseout', () => {
        infoWindow.close();
    });

}

/**
 * Show Network click information
 */
function addNetworkClickInteraction(map, layer) {
    const infoWindow = new google.maps.InfoWindow();

    layer.addListener('click', event => {
        const feature = event.feature;
        const get = key => feature.getProperty(key) ?? '';

        const content = document.createElement('div');
        content.style.minWidth = '240px';

        const title = document.createElement('div');
        title.textContent = get('Name');
        title.style.fontSize = '18px';
        title.style.fontWeight = '600';
        title.style.color = '#2864c8';
        content.appendChild(title);

        const addLine = (label, value) => {
            if (!value) return;

            const line = document.createElement('div');
            const strong = document.createElement('strong');
            strong.textContent = `${label}: `;
            line.append(strong, document.createTextNode(value));
            content.appendChild(line);
        };

        addLine('Address', get('Address'));
        addLine('Chief of Schools', get('Admin'));
        addLine('Phone', get('Phone'));

        infoWindow.setContent(content);
        infoWindow.setPosition(event.latLng);
        infoWindow.open({ map });
    });
}

async function addNetworkMarkers(map, overlayId, features, color) {
    const { AdvancedMarkerElement } =
        await google.maps.importLibrary('marker');
    
    const markers = [];
    const seenNetworks = new Set();

    for (const feature of features) {
        const properties = feature.properties ?? {};
        const networkNumber = String(properties.NetworkNum ?? '').trim();
        const lat = Number(properties.Lat);
        const lng = Number(properties.Long);

        if (
            !networkNumber ||
            !Number.isFinite(lat) ||
            !Number.isFinite(lng) ||
            seenNetworks.has(networkNumber)
        ) {
            continue;
        }

        seenNetworks.add(networkNumber);

        const circle = document.createElement('div');
        circle.textContent = networkNumber;
        circle.style.cssText = `
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            border-radius: 50%;
            background: ${color};
            border: 2px solid white;
            color: white;
            font: bold 14px Arial, sans-serif;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
        `;

        const marker = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: { lat, lng },
            title: `Network ${networkNumber}`,
            content: circle
        });

        marker.append(circle);
        markers.push(marker);
    }

    activeNetworkMarkers.set(overlayId, markers);
}

/**
 * Display an overlay on Google Maps.
 */
export async function showOverlay(map, overlayId) {

    const overlay = overlayConfig.find(
        item => item.id === overlayId
    );

    if (!overlay) {
        throw new Error(`Unknown overlay: ${overlayId}`);
    }

    if (!overlay.dataSource) {
        throw new Error(
            `No verified data source configured for ${overlay.name}.`
        );
    }

    // Avoid creating duplicate layers.
    if (activeLayers.has(overlayId)) {
        return;
    }

    const { mapName, year, filter } = overlay.dataSource;

    console.log(`Loading overlay: ${overlay.name}`);

    const originalData = await getCachedDataset(mapName, year);

    // Normalize geometry before applying filters.
    const normalizedData = normalizeGeoJSON(originalData);

    const filteredData = filterGeoJSON(
        normalizedData,
        filter
    );

    if (
        overlayId === 'elementary-networks' ||
        overlayId === 'high-school-networks'
    ) {
        console.log(`${overlay.name} sample properties:`);
        console.table(
            filteredData.features
                .slice(0, 3)
                .map(feature => feature.properties)
        );
    }

    if (filteredData.features.length === 0) {
        console.warn(`No features found for ${overlay.name}.`);
        return;
    }

    // Each overlay gets its own independent Data layer.
    const layer = new google.maps.Data({
        map: map
    });

    layer.setStyle(getOverlayStyle(overlay));

    try {

        layer.addGeoJson(filteredData);
        if (overlay.styleBy === 'Tier') {
            addTierHoverInteraction(map, layer);
        }

        if (
            overlayId === 'elementary-networks' ||
            overlayId === 'high-school-networks'
        ) {
            await addNetworkMarkers(
                map,
                overlayId,
                filteredData.features,
                overlay.color
            );
        }

        if (
            overlayId === 'elementary-networks' ||
            overlayId === 'high-school-networks'
        ) {
            addNetworkClickInteraction(map, layer);
        }

        activeLayers.set(overlayId, layer);

        console.log(
            `Overlay displayed: ${overlay.name} ` +
            `(${filteredData.features.length} features)`
        );

    } catch (error) {

        layer.setMap(null);

        throw error;
    }
}

/**
 * Hide an individual overlay without affecting other layers.
 */
export function hideOverlay(overlayId) {

    const layer = activeLayers.get(overlayId);

    if (!layer) return;

    layer.setMap(null);

    const markers = activeNetworkMarkers.get(overlayId) ?? [];

    for (const marker of markers) {
        marker.map = null;
    }

    activeNetworkMarkers.delete(overlayId);

    activeLayers.delete(overlayId);

    console.log(`Overlay hidden: ${overlayId}`);
}

/**
 * Toggle an overlay on or off.
 */
export async function toggleOverlay(map, overlayId, enabled) {

    if (enabled) {
        await showOverlay(map, overlayId);
    } else {
        hideOverlay(overlayId);
    }
}

/**
 * Hide all active overlays.
 */
export function clearAllOverlays() {

    for (const [overlayId, layer] of activeLayers) {

        layer.setMap(null);

        console.log(`Overlay cleared: ${overlayId}`);
    }

    activeLayers.clear();
}
