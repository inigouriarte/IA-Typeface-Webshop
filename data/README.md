# Data (spreadsheet-style, no database)

Product and typeface sample data live here as JSON. No Supabase or other backend—edit the files or export from a spreadsheet.

## Files

- **`products.json`** – Font products (one object per row).  
  Columns: `id`, `family_name`, `style_name`, `display_name`, `font_weight`, `font_style`, `font_stretch`, `price`, `currency`, `glyph_count`, `unicode_ranges`, `language_support`, `file_path_woff2`, `file_path_woff`, `is_active`.  
  The site uses: `fetchAllProducts()`, `fetchProductsByFamily()`, `fetchProductById()`, `findProductBySpecs()`, `getAllFontFamilies()` in `script.js`.

- **`typeface-samples.json`** – Sample texts per typeface family.  
  Array of `{ "family_name": "...", "sample_texts": [ { "text", "fontSize", "letterSpacing", "sampleType" }, ... ] }`.  
  Used by `getTypefaceSamples()` (e.g. on `insert-samples.html`).  
  To refresh from the in-app data: open `insert-samples.html` → “Export typeface-samples.json” → save the download as `data/typeface-samples.json`.

## Workflow with a spreadsheet

1. **Edit in Excel/Google Sheets**  
   One sheet for products (columns = product fields), one for typeface samples (e.g. family_name + sample_texts as JSON or separate columns).

2. **Export to JSON**  
   - **Products:** Export the sheet to CSV, then convert to JSON (e.g. [csv2json](https://www.convertcsv.com/csv-to-json.htm)), or maintain `products.json` by hand.  
   - **Samples:** Use “Export typeface-samples.json” on `insert-samples.html` and save as `data/typeface-samples.json`, or edit `typeface-samples.json` directly.

3. **Commit**  
   Commit updated `data/*.json` with the rest of the site. No server or database to pay for.

## Example product row (products.json)

```json
{
  "id": "alvica-regular-001",
  "family_name": "INDG Alvica",
  "style_name": "Regular",
  "display_name": "INDG Alvica Regular",
  "font_weight": 400,
  "font_style": "normal",
  "font_stretch": "normal",
  "price": 17,
  "currency": "EUR",
  "glyph_count": 794,
  "unicode_ranges": ["Basic Latin", "Latin 1-Supplement"],
  "language_support": ["Latin", "Greek", "Cyrillic"],
  "file_path_woff2": "fonts/Alvica/INDGAlvica-Regular.woff2",
  "file_path_woff": "fonts/Alvica/INDGAlvica-Regular.woff",
  "is_active": true
}
```
