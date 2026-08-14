/**
 * "I FOUND THIS ONLINE"
 *
 * Turns a screenshot of a product into the same structured shape as a catalog
 * item, so a garment MAVIE has never seen can flow through the exact same
 * decision engine as one it curated.
 *
 * The model reads attributes off the image. It does not decide anything, and
 * it does not get to invent a price — if no price is visible we say so rather
 * than guessing, because the budget maths depends on it.
 */

import { askJSON } from './llm.js';

const SYSTEM = `You are MAVIE's product vision engine. Look at this screenshot of a
clothing or beauty product and extract its attributes. Return ONLY JSON:
{
  "name": "<short product name you can see or infer, e.g. 'Burgundy Satin Slip Dress'>",
  "category": "top|bottom|dress|outerwear|shoes|accessory",
  "colors": ["<plain colour words>"],
  "hex": "<dominant garment colour as #RRGGBB>",
  "style_tags": ["minimal","feminine","bold","elegant","casual","romantic","structured","relaxed"],
  "occasion_tags": ["interview","office","date","dinner","party","wedding","college","brunch","travel","casual"],
  "fit": "fitted|regular|relaxed|oversized|wide|straight|a-line|wrap",
  "season": "all|summer|winter",
  "price": <number if a price is clearly visible in the image, else null>,
  "currency": "<currency if visible, else null>",
  "versatility": <0-100, how many different contexts this piece realistically works in>,
  "maintenance": <0-100, care burden: delicate fabric, dry-clean, ironing>,
  "confidence": <0-1, how sure you are about this reading>,
  "notes": "<one short sentence on what you can see>"
}
Pick 2-4 style_tags and 2-4 occasion_tags. Be honest about versatility: an
occasion-specific piece like a sequined gown should score low, a plain black
top should score high. Never invent a price that is not visible.`;

export async function analyseProductImage({ imageBase64, statedPrice = null }) {
  const ai = await askJSON({
    system: SYSTEM,
    user: 'Extract this product\'s attributes.',
    image: imageBase64,
    maxTokens: 2500,
  });

  if (!ai || !ai.category) {
    return { ...fallbackProduct(statedPrice), source: 'fallback' };
  }

  // The user's stated price always wins over anything read off the image.
  const price = statedPrice ?? (typeof ai.price === 'number' ? ai.price : null);

  return {
    id: `found-${Date.now()}`,
    name: str(ai.name, 'This piece'),
    category: category(ai.category),
    subcategory: category(ai.category),
    body_area: bodyArea(category(ai.category)),
    price: price ?? 0,
    price_known: price != null,
    currency: 'USD',
    hex: hex(ai.hex),
    colors: arr(ai.colors, ['unknown']),
    style_tags: arr(ai.style_tags, ['minimal']),
    occasion_tags: arr(ai.occasion_tags, ['casual']),
    fit: str(ai.fit, 'regular'),
    season: str(ai.season, 'all'),
    versatility: num(ai.versatility, 60),
    maintenance: num(ai.maintenance, 40),
    confidence: Math.max(0, Math.min(1, Number(ai.confidence) || 0.6)),
    notes: str(ai.notes, ''),
    image_url: imageBase64,
    product_url: null,
    available: true,
    found: true,
    source: 'vision',
  };
}

/**
 * When there is no vision model available, MAVIE still accepts the upload —
 * it just asks the user to confirm what it is instead of pretending to know.
 */
function fallbackProduct(statedPrice) {
  return {
    id: `found-${Date.now()}`,
    name: 'Your uploaded piece',
    category: 'dress',
    subcategory: 'dress',
    body_area: 'full',
    price: statedPrice ?? 0,
    price_known: statedPrice != null,
    currency: 'USD',
    hex: '#C98B94',
    colors: ['unknown'],
    style_tags: ['minimal'],
    occasion_tags: ['casual'],
    fit: 'regular',
    season: 'all',
    versatility: 60,
    maintenance: 40,
    confidence: 0,
    notes: 'MAVIE could not read this image automatically — confirm the details below.',
    image_url: null,
    product_url: null,
    available: true,
    found: true,
    needs_confirmation: true,
  };
}

const CATEGORIES = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory'];
const category = (c) => (CATEGORIES.includes(c) ? c : 'top');
const bodyArea = (c) =>
  ({ top: 'upper', outerwear: 'upper', bottom: 'lower', dress: 'full', shoes: 'feet' }[c] || 'accessory');

const str = (v, fb) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 80) : fb);
const arr = (v, fb) => (Array.isArray(v) && v.length ? v.map(String).slice(0, 4) : fb);
const num = (v, fb) => (typeof v === 'number' && v >= 0 && v <= 100 ? Math.round(v) : fb);
const hex = (v) => (/^#[0-9a-f]{6}$/i.test(v) ? v : '#C98B94');
