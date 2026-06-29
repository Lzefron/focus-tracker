const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const svgPath  = path.join(__dirname, '..', 'assets', 'icon.svg');
const pngPath  = path.join(__dirname, '..', 'assets', 'icon.png');
const icoPath  = path.join(__dirname, '..', 'assets', 'icon.ico');

async function main() {
  const svgBuffer = fs.readFileSync(svgPath);

  // Generate PNG sizes needed for ICO (16, 32, 48, 64, 128, 256)
  const sizes = [16, 32, 48, 64, 128, 256];

  const pngBuffers = await Promise.all(
    sizes.map((size) =>
      sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toBuffer()
    )
  );

  // Save the 256x256 PNG as well for reference
  await sharp(svgBuffer).resize(256, 256).png().toFile(pngPath);
  console.log('✓ Generated icon.png');

  // Build a minimal ICO file from the PNGs
  // ICO format: ICONDIR header + ICONDIRENTRY array + PNG data
  const numImages = pngBuffers.length;

  // ICONDIR: 6 bytes
  const iconDir = Buffer.alloc(6);
  iconDir.writeUInt16LE(0, 0);        // reserved
  iconDir.writeUInt16LE(1, 2);        // type: 1 = ICO
  iconDir.writeUInt16LE(numImages, 4); // count

  // Each ICONDIRENTRY is 16 bytes
  const entrySize = 16;
  const headerSize = 6 + numImages * entrySize;

  const entries = [];
  let offset = headerSize;

  for (let i = 0; i < numImages; i++) {
    const size = sizes[i];
    const data = pngBuffers[i];
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(size === 256 ? 0 : size, 0);   // width  (0 = 256)
    entry.writeUInt8(size === 256 ? 0 : size, 1);   // height (0 = 256)
    entry.writeUInt8(0, 2);    // color count (0 = no palette)
    entry.writeUInt8(0, 3);    // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bit count
    entry.writeUInt32LE(data.length, 8);  // size of image data
    entry.writeUInt32LE(offset, 12);      // offset of image data
    entries.push(entry);
    offset += data.length;
  }

  const icoBuffer = Buffer.concat([iconDir, ...entries, ...pngBuffers]);
  fs.writeFileSync(icoPath, icoBuffer);
  console.log('✓ Generated icon.ico');
}

main().catch((err) => {
  console.error('make-icon failed:', err);
  process.exit(1);
});
