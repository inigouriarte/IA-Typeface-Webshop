# Data (spreadsheet-style, no database)

Content for the index page and typeface detail pages lives here as JSON. Edit via the admin panel or the files directly.

## Files

- **`index-content.json`** – Array of typeface configs for the **homepage** (id, name, displayName, linkUrl, dropdownType, weights/options/styles, fontSize, letterSpacing, etc.). One object per typeface row.

- **`typeface-detail-content.json`** – Object keyed by typeface **id** with content for each **detail page**: description, details (designer, version, formats, styles, glyphs, unicodeRanges), samples, pricing, hasOpenType, openTypeFeatures.

The build script (`npm run build`) reads these JSON files to generate the index and typeface detail pages.

## Admin panel

1. **Setup** – Copy `.env.example` to `.env`, set `SESSION_SECRET` and either `ADMIN_PASSWORD_HASH` (run `npm run hash-password -- "YourPassword"`) or Google OAuth with `ALLOWED_ADMIN_EMAILS`.

2. **Run** – `npm run dev`, then open **http://localhost:3000/admin.html**. Log in and edit **Index page** and **Typeface detail pages**, then **Save**.

3. **Apply to site** – After saving, run:
   ```bash
   npm run build
   ```
   The build reads **directly from** `index-content.json` and `typeface-detail-content.json`, so your edits are used immediately. No extra sync step needed.
