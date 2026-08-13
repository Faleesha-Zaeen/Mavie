import { catalog, beautyCatalog, findItem } from '../data/catalog.js';
import { searchCatalog } from '../services/catalog/searchService.js';
import { composeLooks } from '../services/catalog/outfitComposer.js';
import { scoreLook } from '../services/decision/scoringService.js';
import { store } from '../store.js';

export function list(req, res) {
  const { category } = req.query;
  const items = category ? catalog.filter((c) => c.category === category) : catalog;
  res.json({ items, beauty: beautyCatalog, count: items.length });
}

export function search(req, res, next) {
  try {
    const { constraints = {}, category, limit } = req.body || {};
    res.json({ items: searchCatalog(constraints, { category, limit }) });
  } catch (err) {
    next(err);
  }
}

export function compose(req, res, next) {
  try {
    const { constraints, guest } = req.body;
    const profile = store.getProfile();
    const closet = store.closet();

    const looks = composeLooks(constraints, profile, closet);

    if (!looks.length) {
      return res.status(422).json({
        error: 'no_looks',
        message: "MAVIE couldn't build a complete look inside those constraints. Try widening the budget a little.",
      });
    }

    if (!guest) looks.forEach((l) => store.saveLook(l));

    res.json({
      looks,
      pick: looks[0].id,
      pick_reason: `${looks[0].name} is the closest match to what you told MAVIE you wanted.`,
    });
  } catch (err) {
    next(err);
  }
}

export function score(req, res, next) {
  try {
    const { items = [], constraints = {}, makeup = null } = req.body || {};
    const resolved = items.map((i) => findItem(i.id) || i);
    res.json({ scores: scoreLook({ items: resolved, makeup, constraints, profile: store.getProfile(), closet: store.closet() }) });
  } catch (err) {
    next(err);
  }
}

export function compare(req, res, next) {
  try {
    const { looks = [] } = req.body || {};
    const rows = ['occasion', 'style', 'preference', 'budget', 'comfort', 'beauty'];
    res.json({
      rows: rows.map((key) => ({
        factor: key,
        values: looks.map((l) => l.scores?.[key] ?? 0),
      })),
      overall: looks.map((l) => l.scores?.overall ?? 0),
      winner: looks.reduce((best, l) => ((l.scores?.overall ?? 0) > (best.scores?.overall ?? 0) ? l : best), looks[0] || null)?.id,
    });
  } catch (err) {
    next(err);
  }
}

export function saveLook(req, res) {
  const look = req.body;
  store.saveForUser(store.DEMO_USER, { ...look, saved_at: new Date().toISOString() });
  res.json({ saved: true, look_id: look.id });
}

export function savedLooks(req, res) {
  res.json({ looks: store.savedLooks() });
}
