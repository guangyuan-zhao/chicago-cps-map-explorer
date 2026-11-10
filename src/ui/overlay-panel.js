import { overlayConfig } from '../overlays/overlay-config.js';

export function initializeOverlayPanel() {

    const container = document.getElementById('overlay-container');
    const clearButton = document.getElementById('clear-overlays');

    const categories = {
        attendance: 'Attendance Boundaries',
        geographic: 'Geographic Overlays',
        political: 'Political Overlays'
    };

    function renderOverlays() {

        container.innerHTML = '';

        Object.entries(categories).forEach(([category, title]) => {

            const categorySection = document.createElement('div');
            categorySection.className = 'overlay-category';

            const heading = document.createElement('h3');
            heading.textContent = title;

            categorySection.appendChild(heading);

            const overlays = overlayConfig.filter(
                overlay => overlay.category === category
            );

            overlays.forEach(overlay => {

                const label = document.createElement('label');
                label.className = 'overlay-item';

                const checkbox = document.createElement('input');

                checkbox.type = 'checkbox';
                checkbox.checked = overlay.enabled;
                checkbox.dataset.overlayId = overlay.id;

                checkbox.addEventListener('change', (event) => {

                    overlay.enabled = event.target.checked;

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

        renderOverlays();

        console.log('All overlays cleared.');

    });

    renderOverlays();

}