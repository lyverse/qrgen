# QRgen

A minimal, monochrome-in-black QR code generator. Renders fully in the browser
with a custom canvas and SVG renderer, so nothing is ever uploaded.

## Features

- Content types: Text, Link, Wi-Fi, Email, Phone, SMS, vCard
- Error correction L / M / Q / H
- Dot styles: square, rounded, dots, diamond
- Eye styles: square, rounded, circle (+ optional eye color)
- Foreground / background colors, transparent background
- Linear / radial gradient
- Optional centered logo with size and clear padding
- Export to PNG, JPEG and SVG; copy PNG to clipboard
- Presets and shareable links (config in the URL hash)
- Undo / redo, About modal, responsive mobile layout

## Development

```bash
npm install
npm run dev
```

Dev server: http://localhost:5173/qrgen/

## Build

```bash
npm run build
```

Outputs to `dist/`.

## Deploy

Hosted on Cloudflare Pages.

- Build command: `npm run build`
- Build output directory: `dist`
- `base` is `/` on Cloudflare and `/qrgen/` locally.

All processing happens client-side.
