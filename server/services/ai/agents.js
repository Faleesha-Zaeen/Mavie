/**
 * THE STYLIST 🟢 and THE SKEPTIC 🔴
 *
 * Both agents receive IDENTICAL structured evidence. Neither one decides —
 * they produce structured reasons, and the deterministic Decision Engine
 * weighs that evidence. That separation is what makes MAVIE defensible.
 *
 * Hard constraint on both: do not invent facts.
 */

import { askJSON } from './llm.js';

const STYLIST_SYSTEM = `You are THE STYLIST, one half of MAVIE's decision panel.
Your job: find the strongest reasons this is a GOOD decision, using ONLY the user's stated
goals, preferences, the catalog metadata and the evidence provided.
Do not invent facts. Do not reference anything not present in the evidence.
Return ONLY JSON: { "reasons": [{ "claim": "<one sentence>", "basis": "<field name only>" }] }
Give 2-4 reasons. Be specific, warm and concrete — never generic flattery.

"basis" MUST be a bare field name of at most 3 words, such as "versatility",
"budget_fit" or "occasion_match". It is rendered as a small caption, so it must
never be a sentence, an explanation, or contain backticks or numbers.

All prices are US DOLLARS. Always write them as $42. Never use ₹, rupees, or any
other currency symbol, whatever the user's phrasing looks like.`;

const SKEPTIC_SYSTEM = `You are THE SKEPTIC, one half of MAVIE's decision panel.
Your job: CHALLENGE this purchase. Look for conflicts with the user's goals, budget, closet,
versatility, maintenance preferences and expected usage.
Use ONLY the evidence provided. DO NOT INVENT FACTS. If the evidence does not support a
concern, do not raise it. It is acceptable to return few concerns when the purchase is sound.
Return ONLY JSON: { "concerns": [{ "claim": "<one sentence>", "basis": "<field name only>", "severity": "low|medium|high" }] }
Give 1-4 concerns. Be direct and useful, never preachy or moralising about spending.

Two hard rules:
1. If "already_owns" is non-empty, your FIRST concern must name those specific
   pieces. Someone who already owns three similar dresses needs to hear that
   before anything else — it is the most concrete reason not to buy.
2. State concerns as fact, not as hedge. Write "This works for weddings, not for
   a weeknight dinner", not "this may be less suitable than desired". Never use
   "may be", "might", "could potentially" or "than desired".

"basis" MUST be a bare field name of at most 3 words, such as "versatility",
"closet_overlap" or "budget_pressure". It is rendered as a small caption, so it
must never be a sentence, an explanation, or contain backticks or numbers.

All prices are US DOLLARS. Always write them as $42. Never use ₹, rupees, or any
other currency symbol, whatever the user's phrasing looks like.`;

export async function runPanel(evidence) {
  const payload = JSON.stringify(evidence, null, 2);

  const [stylistAI, skepticAI] = await Promise.all([
    askJSON({ system: STYLIST_SYSTEM, user: `Evidence:\n${payload}` }),
    askJSON({ system: SKEPTIC_SYSTEM, user: `Evidence:\n${payload}` }),
  ]);

  const stylist = normalise(stylistAI?.reasons) || deterministicStylist(evidence);
  const skeptic = normalise(skepticAI?.concerns) || deterministicSkeptic(evidence);

  return {
    stylist,
    skeptic,
    debate: interleave(stylist, skeptic),
  };
}

/* ── Deterministic fallbacks: fully functional with no LLM key ───────────── */

export function deterministicStylist({ metrics, constraints, items, makeup }) {
  const reasons = [];
  const goal = (constraints.goal || []).slice(0, 2).join(' and ') || 'what you described';

  if (metrics.occasion_match >= 85) {
    reasons.push({
      claim: `This reads correctly for ${article(constraints.occasion)} — occasion fit scores ${metrics.occasion_match}%.`,
      basis: 'occasion_match',
    });
  }
  if (metrics.style_match >= 82) {
    reasons.push({
      claim: `The silhouette lines up with your preference for ${goal}, scoring ${metrics.style_match}% on style.`,
      basis: 'style_match',
    });
  }
  if (metrics.budget_fit >= 90) {
    const total = items.reduce((s, i) => s + i.price, 0);
    reasons.push({
      claim: `At $${total.toLocaleString('en-US')} it sits comfortably inside the budget you set.`,
      basis: 'budget_fit',
    });
  }
  if (metrics.versatility >= 80) {
    reasons.push({
      claim: `These pieces carry across several contexts, so the cost spreads over more than one wear.`,
      basis: 'versatility',
    });
  }
  if (makeup) {
    reasons.push({
      claim: `The ${makeup.name.toLowerCase()} makeup direction coordinates with the palette rather than competing with it.`,
      basis: 'makeup',
    });
  }

  return reasons.slice(0, 4).length
    ? reasons.slice(0, 4)
    : [{ claim: 'This is a workable match for what you described.', basis: 'overall' }];
}

