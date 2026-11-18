
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
        content.textContent = value || 'Not available';

        row.appendChild(heading);
        row.appendChild(content);

        container.appendChild(row);
    }

    function addSchoolSection(title, boundary) {

        const section = document.createElement('div');
        section.className = 'school-info-section';

        const heading = document.createElement('h4');
        heading.className = 'school-section-heading';
        heading.textContent = title;

        section.appendChild(heading);
        container.appendChild(section);

        if (!boundary) {

            const message = document.createElement('p');
            message.className = 'school-not-found';
            message.textContent = 'No matching boundary found';

            section.appendChild(message);
            return;
        }

        const details = boundary.schoolDetails ?? {};

        const schoolName =
            boundary.SCHOOL_NM ||
            details.name ||
            'School name unavailable';

        const name = document.createElement('div');
        name.className = 'school-name';
        name.textContent = schoolName;

        section.appendChild(name);

        function addSchoolRow(label, value) {

            const row = document.createElement('div');
            row.className = 'school-detail-row';

            const labelElement = document.createElement('span');
            labelElement.className = 'school-detail-label';
            labelElement.textContent = label;

            const valueElement = document.createElement('span');
            valueElement.className = 'school-detail-value';
            valueElement.textContent = value || 'Not available';

            row.appendChild(labelElement);
            row.appendChild(valueElement);

            section.appendChild(row);
        }

        addSchoolRow(
            'Address',
            details.address || boundary.SCHOOL_ADDR
        );

        addSchoolRow(
            'School ID',
            details.schoolId || boundary.SCHOOL_ID
        );

        addSchoolRow(
            'Grades served',
            details.gradesServed || boundary.BOUNDARYGR
        );

        addSchoolRow(
            'Governance',
            details.governance
        );

        addSchoolRow(
            'Boundary type',
            details.boundaryType
        );

        addSchoolRow(
            'School status',
            details.openStatus
        );

        addSchoolRow(
            'Boundary grades',
            boundary.BOUNDARYGR
        );
    }

    // Property address.
    const addressHeading = document.createElement('h3');
    addressHeading.className = 'property-address';
    addressHeading.textContent = address;

    container.appendChild(addressHeading);

    // CPS Tier.
    addRow(
        'CPS Tier',
        result.tier?.NameSm
    );

    // Census tract.
    addRow(
        'Census Tract',
        result.tier?.NAMELSAD
    );

    // School information.
    addSchoolSection(
        'Elementary School',
        result.elementary
    );

    addSchoolSection(
        'Middle School',
        result.middleSchool
    );

    addSchoolSection(
        'High School',
        result.highSchool
    );

    // Property location section.
    const locationSection = document.createElement('div');
    locationSection.className = 'location-info-section';

    const locationHeading = document.createElement('h4');
    locationHeading.className = 'school-section-heading';
    locationHeading.textContent = 'Property Location';

    locationSection.appendChild(locationHeading);

    function addLocationRow(label, value) {

        const row = document.createElement('div');
        row.className = 'location-info-row';

        const labelElement = document.createElement('div');
        labelElement.className = 'property-info-label';
        labelElement.textContent = label;

        const valueElement = document.createElement('div');
        valueElement.className = 'property-info-value';
        valueElement.textContent = value;

        row.appendChild(labelElement);
        row.appendChild(valueElement);

        locationSection.appendChild(row);
    }

    addLocationRow(
        'Latitude',
        result.coordinates.latitude.toFixed(6)
    );

    addLocationRow(
        'Longitude',
        result.coordinates.longitude.toFixed(6)
    );

    container.appendChild(locationSection);
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
