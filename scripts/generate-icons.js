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
      .ensureAlpha()
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
  // TRAY ICONS (from light.jpeg)
  // For macOS template icons: black on transparent
  // light.jpeg has black icon on white background - easier to process
  // ============================================
  console.log('\n🔲 Generating tray icons from light.jpeg:');

  // Get the metadata
  const lightMeta = await sharp(lightJpeg).metadata();
  const srcSize = Math.min(lightMeta.width, lightMeta.height);

  // Find the bounding box of the icon (non-white area)
  // First, analyze the image to find where the icon starts
  const { data: analysisData, info } = await sharp(lightJpeg)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Find the bounding box of dark pixels (the icon)
  let minX = info.width, maxX = 0, minY = info.height, maxY = 0;
  const threshold = 240; // Pixels darker than this are icon

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = y * info.width + x;
      if (analysisData[idx] < threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Add some padding around the icon
  const padding = Math.floor((maxX - minX) * 0.1);
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(info.width - 1, maxX + padding);
  maxY = Math.min(info.height - 1, maxY + padding);

  const cropWidth = maxX - minX;
  const cropHeight = maxY - minY;
  const cropSize2 = Math.max(cropWidth, cropHeight);

  // Center the crop to make it square
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const cropLeft = Math.max(0, Math.floor(centerX - cropSize2 / 2));
  const cropTop = Math.max(0, Math.floor(centerY - cropSize2 / 2));

  console.log(`   Icon bounding box: ${minX},${minY} to ${maxX},${maxY}`);
  console.log(`   Cropping from: ${cropLeft},${cropTop} size: ${cropSize2}x${cropSize2}`);

  for (const size of [22, 44]) {
    const suffix = size === 44 ? '@2x' : '';
    const filename = `tray-icon${suffix}.png`;

    // Extract and resize the icon area
    const { data } = await sharp(lightJpeg)
      .extract({
        left: cropLeft,
        top: cropTop,
        width: Math.min(cropSize2, info.width - cropLeft),
        height: Math.min(cropSize2, info.height - cropTop)
      })
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255 },
        kernel: 'lanczos3'
      })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Create new RGBA buffer
    const pixelCount = size * size;
    const newData = Buffer.alloc(pixelCount * 4);

    // Convert: white/light pixels -> transparent, dark pixels -> black with varying alpha
    let srcIdx = 0;
    let dstIdx = 0;
    for (let p = 0; p < pixelCount; p++) {
      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];
      const luminance = (r + g + b) / 3;
      srcIdx += 3;

      // Use luminance to calculate alpha (inverse relationship)
      // Darker pixels = more opaque, lighter pixels = more transparent
      // This preserves anti-aliasing!
      const alpha = Math.max(0, 255 - luminance);

      newData[dstIdx] = 0;       // R (always black)
      newData[dstIdx + 1] = 0;   // G
      newData[dstIdx + 2] = 0;   // B
      newData[dstIdx + 3] = alpha; // A - based on darkness
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

    console.log(`   ✓ ${filename} (${size}x${size})`);
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
