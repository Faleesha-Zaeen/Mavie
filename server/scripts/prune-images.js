/**
 * Drop catalog photos whose described colour contradicts the garment.
 *
 *   npm run images:prune
 *
 * Unsplash's `color` field is the dominant colour of the whole IMAGE, usually
 * the background — so it passes a black dress photographed on a dark backdrop
 * even when the garment shown is tan. The photo's own description is a far
 * better signal for what colour the clothing actually is.
 *
 * This matters more here than in a normal catalog: MAVIE's reasoning talks
 * about garment colour out loud ("matched the lip to the dusty rose in your
 * outfit"). A photo that contradicts that makes the product look broken, so a
 * drawn rendering in the exact colour is the better answer.
 *
 * Uses no API requests.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { catalog } from '../data/catalog.js';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'catalog-images.json');
const images = JSON.parse(fs.readFileSync(OUT, 'utf8'));

const FAMILIES = {
  black: ['black'],
  white: ['white', 'ivory', 'cream', 'off-white'],
  grey: ['grey', 'gray', 'charcoal', 'stone', 'silver'],
  blue: ['blue', 'navy', 'denim', 'indigo'],
  green: ['green', 'sage', 'olive', 'emerald'],
  red: ['red', 'burgundy', 'maroon', 'wine', 'crimson'],
  pink: ['pink', 'rose', 'blush'],
  brown: ['brown', 'tan', 'camel', 'beige', 'espresso', 'chocolate', 'oat', 'ecru', 'nude', 'khaki'],
  yellow: ['yellow', 'gold', 'champagne', 'mustard'],
  purple: ['purple', 'plum', 'lavender', 'violet'],
};

const familyOf = (word = '') =>
  Object.entries(FAMILIES).find(([, words]) => words.some((w) => word.includes(w)))?.[0];

const familiesNamedIn = (text) =>
  Object.entries(FAMILIES)
    .filter(([, words]) => words.some((w) => new RegExp(`\\b${w}`, 'i').test(text)))
    .map(([family]) => family);

const kept = {};
const dropped = [];

for (const item of catalog) {
  const photo = images[item.id];
  if (!photo) continue;

  const wanted = familyOf(String(item.colors[0] || '').toLowerCase());
  const named = familiesNamedIn(photo.alt || '');

  // Keep when we can't tell (no colour named, or no family for the garment).
  // Only drop on an explicit contradiction.
  if (!wanted || !named.length || named.includes(wanted)) {
    kept[item.id] = photo;
  } else {
    dropped.push(`${item.name} (${wanted}) — photo described as ${named.join('/')}: "${(photo.alt || '').slice(0, 46)}"`);
  }
}

fs.writeFileSync(OUT, JSON.stringify(kept, null, 2));

console.log(`\n  kept:    ${Object.keys(kept).length} colour-consistent photos`);
console.log(`  dropped: ${dropped.length} contradicting the garment colour\n`);
dropped.forEach((d) => console.log(`   · ${d}`));
console.log(`\n  ${catalog.length - Object.keys(kept).length} garments use the drawn rendering, where the colour is exact.\n`);
