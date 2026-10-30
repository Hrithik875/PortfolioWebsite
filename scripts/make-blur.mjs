// Generates the webp portrait and tiny pre-blurred portrait used by "lite" mode.
// Usage: node scripts/make-blur.mjs
import sharp from "sharp";
import fs from "fs";
import path from "path";

const srcJpg = "public/images/about-portrait-red.jpg";
const outWebp = "public/images/about-portrait.webp";
const outTiny = "public/images/about-portrait-tiny.webp";

if (fs.existsSync(srcJpg)) {
  await sharp(srcJpg)
    .webp({ quality: 90 })
    .toFile(outWebp);
  console.log(`wrote ${outWebp}`);

  await sharp(outWebp)
    .resize({ width: 64 })
    .blur(2)
    .webp({ quality: 70 })
    .toFile(outTiny);
  console.log(`wrote ${outTiny}`);
} else {
  console.error(`Source image not found: ${srcJpg}`);
  process.exit(1);
}
