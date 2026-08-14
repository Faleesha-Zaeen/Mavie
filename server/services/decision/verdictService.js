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

  // Name the pieces that actually collide. Passing only a closet COUNT meant
  // the Skeptic could see a 34% overlap score but had no idea what it was
  // overlapping with — so the single strongest reason for a WAIT went unsaid.
  const overlapping = items.flatMap((item) =>
    closet
      .filter((c) => c.category === item.category
        && (c.color === item.colors?.[0] || (c.colors || []).includes(item.colors?.[0])))
      .map((c) => ({ owned: c.name || `${c.color} ${c.category}`, collides_with: item.name })),
  );

  const panel = await runPanel({
    metrics: aftermath.metrics,
    constraints,
    profile: { style_dna: profile.style_dna, avoided_colors: profile.avoided_colors },
    items: items.map(({ id, name, category, price, colors, style_tags, occasion_tags, versatility, maintenance }) => ({
      id, name, category, price, colors, style_tags, occasion_tags, versatility, maintenance,
    })),
    closet_size: closet.length,
    already_owns: overlapping,
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
      // Lead with whichever factor actually drove the verdict, rather than
      // reciting the same two numbers every time.
      reason: (items, a) => `${dominantReason(a.metrics)} Give it a day, or take one of the alternatives below.`,
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
 * Which factor contributed most to the risk score? The verdict should explain
 * itself using that, not a fixed sentence — otherwise every WAIT reads the same
 * and the user learns nothing about their own decision.
 */
function dominantReason(m) {
  const contributions = [
    { weight: m.closet_overlap * 0.10, text: `You already own pieces doing this job — closet overlap is ${m.closet_overlap}%.` },
    { weight: (100 - m.rewear_potential) * 0.15, text: `You are unlikely to reach for this often — rewear potential is ${m.rewear_potential}%.` },
    { weight: (100 - m.versatility) * 0.15, text: `This is a narrow piece — it works in few contexts, scoring ${m.versatility}% on versatility.` },
    { weight: m.maintenance_burden * 0.10, text: `The upkeep is real — care burden is ${m.maintenance_burden}%.` },
    { weight: m.budget_pressure * 0.10, text: `This takes up most of your budget — budget pressure is ${m.budget_pressure}%.` },
    { weight: (100 - m.occasion_match) * 0.20, text: `It is not quite right for the occasion — occasion fit is ${m.occasion_match}%.` },
  ].sort((a, b) => b.weight - a.weight);

  return contributions[0].text;
}

/**
 * ALTERNATIVE ENGINE
 * Same aesthetic, lower decision risk.
 */
export function findAlternatives({ items = [], constraints = {}, limit = 3 }) {
  const target = items[0];
  if (!target) return [];

  const pool = searchCatalog(constraints, { category: target.category, limit: 20 });
  const budget = constraints.budget;

  return pool
    .filter((c) => c.id !== target.id)
    // An "alternative" that blows the budget is not an alternative.
    .filter((c) => (budget ? c.price <= budget : true))
    // It has to still work for the occasion. Suggesting a more versatile piece
    // that doesn't suit the event is not a better match, it's a worse one — and
    // it was quietly producing a second WAIT instead of a way forward.
    .filter((c) => (constraints.occasion ? c.occasion_tags.includes(constraints.occasion) : true))
    // It must actually reduce decision risk, not merely look similar.
    .filter((c) => c.versatility > target.versatility || c.maintenance < target.maintenance - 15)
    .map((c) => ({
      ...c,
      improvement: Math.round(
        (c.versatility - target.versatility) * 0.5 +
        (target.maintenance - c.maintenance) * 0.3 +
        (target.price - c.price) / 10,
      ),
      shares_aesthetic: c.style_tags.filter((t) => target.style_tags.includes(t)).length,
    }))
    // Rank by how much decision risk is actually removed, using shared
    // aesthetic only as a tiebreak. Sorting on aesthetic first surfaced a 44%
    // versatility dress above a 90% one purely because it shared more style
    // tags — which is not "a better match", it is the same mistake again.
    .sort((a, b) => (b.improvement - a.improvement) || (b.shares_aesthetic - a.shares_aesthetic))
    .slice(0, limit)
    .map((c) => ({ ...c, why: whyBetter(c, target, budget) }));
}

/** Say exactly which of the Skeptic's concerns this piece answers. */
function whyBetter(candidate, target, budget) {
  const wins = [];

  if (candidate.versatility > target.versatility) {
    wins.push(`works in more contexts (${candidate.versatility}% vs ${target.versatility}%)`);
  }
  if (candidate.maintenance < target.maintenance - 15) {
    wins.push('far easier to care for');
  }
  if (candidate.price < target.price) {
    wins.push(`$${(target.price - candidate.price).toLocaleString('en-US')} cheaper`);
  }
  if (budget && candidate.price <= budget && target.price > budget) {
    wins.push('inside your budget');
  }

  const shared = candidate.style_tags.find((t) => target.style_tags.includes(t));
  const feel = shared ? `Same ${shared} feel` : 'Similar mood';

  return wins.length ? `${feel} — ${wins.slice(0, 2).join(', ')}.` : `${feel}.`;
}
