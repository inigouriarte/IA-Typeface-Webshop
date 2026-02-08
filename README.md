# Indigo Alphabets® Typeface Webshop

A clean, minimalist typeface showcase website inspired by the Indigo Alphabets design.

## Features

- **Clean, Minimalist Design**: White background with blue accents
- **Interactive Typeface Controls**: 
  - Font size slider (10px - 300px)
  - Letter spacing slider (-50% to +50%)
  - Font weight selector (where applicable)
- **11 Typeface Showcases**: Displaying various typefaces with interactive controls
- **Responsive Design**: Works on desktop and mobile devices
- **Smooth Scrolling**: Navigation with smooth scroll behavior

## Data (products & typeface samples)

Product and typeface sample data are stored as JSON in **`data/`** (no database or Supabase). See **`data/README.md`** for editing with a spreadsheet and export workflow.

## Files

- `index.html` - Main HTML structure
- `styles.css` - Styling and layout
- `script.js` - Interactive functionality
- `data/products.json` - Font products (edit or export from a spreadsheet)
- `data/typeface-samples.json` - Typeface sample texts per family

## Usage

Simply open `index.html` in a web browser to view the website.

## Customization

To add custom fonts:
1. Add the font files to your project
2. Include `@font-face` declarations in `styles.css`
3. Update the `.typeface-sample` elements to use your custom font families

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge).

