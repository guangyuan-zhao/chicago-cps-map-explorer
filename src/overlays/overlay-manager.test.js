import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCPSGeoJSON } from '../cps/cps-api.js';
import {
showOverlay,
hideOverlay,
clearAllOverlays
} from './overlay-manager.js';

vi.mock('../cps/cps-api.js', () => ({
getCPSGeoJSON: vi.fn()
}));

describe('clearAllOverlays', () => {
let map;
let layer;
let markers;

beforeEach(() => {
markers = [];

layer = {
setMap: vi.fn(),
setStyle: vi.fn(),
addGeoJson: vi.fn(),
addListener: vi.fn()
};

class MockData {
constructor(options) {
this.map = options.map;
this.setMap = layer.setMap;
this.setStyle = layer.setStyle;
this.addGeoJson = layer.addGeoJson;
this.addListener = layer.addListener;
}
}

class MockAdvancedMarker {
constructor(options) {
Object.assign(this, options);
markers.push(this);
}

append() {}
}

map = {};

vi.stubGlobal('google', {
maps: {
Data: MockData,
InfoWindow: class {
setContent() {}
setPosition() {}
open() {}
},
importLibrary: vi.fn(async () => ({
AdvancedMarkerElement: MockAdvancedMarker
})),
marker: {
AdvancedMarkerElement: MockAdvancedMarker
}
}
});

vi.stubGlobal('document', {
createElement: () => ({
style: {},
textContent: ''
}),
createTextNode: text => ({ text })
});

getCPSGeoJSON.mockResolvedValue({
type: 'FeatureCollection',
features: [{
type: 'Feature',
properties: {
NetworkNum: 13,
Lat: 41.8,
Long: -87.6,
Name: 'Test Network'
},
geometry: {
type: 'Point',
coordinates: [-87.6, 41.8]
}
}]
});
});

afterEach(() => {
vi.unstubAllGlobals();
vi.clearAllMocks();
});

it('removes network layers and their markers', async () => {
await showOverlay(map, 'elementary-networks');

expect(markers).toHaveLength(1);
expect(markers[0].map).toBe(map);

clearAllOverlays();

expect(layer.setMap).toHaveBeenCalledWith(null);
expect(markers[0].map).toBeNull();
});

it('removes a network layer and its markers when hiding that overlay', async () => {
    await showOverlay(map, 'elementary-networks');

    const { hideOverlay } = await import('./overlay-manager.js');
    hideOverlay('elementary-networks');

    expect(layer.setMap).toHaveBeenCalledWith(null);
    expect(markers[0].map).toBeNull();
});

it('does not create duplicate layers or markers for an active overlay', async () => {
    await showOverlay(map, 'elementary-networks');
    await showOverlay(map, 'elementary-networks');

    expect(markers).toHaveLength(1);
});
});
