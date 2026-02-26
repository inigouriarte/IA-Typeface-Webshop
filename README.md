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

## Data

Index and typeface detail content are stored in **`data/index-content.json`** and **`data/typeface-detail-content.json`**. Edit them in the admin panel (see **`data/README.md`**) or run `npm run sync-admin` after editing to update the site.

## Files

- `index.html` - Main HTML structure
- `styles.css` - Styling and layout
- `script.js` - Interactive functionality
- `data/index-content.json` - Homepage typeface list (edit via admin)
- `data/typeface-detail-content.json` - Detail page content per typeface (edit via admin)

## Usage

Simply open `index.html` in a web browser to view the website.

## Customization

To add custom fonts:
1. Add the font files to your project
2. Include `@font-face` declarations in `styles.css`
3. Update the `.typeface-sample` elements to use your custom font families

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge).

