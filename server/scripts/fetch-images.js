/**
 * Pull real garment photography from Unsplash for the catalog.
 *
 *   npm run images:fetch
 *
 * Rate limit on a demo Unsplash app is 50 requests/hour, and the catalog has 60
 * items — so this does NOT search once per garment. It pulls a candidate pool
 * per category (about 18 requests total), then assigns each garment the unused
 * photo whose dominant colour is closest to that garment's catalog colour.
 * Colour is what makes a look read as coordinated, so matching on it keeps the
 * photography consistent with the palette the engine reasons about.
 *
 * Unsplash's API terms require crediting the photographer and pinging the
 * download endpoint when a photo is used. Both are handled here.
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { catalog } from '../data/catalog.js';

const KEY = process.env.UNSPLASH_ACCESS_KEY;
if (!KEY) {
  console.error('\n  Set UNSPLASH_ACCESS_KEY in server/.env first.\n');
  process.exit(1);
}

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'catalog-images.json');

/* Queries chosen to return clean studio/editorial garment shots. */
const QUERIES = {
  top: ['womens silk blouse', 'womens linen shirt', 'womens knit sweater', 'white blouse woman fashion', 'womens top clothing rack'],
  bottom: ['womens tailored trousers', 'wide leg trousers woman', 'womens jeans denim fashion', 'midi skirt woman', 'womens pants fashion'],
  dress: ['womens midi dress', 'slip dress woman', 'wrap dress woman', 'elegant dress woman fashion', 'summer dress woman'],
  outerwear: ['womens wool coat', 'womens blazer fashion', 'trench coat woman', 'womens cardigan'],
  shoes: ['womens heels shoes', 'leather flats shoes', 'white sneakers shoes', 'ankle boots womens', 'sandals womens shoes'],
  accessory: ['gold earrings jewelry', 'leather handbag purse', 'silk scarf accessory', 'gold necklace jewelry'],
};

/**
 * Relevance keywords per category. A photo must plausibly SHOW the garment —
 * colour proximity alone paired a men's flat-lay with an ivory blouse and a man
 * in a hallway with women's jeans, which is worse than drawing it ourselves.
 */
const MUST_SHOW = {
  top: ['shirt', 'blouse', 'top', 'sweater', 'tee', 'knit', 'cardigan', 'camisole'],
  bottom: ['trouser', 'pant', 'jean', 'skirt', 'denim', 'slack'],
  dress: ['dress', 'gown', 'frock'],
  outerwear: ['coat', 'blazer', 'jacket', 'cardigan', 'trench'],
  shoes: ['shoe', 'heel', 'sneaker', 'boot', 'sandal', 'flat', 'loafer', 'footwear'],
  accessory: ['bag', 'earring', 'necklace', 'belt', 'scarf', 'clutch', 'jewel', 'purse', 'handbag', 'bracelet'],
};

/** Wrong-subject markers for a womenswear catalog. */
const DISQUALIFY = ['man ', 'men', 'male', 'boy', 'beard', 'suit and tie', 'groom'];

function relevance(photo, category) {
  const alt = (photo.alt || '').toLowerCase();
  if (!alt) return 0;
  if (DISQUALIFY.some((w) => alt.includes(w))) return 0;
  const hits = (MUST_SHOW[category] || []).filter((k) => alt.includes(k)).length;
  if (!hits) return 0;
  let score = hits * 10;
  if (/woman|women|female|she|her/.test(alt)) score += 4;
  if (/studio|flat lay|white background|minimal/.test(alt)) score += 3;
  return score;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let rateLimited = false;

async function search(query) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}`
    + '&per_page=30&orientation=portrait&content_filter=high';
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${KEY}` } });
  if (!res.ok) {
    // Unsplash demo apps allow 50 requests/hour. Hitting it mid-run means the
    // pools are incomplete, and matching against them would silently produce a
    // worse catalog than the one already on disk.
    if (res.status === 403) rateLimited = true;
    console.warn(`  ! "${query}" → HTTP ${res.status}${res.status === 403 ? ' (rate limit)' : ''}`);
    return [];
  }
  const data = await res.json();
  return (data.results || []).map((p) => ({
    id: p.id,
    color: p.color,
    raw: p.urls.raw,
    alt: p.alt_description || '',
    photographer: p.user.name,
    photographer_url: p.user.links.html,
    download_location: p.links.download_location,
  }));
}

