import { store } from '../store.js';
import { composeLooks } from '../services/catalog/outfitComposer.js';
import { scoreLook } from '../services/decision/scoringService.js';

export function list(req, res) {
  const items = store.closet();
  res.json({ items, counts: countByCategory(items) });
}

export function add(req, res) {
  res.json({ item: store.addClosetItem(store.DEMO_USER, req.body) });
}

export function remove(req, res) {
  res.json(store.removeClosetItem(store.DEMO_USER, req.params.id));
}

/** Overlap and gap analysis — this feeds straight into the Skeptic's evidence. */
export function analyse(req, res) {
  const items = store.closet();
  const counts = countByCategory(items);

  const duplicates = Object.entries(
    items.reduce((acc, i) => {
      const key = `${i.category}:${i.color || (i.colors || [])[0] || 'unknown'}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
  )
    .filter(([, n]) => n >= 3)
    .map(([key, n]) => {
      const [category, color] = key.split(':');
      return { category, color, count: n, note: `You already own ${n} ${color} ${plural(category)}.` };
    });

  const gaps = ['top', 'bottom', 'shoes', 'outerwear']
    .filter((c) => (counts[c] || 0) === 0)
    .map((c) => ({ category: c, note: `Nothing in your closet covers ${plural(c)} yet.` }));

  res.json({ counts, total: items.length, duplicates, gaps });
}

/** "Style what I already own" — no purchase required. */
export function style(req, res) {
  const { constraints = {} } = req.body || {};
  const closet = store.closet();

  if (closet.length < 2) {
    return res.status(422).json({
      error: 'closet_too_small',
      message: 'Add a few more pieces and MAVIE can style what you already own.',
    });
  }

  // Reuse the composer over closet items shaped like catalog entries.
  const asCatalog = closet.map((c, idx) => ({
    id: c.id,
    name: c.name || `${c.color || ''} ${c.category}`.trim(),
    category: c.category,
    body_area: bodyArea(c.category),
    price: 0,
    hex: c.hex || '#CFC6B8',
    colors: c.colors || [c.color].filter(Boolean),
    style_tags: c.style_tags || ['minimal'],
    occasion_tags: c.occasion_tags || ['casual', constraints.occasion].filter(Boolean),
    fit: c.fit || 'regular',
    season: 'all',
    versatility: 85,
    maintenance: 25,
    relevance: 100 - idx,
    owned: true,
  }));

  const looks = buildFromOwned(asCatalog, constraints);

  res.json({
    looks,
    note: 'Styled entirely from pieces you already own. Total cost: $0.',
  });
}

function buildFromOwned(items, constraints) {
  const byCat = (c) => items.filter((i) => i.category === c);
  const looks = [];

  const tops = byCat('top');
  const bottoms = byCat('bottom');
  const dresses = byCat('dress');
  const shoes = byCat('shoes');
  const accessories = byCat('accessory');

  const combos = [];
  dresses.slice(0, 2).forEach((d) => combos.push([d]));
  tops.slice(0, 3).forEach((t) => bottoms.slice(0, 2).forEach((b) => combos.push([t, b])));

  combos.slice(0, 3).forEach((base, idx) => {
    const set = [...base];
    if (shoes[idx % Math.max(shoes.length, 1)]) set.push(shoes[idx % shoes.length]);
    if (accessories[idx % Math.max(accessories.length, 1)]) set.push(accessories[idx % accessories.length]);

    looks.push({
      id: `closet-look-${idx + 1}`,
      name: ['From Your Closet', 'Already Yours', 'No Purchase Needed'][idx] || 'From Your Closet',
      items: set,
      total: 0,
      owned: true,
      scores: scoreLook({ items: set, constraints, profile: store.getProfile(), closet: store.closet() }),
      explanation: 'Built entirely from pieces already in your closet — style more, buy less.',
    });
  });

  return looks.sort((a, b) => b.scores.overall - a.scores.overall);
}

/** "dresses" not "dresss"; "shoes" and "outerwear" don't take an extra s. */
function plural(category) {
  if (['shoes', 'outerwear'].includes(category)) return category;
  if (/(s|sh|ch|x|z)$/.test(category)) return `${category}es`;
  return `${category}s`;
}

const bodyArea = (category) =>
  ({ top: 'upper', outerwear: 'upper', bottom: 'lower', dress: 'full', shoes: 'feet' }[category] || 'accessory');

function countByCategory(items) {
  return items.reduce((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + 1;
    return acc;
  }, {});
}
