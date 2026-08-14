/**
 * DECISION ENGINE
 *
 * The agents do not decide. They supply evidence.
 * This module weighs that evidence deterministically and produces the verdict.
 */

import { analyseAftermath } from './regretService.js';
import { runPanel } from '../ai/agents.js';
import { searchCatalog } from '../catalog/searchService.js';

export async function decide({ items = [], constraints = {}, profile = {}, closet = [], matchScores = {} }) {
  const aftermath = analyseAftermath({ items, constraints, profile, closet, matchScores });

  const panel = await runPanel({
    metrics: aftermath.metrics,
    constraints,
    profile: { style_dna: profile.style_dna, avoided_colors: profile.avoided_colors },
    items: items.map(({ id, name, category, price, colors, style_tags, occasion_tags, versatility, maintenance }) => ({
      id, name, category, price, colors, style_tags, occasion_tags, versatility, maintenance,
    })),
    closet_size: closet.length,
    makeup: null,
  });

  // High-severity, evidence-backed concerns pull the verdict down.
  const highSeverity = panel.skeptic.filter((c) => c.severity === 'high').length;
  const adjustedRisk = Math.min(100, aftermath.risk_score + highSeverity * 6);

  const verdict = toVerdict(adjustedRisk, matchScores.overall ?? 80);

  return {
    ...aftermath,
    risk_score: adjustedRisk,
    regret_risk: adjustedRisk <= 30 ? 'LOW' : adjustedRisk <= 60 ? 'MEDIUM' : 'HIGH',
    buy_confidence: Math.max(0, 100 - adjustedRisk),
    panel,
    verdict: verdict.code,
    verdict_label: verdict.label,
    verdict_headline: verdict.headline,
    verdict_reason: verdict.reason(items, aftermath, matchScores),
  };
}

function toVerdict(risk, overallMatch) {
  if (risk <= 30 && overallMatch >= 78) {
    return {
      code: 'BUY',
      label: 'BUY',
      headline: 'This one earns its place.',
      reason: (items, a) =>
        `Strong fit with your goals and low decision risk. Versatility sits at ${a.metrics.versatility}% and it stays inside your budget, so you should get real use out of it.`,
    };
  }
  if (risk <= 60) {
    return {
      code: 'WAIT',
      label: 'WAIT',
      headline: 'You look great in it. That is not the same as needing it.',
      reason: (items, a) =>
        `Based on what you've told MAVIE you value, this may not be a great purchase yet. Rewear potential is ${a.metrics.rewear_potential}% and versatility is ${a.metrics.versatility}% — give it a day, or see the alternatives below.`,
    };
  }
  return {
    code: 'SKIP',
    label: 'SKIP',
    headline: 'Looking good in it is not a reason to buy it.',
    reason: (items, a) =>
      `The evidence points against this one: versatility ${a.metrics.versatility}%, rewear ${a.metrics.rewear_potential}%, closet overlap ${a.metrics.closet_overlap}%. MAVIE would rather find you something you'll actually reach for.`,
  };
}

/**
 * ALTERNATIVE ENGINE
 * Same aesthetic, lower decision risk.
 */
export function findAlternatives({ items = [], constraints = {}, limit = 3 }) {
  const target = items[0];
  if (!target) return [];

  const pool = searchCatalog(constraints, { category: target.category, limit: 12 });

  return pool
    .filter((c) => c.id !== target.id)
    .map((c) => ({
      ...c,
      // Prefer items that keep the look but improve the things the Skeptic flags.
      improvement: Math.round(
        (c.versatility - target.versatility) * 0.5 +
        (target.maintenance - c.maintenance) * 0.3 +
        (target.price - c.price) / 40,
      ),
      shares_aesthetic: c.style_tags.filter((t) => target.style_tags.includes(t)).length,
    }))
    .filter((c) => c.shares_aesthetic >= 1)
    .sort((a, b) => b.improvement - a.improvement)
    .slice(0, limit)
    .map((c) => ({
      ...c,
      why: `Similar ${c.style_tags[0]} feel, versatility ${c.versatility}%${c.price < target.price ? `, and $${(target.price - c.price).toLocaleString('en-US')} cheaper` : ''}.`,
    }));
}
