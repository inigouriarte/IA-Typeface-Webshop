// Script to insert typeface sample texts into Supabase
// This script extracts all sample texts from the HTML files and inserts them into Supabase

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
 * Insert typeface samples into Supabase
 * This function inserts all sample texts for each typeface family into the database
 */
async function insertTypefaceSamples() {
    console.log('Starting to insert typeface samples into Supabase...');
    
    // Check if supabase client is available
    if (typeof supabase === 'undefined') {
        console.error('Supabase client is not available. Make sure supabase-config.js is loaded.');
        return;
    }

    const results = [];
    
    for (const [familyName, samples] of Object.entries(typefaceSamplesData)) {
        try {
            // Convert samples array to JSON string for storage
            const samplesJson = JSON.stringify(samples);
            
            // Prepare the data for insertion
            const insertData = {
                family_name: familyName,
                sample_texts: samplesJson,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Check if record already exists
            const { data: existing, error: checkError } = await supabase
                .from('typeface_samples')
                .select('id')
                .eq('family_name', familyName)
                .single();

            if (existing) {
                // Update existing record
                const { data, error } = await supabase
                    .from('typeface_samples')
                    .update({
                        sample_texts: samplesJson,
                        updated_at: new Date().toISOString()
                    })
                    .eq('family_name', familyName)
                    .select();

                if (error) {
                    console.error(`Error updating samples for ${familyName}:`, error);
                    results.push({ familyName, status: 'error', error: error.message });
                } else {
                    console.log(`✓ Updated samples for ${familyName}`);
                    results.push({ familyName, status: 'updated', data });
                }
            } else {
                // Insert new record
                const { data, error } = await supabase
                    .from('typeface_samples')
                    .insert(insertData)
                    .select();

                if (error) {
                    console.error(`Error inserting samples for ${familyName}:`, error);
                    results.push({ familyName, status: 'error', error: error.message });
                } else {
                    console.log(`✓ Inserted samples for ${familyName}`);
                    results.push({ familyName, status: 'inserted', data });
                }
            }
        } catch (error) {
            console.error(`Error processing ${familyName}:`, error);
            results.push({ familyName, status: 'error', error: error.message });
        }
    }

    console.log('\n=== Insertion Summary ===');
    results.forEach(result => {
        console.log(`${result.familyName}: ${result.status}`);
        if (result.error) {
            console.log(`  Error: ${result.error}`);
        }
    });

    return results;
}

/**
 * Get typeface samples from Supabase
 * @param {string} familyName - The font family name (optional, if not provided returns all)
 * @returns {Promise<Array>} Array of sample objects
 */
async function getTypefaceSamples(familyName = null) {
    try {
        let query = supabase
            .from('typeface_samples')
            .select('*');

        if (familyName) {
            query = query.eq('family_name', familyName);
        }

        const { data, error } = await query.order('family_name', { ascending: true });

        if (error) {
            console.error('Error fetching typeface samples:', error);
            return [];
        }

        // Parse the JSON strings back to objects
        if (data) {
            return data.map(item => ({
                ...item,
                sample_texts: JSON.parse(item.sample_texts)
            }));
        }

        return [];
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

