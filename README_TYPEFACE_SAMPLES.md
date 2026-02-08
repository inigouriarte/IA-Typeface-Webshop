# Typeface Samples Database Setup

This document explains how to add typeface sampling texts to your Supabase database.

## Overview

The typeface samples are stored in a Supabase table with one row per typeface family. Each row contains a JSON array of sample texts, along with their default font sizes and letter spacing (tracking) values.

## Database Schema

### Table: `typeface_samples`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `family_name` | TEXT | Typeface family name (unique) |
| `sample_texts` | TEXT | JSON array of sample text objects |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Sample Text Object Structure

Each sample text object in the `sample_texts` JSON array has the following structure:

```json
{
    "text": "Sample text content",
    "fontSize": 120,
    "letterSpacing": 0,
    "sampleType": "default"
}
```

- `text`: The sample text content
- `fontSize`: Default font size in pixels
- `letterSpacing`: Default letter spacing (tracking) in pixels
- `sampleType`: Identifier for the sample type (e.g., "default", "regular", "bold", "cyrillic", "greek", etc.)

## Setup Instructions

### Step 1: Create the Database Table

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `TYPEFACE_SAMPLES_SCHEMA.sql`
4. Run the SQL to create the table

### Step 2: Insert the Sample Data

**Option A: Using the HTML Interface (Recommended)**

1. Make sure `supabase-config.js` is properly configured with your Supabase credentials
2. Open `insert-samples.html` in your browser
3. Click the "Insert/Update Typeface Samples" button
4. Check the output area for confirmation

**Option B: Using the Browser Console**

1. Open your website in a browser
2. Open the browser console (F12)
3. Make sure the page has loaded `supabase-config.js` and `insert-typeface-samples.js`
4. Run: `await insertTypefaceSamples()`

### Step 3: Verify the Data

You can verify the data was inserted correctly by:

1. Using the HTML interface: Click "View Existing Samples"
2. In Supabase dashboard: Go to Table Editor and view the `typeface_samples` table
3. In browser console: Run `await getTypefaceSamples()`

## Data Structure

The script inserts sample texts for the following typeface families:

- **INDG Alvica**: 7 samples (default, semibold, regular, bold, bold-de, greek, cyrillic)
- **INDG Actio**: 1 sample
- **INDG Modus**: 1 sample
- **INDG Luara**: 1 sample
- **INDG Zigrid**: 1 sample
- **INDG Dale**: 1 sample
- **INDG Peqat**: 1 sample
- **INDG Heron**: 1 sample
- **INDG Naora**: 1 sample
- **INDG Sifora**: 1 sample
- **Old English Quadrat**: 1 sample

## Usage in Your Application

To retrieve typeface samples in your application:

```javascript
// Get all samples
const allSamples = await getTypefaceSamples();

// Get samples for a specific family
const alvicaSamples = await getTypefaceSamples('INDG Alvica');

// Access the sample texts array
alvicaSamples[0].sample_texts.forEach(sample => {
    console.log(sample.text);
    console.log(`Size: ${sample.fontSize}px`);
    console.log(`Tracking: ${sample.letterSpacing}px`);
});
```

## Notes

- The script uses **upsert** logic: if a family already exists, it will update the record; otherwise, it will insert a new one
- Sample texts are stored as a JSON string in the TEXT column. If you prefer, you can modify the schema to use JSONB for better querying capabilities
- All font sizes and letter spacing values are stored in pixels (px)
- The `sampleType` field helps identify different types of samples (e.g., language variants, style variants)

## Troubleshooting

### Table doesn't exist error
- Make sure you've run the SQL schema file to create the table
- Check that the table name is exactly `typeface_samples`

### Permission errors
- Check your Row Level Security (RLS) policies in Supabase
- You may need to adjust the policies or use a service role key for inserts

### Script not loading
- Ensure `supabase-config.js` is loaded before `insert-typeface-samples.js`
- Check browser console for any JavaScript errors
- Verify that the Supabase client library is loaded

