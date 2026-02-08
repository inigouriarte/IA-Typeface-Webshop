/**
 * Typeface configuration data
 * Used to generate typeface sections dynamically
 */

const typefacesConfig = [
    {
        id: 'alvica',
        name: 'INDG Alvica',
        displayName: 'INDG Alvica',
        hasLink: true,
        linkUrl: 'alvica.html',
        dropdownType: 'weight',
        weights: [100, 300, 400, 600, 700, 900],
        weightLabels: ['Thin', 'Light', 'Regular', 'Semibold', 'Bold', 'Black'],
        defaultWeight: 400,
        defaultWeightIndex: 2,
        fontSize: 120,
        letterSpacing: 0
    },
    {
        id: 'actio',
        name: 'INDG Actio',
        displayName: 'INDG Actio',
        hasLink: false,
        dropdownType: 'weight-stretch',
        weights: [
            { weight: 100, stretch: 'normal', label: 'Thin' },
            { weight: 100, stretch: 'expanded', label: 'Thin Expanded' },
            { weight: 300, stretch: 'normal', label: 'Light' },
            { weight: 300, stretch: 'expanded', label: 'Light Expanded' },
            { weight: 400, stretch: 'normal', label: 'Regular' },
            { weight: 400, stretch: 'expanded', label: 'Regular Expanded' },
            { weight: 700, stretch: 'normal', label: 'Bold' },
            { weight: 700, stretch: 'expanded', label: 'Bold Expanded' },
            { weight: 900, stretch: 'normal', label: 'Black' },
            { weight: 900, stretch: 'expanded', label: 'Black Expanded' }
        ],
        defaultStyleIndex: 4,
        fontSize: 120,
        letterSpacing: 0
    },
    {
        id: 'modus',
        name: 'INDG Modus',
        displayName: 'INDG Modus',
        hasLink: false,
        dropdownType: 'custom',
        options: [
            { value: 400, label: 'Grey' },
            { value: 900, label: 'Black' },
            { value: 100, label: 'White' }
        ],
        defaultOptionIndex: 0,
        fontSize: 120,
        letterSpacing: 0
    },
    {
        id: 'luara',
        name: 'INDG Luara',
        displayName: 'INDG Luara',
        hasLink: false,
        isOneStyle: true,
        fontSize: 120,
        letterSpacing: 0
    },
    {
        id: 'zigrid',
        name: 'INDG Zigrid',
        displayName: 'INDG Zigrid',
        hasLink: false,
        isOneStyle: true,
        fontSize: 120,
        letterSpacing: 0
    },
    {
        id: 'dale',
        name: 'INDG Dale',
        displayName: 'INDG Dale',
        hasLink: false,
        dropdownType: 'style',
        styles: [
            { weight: 500, style: 'normal', label: 'Regular' },
            { weight: 500, style: 'italic', label: 'Italic' },
            { weight: 500, style: 'oblique', label: 'Oblique' }
        ],
        defaultStyleIndex: 0,
        fontSize: 140,
        letterSpacing: 0
    },
    {
        id: 'peqat',
        name: 'INDG Peqat',
        displayName: 'INDG Peqat',
        hasLink: false,
        dropdownType: 'weight',
        weights: [400, 700],
        weightLabels: ['Norma', 'Capitalis'],
        defaultWeight: 400,
        defaultWeightIndex: 0,
        fontSize: 120,
        letterSpacing: 0
    },
    {
        id: 'heron2',
        name: 'INDG Heron',
        displayName: 'INDG Heron',
        hasLink: false,
        isOneStyle: true,
        fontSize: 120,
        letterSpacing: 0,
        fontWeight: 700
    },
    {
        id: 'naora',
        name: 'INDG Naora',
        displayName: 'INDG Naora',
        hasLink: false,
        isOneStyle: true,
        fontSize: 100,
        letterSpacing: 0
    },
    {
        id: 'sifora',
        name: 'INDG Sifora',
        displayName: 'INDG Sifora',
        hasLink: false,
        isOneStyle: true,
        fontSize: 120,
        letterSpacing: 0
    },
    {
        id: 'oequadrat',
        name: 'Old English Quadrat',
        displayName: 'Old English Quadrat',
        hasLink: false,
        isOneStyle: true,
        fontSize: 120,
        letterSpacing: 0,
        fontWeight: 700
    }
];

