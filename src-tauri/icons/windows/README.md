# Windows Icons

Place `icon.ico` here for Windows builds.

## How to create icon.ico

Use the shared PNG files to create an ICO file:

1. Use an online converter like https://convertio.co/png-ico/
2. Or use ImageMagick:
   ```bash
   convert ../shared/256x256.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
   ```
3. Or use a tool like GIMP to export as ICO

The ICO file should contain multiple sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
