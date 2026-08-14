/**
 * TRIP MODE
 *
 * "I'm going to Lisbon for four days."
 *
 * The point is NOT to generate four unrelated outfits. It's a capsule: a small
 * set of pieces that recombine across days, prioritising the closet so the trip
 * costs as little as possible. That is the same "style more, buy less" thesis
 * as the rest of MAVIE, applied to a suitcase.
 */

import { askJSON } from '../ai/llm.js';
import { searchCatalog } from './searchService.js';
import { recommendMakeup } from '../ai/makeupService.js';

const SYSTEM = `You are MAVIE's trip planner. Read the user's description of a trip and
return ONLY JSON:
{
  "destination": "<place or null>",
  "days": <number of days, default 3>,
  "climate": "warm|mild|cold",
  "schedule": [
    { "day": 1, "label": "<short label e.g. Travel day>", "occasion": "travel|casual|brunch|dinner|office|party|wedding|college" }
  ],
  "summary": "<one warm sentence about the trip>"
}
Build one schedule entry per day. Real trips have a shape: travel in, activity
days, usually one nicer evening, travel home. Infer sensibly from what they say.`;

export async function planTrip({ text, profile = {}, closet = [], budget = null }) {
  const plan = (await askJSON({ system: SYSTEM, user: `Trip: "${text}"` })) || deterministicPlan(text);

  const days = clampDays(plan.days ?? deterministicPlan(text).days);
  const schedule = normaliseSchedule(plan.schedule, days);
  const climate = ['warm', 'mild', 'cold'].includes(plan.climate) ? plan.climate : 'mild';

  // Build the capsule ONCE, then assign pieces to days. This is what makes it a
  // packing list rather than N independent outfit requests.
  const capsule = buildCapsule({ schedule, climate, profile, closet, budget });
  const outfits = assignDays({ schedule, capsule, profile });

  const bought = capsule.filter((c) => !c.owned);
  const reused = capsule.filter((c) => c.owned);

  return {
    destination: plan.destination || null,
    days,
    climate,
    summary: plan.summary || `${days} days${plan.destination ? ` in ${plan.destination}` : ''}, packed light.`,
    capsule,
    outfits,
    stats: {
      pieces: capsule.length,
      from_closet: reused.length,
      to_buy: bought.length,
      spend: bought.reduce((s, i) => s + i.price, 0),
      // The number that makes the capsule case: each packed piece gets worn
      // more than once, which is the whole reason to pack a capsule.
      wears_per_piece: capsule.length
        ? Math.round((outfits.reduce((s, o) => s + o.items.length, 0) / capsule.length) * 10) / 10
        : 0,
    },
  };
}

/**
 * A capsule needs enough coverage for every occasion in the trip while staying
 * small. Closet pieces are free, so they are always preferred.
 */
function buildCapsule({ schedule, climate, profile, closet, budget }) {
  const occasions = [...new Set(schedule.map((d) => d.occasion))];
  const season = climate === 'cold' ? 'winter' : climate === 'warm' ? 'summer' : 'all';

  const capsule = [];
  const seen = new Set();

  const add = (item, owned = false) => {
    if (!item || seen.has(item.id)) return;
    seen.add(item.id);
    capsule.push({ ...item, owned });
  };

  // 1. Closet first — packing what you own costs nothing.
  closet.slice(0, 8).forEach((c) => {
    add(closetToItem(c), true);
  });

  // 2. Fill gaps from the catalog, biased toward versatile pieces.
  //
  // Capsule size scales with trip length. A 3-day trip that needs 9 pieces is
  // not a capsule — each piece has to earn its place by being worn more than
  // once, so we deliberately under-pack and let the outfits recombine.
  const days = schedule.length;
  const hasDressyDay = occasions.some((o) => ['dinner', 'party', 'wedding'].includes(o));

  const need = {
    top: Math.min(3, Math.max(2, days - 1)),
    bottom: days <= 3 ? 1 : 2,
    dress: hasDressyDay ? 1 : 0,
    outerwear: climate === 'cold' ? 1 : 0,
    // Two pairs only when the trip genuinely has both registers to cover.
    shoes: hasDressyDay ? 2 : 1,
    accessory: 1,
  };

  Object.entries(need).forEach(([category, count]) => {
    const have = capsule.filter((c) => c.category === category).length;
    const missing = Math.max(0, count - have);
    if (!missing) return;

    // Search once per occasion in the trip and merge, so a beach week doesn't
    // get packed out of the "travel" shortlist alone. A piece that serves
    // several of the trip's occasions is what we actually want.
    const scored = new Map();

    occasions.forEach((occasion) => {
      searchCatalog(
        {
          occasion,
          style_preferences: profile.style_dna || [],
          avoided_colors: profile.avoided_colors || [],
          budget,
          comfort_priority: 0.8,
        },
        { category, limit: 12 },
      )
        .filter((i) => i.season === 'all' || i.season === season)
        .forEach((i) => {
          const prev = scored.get(i.id);
          // covers = how many of THIS trip's occasions the piece suits.
          scored.set(i.id, prev ? { ...prev, covers: prev.covers + 1 } : { item: i, covers: 1 });
        });
    });

    // Season-matched pieces are PREFERRED, not merely permitted. Without this a
    // beach week packs black tailored trousers purely because they score high
    // on year-round versatility.
    const seasonBoost = (i) => (season !== 'all' && i.season === season ? 1 : 0);

    [...scored.values()]
      .sort((a, b) =>
        (seasonBoost(b.item) - seasonBoost(a.item)) ||
        (b.covers - a.covers) ||
        (b.item.versatility - a.item.versatility))
      .slice(0, missing)
      .forEach(({ item }) => add(item, false));
  });

  return capsule;
}