export function deterministicSkeptic(evidence) {
  const { metrics, constraints, items } = evidence;
  const concerns = [];

  // Lead with what she already owns — same rule the LLM Skeptic is given.
  const owned = (evidence.already_owns || []).map((o) => o.owned);
  if (owned.length) {
    concerns.push({
      claim: `You already own ${owned.length} ${owned.length === 1 ? 'piece' : 'pieces'} doing this job — ${owned.slice(0, 3).join(', ')}.`,
      basis: 'closet_overlap',
      severity: owned.length >= 3 ? 'high' : 'medium',
    });
  }

  if (metrics.versatility < 65) {
    concerns.push({
      claim: `Versatility is only ${metrics.versatility}% — this leans occasion-specific rather than everyday.`,
      basis: 'versatility',
      severity: metrics.versatility < 50 ? 'high' : 'medium',
    });
  }
  if (metrics.rewear_potential < 65) {
    concerns.push({
      claim: `Expected rewear sits at ${metrics.rewear_potential}%. You said you prefer pieces you'll reach for repeatedly.`,
      basis: 'rewear_potential',
      severity: metrics.rewear_potential < 50 ? 'high' : 'medium',
    });
  }
  if (!owned.length && metrics.closet_overlap > 25) {
    concerns.push({
      claim: `Your closet already contains pieces serving a similar purpose — overlap is ${metrics.closet_overlap}%.`,
      basis: 'closet_overlap',
      severity: metrics.closet_overlap > 50 ? 'high' : 'medium',
    });
  }
  if (metrics.maintenance_burden > 60) {
    concerns.push({
      claim: `Care burden is high (${metrics.maintenance_burden}%) — delicate fabrics that need real upkeep.`,
      basis: 'maintenance_burden',
      severity: 'medium',
    });
  }
  if (metrics.budget_pressure > 40) {
    concerns.push({
      claim: `This consumes most of your stated budget, leaving little room for the rest of the look.`,
      basis: 'budget_pressure',
      severity: metrics.budget_pressure > 60 ? 'high' : 'medium',
    });
  }
  if (constraints.comfort_priority > 0.7) {
    const stiff = items.filter((i) => i.fit === 'fitted').length;
    if (stiff >= 2) {
      concerns.push({
        claim: `You put comfort high on the list, and this look leans structured and fitted.`,
        basis: 'comfort_priority',
        severity: 'low',
      });
    }
  }

  return concerns.slice(0, 4).length
    ? concerns.slice(0, 4)
    : [{
        claim: 'No strong objection from the evidence — the main open question is whether you love it enough to reach for it often.',
        basis: 'overall',
        severity: 'low',
      }];
}

/** "an interview", "a wedding" — small thing, but it reads as sloppy otherwise. */
function article(occasion) {
  if (!occasion) return 'a moment like this';
  return `${/^[aeiou]/i.test(occasion) ? 'an' : 'a'} ${occasion}`;
}

/** Alternate the two sides so the UI can render it as an actual argument. */
function interleave(stylist, skeptic) {
  const turns = [];
  const max = Math.max(stylist.length, skeptic.length);
  for (let i = 0; i < max; i++) {
    if (stylist[i]) turns.push({ side: 'stylist', ...stylist[i] });
    if (skeptic[i]) turns.push({ side: 'skeptic', ...skeptic[i] });
  }
  return turns;
}

function normalise(list) {
  if (!Array.isArray(list) || !list.length) return null;
  const cleaned = list
    .filter((r) => r && typeof r.claim === 'string' && r.claim.length > 3)
    .map((r) => ({
      claim: cleanClaim(r.claim),
      basis: cleanBasis(r.basis),
      ...(r.severity ? { severity: r.severity } : {}),
    }))
    .slice(0, 4);
  return cleaned.length ? cleaned : null;
}

/**
 * The model occasionally slips into rupees — the prompts are full of Indian
 * phrasing and it pattern-matches. Prices are USD everywhere in MAVIE, so this
 * is enforced in code rather than trusted to the instruction.
 */
export function cleanClaim(claim) {
  return String(claim)
    .replace(/₹\s?/g, '$')
    // "899 rupees" / "899 rs"  →  "$899"
    .replace(/\b(\d[\d,]*)\s*(?:rupees|rs\.?|inr)\b/gi, '$$$1')
    // "Rs. 899" / "INR 899"  →  "$899"
    .replace(/\b(?:rs\.?|inr)\s*(\d[\d,]*)/gi, '$$$1')
    .replace(/`/g, '')
    .trim()
    .slice(0, 240);
}

/**
 * `basis` is rendered as a small caption under each claim. The model sometimes
 * returns a whole explanatory sentence instead of a field name, which breaks
 * the layout — so reduce it to the field it is clearly pointing at.
 */
const KNOWN_FIELDS = [
  'occasion_match', 'style_match', 'budget_fit', 'versatility', 'rewear_potential',
  'closet_overlap', 'maintenance_burden', 'budget_pressure', 'visual_match',
  'comfort_priority', 'style_preferences', 'style_dna', 'occasion_tags', 'style_tags', 'price',
];

export function cleanBasis(raw) {
  const text = String(raw || 'evidence').toLowerCase().replace(/[`'"]/g, '');

  // Prefer an explicit field name mentioned anywhere in the string.
  const snake = text.replace(/\s+/g, '_');
  const hit = KNOWN_FIELDS.find((f) => snake.includes(f) || text.includes(f.replace(/_/g, ' ')));
  if (hit) return hit;

  // Otherwise keep it to a short caption rather than a sentence.
  const words = text.replace(/[^a-z_\s]/g, '').trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 3).join('_') || 'evidence';
}
