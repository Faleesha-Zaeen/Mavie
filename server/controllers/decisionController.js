import { decide, findAlternatives } from '../services/decision/verdictService.js';
import { scoreLook } from '../services/decision/scoringService.js';
import { findItem } from '../data/catalog.js';
import { store } from '../store.js';

export async function analyse(req, res, next) {
  try {
    const { items = [], constraints = {}, matchScores, guest } = req.body;
    const resolved = items.map((i) => findItem(i.id) || i);
    const profile = store.getProfile();
    const closet = store.closet();

    const scores = matchScores?.overall
      ? matchScores
      : scoreLook({ items: resolved, constraints, profile, closet });

    const result = await decide({ items: resolved, constraints, profile, closet, matchScores: scores });

    const decision = {
      id: `decision-${Date.now()}`,
      items: resolved.map((i) => i.id),
      verdict: result.verdict,
      buy_confidence: result.buy_confidence,
      regret_risk: result.regret_risk,
      created_at: new Date().toISOString(),
    };
    if (!guest) store.saveDecision(decision);

    res.json({ ...result, match: scores, decision_id: decision.id });
  } catch (err) {
    next(err);
  }
}

export function alternatives(req, res, next) {
  try {
    const { items = [], constraints = {} } = req.body || {};
    const resolved = items.map((i) => findItem(i.id) || i);
    res.json({ alternatives: findAlternatives({ items: resolved, constraints }) });
  } catch (err) {
    next(err);
  }
}

export function feedback(req, res, next) {
  try {
    res.json(store.addFeedback(store.DEMO_USER, req.body));
  } catch (err) {
    next(err);
  }
}
