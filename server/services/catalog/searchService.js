/**
 * CATALOG SEARCH
 * Deterministic constraint filtering + relevance ranking over real products.
 * No LLM involved — this is the part that must be predictable.
 */

import { catalog, beautyCatalog } from '../../data/catalog.js';

export function searchCatalog(constraints = {}, opts = {}) {
  const {
    occasion,
    style_preferences = [],
    avoided_colors = [],
    budget,
    comfort_priority = 0.5,
  } = constraints;

  const { category, limit = 40 } = opts;

  return catalog
    .filter((it) => it.available)
    .filter((it) => (category ? it.category === category : true))
    .filter((it) => !avoided_colors.some((c) => it.colors.includes(c) || it.style_tags.includes(c)))
    .map((it) => ({ ...it, relevance: relevance(it, { occasion, style_preferences, budget, comfort_priority }) }))
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}

export function relevance(item, { occasion, style_preferences = [], budget, comfort_priority = 0.5 }) {
  let score = 0;

  // Occasion fit is the strongest signal.
  if (occasion && item.occasion_tags.includes(occasion)) score += 40;
  else if (occasion && adjacentOccasions(occasion).some((o) => item.occasion_tags.includes(o))) score += 18;

  // Style overlap.
  const overlap = item.style_tags.filter((t) => style_preferences.includes(t)).length;
  score += Math.min(overlap * 12, 24);

  // Budget sanity — a single item shouldn't eat the whole budget.
  if (budget) {
    const share = item.price / budget;
    if (share <= 0.35) score += 14;
    else if (share <= 0.6) score += 6;
    else if (share > 1) score -= 30;
  }

  // Comfort preference nudges relaxed fits and low-maintenance pieces.
  if (comfort_priority > 0.7) {
    if (['relaxed', 'oversized', 'wide', 'straight'].includes(item.fit)) score += 10;
    score += (100 - item.maintenance) * 0.06;
  }

  // Versatile pieces are quietly favoured — it is MAVIE's whole thesis.
  score += item.versatility * 0.12;

  return Math.round(score);
}

function adjacentOccasions(occasion) {
  const map = {
    interview: ['office', 'formal'],
    office: ['interview', 'college'],
    date: ['dinner', 'brunch'],
    dinner: ['date', 'party'],
    party: ['dinner', 'wedding'],
    wedding: ['party', 'dinner'],
    college: ['casual', 'office'],
    brunch: ['casual', 'date'],
    travel: ['casual'],
    casual: ['college', 'travel'],
  };
  return map[occasion] || [];
}

export function searchBeauty({ finish, category } = {}) {
  return beautyCatalog
    .filter((b) => (category ? b.category === category : true))
    .filter((b) => (finish ? b.finish === finish || b.tags.includes(finish) : true));
}
