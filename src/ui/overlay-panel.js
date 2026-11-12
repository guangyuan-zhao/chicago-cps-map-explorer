
import { overlayConfig } from '../overlays/overlay-config.js';

export function initializeOverlayPanel({
    onToggle,
    onClear
} = {}) {

    const container = document.getElementById('overlay-container');
    const clearButton = document.getElementById('clear-overlays');

    if (!container || !clearButton) {
        throw new Error(
            'Overlay panel elements were not found in index.html.'
        );
    }

    const categories = {
        attendance: 'Attendance Boundaries',
        schools: 'School Locations',
        geographic: 'Geographic Overlays',
        political: 'Political Overlays'
    };

    function renderOverlays() {

        container.innerHTML = '';

        Object.entries(categories).forEach(([category, title]) => {

            const overlays = overlayConfig.filter(
                overlay => overlay.category === category
            );

            if (overlays.length === 0) return;

            const categorySection = document.createElement('div');
            categorySection.className = 'overlay-category';

            const heading = document.createElement('h3');
            heading.textContent = title;

            categorySection.appendChild(heading);

            overlays.forEach(overlay => {

                const label = document.createElement('label');
                label.className = 'overlay-item';

                const checkbox = document.createElement('input');

                checkbox.type = 'checkbox';
                checkbox.checked = overlay.enabled;
                checkbox.dataset.overlayId = overlay.id;

                // Temporarily disable unverified data sources.
                const unavailable =
                    overlay.status === 'pending' ||
                    !overlay.dataSource;

                checkbox.disabled = unavailable;

                if (unavailable) {
                    label.title = 'Data source not yet configured.';
                    label.classList.add('overlay-unavailable');
                }

                checkbox.addEventListener('change', (event) => {

                    overlay.enabled = event.target.checked;

                    if (typeof onToggle === 'function') {
                        onToggle(overlay.id, overlay.enabled);
                    }

                    console.log(
                        `Overlay "${overlay.name}":`,
                        overlay.enabled ? 'ON' : 'OFF'
                    );

                });

                const colorIndicator = document.createElement('span');

                colorIndicator.className = 'overlay-color';
                colorIndicator.style.backgroundColor = overlay.color;

                const name = document.createElement('span');
                name.textContent = overlay.name;

                label.appendChild(checkbox);
                label.appendChild(colorIndicator);
                label.appendChild(name);

                categorySection.appendChild(label);

            });

            container.appendChild(categorySection);

        });

    }

    clearButton.addEventListener('click', () => {

        overlayConfig.forEach(overlay => {
            overlay.enabled = false;
        });

        if (typeof onClear === 'function') {
            onClear();
        }

        renderOverlays();

        console.log('All overlays cleared.');

    });

    renderOverlays();

}
