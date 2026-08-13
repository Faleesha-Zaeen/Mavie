import { parseContext } from '../services/ai/contextService.js';
import { store } from '../store.js';

export async function parse(req, res, next) {
  try {
    const constraints = await parseContext(req.body.text);
    const profile = store.getProfile();

    // Fill gaps from the persisted profile rather than guessing.
    if (constraints.budget == null && profile.budget_range) {
      constraints.budget = profile.budget_range[1];
      constraints.budget_inferred = true;
    }
    if (!constraints.avoided_colors?.length) {
      constraints.avoided_colors = profile.avoided_colors;
    }

    const session = store.saveSession({
      id: `session-${Date.now()}`,
      occasion: constraints.occasion,
      goal: constraints.goal,
      budget: constraints.budget,
      context: constraints,
      created_at: new Date().toISOString(),
    });

    res.json({ constraints, session_id: session.id });
  } catch (err) {
    next(err);
  }
}

export function getProfile(req, res) {
  res.json({ profile: store.getProfile() });
}

export function updateProfile(req, res) {
  res.json({ profile: store.updateProfile(store.DEMO_USER, req.body || {}) });
}

export function deleteProfile(req, res) {
  res.json(store.deleteProfile());
}
