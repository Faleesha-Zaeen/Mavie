/**
 * CONTEXT ENGINE
 * Natural language → structured constraints.
 *
 * The LLM does the language understanding. It does NOT make the final decision.
 * A deterministic keyword extractor backs it up so MAVIE never hard-fails.
 */

import { askJSON } from './llm.js';

const OCCASIONS = {
  interview: ['interview', 'placement', 'hiring', 'recruiter'],
  office: ['office', 'work', 'meeting', 'presentation', 'client', 'internship'],
  date: ['date', 'dinner date', 'anniversary'],
  dinner: ['dinner', 'restaurant', 'birthday dinner'],
  party: ['party', 'night out', 'club', 'celebration', 'birthday'],
  wedding: ['wedding', 'reception', 'sangeet', 'engagement', 'graduation', 'ceremony'],
  college: ['college', 'class', 'campus', 'lecture', 'seminar', 'fest'],
  brunch: ['brunch', 'lunch', 'coffee', 'cafe'],
  travel: ['travel', 'trip', 'flight', 'vacation', 'holiday'],
  casual: ['casual', 'hangout', 'errands', 'chill', 'friends'],
};

const FORMALITY = {
  interview: 'formal', office: 'smart-casual', wedding: 'formal', party: 'statement',
  dinner: 'smart-casual', date: 'smart-casual', formal: 'formal',
  college: 'casual', brunch: 'casual', travel: 'casual', casual: 'casual',
};

const GOALS = {
  professional: ['professional', 'formal', 'serious', 'polished', 'sharp'],
  confident: ['confident', 'powerful', 'strong', 'put together'],
  feminine: ['feminine', 'girly', 'soft', 'romantic', 'pretty'],
  minimal: ['minimal', 'simple', 'clean', 'understated', 'subtle'],
  elegant: ['elegant', 'sophisticated', 'classy', 'refined', 'graceful'],
  bold: ['bold', 'statement', 'standout', 'dramatic', 'striking'],
  comfortable: ['comfortable', 'comfy', 'cosy', 'easy', 'relaxed'],
  cute: ['cute', 'sweet', 'adorable'],
};

const DISLIKE_COLORS = {
  neon: ['neon', 'bright colors', 'bright colours', 'loud colors'],
  black: ['not black', 'no black', 'hate black'],
  pink: ['not pink', 'no pink', 'hate pink'],
};

const SYSTEM = `You are MAVIE's Context Engine. Convert a user's natural-language description of an
occasion into structured styling constraints. Return ONLY JSON with this exact shape:
{
  "occasion": "interview|office|date|dinner|party|wedding|college|brunch|travel|casual",
  "formality": "casual|smart-casual|formal|statement",
  "goal": ["professional","confident","feminine","minimal","elegant","bold","comfortable"],
  "budget": <number in INR or null>,
  "comfort_priority": <0..1>,
  "style_preferences": ["minimal","elegant","feminine","classic","relaxed","bold"],
  "avoided_colors": ["neon"],
  "summary": "<one warm sentence reflecting the moment back to the user>"
}
Never invent a budget the user did not state. Use null instead.`;

export async function parseContext(text) {
  const fallback = deterministicParse(text);

  const ai = await askJSON({
    system: SYSTEM,
    user: `User said: "${text}"`,
  });

  if (!ai || !ai.occasion) return { ...fallback, source: 'deterministic' };

  return {
    occasion: ai.occasion || fallback.occasion,
    formality: ai.formality || fallback.formality,
    goal: arr(ai.goal, fallback.goal),
    budget: typeof ai.budget === 'number' ? ai.budget : fallback.budget,
    comfort_priority: clamp01(ai.comfort_priority ?? fallback.comfort_priority),
    style_preferences: arr(ai.style_preferences, fallback.style_preferences),
    avoided_colors: arr(ai.avoided_colors, fallback.avoided_colors),
    summary: ai.summary || fallback.summary,
    raw_input: text,
    source: 'llm',
  };
}

export function deterministicParse(text) {
  const t = (text || '').toLowerCase();

  let occasion = 'casual';
  let bestHits = 0;
  for (const [key, words] of Object.entries(OCCASIONS)) {
    const hits = words.filter((w) => t.includes(w)).length;
    if (hits > bestHits) {
      bestHits = hits;
      occasion = key;
    }
  }

  const goal = Object.entries(GOALS)
    .filter(([, words]) => words.some((w) => t.includes(w)))
    .map(([key]) => key);

  const avoided_colors = Object.entries(DISLIKE_COLORS)
    .filter(([, words]) => words.some((w) => t.includes(w)))
    .map(([key]) => key);

  // ₹2,500 / 2500 rupees / budget of 3000
  const budgetMatch = t.match(/(?:₹|rs\.?\s*|inr\s*)([\d,]{3,7})|([\d,]{3,7})\s*(?:rupees|rs\b|bucks)/);
  const budget = budgetMatch
    ? parseInt((budgetMatch[1] || budgetMatch[2]).replace(/,/g, ''), 10)
    : null;

  const comfortWords = ['comfortable', 'comfy', 'uncomfortable', 'cosy', 'easy to move'];
  const comfort_priority = comfortWords.some((w) => t.includes(w)) ? 0.9 : 0.5;

  const style_preferences = goal.filter((g) =>
    ['minimal', 'elegant', 'feminine', 'bold'].includes(g),
  );
  if (!style_preferences.length) style_preferences.push('minimal');

  return {
    occasion,
    formality: FORMALITY[occasion] || 'casual',
    goal: goal.length ? goal : ['comfortable'],
    budget,
    comfort_priority,
    style_preferences,
    avoided_colors,
    summary: summarise(occasion, goal, budget),
    raw_input: text,
  };
}

function summarise(occasion, goal, budget) {
  const label = {
    interview: 'an interview', office: 'a day at work', date: 'a date',
    dinner: 'dinner', party: 'a party', wedding: 'a wedding',
    college: 'college', brunch: 'brunch', travel: 'travel', casual: 'a relaxed day',
  }[occasion] || 'your moment';
  const tone = goal.length ? goal.slice(0, 2).join(' and ') : 'like yourself';
  const money = budget ? ` within ₹${budget.toLocaleString('en-IN')}` : '';
  return `You're dressing for ${label}, and you want to feel ${tone}${money}.`;
}

const arr = (v, fb) => (Array.isArray(v) && v.length ? v : fb);
const clamp01 = (n) => Math.max(0, Math.min(1, Number(n) || 0.5));
