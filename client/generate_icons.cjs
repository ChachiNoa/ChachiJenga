/**
 * generate_icons.js — Generates PWA icons at multiple resolutions from a 512px source.
 * Uses the canvas npm package (or just copies the 512 for now since we don't have sharp/canvas).
 * 
 * For a production pipeline, use `sharp` or an online tool.
 * For now, we just copy the 512px icon to all sizes as a placeholder.
 */
const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, 'public', 'icons', 'icon-512.png');
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of SIZES) {
  const dest = path.join(__dirname, 'public', 'icons', `icon-${size}.png`);
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(SOURCE, dest);
    console.log(`Created icon-${size}.png (placeholder copy)`);
  } else {
    console.log(`icon-${size}.png already exists, skipping`);
  }
}

console.log('Done! For production, resize these with sharp or an image tool.');