/* Perceptual-ish distance in RGB. Good enough to keep a rose dress rose. */
const rgb = (hex) => {
  const h = (hex || '#888888').replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) || 0);
};
const distance = (a, b) => {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  return Math.sqrt(2 * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + 3 * (b1 - b2) ** 2);
};

console.log('\n  💗 MAVIE · fetching catalog photography\n');

/**
 * Incremental by design.
 *
 * The free Unsplash tier allows 50 requests/hour and the catalog needs more
 * than one window's worth. So this loads whatever has already been matched,
 * works only on what is still missing, and merges. Re-run it as many times as
 * you like — progress accumulates and a throttled run never loses ground.
 */
const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const missing = catalog.filter((i) => !existing[i.id]);

console.log(`  already matched: ${Object.keys(existing).length}/${catalog.length}`);
if (!missing.length) {
  console.log('\n  Nothing left to fetch.\n');
  process.exit(0);
}
console.log(`  still needed:    ${missing.length}\n`);

// Only search categories that still have unmatched garments.
const needed = [...new Set(missing.map((i) => i.category))];
const pools = {};
let requests = 0;

for (const category of needed) {
  pools[category] = [];
  for (const q of QUERIES[category] || []) {
    if (rateLimited) break;
    const found = await search(q);
    requests++;
    pools[category].push(...found);
    await sleep(250);
  }
  const seen = new Set();
  pools[category] = pools[category].filter((p) => !seen.has(p.id) && seen.add(p.id));
  console.log(`  ${category.padEnd(10)} ${pools[category].length} candidates`);
  if (rateLimited) break;
}

console.log(`\n  ${requests} API requests used\n`);

const totalCandidates = Object.values(pools).reduce((n, p) => n + p.length, 0);
if (!totalCandidates) {
  console.error('\x1b[31m  No candidates fetched — nothing changed.\x1b[0m');
  console.error('  Unsplash allows 50 requests/hour on a demo app. Wait for the window');
  console.error('  to reset and run this again; matched photos are kept between runs.\n');
  process.exit(1);
}

/* Assign each still-missing garment its best photo. */
const images = { ...existing };
const used = new Set(Object.values(existing).map((v) => v.photo_id).filter(Boolean));
let matched = 0;
let skipped = 0;

for (const item of missing) {
  // Relevance first, colour second. A photo that doesn't show the right kind of
  // garment is rejected outright — the drawn studio rendering is better than a
  // confidently wrong photograph.
  const pool = (pools[item.category] || [])
    .filter((p) => !used.has(p.id))
    .map((p) => ({ p, rel: relevance(p, item.category) }))
    .filter((c) => c.rel > 0)
    .sort((a, b) => (b.rel - a.rel) || (distance(item.hex, a.p.color) - distance(item.hex, b.p.color)));

  // Among the genuinely relevant photos, take the closest colour match.
  const shortlist = pool.filter((c) => c.rel >= pool[0]?.rel - 4).slice(0, 12);
  const chosen = shortlist.sort((a, b) => distance(item.hex, a.p.color) - distance(item.hex, b.p.color))[0];

  if (!chosen) {
    skipped++;
    console.warn(`  · ${item.name} — no relevant photo, keeping drawn rendering`);
    continue;
  }

  const best = chosen.p;
  used.add(best.id);
  matched++;

  images[item.id] = {
    photo_id: best.id,
    // Fixed 3:4 crop so every card in a grid lines up exactly.
    url: `${best.raw}&w=900&h=1200&fit=crop&crop=entropy&q=80&fm=jpg`,
    color: best.color,
    alt: best.alt || item.name,
    photographer: best.photographer,
    photographer_url: best.photographer_url,
    source: 'Unsplash',
  };

  // Required by the Unsplash API terms whenever a photo is actually used.
  fetch(best.download_location, { headers: { Authorization: `Client-ID ${KEY}` } }).catch(() => {});
}

fs.writeFileSync(OUT, JSON.stringify(images, null, 2));

const total = Object.keys(images).length;
console.log(`  matched this run: ${matched}   (${skipped} had no relevant photo)`);
console.log(`  total photographed: ${total}/${catalog.length}`);
console.log(`  written to ${path.relative(process.cwd(), OUT)}`);

if (rateLimited) {
  console.log('\n\x1b[33m  Stopped early on the hourly rate limit — progress above is saved.');
  console.log('  Run this again after the window resets to continue.\x1b[0m');
} else if (total < catalog.length) {
  console.log(`\n  ${catalog.length - total} garments keep the drawn studio rendering.`);
}
console.log('');
