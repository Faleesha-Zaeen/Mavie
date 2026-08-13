/**
 * MAVIE MATCH — the scoring layer.
 *
 * IMPORTANT: this is NOT an attractiveness score. It measures how well a look
 * satisfies the user's OWN stated requirements. Weights are transparent product
 * judgement, not validated measurement, and the UI says so.
 */

export const MATCH_WEIGHTS = {
  occasion: 0.25,
  style: 0.20,
  preference: 0.15,
  budget: 0.15,
  comfort: 0.10,
  beauty: 0.10,
  closet: 0.05,
};

export function scoreLook({ items = [], makeup = null, constraints = {}, profile = {}, closet = [] }) {
  const occasion = occasionScore(items, constraints);
  const style = styleScore(items, constraints, profile);
  const preference = preferenceScore(items, constraints, profile);
  const budget = budgetScore(items, constraints);
  const comfort = comfortScore(items, constraints);
  const beauty = beautyScore(makeup, constraints, profile);
  const closetFit = closetScore(items, closet);

  const overall = Math.round(
    occasion * MATCH_WEIGHTS.occasion +
    style * MATCH_WEIGHTS.style +
    preference * MATCH_WEIGHTS.preference +
    budget * MATCH_WEIGHTS.budget +
    comfort * MATCH_WEIGHTS.comfort +
    beauty * MATCH_WEIGHTS.beauty +
    closetFit * MATCH_WEIGHTS.closet,
  );

  return { occasion, style, preference, budget, comfort, beauty, closet: closetFit, overall };
}

function occasionScore(items, { occasion }) {
  if (!items.length) return 0;
  if (!occasion) return 75;
  const hits = items.filter((i) => i.occasion_tags.includes(occasion)).length;
  return pct(55 + (hits / items.length) * 45);
}

function styleScore(items, { style_preferences = [] }, profile) {
  const prefs = [...style_preferences, ...(profile?.style_dna || [])];
  if (!prefs.length || !items.length) return 78;
  const hits = items.reduce(
    (sum, i) => sum + (i.style_tags.some((t) => prefs.includes(t)) ? 1 : 0),
    0,
  );
  return pct(58 + (hits / items.length) * 42);
}

function preferenceScore(items, { goal = [], avoided_colors = [] }, profile) {
  let score = 82;
  const avoided = [...avoided_colors, ...(profile?.avoided_colors || [])];
  items.forEach((i) => {
    if (avoided.some((c) => i.colors.includes(c))) score -= 22;
    if (i.style_tags.some((t) => goal.includes(t))) score += 5;
  });
  return pct(score);
}

function budgetScore(items, { budget }) {
  const total = items.reduce((s, i) => s + i.price, 0);
  if (!budget) return 90;
  if (total <= budget * 0.85) return 100;
  if (total <= budget) return 94;
  const over = (total - budget) / budget;
  return pct(90 - over * 160);
}

function comfortScore(items, { comfort_priority = 0.5 }) {
  if (!items.length) return 70;
  const avgMaintenance = avg(items.map((i) => i.maintenance));
  const relaxedShare = items.filter((i) => ['relaxed', 'oversized', 'wide', 'straight', 'a-line'].includes(i.fit)).length / items.length;
  const base = 60 + relaxedShare * 30 + (100 - avgMaintenance) * 0.15;
  // Users who care about comfort feel the penalty more sharply.
  return pct(comfort_priority > 0.7 ? base : base * 0.85 + 15);
}

function beautyScore(makeup, { goal = [] }, profile) {
  if (!makeup) return 80;
  let score = 86;
  const preferred = profile?.beauty?.intensity;
  if (preferred && makeup.intensity === preferred) score += 9;
  if (goal.includes('bold') && makeup.intensity.includes('bold')) score += 6;
  if (goal.includes('minimal') && makeup.intensity === 'light') score += 6;
  if (profile?.beauty?.preferred_finish === makeup.finish) score += 5;
  return pct(score);
}

function closetScore(items, closet) {
  if (!closet?.length) return 80;
  // A look that coordinates with pieces you already own is worth more.
  const closetColors = new Set(closet.flatMap((c) => c.colors || [c.color]).filter(Boolean));
  const coordinating = items.filter((i) => i.colors.some((c) => closetColors.has(c))).length;
  return pct(65 + (coordinating / items.length) * 35);
}

const pct = (n) => Math.max(0, Math.min(100, Math.round(n)));
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
