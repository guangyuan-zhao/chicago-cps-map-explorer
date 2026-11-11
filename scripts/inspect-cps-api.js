
const API_URL = 'https://api.cps.edu/maps/CPS/MapsList';

async function main() {
    console.log('Connecting to CPS Public Maps API...\n');

    const response = await fetch(API_URL);

    if (!response.ok) {
        throw new Error(
            `HTTP ${response.status}: ${response.statusText}`
        );
    }

    const maps = await response.json();

    if (!Array.isArray(maps)) {
        console.log('Unexpected response structure:');
        console.dir(maps, { depth: null });
        return;
    }

    console.log(`Total map records: ${maps.length}\n`);

    console.table(
        maps.map(map => ({
            mapID: map.mapID,
            mapName: map.mapName,
            year: map.year,
            lastUpdated: map.lastUpdated
        }))
    );

    // Summarize available school years.
    const years = [...new Set(maps.map(map => map.year))].sort();

    console.log('\nAvailable school years:');
    console.log(years.join(', '));

    // Save a local copy for development inspection.
    const fs = await import('node:fs/promises');

    await fs.writeFile(
        'docs/cps-maps-list.json',
        JSON.stringify(maps, null, 2)
    );

    console.log('\nSaved API response to docs/cps-maps-list.json');
}

main().catch(error => {
    console.error('\nCPS API inspection failed:');
    console.error(error);
    process.exitCode = 1;
});
