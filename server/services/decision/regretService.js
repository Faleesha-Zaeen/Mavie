/**
 * AFTERMATH — decision-risk analysis.
 *
 * This is a transparent decision-support heuristic built from the user's stated
 * constraints and catalog metadata. It is NOT a validated prediction of human
 * regret, and MAVIE never claims otherwise.
 */

export const RISK_WEIGHTS = {
  context_mismatch: 0.20,
  preference_mismatch: 0.20,
  low_versatility: 0.15,
  low_rewear: 0.15,
  closet_overlap: 0.10,
  maintenance: 0.10,
  budget_pressure: 0.10,
};

export function analyseAftermath({ items = [], constraints = {}, profile = {}, closet = [], matchScores = {} }) {
  const versatility = pct(avg(items.map((i) => i.versatility)));
  const rewear = rewearPotential(items, constraints);
  const overlap = closetOverlap(items, closet);
  const maintenance = pct(avg(items.map((i) => i.maintenance)));
  const budgetPressure = budgetPressureScore(items, constraints);

  const contextMismatch = 100 - (matchScores.occasion ?? 80);
  const preferenceMismatch = 100 - (matchScores.preference ?? 80);

  const risk = Math.round(
    contextMismatch * RISK_WEIGHTS.context_mismatch +
    preferenceMismatch * RISK_WEIGHTS.preference_mismatch +
    (100 - versatility) * RISK_WEIGHTS.low_versatility +
    (100 - rewear) * RISK_WEIGHTS.low_rewear +
    overlap * RISK_WEIGHTS.closet_overlap +
    maintenance * RISK_WEIGHTS.maintenance +
    budgetPressure * RISK_WEIGHTS.budget_pressure,
  );

  return {
    metrics: {
      visual_match: matchScores.style ?? 88,
      occasion_match: matchScores.occasion ?? 85,
      style_match: matchScores.style ?? 88,
      budget_fit: matchScores.budget ?? 90,
      versatility,
      rewear_potential: rewear,
      closet_overlap: overlap,
      maintenance_burden: maintenance,
      budget_pressure: budgetPressure,
    },
    risk_score: clamp(risk),
    regret_risk: band(risk),
    buy_confidence: clamp(100 - risk),
    disclaimer:
      'Regret risk is a decision-support heuristic derived from your stated constraints and product metadata. It is not a scientific prediction.',
  };
}

/** How many distinct contexts could these pieces realistically serve? */
function rewearPotential(items, { occasion }) {
  if (!items.length) return 50;
  const contexts = new Set(items.flatMap((i) => i.occasion_tags));
  const breadth = Math.min(contexts.size / 7, 1) * 60;
  const specificity = avg(items.map((i) => i.occasion_tags.length)) * 8;
  // Highly occasion-specific pieces (weddings, parties) rewear poorly.
  const penalty = ['wedding', 'party'].includes(occasion) ? 14 : 0;
  return pct(breadth + specificity - penalty);
}

/** Do you already own something that serves the same purpose? */
function closetOverlap(items, closet) {
  if (!closet?.length) return 0;
  let overlap = 0;
  items.forEach((item) => {
    const similar = closet.filter(
      (c) => c.category === item.category && (c.color === item.colors[0] || (c.colors || []).includes(item.colors[0])),
    ).length;
    if (similar >= 3) overlap += 34;
    else if (similar === 2) overlap += 22;
    else if (similar === 1) overlap += 11;
  });
  return clamp(overlap);
}

function budgetPressureScore(items, { budget }) {
  const total = items.reduce((s, i) => s + i.price, 0);
  if (!budget) return 20;
  const ratio = total / budget;
  if (ratio <= 0.6) return 5;
  if (ratio <= 0.85) return 18;
  if (ratio <= 1) return 34;
  return clamp(50 + (ratio - 1) * 120);
}

export function band(risk) {
  if (risk <= 30) return 'LOW';
  if (risk <= 60) return 'MEDIUM';
  return 'HIGH';
}

const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
const pct = clamp;
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
