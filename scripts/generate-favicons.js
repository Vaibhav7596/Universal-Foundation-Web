/**
 * generate-favicons.js
 * One-time script to generate favicon files from images/logo.png
 * Run with: node scripts/generate-favicons.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = path.join(__dirname, '..', 'images', 'logo.jpeg');
const OUT = path.join(__dirname, '..');

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-192x192.png', size: 192 },
];

(async () => {
  for (const { name, size } of sizes) {
    const dest = path.join(OUT, name);
    await sharp(SRC)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(dest);
    console.log(`✅ Created ${name} (${size}x${size})`);
  }

  // Also create favicon.ico as a 32x32 PNG renamed (browsers accept PNG as .ico)
  await sharp(SRC)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(OUT, 'favicon.ico'));
  console.log('✅ Created favicon.ico (32x32 PNG)');

  console.log('\nAll favicons generated in project root!');
})();
