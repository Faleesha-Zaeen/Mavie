/**
 * OUTFIT COMPOSER
 *
 * Builds complete looks from REAL catalog products.
 * Never "imagine a cream blouse" — always product #top-101 + #bot-201 + #out-401.
 *
 * The LLM may re-rank and name the looks, but it can only choose from the
 * candidate ids this module produces.
 */

import { searchCatalog } from './searchService.js';
import { scoreLook } from '../decision/scoringService.js';
import { recommendMakeup } from '../ai/makeupService.js';

const ARCHETYPES = [
  { key: 'classic', name: 'The Classic', bias: ['classic', 'professional', 'timeless', 'minimal'] },
  { key: 'soft', name: 'The Soft Statement', bias: ['feminine', 'soft', 'romantic', 'elegant'] },
  { key: 'effortless', name: 'The Effortless', bias: ['relaxed', 'comfort', 'minimal', 'everyday'] },
];

export function composeLooks(constraints, profile = {}, closet = []) {
  const budget = constraints.budget || 5000;

  const pools = {
    top: searchCatalog(constraints, { category: 'top', limit: 14 }),
    bottom: searchCatalog(constraints, { category: 'bottom', limit: 14 }),
    dress: searchCatalog(constraints, { category: 'dress', limit: 12 }),
    outerwear: searchCatalog(constraints, { category: 'outerwear', limit: 8 }),
    shoes: searchCatalog(constraints, { category: 'shoes', limit: 8 }),
    accessory: searchCatalog(constraints, { category: 'accessory', limit: 8 }),
  };

  const used = new Set();
  const looks = [];

  ARCHETYPES.forEach((arch, index) => {
    // Alternate between two-piece and dress-based silhouettes for genuine variety.
    const preferDress = index === 1 && pools.dress.length > 0;
    const items = preferDress
      ? buildDressLook(pools, arch, used, budget)
      : buildSeparatesLook(pools, arch, used, budget);

    if (!items.length) return;

    items.forEach((i) => used.add(i.id));

    const makeup = recommendMakeup(constraints, profile, items);
    const scores = scoreLook({ items, makeup, constraints, profile, closet });

    looks.push({
      id: `look-${index + 1}`,
      name: arch.name,
      archetype: arch.key,
      items,
      makeup,
      total: items.reduce((s, i) => s + i.price, 0),
      scores,
      explanation: explain(arch, items, constraints, scores),
    });
  });

  return looks.sort((a, b) => b.scores.overall - a.scores.overall);
}

function buildSeparatesLook(pools, arch, used, budget) {
  const top = pick(pools.top, arch, used);
  const bottom = pick(pools.bottom, arch, used);
  if (!top || !bottom) return [];

  const items = [top, bottom];
  addIfAffordable(items, pick(pools.shoes, arch, used), budget);
  addIfAffordable(items, pick(pools.outerwear, arch, used), budget);
  addIfAffordable(items, pick(pools.accessory, arch, used), budget);
  return items;
}

function buildDressLook(pools, arch, used, budget) {
  const dress = pick(pools.dress, arch, used);
  if (!dress) return [];

  const items = [dress];
  addIfAffordable(items, pick(pools.shoes, arch, used), budget);
  addIfAffordable(items, pick(pools.accessory, arch, used), budget);
  addIfAffordable(items, pick(pools.outerwear, arch, used), budget);
  return items;
}

/** Bias the pool toward the archetype, then take the best unused item. */
function pick(pool, arch, used) {
  if (!pool?.length) return null;
  const ranked = pool
    .map((it) => {
      const biasHits = it.style_tags.filter((t) => arch.bias.includes(t)).length;
      return { it, score: it.relevance + biasHits * 18 - (used.has(it.id) ? 1000 : 0) };
    })
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  return best && !used.has(best.it.id) ? best.it : null;
}

function addIfAffordable(items, candidate, budget) {
  if (!candidate) return;
  const total = items.reduce((s, i) => s + i.price, 0);
  if (total + candidate.price <= budget) items.push(candidate);
}

function explain(arch, items, constraints, scores) {
  const names = items.slice(0, 2).map((i) => i.name.toLowerCase()).join(' with ');
  const goal = (constraints.goal || []).slice(0, 2).join(' and ') || 'like yourself';
  const budgetLine = constraints.budget
    ? ` It lands at $${items.reduce((s, i) => s + i.price, 0).toLocaleString('en-US')} against your $${constraints.budget.toLocaleString('en-US')} budget.`
    : '';
  const occasion = constraints.occasion
    ? `${/^[aeiou]/i.test(constraints.occasion) ? 'an' : 'a'} ${constraints.occasion}`
    : 'a day out';
  return `${arch.name} pairs the ${names} because you asked to feel ${goal} for ${occasion}.${budgetLine} Occasion fit scores ${scores.occasion}%.`;
}
