/**
 * Supabase persistence adapter.
 *
 * Speaks the PostgREST HTTP API directly — no SDK dependency, which keeps the
 * install small and means one less thing to break the night before a demo.
 *
 * Enabled automatically when SUPABASE_URL and SUPABASE_SERVICE_KEY are set.
 * Everything is best-effort: if a write fails, MAVIE logs it and carries on
 * with the in-memory copy rather than failing the user's request. Losing a
 * saved look is annoying; a 500 in the middle of a demo is worse.
 */

export const isEnabled = () =>
  Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);

const headers = () => ({
  'Content-Type': 'application/json',
  apikey: process.env.SUPABASE_SERVICE_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
});

async function rest(path, { method = 'GET', body, prefer } = {}) {
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { ...headers(), ...(prefer ? { Prefer: prefer } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw new Error(`Supabase ${method} ${path} → ${res.status} ${(await res.text()).slice(0, 160)}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/** Never let a persistence failure break the request. */
const safe = async (label, fn, fallback = null) => {
  try {
    return await fn();
  } catch (err) {
    console.warn(`[supabase] ${label} failed, continuing in memory:`, err.message);
    return fallback;
  }
};

/**
 * closet_items, looks and decisions all reference profiles(id). Writes are
 * mirrored fire-and-forget, so a dependent write can reach Postgres before the
 * profile upsert does and fail with 23503 (foreign key violation).
 *
 * Rather than ordering every call site, any write that hits 23503 creates the
 * missing profile row and retries once.
 */
const isMissingProfile = (err) => /23503/.test(err.message);

async function withProfile(userId, label, fn) {
  try {
    return await fn();
  } catch (err) {
    if (!isMissingProfile(err)) throw err;
    await db.upsertProfile({ id: userId });
    console.warn(`[supabase] ${label}: created missing profile row, retrying`);
    return fn();
  }
}

export const db = {
  async getProfile(userId) {
    return safe('getProfile', async () => {
      const rows = await rest(`profiles?id=eq.${userId}&select=*`);
      return rows?.[0] || null;
    });
  },

  async upsertProfile(profile) {
    return safe('upsertProfile', () =>
      rest('profiles', {
        method: 'POST',
        body: [{ ...profile, updated_at: new Date().toISOString() }],
        prefer: 'resolution=merge-duplicates,return=representation',
      }),
    );
  },

  async deleteProfile(userId) {
    // Cascades to closet, looks, saved looks, decisions and feedback.
    return safe('deleteProfile', () => rest(`profiles?id=eq.${userId}`, { method: 'DELETE' }));
  },

  async listCloset(userId) {
    return safe('listCloset', () => rest(`closet_items?user_id=eq.${userId}&select=*&order=created_at`), []);
  },

  async addClosetItem(item) {
    return safe('addClosetItem', () =>
      withProfile(item.user_id, 'addClosetItem', () =>
        rest('closet_items', { method: 'POST', body: [item], prefer: 'return=representation' }),
      ),
    );
  },

  async removeClosetItem(userId, itemId) {
    return safe('removeClosetItem', () =>
      rest(`closet_items?id=eq.${itemId}&user_id=eq.${userId}`, { method: 'DELETE' }),
    );
  },

  async saveLook(userId, look) {
    return safe('saveLook', () => withProfile(userId, 'saveLook', async () => {
      await rest('looks', {
        method: 'POST',
        body: [{
          id: look.id,
          user_id: userId,
          name: look.name,
          archetype: look.archetype,
          items: look.items,
          makeup: look.makeup,
          total: look.total,
          scores: look.scores,
          explanation: look.explanation,
        }],
        prefer: 'resolution=merge-duplicates',
      });
      await rest('saved_looks', {
        method: 'POST',
        body: [{ user_id: userId, look_id: look.id }],
        prefer: 'resolution=merge-duplicates',
      });
      return true;
    }));
  },

  async listSavedLooks(userId) {
    return safe('listSavedLooks', async () => {
      const rows = await rest(
        `saved_looks?user_id=eq.${userId}&select=saved_at,looks(*)&order=saved_at.desc`,
      );
      return (rows || []).map((r) => r.looks).filter(Boolean);
    }, []);
  },

  async saveDecision(userId, decision) {
    return safe('saveDecision', () =>
      withProfile(userId, 'saveDecision', () =>
        rest('decisions', { method: 'POST', body: [{ ...decision, user_id: userId }] }),
      ),
    );
  },

  async addFeedback(userId, entry) {
    return safe('addFeedback', () =>
      withProfile(userId, 'addFeedback', () =>
        rest('feedback', { method: 'POST', body: [{ ...entry, user_id: userId }] }),
      ),
    );
  },

  /** Called once at boot so a bad URL or key surfaces immediately, not mid-demo. */
  async healthCheck() {
    try {
      await rest('profiles?select=id&limit=1');
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },
};
