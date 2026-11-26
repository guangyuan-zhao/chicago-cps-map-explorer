# Chicago CPS Map Explorer

Chicago CPS Map Explorer is a browser-based map application for exploring Chicago residential addresses and nearby Chicago Public Schools geographic information.

The app uses Google Maps for map rendering and address lookup, and the public Chicago Public Schools Maps API for attendance boundaries, school locations, census tiers, geographic networks, and other civic overlays.

## Features

- Search for a Chicago address with CPS geocoder suggestions
- Select a location directly on the map
- View elementary, middle, and high school attendance assignments
- View CPS Tier and census tract information
- View detailed school records when available
- Toggle attendance, school, geographic, and political overlays
- Remove all active overlays with one control
- Use cached CPS datasets while the page remains open

## Available Overlays

Configured overlays include:

- Elementary and middle school attendance boundaries
- High school attendance boundaries
- Charter school preference boundaries
- Elementary and high school geographic networks
- Safe passage routes
- CPS tiers
- Community areas
- ZIP codes
- School locations
- Wards
- Illinois House and Senate districts
- US congressional districts
- Local school council boundaries

Transit, bike paths, elected representative school board boundaries, and ARA regions are currently disabled until their data sources are verified.

## Requirements

- Node.js and npm
- A Google Maps API key with access to:
  - Maps JavaScript API
  - Advanced Markers
  - Geocoding API

The CPS Maps API is public and does not require an application key.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Add your Google Maps API key:

   ```dotenv
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the local URL printed by Vite.

For browser security, restrict the API key to your expected development domains and enable only the required Google Maps APIs.

## Usage

### Address search

Enter at least three characters in the property search field. Select a CPS address suggestion and run the search, or press Enter. The app geocodes the address, determines the containing CPS boundaries and tier, and places an advanced marker on the map.

Low-confidence address matches show a confirmation prompt before continuing.

### Map selection

Click anywhere on the map to perform a property lookup. The app combines coordinate-based CPS boundary lookup with Google reverse geocoding and displays the available results in the sidebar.

### Overlays

Use the Map Overlays panel to toggle configured datasets. Overlay controls that are disabled in the interface do not yet have a verified data source.

## Scripts

- `npm run dev` - start the Vite development server
- `npm run build` - create a production build in `dist/`
- `npm run preview` - serve the production build locally
- `npm test` - run Vitest tests
- `npm run cps:inspect` - retrieve the CPS maps catalog and refresh `docs/cps-maps-list.json`
- `npm run cps:geojson` - inspect configured CPS GeoJSON datasets
- `npm run cps:geometry` - inspect coordinate geometry for core datasets
- `npm run cps:validate` - validate and summarize key CPS layers

## Project Structure

```text
src/
  main.js                 Application setup and search interactions
  cps/cps-api.js          CPS API and coordinate conversion helpers
  map/map.js              Google Maps initialization
  overlays/               Overlay configuration and rendering
  property/               Property lookup and sidebar rendering
  ui/                     Overlay panel and application styles
scripts/                  CPS API inspection and validation utilities
docs/cps-maps-list.json   Saved CPS map catalog data
public/assets/            Static assets
```

## Data Sources

- Google Maps JavaScript API and Geocoding API
- Chicago Public Schools Public Maps API: `https://api.cps.edu/maps/`

CPS datasets are requested through `CPS/GeoJSON`, `CPS/MapsList`, and the geocoder endpoints. Data coverage and school boundaries can vary by year. Overlay configurations specify the relevant map name and year in `src/overlays/overlay-config.js`.

Property lookup uses the following core datasets:

- `BOUNDARY_ES` (2026) - elementary and middle school boundaries
- `BOUNDARY_HS` (2026) - high school boundaries
- `TIER` (2027) - CPS tier assignments
- `SCHOOL` (2027) - school records used to enrich boundary results

Boundary lookup uses `@turf/turf` to find the polygon containing a selected longitude and latitude.

## Tests

Run the Vitest suite with:

```bash
npm test
```

The current tests cover overlay lifecycle behavior, including clearing, hiding, and duplicate-layer prevention.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
