
/**
 * Display CPS property lookup results in the sidebar.
 */
export function renderPropertyInformation(address, result) {

    const container = document.getElementById(
        'property-information'
    );

    if (!container) {
        throw new Error('Property information container not found.');
    }

    container.innerHTML = '';

    function addRow(label, value) {

        const row = document.createElement('div');
        row.className = 'property-info-row';

        const heading = document.createElement('div');
        heading.className = 'property-info-label';
        heading.textContent = label;

        const content = document.createElement('div');
        content.className = 'property-info-value';
        content.textContent = value || 'No matching boundary found';

        row.appendChild(heading);
        row.appendChild(content);

        container.appendChild(row);
    }

    function schoolName(feature) {
        return feature?.SCHOOL_NM || null;
    }

    // Address heading.
    const addressHeading = document.createElement('h3');
    addressHeading.className = 'property-address';
    addressHeading.textContent = address;

    container.appendChild(addressHeading);

    // CPS Tier.
    addRow(
        'CPS Tier',
        result.tier?.NameSm || null
    );

    // School attendance information.
    addRow(
        'Elementary School',
        schoolName(result.elementary)
    );

    addRow(
        'Middle School',
        schoolName(result.middleSchool)
    );

    addRow(
        'High School',
        schoolName(result.highSchool)
    );

    // Census tract.
    addRow(
        'Census Tract',
        result.tier?.NAMELSAD || null
    );

    // Coordinates.
    addRow(
        'Latitude',
        result.coordinates.latitude.toFixed(6)
    );

    addRow(
        'Longitude',
        result.coordinates.longitude.toFixed(6)
    );
}

/**
 * Display a search error or status message.
 */
export function renderPropertyMessage(message) {

    const container = document.getElementById(
        'property-information'
    );

    container.replaceChildren();

    const paragraph = document.createElement('p');
    paragraph.className = 'placeholder-text';
    paragraph.textContent = message;

    container.appendChild(paragraph);
}
