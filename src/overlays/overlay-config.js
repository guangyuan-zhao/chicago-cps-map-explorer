export const overlayConfig = [

    // Attendance boundaries
    {
        id: 'elementary',
        name: 'Elementary School',
        category: 'attendance',
        enabled: false,
        color: '#2878D0',
        opacity: 0.25
    },
    {
        id: 'high-school',
        name: 'High School',
        category: 'attendance',
        enabled: false,
        color: '#E53935',
        opacity: 0.25
    },
    {
        id: 'charter-preference',
        name: 'Charter School Preference Boundary',
        category: 'attendance',
        enabled: false,
        color: '#8E44AD',
        opacity: 0.25
    },

    // Geographic overlays
    {
        id: 'elementary-networks',
        name: 'Elementary School Geographic Networks',
        category: 'geographic',
        enabled: false,
        color: '#2980B9',
        opacity: 0.20
    },
    {
        id: 'high-school-networks',
        name: 'High School Geographic Networks',
        category: 'geographic',
        enabled: false,
        color: '#C0392B',
        opacity: 0.20
    },
    {
        id: 'safe-passage',
        name: 'Safe Passage Routes',
        category: 'geographic',
        enabled: false,
        color: '#F39C12',
        opacity: 0.80
    },
    {
        id: 'cps-tiers',
        name: 'CPS Tiers',
        category: 'geographic',
        enabled: false,
        color: '#795548',
        opacity: 0.25
    },
    {
        id: 'community-areas',
        name: 'Community Areas',
        category: 'geographic',
        enabled: false,
        color: '#388E3C',
        opacity: 0.20
    },
    {
        id: 'zip-codes',
        name: 'ZIP Codes',
        category: 'geographic',
        enabled: false,
        color: '#16A085',
        opacity: 0.20
    },
    {
        id: 'transit',
        name: 'Transit',
        category: 'geographic',
        enabled: false,
        color: '#3498DB',
        opacity: 0.80
    },
    {
        id: 'bike-paths',
        name: 'Bike Paths',
        category: 'geographic',
        enabled: false,
        color: '#27AE60',
        opacity: 0.80
    },
    {
        id: 'ara-regions',
        name: 'ARA Regions',
        category: 'geographic',
        enabled: false,
        color: '#9B59B6',
        opacity: 0.20
    },

    // Political overlays
    {
        id: 'school-board',
        name: 'Elected Representative School Board',
        category: 'political',
        enabled: false,
        color: '#D35400',
        opacity: 0.20
    },
    {
        id: 'wards',
        name: 'Wards',
        category: 'political',
        enabled: false,
        color: '#34495E',
        opacity: 0.20
    },
    {
        id: 'il-house',
        name: 'Illinois House District',
        category: 'political',
        enabled: false,
        color: '#E67E22',
        opacity: 0.20
    },
    {
        id: 'il-senate',
        name: 'Illinois Senate District',
        category: 'political',
        enabled: false,
        color: '#C0392B',
        opacity: 0.20
    },
    {
        id: 'congressional',
        name: 'US Congressional District',
        category: 'political',
        enabled: false,
        color: '#8E44AD',
        opacity: 0.20
    }

];