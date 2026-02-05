/**
 * Typeface detail page configuration
 * Contains descriptions, sample texts, technical details, and pricing for each typeface
 */

const typefaceDetailConfig = {
    'alvica': {
        description: 'Swiss-knife (you get it?), everyday use, highly versatile, all-in-one typographic family. INDG Alvica counters its sober appearance with a broad set of quirky alternates.',
        samples: [
            { weight: 600, fontSize: 120, text: 'Sphinx of black judge my vow.', sampleId: 'semibold' },
            { weight: 400, fontSize: 100, text: 'AaBbCcDdEeFfGg HhliJjKkLlMmNnOo PpQqRrSsTtUuVv WwXxYyZz', sampleId: 'regular' },
            { weight: 700, fontSize: 140, text: '"Irreversible"', sampleId: 'bold' },
            { weight: 700, fontSize: 80, text: 'Das Wort Schwung bezieht sich im Sinne von eine schnelle, bogenförmige Bewegung auf eine dynamische, kraftvolle Aktivität oder eine elegante Geste, die sowohl körperliche als auch metaphorische Bedeutung haben kann.', sampleId: 'bold-de' },
            { weight: 400, fontSize: 50, text: 'Τα Εξάρχεια είναι συνοικία της Αθήνας που βρίσκεται βόρεια της οδού Αχαρνών και ανατολικά της οδού Πατησίων. Η περιοχή είναι γνωστή για το πλούσιο πολιτιστικό και κοινωνικό της ιστορικό.', sampleId: 'greek' },
            { weight: 400, fontSize: 50, text: 'У 1964 році на Печерську відкрито музей історії України, який розповідає про багатовікову спадщину країни та її культуру. Це місце стало важливим центром для дослідження національної ідентичності.', sampleId: 'cyrillic' }
        ],
        details: {
            designer: 'Iñigo Uriarte',
            version: '2.0',
            formats: 'OTF, TTF, WOFF, WOFF2',
            styles: '6',
            glyphs: '794',
            unicodeRanges: [
                'Basic Latin',
                'Latin 1-Supplement',
                'Latin Extended-A',
                'Greek and Coptic',
                'Cyrillic',
                'Cyrillic Supplement',
                'General Punctuation',
                'Cyrillic Extended A',
                'Supplemental Punctuation',
                'Cyrillic Extended B',
                'Alphabetic Presentation Forms'
            ]
        },
        pricing: [
            { name: 'INDG Alvica Family', price: '102€' },
            { name: 'INDG Alvica Thin', price: '17€' },
            { name: 'INDG Alvica Light', price: '17€' },
            { name: 'INDG Alvica Regular', price: '17€' },
            { name: 'INDG Alvica Semibold', price: '17€' },
            { name: 'INDG Alvica Bold', price: '17€' },
            { name: 'INDG Alvica Black', price: '17€' }
        ],
        hasOpenType: true,
        openTypeFeatures: ['liga', 'ss02', 'zero', 'ss03', 'dlig', 'ss04', 'smcp', 'ss05', 'salt', 'ss06', 'ss01', 'ss07']
    },
    'actio': {
        description: 'A versatile typeface with expanded and normal variants, designed for both display and text use.',
        samples: [
            { weight: 400, stretch: 'normal', fontSize: 120, text: 'Actio displays versatility through its expanded and normal variants.', sampleId: 'regular' },
            { weight: 700, stretch: 'normal', fontSize: 140, text: 'BOLD EXPRESSION', sampleId: 'bold' },
            { weight: 400, stretch: 'expanded', fontSize: 100, text: 'EXPANDED WIDTH', sampleId: 'expanded' }
        ],
        details: {
            designer: 'Iñigo Uriarte',
            version: '1.0',
            formats: 'OTF, TTF, WOFF, WOFF2',
            styles: '10',
            glyphs: '650',
            unicodeRanges: [
                'Basic Latin',
                'Latin 1-Supplement',
                'Latin Extended-A'
            ]
        },
        pricing: [
            { name: 'INDG Actio Family', price: '150€' },
            { name: 'INDG Actio Thin', price: '20€' },
            { name: 'INDG Actio Thin Expanded', price: '20€' },
            { name: 'INDG Actio Light', price: '20€' },
            { name: 'INDG Actio Light Expanded', price: '20€' },
            { name: 'INDG Actio Regular', price: '20€' },
            { name: 'INDG Actio Regular Expanded', price: '20€' },
            { name: 'INDG Actio Bold', price: '20€' },
            { name: 'INDG Actio Bold Expanded', price: '20€' },
            { name: 'INDG Actio Black', price: '20€' },
            { name: 'INDG Actio Black Expanded', price: '20€' }
        ],
        hasOpenType: false
    },
    'modus': {
        description: 'A distinctive typeface with Grey, Black, and White variants, perfect for experimental typography.',
        samples: [
            { weight: 400, fontSize: 120, text: 'MODUS GREY', sampleId: 'grey' },
            { weight: 900, fontSize: 140, text: 'MODUS BLACK', sampleId: 'black' },
            { weight: 100, fontSize: 100, text: 'MODUS WHITE', sampleId: 'white' }
        ],
        details: {
            designer: 'Iñigo Uriarte',
            version: '1.0',
            formats: 'OTF, TTF, WOFF, WOFF2',
            styles: '3',
            glyphs: '450',
            unicodeRanges: [
                'Basic Latin',
                'Latin 1-Supplement'
            ]
        },
        pricing: [
            { name: 'INDG Modus Family', price: '60€' },
            { name: 'INDG Modus Grey', price: '20€' },
            { name: 'INDG Modus Black', price: '20€' },
            { name: 'INDG Modus White', price: '20€' }
        ],
        hasOpenType: false
    },
    'luara': {
        description: 'A single-weight typeface with elegant simplicity, designed for refined typographic expression.',
        samples: [
            { weight: 400, fontSize: 120, text: 'Luara', sampleId: 'regular' }
        ],
        details: {
            designer: 'Iñigo Uriarte',
            version: '1.0',
            formats: 'OTF, TTF, WOFF, WOFF2',
            styles: '1',
            glyphs: '350',
            unicodeRanges: [
                'Basic Latin',
                'Latin 1-Supplement'
            ]
        },
        pricing: [
            { name: 'INDG Luara', price: '25€' }
        ],
        hasOpenType: false
    },
    'zigrid': {
        description: 'A geometric typeface with a single weight, characterized by its grid-based construction.',
        samples: [
            { weight: 400, fontSize: 120, text: 'Zigrid', sampleId: 'regular' }
        ],
        details: {
            designer: 'Iñigo Uriarte',
            version: '1.0',
            formats: 'OTF, TTF, WOFF, WOFF2',
            styles: '1',
            glyphs: '380',
            unicodeRanges: [
                'Basic Latin',
                'Latin 1-Supplement'
            ]
        },
        pricing: [
            { name: 'INDG Zigrid', price: '25€' }
        ],
        hasOpenType: false
    },
    'dale': {
        description: 'A typeface with Regular, Italic, and Oblique variants, offering flexibility for editorial design.',
        samples: [
            { weight: 500, style: 'normal', fontSize: 140, text: 'DALE', sampleId: 'regular' },
            { weight: 500, style: 'italic', fontSize: 120, text: 'Dale Italic', sampleId: 'italic' },
            { weight: 500, style: 'oblique', fontSize: 120, text: 'Dale Oblique', sampleId: 'oblique' }
        ],
        details: {
            designer: 'Iñigo Uriarte',
            version: '1.0',
            formats: 'OTF, TTF, WOFF, WOFF2',
            styles: '3',
            glyphs: '420',
            unicodeRanges: [
                'Basic Latin',
                'Latin 1-Supplement',
                'Latin Extended-A'
            ]
        },
        pricing: [
            { name: 'INDG Dale Family', price: '60€' },
            { name: 'INDG Dale Regular', price: '20€' },
            { name: 'INDG Dale Italic', price: '20€' },
            { name: 'INDG Dale Oblique', price: '20€' }
        ],
        hasOpenType: false
    },
    'peqat': {
        description: 'A typeface with two distinct styles: Norma and Capitalis, each with unique character.',
        samples: [
            { weight: 400, fontSize: 120, text: 'Peqat Norma', sampleId: 'norma' },
            { weight: 700, fontSize: 140, text: 'PEQAT CAPITALIS', sampleId: 'capitalis' }
        ],
        details: {
            designer: 'Iñigo Uriarte',
            version: '1.0',
            formats: 'OTF, TTF, WOFF, WOFF2',
            styles: '2',
            glyphs: '400',
            unicodeRanges: [
                'Basic Latin',
                'Latin 1-Supplement'
            ]
        },
        pricing: [
            { name: 'INDG Peqat Family', price: '45€' },
            { name: 'INDG Peqat Norma', price: '25€' },
            { name: 'INDG Peqat Capitalis', price: '25€' }
        ],
        hasOpenType: false
    },
    'heron2': {
        description: 'A single-weight display typeface with strong character, ideal for headlines and branding.',
        samples: [
            { weight: 700, fontSize: 120, text: 'Heron', sampleId: 'regular' }
        ],
        details: {
            designer: 'Iñigo Uriarte',
            version: '1.0',
            formats: 'OTF, TTF, WOFF, WOFF2',
            styles: '1',
            glyphs: '320',
            unicodeRanges: [
                'Basic Latin',
                'Latin 1-Supplement'
            ]
        },
        pricing: [
            { name: 'INDG Heron', price: '25€' }
        ],
        hasOpenType: false
    },
    'naora': {
        description: 'A delicate single-weight typeface with refined proportions, perfect for elegant typography.',
        samples: [
            { weight: 400, fontSize: 100, text: 'Naora', sampleId: 'regular' }
        ],
        details: {
            designer: 'Iñigo Uriarte',
            version: '1.0',
            formats: 'OTF, TTF, WOFF, WOFF2',
            styles: '1',
            glyphs: '360',
            unicodeRanges: [
                'Basic Latin',
                'Latin 1-Supplement'
            ]
        },
        pricing: [
            { name: 'INDG Naora', price: '25€' }
        ],
        hasOpenType: false
    },
    'sifora': {
        description: 'A single-weight typeface with clean lines and modern aesthetics.',
        samples: [
            { weight: 400, fontSize: 120, text: 'Sifora', sampleId: 'regular' }
        ],
        details: {
            designer: 'Iñigo Uriarte',
            version: '1.0',
            formats: 'OTF, TTF, WOFF, WOFF2',
            styles: '1',
            glyphs: '340',
            unicodeRanges: [
                'Basic Latin',
                'Latin 1-Supplement'
            ]
        },
        pricing: [
            { name: 'INDG Sifora', price: '25€' }
        ],
        hasOpenType: false
    },
    'oequadrat': {
        description: 'A blackletter typeface inspired by Old English typography, bringing historical character to modern design.',
        samples: [
            { weight: 700, fontSize: 120, text: 'Old English', sampleId: 'regular' }
        ],
        details: {
            designer: 'Iñigo Uriarte',
            version: '1.0',
            formats: 'OTF, TTF, WOFF, WOFF2',
            styles: '1',
            glyphs: '280',
            unicodeRanges: [
                'Basic Latin',
                'Latin 1-Supplement'
            ]
        },
        pricing: [
            { name: 'Old English Quadrat', price: '25€' }
        ],
        hasOpenType: false
    }
};

