# Font Files Setup

## Where to Place Font Files

Create a `fonts` folder in the root of your project directory:
```
typeface-webshop/
├── fonts/
│   ├── INDGAlvica-Regular.woff2
│   ├── INDGAlvica-Regular.woff
│   ├── INDGAlvica-Light.woff2
│   ├── INDGAlvica-Light.woff
│   ├── INDGAlvica-Bold.woff2
│   ├── INDGAlvica-Bold.woff
│   ├── DMMono-Regular.woff2
│   ├── DMMono-Regular.woff
│   ├── DMMono-Medium.woff2
│   └── DMMono-Medium.woff
├── index.html
├── styles.css
└── script.js
```

## Required Font Files

### INDG Alvica
- `INDGAlvica-Regular.woff2` (or .woff)
- `INDGAlvica-Light.woff2` (or .woff) - optional
- `INDGAlvica-Bold.woff2` (or .woff) - optional

### DM Mono
- `DMMono-Regular.woff2` (or .woff)
- `DMMono-Medium.woff2` (or .woff) - optional

## Font Format Support

The CSS includes both `.woff2` (preferred) and `.woff` formats for better browser compatibility. If you only have one format, you can remove the other from the `@font-face` declarations in `styles.css`.

## Alternative: Using System Fonts

If you don't have the font files yet, the CSS will fall back to system fonts. The fonts will be applied once you add the font files to the `fonts/` folder.

