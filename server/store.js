/**
 * In-memory store.
 *
 * The prototype runs with zero configuration. When SUPABASE_URL is set the
 * same interface is backed by Postgres — the table shapes below mirror the
 * schema documented in the README.
 *
 * Guest Mode: nothing here is written when `guest` is true on the request.
 */

const db = {
  profiles: new Map(),   // userId → profile
  sessions: new Map(),   // sessionId → session
  looks: new Map(),      // lookId → look
  savedLooks: new Map(), // userId → [lookId]
  closets: new Map(),    // userId → [items]
  decisions: new Map(),  // decisionId → decision
  feedback: [],
};

const DEMO_USER = 'demo-user';

export const store = {
  getProfile(userId = DEMO_USER) {
    if (!db.profiles.has(userId)) {
      db.profiles.set(userId, {
        id: userId,
        style_dna: ['minimal', 'feminine', 'elegant'],
        preferred_colors: ['ivory', 'beige', 'black', 'dusty rose'],
        avoided_colors: ['neon'],
        comfort_priority: 0.8,
        budget_range: [50, 300],
        beauty: null,
        created_at: new Date().toISOString(),
      });
    }
    return db.profiles.get(userId);
  },

  updateProfile(userId = DEMO_USER, patch = {}) {
    const current = store.getProfile(userId);
    const next = { ...current, ...patch, updated_at: new Date().toISOString() };
    db.profiles.set(userId, next);
    return next;
  },

  deleteProfile(userId = DEMO_USER) {
    db.profiles.delete(userId);
    db.closets.delete(userId);
    db.savedLooks.delete(userId);
    return { deleted: true };
  },

  saveSession(session) {
    db.sessions.set(session.id, session);
    return session;
  },
  getSession: (id) => db.sessions.get(id) || null,

  saveLook(look) {
    db.looks.set(look.id, look);
    return look;
  },
  getLook: (id) => db.looks.get(id) || null,

  saveForUser(userId = DEMO_USER, look) {
    db.looks.set(look.id, look);
    const list = db.savedLooks.get(userId) || [];
    if (!list.includes(look.id)) list.push(look.id);
    db.savedLooks.set(userId, list);
    return look;
  },
  savedLooks(userId = DEMO_USER) {
    return (db.savedLooks.get(userId) || []).map((id) => db.looks.get(id)).filter(Boolean);
  },

  closet(userId = DEMO_USER) {
    return db.closets.get(userId) || [];
  },
  addClosetItem(userId = DEMO_USER, item) {
    const list = db.closets.get(userId) || [];
    const entry = { id: `closet-${Date.now()}-${list.length}`, ...item, created_at: new Date().toISOString() };
    list.push(entry);
    db.closets.set(userId, list);
    return entry;
  },
  removeClosetItem(userId = DEMO_USER, itemId) {
    const list = (db.closets.get(userId) || []).filter((i) => i.id !== itemId);
    db.closets.set(userId, list);
    return { removed: true };
  },

  saveDecision(decision) {
    db.decisions.set(decision.id, decision);
    return decision;
  },

  /**
   * Preference learning loop.
   * Shallow by design: feedback nudges weights, it does not train a model.
   */
  addFeedback(userId = DEMO_USER, entry) {
    db.feedback.push({ userId, ...entry, created_at: new Date().toISOString() });
    const profile = store.getProfile(userId);

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

    db.profiles.set(userId, profile);
    return { recorded: true, profile };
  },

  feedbackHistory: () => db.feedback,
  DEMO_USER,
};
