import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '../src-tauri/icons');

// Simple tray icon SVG - voice waves with translation dot
// Template icon for macOS (black on transparent)
const trayIconSvg = `
<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Sound waves -->
  <path d="M6 9C6 9 7.5 7.5 9.5 7.5S13 9 13 9" stroke="black" stroke-width="2" stroke-linecap="round"/>
  <path d="M4 6.5C4 6.5 6.5 4 9.5 4S15 6.5 15 6.5" stroke="black" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
  <!-- Flow line -->
  <path d="M9.5 11V16" stroke="black" stroke-width="2" stroke-linecap="round"/>
  <path d="M9.5 16L14 14" stroke="black" stroke-width="2" stroke-linecap="round"/>
  <!-- Output dot -->
  <circle cx="15.5" cy="14" r="2.5" fill="black"/>
</svg>
`;

// App icon SVG - more detailed for dock/app icon
const appIconSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="512" height="512" rx="115" fill="#292524"/>
  <!-- Sound waves -->
  <path d="M140 210C140 210 175 170 230 170S320 210 320 210" stroke="#F5F5F4" stroke-width="24" stroke-linecap="round"/>
  <path d="M100 160C100 160 160 100 230 100S360 160 360 160" stroke="#F5F5F4" stroke-width="24" stroke-linecap="round" opacity="0.5"/>
  <!-- Flow line -->
  <path d="M230 260V370" stroke="#F5F5F4" stroke-width="24" stroke-linecap="round"/>
  <path d="M230 370L340 320" stroke="#F5F5F4" stroke-width="24" stroke-linecap="round"/>
  <!-- Output dot -->
  <circle cx="370" cy="320" r="40" fill="#A78BFA"/>
</svg>
`;

async function generateIcons() {
  console.log('Generating icons...');

  // Generate tray icon (22x22 for macOS menu bar)
  const trayBuffer = Buffer.from(trayIconSvg);
  await sharp(trayBuffer)
    .resize(22, 22)
    .png()
    .toFile(join(iconsDir, 'tray-icon.png'));
  console.log('✓ tray-icon.png (22x22)');

  // Generate tray icon @2x (44x44)
  await sharp(trayBuffer)
    .resize(44, 44)
    .png()
    .toFile(join(iconsDir, 'tray-icon@2x.png'));
  console.log('✓ tray-icon@2x.png (44x44)');

  // Generate app icons
  const sizes = [32, 128, 256, 512];
  for (const size of sizes) {
    const appBuffer = Buffer.from(appIconSvg(size));
    await sharp(appBuffer)
      .resize(size, size)
      .png()
      .toFile(join(iconsDir, `${size}x${size}.png`));
    console.log(`✓ ${size}x${size}.png`);
  }

  // Generate 128x128@2x (256px)
  const app256Buffer = Buffer.from(appIconSvg(256));
  await sharp(app256Buffer)
    .resize(256, 256)
    .png()
    .toFile(join(iconsDir, '128x128@2x.png'));
  console.log('✓ 128x128@2x.png (256x256)');

  // Generate icon.png (512px main icon)
  const app512Buffer = Buffer.from(appIconSvg(512));
  await sharp(app512Buffer)
    .resize(512, 512)
    .png()
    .toFile(join(iconsDir, 'icon.png'));
  console.log('✓ icon.png (512x512)');

  console.log('\nDone! Icons generated in src-tauri/icons/');
}

generateIcons().catch(console.error);
