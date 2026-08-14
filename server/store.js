/**
 * Store.
 *
 * In-memory is the working set, so every read stays synchronous and fast.
 * When SUPABASE_URL is set, writes are mirrored through to Postgres and the
 * working set is hydrated from it at boot.
 *
 * Write-through rather than read-through on purpose: it keeps the whole
 * codebase free of async plumbing for what is, in a prototype, a handful of
 * rows — and a slow database can never stall a request.
 *
 * Guest Mode: nothing here is written when `guest` is true on the request.
 */

import { db, isEnabled } from './db/supabase.js';

/** Mirror a write to Supabase without making the caller wait. */
const mirror = (fn) => {
  if (isEnabled()) Promise.resolve().then(fn).catch(() => {});
};

const mem = {
  profiles: new Map(),   // userId → profile
  sessions: new Map(),   // sessionId → session
  looks: new Map(),      // lookId → look
  savedLooks: new Map(), // userId → [lookId]
  closets: new Map(),    // userId → [items]
  decisions: new Map(),  // decisionId → decision
  feedback: [],
};

const DEMO_USER = 'demo-user';

const defaultProfile = (userId) => ({
  id: userId,
  style_dna: ['minimal', 'feminine', 'elegant'],
  preferred_colors: ['ivory', 'beige', 'black', 'dusty rose'],
  avoided_colors: ['neon'],
  comfort_priority: 0.8,
  budget_range: [50, 300],
  beauty: null,
  created_at: new Date().toISOString(),
});

export const store = {
  getProfile(userId = DEMO_USER) {
    if (!mem.profiles.has(userId)) {
      const profile = defaultProfile(userId);
      mem.profiles.set(userId, profile);
      mirror(() => db.upsertProfile(profile));
    }
    return mem.profiles.get(userId);
  },

  updateProfile(userId = DEMO_USER, patch = {}) {
    const next = { ...store.getProfile(userId), ...patch, updated_at: new Date().toISOString() };
    mem.profiles.set(userId, next);
    mirror(() => db.upsertProfile(next));
    return next;
  },

  deleteProfile(userId = DEMO_USER) {
    mem.profiles.delete(userId);
    mem.closets.delete(userId);
    mem.savedLooks.delete(userId);
    mirror(() => db.deleteProfile(userId));
    return { deleted: true };
  },

  saveSession(session) {
    mem.sessions.set(session.id, session);
    return session;
  },
  getSession: (id) => mem.sessions.get(id) || null,

  saveLook(look) {
    mem.looks.set(look.id, look);
    return look;
  },
  getLook: (id) => mem.looks.get(id) || null,

  saveForUser(userId = DEMO_USER, look) {
    mem.looks.set(look.id, look);
    const list = mem.savedLooks.get(userId) || [];
    if (!list.includes(look.id)) list.push(look.id);
    mem.savedLooks.set(userId, list);
    mirror(() => db.saveLook(userId, look));
    return look;
  },
  savedLooks(userId = DEMO_USER) {
    return (mem.savedLooks.get(userId) || []).map((id) => mem.looks.get(id)).filter(Boolean);
  },

  closet(userId = DEMO_USER) {
    return mem.closets.get(userId) || [];
  },
  addClosetItem(userId = DEMO_USER, item) {
    const list = mem.closets.get(userId) || [];
    const entry = {
      id: `closet-${Date.now()}-${list.length}`,
      ...item,
      created_at: new Date().toISOString(),
    };
    list.push(entry);
    mem.closets.set(userId, list);
    mirror(() => db.addClosetItem({ ...entry, user_id: userId }));
    return entry;
  },
  removeClosetItem(userId = DEMO_USER, itemId) {
    mem.closets.set(userId, (mem.closets.get(userId) || []).filter((i) => i.id !== itemId));
    mirror(() => db.removeClosetItem(userId, itemId));
    return { removed: true };
  },

  saveDecision(decision) {
    mem.decisions.set(decision.id, decision);
    mirror(() => db.saveDecision(DEMO_USER, decision));
    return decision;
  },

  /**
   * Preference learning loop.
   * Shallow by design: feedback nudges weights, it does not train a model.
   */
  addFeedback(userId = DEMO_USER, entry) {
    mem.feedback.push({ userId, ...entry, created_at: new Date().toISOString() });
    const profile = { ...store.getProfile(userId) };

    if (entry.feedback_type === 'too_expensive') {
      profile.budget_range = [profile.budget_range[0], Math.round(profile.budget_range[1] * 0.85)];
    }
    if (entry.feedback_type === 'too_uncomfortable') {
      profile.comfort_priority = Math.min(1, profile.comfort_priority + 0.1);
    }
    if (entry.feedback_type === 'too_bold') {
      profile.style_dna = [...new Set([...profile.style_dna, 'minimal'])];
    }
    if (entry.feedback_type === 'love' && entry.style_tags) {
      profile.style_dna = [...new Set([...profile.style_dna, ...entry.style_tags])].slice(0, 6);
    }

    mem.profiles.set(userId, profile);
    mirror(() => db.upsertProfile(profile));
    mirror(() => db.addFeedback(userId, entry));
    return { recorded: true, profile };
  },

  /**
   * Load the persisted working set at boot. Called once from server.js.
   * Failure is non-fatal — MAVIE simply starts with an empty in-memory store.
   */
  async hydrate(userId = DEMO_USER) {
    if (!isEnabled()) return { hydrated: false, reason: 'no_supabase' };

    const health = await db.healthCheck();
    if (!health.ok) return { hydrated: false, reason: health.error };

    // Guarantee the profile row exists before anything that references it.
    // Every other table has a foreign key onto profiles(id), and mirrored
    // writes are fire-and-forget — so without this, the first closet item or
    // saved look of a fresh project races the profile insert and loses.
    let profile = await db.getProfile(userId);
    if (!profile) {
      profile = defaultProfile(userId);
      await db.upsertProfile(profile);
    }
    mem.profiles.set(userId, profile);

    const closet = await db.listCloset(userId);
    if (closet?.length) mem.closets.set(userId, closet);

    const looks = await db.listSavedLooks(userId);
    if (looks?.length) {
      looks.forEach((l) => mem.looks.set(l.id, l));
      mem.savedLooks.set(userId, looks.map((l) => l.id));
    }

    return {
      hydrated: true,
      profile: Boolean(profile),
      closet: closet?.length || 0,
      saved_looks: looks?.length || 0,
    };
  },

  /**
   * Reset to the seeded demo state. Replaces the profile and closet outright
   * so a demo run is identical every time, whatever was clicked before it.
   */
  seedDemo(profile, closetItems = []) {
    const userId = DEMO_USER;
    mem.profiles.set(userId, { ...profile, created_at: new Date().toISOString() });
    mem.savedLooks.set(userId, []);

    const items = closetItems.map((item, i) => ({
      id: `demo-closet-${i + 1}`,
      ...item,
      created_at: new Date().toISOString(),
    }));
    mem.closets.set(userId, items);

    mirror(async () => {
      await db.upsertProfile({ ...profile, id: userId });
      await db.replaceCloset(userId, items.map((i) => ({ ...i, user_id: userId })));
    });

    return { profile: mem.profiles.get(userId), closet: items };
  },

  feedbackHistory: () => mem.feedback,
  DEMO_USER,
};
