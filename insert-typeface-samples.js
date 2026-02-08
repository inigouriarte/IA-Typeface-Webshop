// Typeface sample data and helpers (data lives in data/typeface-samples.json)
// getTypefaceSamples() reads from that file; insertTypefaceSamples() exports JSON for download.

// Sample texts data organized by typeface family
// Each entry contains: text, fontSize (in px), letterSpacing (tracking in px), and sample type identifier
const typefaceSamplesData = {
    'INDG Alvica': [
        {
            text: 'Alvica',
            fontSize: 120,
            letterSpacing: 0,
            sampleType: 'default'
        },
        {
            text: 'Sphinx of black quartz, judge my vow.',
            fontSize: 120,
            letterSpacing: 0,
            sampleType: 'semibold'
        },
        {
            text: 'AaBbCcDdEeFfGgHhliJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz',
            fontSize: 100,
            letterSpacing: 0,
            sampleType: 'regular'
        },
        {
            text: '"Irreversible"',
            fontSize: 140,
            letterSpacing: 0,
            sampleType: 'bold'
        },
        {
            text: 'Das Wort Schwung bezieht sich im Sinne von „eine schnelle, bogenförmige Bewegung“ auf die Handbewegung beim Schreiben. Das Wort Schnörkel verweist etymologisch auf eine Schnecke(nlinie) bzw. Schleife und bezeichnet eine gewundene Linie, die als Verzierung dienen soll. Die Verwendung von Schwüngen bzw. Schnörkeln gilt zum einen als kunstvoll, zum andern ist sie aber auch negativ konnotiert – etwa weil darunter die Leserlichkeit leiden kann – und wird dann als „Schnörkelei“ oder „Geschnörkel“ bezeichnet. Das Adjektiv „verschnörkelt“ kann sich auf Schrift, aber auch auf kunsthandwerkliche Gegenstände wie etwa Kunstschmiede- oder Tischlerarbeiten beziehen sowie metaphorisch auf ganz anderes, beispielsweise auf Musik oder sprachliche Formulierungen. Das Adjektiv „schnörkellos“ bezeichnet die Beschränkung auf das Wesentliche.',
            fontSize: 25,
            letterSpacing: 0,
            sampleType: 'bold'
        },
        {
            text: 'Τα Εξάρχεια είναι συνοικία της Αθήνας που βρίσκεται βόρεια της οδού Αχαρνών και ανατολικά της οδού Πατησίων. Η περιοχή είναι γνωστή για το πλούσιο πολιτιστικό και κοινωνικό της ιστορικό.',
            fontSize: 50,
            letterSpacing: 0,
            sampleType: 'regular'
        },
        {
            text: 'У 1964 році на Печерську відкрито музей історії України, який розповідає про багатовікову спадщину країни та її культуру. Це місце стало важливим центром для дослідження національної ідентичності.',
            fontSize: 50,
            letterSpacing: 0,
            sampleType: 'regular'
        }
    ],
    'INDG Actio': [
        {
            text: 'Actio',
            fontSize: 120,
            letterSpacing: 0,
            sampleType: 'regular'
        }
    ],
    'INDG Modus': [
        {
            text: 'MODUS',
            fontSize: 120,
            letterSpacing: 0,
            sampleType: 'default'
        }
    ],
    'INDG Luara': [
        {
            text: 'Luara',
            fontSize: 120,
            letterSpacing: 0,
            sampleType: 'default'
        }
    ],
    'INDG Zigrid': [
        {
            text: 'Zigrid',
            fontSize: 120,
            letterSpacing: 0,
            sampleType: 'default'
        }
    ],
    'INDG Dale': [
        {
            text: 'DALE',
            fontSize: 140,
            letterSpacing: 0,
            sampleType: 'default'
        }
    ],
    'INDG Peqat': [
        {
            text: 'Peqat',
            fontSize: 120,
            letterSpacing: 0,
            sampleType: 'default'
        }
    ],
    'INDG Heron': [
        {
            text: 'Heron',
            fontSize: 120,
            letterSpacing: 0,
            sampleType: 'default'
        }
    ],
    'INDG Naora': [
        {
            text: 'Naora',
            fontSize: 100,
            letterSpacing: 0,
            sampleType: 'default'
        }
    ],
    'INDG Sifora': [
        {
            text: 'Sifora',
            fontSize: 120,
            letterSpacing: 0,
            sampleType: 'default'
        }
    ],
    'Old English Quadrat': [
        {
            text: 'Old English',
            fontSize: 120,
            letterSpacing: 0,
            sampleType: 'default'
        }
    ]
};

/**
 * Export typeface samples as JSON and trigger download of data/typeface-samples.json.
 * Replace the file in your project with the downloaded file to update samples.
 */
async function insertTypefaceSamples() {
    const data = Object.entries(typefaceSamplesData).map(([family_name, sample_texts]) => ({
        family_name,
        sample_texts
    }));
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'typeface-samples.json';
    a.click();
    URL.revokeObjectURL(url);
    console.log('Downloaded typeface-samples.json. Save it as data/typeface-samples.json in your project to update samples.');
    return data;
}

/**
 * Get typeface samples from data/typeface-samples.json
 * @param {string} familyName - The font family name (optional, if not provided returns all)
 * @returns {Promise<Array>} Array of { family_name, sample_texts } objects
 */
async function getTypefaceSamples(familyName = null) {
    try {
        const res = await fetch('data/typeface-samples.json');
        if (!res.ok) throw new Error(res.statusText);
        let data = await res.json();
        if (!Array.isArray(data)) data = [];
        if (familyName) {
            data = data.filter(item => item.family_name === familyName);
        } else {
            data = data.sort((a, b) => (a.family_name || '').localeCompare(b.family_name || ''));
        }
        return data.map(item => ({
            ...item,
            sample_texts: typeof item.sample_texts === 'string' ? JSON.parse(item.sample_texts) : item.sample_texts
        }));
    } catch (error) {
        console.error('Error in getTypefaceSamples:', error);
        return [];
    }
}

// Export functions for use in browser console or other scripts
if (typeof window !== 'undefined') {
    window.insertTypefaceSamples = insertTypefaceSamples;
    window.getTypefaceSamples = getTypefaceSamples;
    window.typefaceSamplesData = typefaceSamplesData;
}

// If running in Node.js environment (for testing)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        typefaceSamplesData,
        insertTypefaceSamples,
        getTypefaceSamples
    };
}

