import sharp from 'sharp';
import { join } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '../src-tauri/icons');

async function generateIcons() {
  console.log('🎨 Generating icons from custom logos...\n');

  const darkJpeg = join(iconsDir, 'dark.jpeg');
  const lightJpeg = join(iconsDir, 'light.jpeg');

  // ============================================
  // APP ICONS (from dark.jpeg)
  // ============================================
  console.log('📱 Generating app icons from dark.jpeg:');

  const appSizes = [16, 32, 64, 128, 256, 512, 1024];

  for (const size of appSizes) {
    await sharp(darkJpeg)
      .resize(size, size, { fit: 'cover' })
      .ensureAlpha()  // RGBA required by Tauri
      .png()
      .toFile(join(iconsDir, `${size}x${size}.png`));
    console.log(`   ✓ ${size}x${size}.png`);
  }

  // Generate 128x128@2x (256px)
  await sharp(darkJpeg)
    .resize(256, 256, { fit: 'cover' })
    .ensureAlpha()
    .png()
    .toFile(join(iconsDir, '128x128@2x.png'));
  console.log('   ✓ 128x128@2x.png (256x256)');

  // Generate main icon.png (512px)
  await sharp(darkJpeg)
    .resize(512, 512, { fit: 'cover' })
    .ensureAlpha()
    .png()
    .toFile(join(iconsDir, 'icon.png'));
  console.log('   ✓ icon.png (512x512)');

  // ============================================
  // TRAY ICONS (from dark.jpeg - extract white icon)
  // For macOS template icons: black on transparent
  // IMPORTANT: Crop center to avoid white corners of the rounded rect
  // ============================================
  console.log('\n🔲 Generating tray icons from dark.jpeg:');

  // Get the dimensions of dark.jpeg
  const darkMeta = await sharp(darkJpeg).metadata();
  const srcSize = Math.min(darkMeta.width, darkMeta.height);

  // Crop 15% from each edge to remove the white corners and rounded rect edges
  const cropMargin = Math.floor(srcSize * 0.15);
  const cropSize = srcSize - (cropMargin * 2);

  for (const size of [22, 44]) {
    const suffix = size === 44 ? '@2x' : '';
    const filename = `tray-icon${suffix}.png`;

    // Extract center region, avoiding white corners
    const { data } = await sharp(darkJpeg)
      .extract({
        left: cropMargin,
        top: cropMargin,
        width: cropSize,
        height: cropSize
      })
      .resize(size, size, { fit: 'cover', kernel: 'lanczos3' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Create new RGBA buffer
    const pixelCount = size * size;
    const newData = Buffer.alloc(pixelCount * 4);

    // For dark.jpeg: white icon on dark background
    // We want: white pixels -> black (opaque), dark pixels -> transparent
    // Threshold: high luminance = icon, low luminance = background
    const threshold = 180; // Pixels brighter than this are the white icon

    let srcIdx = 0;
    let dstIdx = 0;
    for (let p = 0; p < pixelCount; p++) {
      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];
      const luminance = (r + g + b) / 3;
      srcIdx += 3;

      if (luminance > threshold) {
        // White/light pixel (the icon) -> opaque black
        newData[dstIdx] = 0;       // R
        newData[dstIdx + 1] = 0;   // G
        newData[dstIdx + 2] = 0;   // B
        newData[dstIdx + 3] = 255; // A - fully opaque
      } else {
        // Dark pixel (background) -> fully transparent
        newData[dstIdx] = 0;
        newData[dstIdx + 1] = 0;
        newData[dstIdx + 2] = 0;
        newData[dstIdx + 3] = 0;   // A - fully transparent
      }
      dstIdx += 4;
    }

    await sharp(newData, {
      raw: {
        width: size,
        height: size,
        channels: 4
      }
    })
      .png()
      .toFile(join(iconsDir, filename));

    console.log(`   ✓ ${filename} (${size}x${size}, from dark.jpeg center)`);
  }

  // ============================================
  // macOS .icns FILE
  // ============================================
  console.log('\n🍎 Generating macOS .icns file:');

  const iconsetDir = join(iconsDir, 'icon.iconset');

  // Clean and create iconset directory
  if (existsSync(iconsetDir)) {
    rmSync(iconsetDir, { recursive: true });
  }
  mkdirSync(iconsetDir);

  // Generate all required sizes for .icns
  const icnsMapping = [
    { size: 16, scale: 1, name: 'icon_16x16.png' },
    { size: 16, scale: 2, name: 'icon_16x16@2x.png' },
    { size: 32, scale: 1, name: 'icon_32x32.png' },
    { size: 32, scale: 2, name: 'icon_32x32@2x.png' },
    { size: 128, scale: 1, name: 'icon_128x128.png' },
    { size: 128, scale: 2, name: 'icon_128x128@2x.png' },
    { size: 256, scale: 1, name: 'icon_256x256.png' },
    { size: 256, scale: 2, name: 'icon_256x256@2x.png' },
    { size: 512, scale: 1, name: 'icon_512x512.png' },
    { size: 512, scale: 2, name: 'icon_512x512@2x.png' },
  ];

  for (const { size, scale, name } of icnsMapping) {
    const actualSize = size * scale;
    await sharp(darkJpeg)
      .resize(actualSize, actualSize, { fit: 'cover' })
      .ensureAlpha()
      .png()
      .toFile(join(iconsetDir, name));
  }
  console.log('   ✓ Created iconset with all sizes');

  // Use iconutil to create .icns
  try {
    execSync(`iconutil -c icns "${iconsetDir}" -o "${join(iconsDir, 'icon.icns')}"`, {
      stdio: 'pipe'
    });
    console.log('   ✓ icon.icns created');

    // Clean up iconset directory
    rmSync(iconsetDir, { recursive: true });
    console.log('   ✓ Cleaned up iconset directory');
  } catch (err) {
    console.log('   ⚠ Failed to create .icns (iconutil not available)');
  }

  console.log('\n✅ Done! All icons generated in src-tauri/icons/');
}

generateIcons().catch(console.error);
