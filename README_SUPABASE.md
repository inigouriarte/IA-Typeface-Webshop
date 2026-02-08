# Supabase (replaced by local JSON)

**This project no longer uses Supabase.** Product and typeface sample data are stored in **`data/products.json`** and **`data/typeface-samples.json`**. See **`data/README.md`** for the spreadsheet-style workflow.

The section below is kept for reference only.

## Initial Setup

1. **Get your Supabase credentials:**
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy your Project URL and anon/public key

2. **Configure Supabase:**
   - Open `supabase-config.js`
   - Replace `YOUR_SUPABASE_URL` with your project URL
   - Replace `YOUR_SUPABASE_ANON_KEY` with your anon key

   Example:
   ```javascript
   const SUPABASE_URL = 'https://abcdefghijklmnop.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
   ```

## Available Functions

The following functions are available in `script.js` for interacting with your products database:

### `fetchAllProducts()`
Fetches all active products from the database.

```javascript
const products = await fetchAllProducts();
console.log(products);
```

### `fetchProductsByFamily(familyName)`
Fetches all products for a specific font family.

```javascript
const alvicaProducts = await fetchProductsByFamily('INDG Alvica');
console.log(alvicaProducts);
```

### `fetchProductById(productId)`
Fetches a single product by its UUID.

```javascript
const product = await fetchProductById('123e4567-e89b-12d3-a456-426614174000');
console.log(product);
```

### `findProductBySpecs(familyName, fontWeight, fontStyle, fontStretch)`
Finds a product matching specific font specifications.

```javascript
const product = await findProductBySpecs('INDG Alvica', 400, 'normal', 'normal');
console.log(product);
```

### `getAllFontFamilies()`
Gets a list of all unique font family names.

```javascript
const families = await getAllFontFamilies();
console.log(families); // ['INDG Actio', 'INDG Alvica', ...]
```

## Database Schema

The `products` table includes the following fields:

- `id` (UUID) - Primary key
- `family_name` (TEXT) - Font family name
- `style_name` (TEXT) - Style/variant name
- `display_name` (TEXT) - Full display name
- `font_weight` (INTEGER) - CSS font-weight value
- `font_style` (TEXT) - Font style (normal, italic, oblique)
- `font_stretch` (TEXT) - Font stretch (normal, expanded, etc.)
- `price` (DECIMAL) - Product price
- `currency` (TEXT) - Currency code
- `glyph_count` (INTEGER) - Number of glyphs
- `unicode_ranges` (TEXT[]) - Array of Unicode ranges
- `language_support` (TEXT[]) - Supported languages
- `file_path_woff2` (TEXT) - Path to .woff2 file
- `file_path_woff` (TEXT) - Path to .woff file
- `is_active` (BOOLEAN) - Whether product is available
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

## Usage Examples

### Display product information when "Much more" is clicked

```javascript
document.querySelectorAll('.more-btn').forEach(button => {
    button.addEventListener('click', async function() {
        const section = this.closest('.typeface-section');
        const fontName = section.querySelector('.typeface-name').textContent;
        
        // Fetch products for this family
        const products = await fetchProductsByFamily(fontName);
        
        // Display product info (e.g., in a modal)
        console.log(`Products for ${fontName}:`, products);
    });
});
```

### Get product price for a specific font variant

```javascript
const product = await findProductBySpecs('INDG Alvica', 700, 'normal', 'normal');
if (product) {
    console.log(`Price: ${product.price} ${product.currency}`);
}
```

## Security Note

The `supabase-config.js` file contains your anon key, which is safe to expose in client-side code. However, make sure you have Row Level Security (RLS) policies set up correctly in Supabase to control data access.

