/**
 * Import generated product images into the catalog.
 *
 *   npm run images:import -- ../generated
 *
 * Drop the images in a folder and point this at it. Files are matched to
 * garments three ways, in order of confidence:
 *
 *   1. by product id      top-101.jpg
 *   2. by list number     1.jpg, 01.png, 7.webp        (the numbered prompt list)
 *   3. by garment name    ivory-satin-blouse.jpg, "Ivory Satin Blouse.png"
 *
 * Matched files are copied into client/public/catalog/ and served by the app,
 * so the catalog works offline and nothing depends on an external host. That
 * also matters for try-on: Apparel VTO needs a reachable garment image.
 *
 * Anything unmatched is reported rather than silently skipped.
 */

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { catalog } from '../data/catalog.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT_JSON = path.join(HERE, '..', 'data', 'catalog-images.json');
const PUBLIC_DIR = path.join(HERE, '..', '..', 'client', 'public', 'catalog');

/**
 * The numbered prompt list runs in catalog order — tops 1–15, bottoms 16–27,
 * dresses 28–39, outerwear 40–47, shoes 48–55, accessories 56–60 — so file
 * "23.png" is simply the 23rd garment.
 */
const ordered = catalog;

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const source = process.argv[2];
if (!source) {
  console.error('\n  Usage: npm run images:import -- <folder>\n');
  process.exit(1);
}
const dir = path.resolve(source);
if (!fs.existsSync(dir)) {
  console.error(`\n  Folder not found: ${dir}\n`);
  process.exit(1);
}

const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
console.log(`\n  💗 MAVIE · importing catalog images\n`);
console.log(`  ${files.length} image files in ${path.basename(dir)}\n`);

fs.mkdirSync(PUBLIC_DIR, { recursive: true });

const images = {};
const used = new Set();
const unmatched = [];
let saved = 0;
const kb = (bytes) => `${Math.round(bytes / 1024)}KB`;

for (const file of files) {
  const base = path.basename(file, path.extname(file));
  const key = slug(base);

  const item =
    // 1. exact product id
    catalog.find((c) => slug(c.id) === key)
    // 2. position in the numbered prompt list
    || (/^\d+$/.test(base.replace(/^0+/, '') || base) ? ordered[parseInt(base, 10) - 1] : null)
    // 3. garment name
    || catalog.find((c) => slug(c.name) === key)
    || catalog.find((c) => key.includes(slug(c.name)) || slug(c.name).includes(key));

  if (!item || used.has(item.id)) {
    unmatched.push(file);
    continue;
  }

  // Generated images arrive huge and often landscape — 2816x1536 PNGs at 5-8MB
  // each, which is ~380MB of catalog and a page that crawls. They are also the
  // wrong shape for a 3:4 product card, and cropping to fill would cut the
  // garment in half.
  //
  // So: letterbox onto white at 3:4 (the flat lays are already on white, so the
  // seam is invisible) and encode as JPEG. Keeps the whole garment visible,
  // which is the entire point of a product shot.
  const target = `${item.id}.jpg`;
  const source = path.join(dir, file);

  const before = fs.statSync(source).size;
  const white = { r: 255, g: 255, b: 255 };

  // Trim the white canvas first. The generated flat lays sit small in a wide
  // frame — a 2816x1536 image whose garment occupies only the middle 1308x1359
  // — so resizing without trimming leaves the product tiny behind big bars.
  // Trim, fit to 3:4, then add an even margin so every card breathes the same.
  await sharp(source)
    .trim({ threshold: 12 })
    .resize(820, 1100, { fit: 'contain', background: white })
    .extend({ top: 50, bottom: 50, left: 40, right: 40, background: white })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(path.join(PUBLIC_DIR, target));

  const after = fs.statSync(path.join(PUBLIC_DIR, target)).size;

  saved += before - after;

  images[item.id] = {
    url: `/catalog/${target}`,
    alt: item.name,
    source: 'generated',
  };
  used.add(item.id);
  console.log(`  ✓ ${file.padEnd(12)} → ${item.name.padEnd(34)} ${kb(before)} → ${kb(after)}`);
}

fs.writeFileSync(OUT_JSON, JSON.stringify(images, null, 2));

const missing = catalog.filter((c) => !images[c.id]);
console.log(`\n  imported ${Object.keys(images).length}/${catalog.length} garments`);

if (unmatched.length) {
  console.log(`\n  ${unmatched.length} file(s) could not be matched:`);
  unmatched.slice(0, 12).forEach((f) => console.log(`   · ${f}`));
  console.log('   Rename these to the product id, the list number, or the garment name.');
}

if (missing.length) {
  console.log(`\n  ${missing.length} garment(s) still using the drawn rendering:`);
  missing.slice(0, 12).forEach((m) => console.log(`   · ${m.id.padEnd(12)} ${m.name}`));
}

console.log('\n  Restart the server to pick these up.\n');