/** Recombine the capsule across days so pieces repeat but outfits don't. */
function assignDays({ schedule, capsule, profile }) {
  const byCat = (c) => capsule.filter((i) => i.category === c);
  const tops = byCat('top');
  const bottoms = byCat('bottom');
  const dresses = byCat('dress');
  const shoes = byCat('shoes');
  const outer = byCat('outerwear');
  const accessories = byCat('accessory');

  return schedule.map((day, i) => {
    const dressy = ['dinner', 'party', 'wedding'].includes(day.occasion);
    const items = [];

    if (dressy && dresses.length) {
      items.push(dresses[i % dresses.length]);
    } else if (tops.length && bottoms.length) {
      items.push(tops[i % tops.length], bottoms[i % bottoms.length]);
    } else {
      items.push(...capsule.slice(0, 2));
    }

    // Shoes must match the register of the day — sneakers with a dinner dress
    // is exactly the kind of mistake that makes a plan look auto-generated.
    const shoe = pickShoe(shoes, dressy);
    if (shoe) items.push(shoe);
    if (outer.length && (day.occasion === 'travel' || dressy)) items.push(outer[0]);
    if (accessories.length) items.push(accessories[i % accessories.length]);

    return {
      day: day.day,
      label: day.label,
      occasion: day.occasion,
      items,
      makeup: recommendMakeup({ occasion: day.occasion, goal: [], formality: dressy ? 'smart-casual' : 'casual' }, profile, items),
      note: dressy
        ? 'The one evening look — worth the single dressier piece.'
        : 'Built from pieces that repeat across the trip.',
    };
  });
}

// Ordered by preference, so a casual day reaches for sneakers before flats and
// a dinner reaches for heels before loafers.
const CASUAL_SHOE = ['sneaker', 'sandal', 'flat', 'boot', 'loafer'];
const DRESSY_SHOE = ['heel', 'boot', 'loafer', 'flat'];

function pickShoe(shoes, dressy) {
  if (!shoes.length) return null;

  const banned = dressy ? ['sneaker', 'sandal'] : ['heel'];
  const eligible = shoes.filter((s) => !banned.some((w) => s.name.toLowerCase().includes(w)));
  const order = dressy ? DRESSY_SHOE : CASUAL_SHOE;

  for (const want of order) {
    const hit = eligible.find((s) => s.name.toLowerCase().includes(want));
    if (hit) return hit;
  }
  return eligible[0] || shoes[0];
}

/* ── helpers ─────────────────────────────────────────────────────────── */

export function deterministicPlan(text) {
  const t = (text || '').toLowerCase();

  const dayMatch = t.match(/(\d+)\s*(?:day|night)/) || t.match(/\b(two|three|four|five|six|seven)\b/);
  const words = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7 };
  const days = clampDays(
    dayMatch ? (parseInt(dayMatch[1], 10) || words[dayMatch[1]] || 3) : 3,
  );

  const climate = /beach|summer|hot|tropical|goa|dubai/.test(t) ? 'warm'
    : /ski|snow|winter|cold|iceland|norway/.test(t) ? 'cold' : 'mild';

  // to/in <Place>
  const place = text?.match(/\b(?:to|in|visiting)\s+([A-Z][A-Za-z]+(?:\s[A-Z][A-Za-z]+)?)/);

  return {
    destination: place ? place[1] : null,
    days,
    climate,
    schedule: defaultSchedule(days),
    summary: `${days} days${place ? ` in ${place[1]}` : ''}, packed light.`,
  };
}

function defaultSchedule(days) {
  const out = [{ day: 1, label: 'Travel day', occasion: 'travel' }];
  for (let d = 2; d <= days; d++) {
    if (d === days) out.push({ day: d, label: 'Travel home', occasion: 'travel' });
    else if (d === days - 1) out.push({ day: d, label: 'Dinner out', occasion: 'dinner' });
    else out.push({ day: d, label: 'Exploring', occasion: 'casual' });
  }
  return out;
}

function normaliseSchedule(schedule, days) {
  if (!Array.isArray(schedule) || !schedule.length) return defaultSchedule(days);
  const cleaned = schedule.slice(0, days).map((d, i) => ({
    day: i + 1,
    label: typeof d?.label === 'string' ? d.label.slice(0, 40) : `Day ${i + 1}`,
    occasion: typeof d?.occasion === 'string' ? d.occasion : 'casual',
  }));
  // Top up if the model returned fewer entries than days.
  while (cleaned.length < days) {
    cleaned.push({ day: cleaned.length + 1, label: 'Exploring', occasion: 'casual' });
  }
  return cleaned;
}

const clampDays = (n) => Math.max(1, Math.min(14, parseInt(n, 10) || 3));

const closetToItem = (c) => ({
  id: c.id,
  name: c.name || `${c.color || ''} ${c.category}`.trim(),
  category: c.category,
  body_area: { top: 'upper', outerwear: 'upper', bottom: 'lower', dress: 'full', shoes: 'feet' }[c.category] || 'accessory',
  price: 0,
  hex: c.hex || '#CFC6B8',
  colors: c.colors || [c.color].filter(Boolean),
  style_tags: c.style_tags || ['minimal'],
  occasion_tags: c.occasion_tags || ['casual', 'travel'],
  fit: c.fit || 'regular',
  season: 'all',
  versatility: 85,
  maintenance: 25,
});
