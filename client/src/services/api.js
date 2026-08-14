const BASE = import.meta.env.VITE_API_URL || '';

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Every error surfaces a human sentence, never a status code.
    const err = new Error(data.message || "MAVIE couldn't complete that. Please try again.");
    err.code = data.error;
    err.issues = data.issues;
    throw err;
  }
  return data;
}

export const api = {
  health: () => request('/health'),

  parseContext: (text) => request('/context/parse', { method: 'POST', body: { text } }),
  getProfile: () => request('/profile'),
  updateProfile: (patch) => request('/profile', { method: 'POST', body: patch }),
  deleteProfile: () => request('/profile', { method: 'DELETE' }),

  analyseSkin: (payload) => request('/skin/analyze', { method: 'POST', body: payload }),
  recommendMakeup: (payload) => request('/makeup/recommend', { method: 'POST', body: payload }),
  makeupVTO: (payload) => request('/makeup/try-on', { method: 'POST', body: payload }),

  catalog: (category) => request(`/catalog${category ? `?category=${category}` : ''}`),
  composeLooks: (constraints, guest) => request('/outfits/compose', { method: 'POST', body: { constraints, guest } }),
  compareLooks: (looks) => request('/looks/compare', { method: 'POST', body: { looks } }),
  saveLook: (look) => request('/looks/save', { method: 'POST', body: look }),
  savedLooks: () => request('/looks/saved'),

  tryOnClothes: (payload) => request('/vto/clothes', { method: 'POST', body: payload }),

  analyseProduct: (payload) => request('/product/analyze', { method: 'POST', body: payload }),
  productBuyConfidence: (payload) => request('/product/buy-confidence', { method: 'POST', body: payload }),

  analyseDecision: (payload) => request('/decision/analyze', { method: 'POST', body: payload }),
  alternatives: (payload) => request('/alternatives', { method: 'POST', body: payload }),
  feedback: (payload) => request('/feedback', { method: 'POST', body: payload }),

  closet: () => request('/closet'),
  addClosetItem: (item) => request('/closet/upload', { method: 'POST', body: item }),
  removeClosetItem: (id) => request(`/closet/${id}`, { method: 'DELETE' }),
  analyseCloset: () => request('/closet/analyze', { method: 'POST', body: {} }),
  styleCloset: (constraints) => request('/closet/style', { method: 'POST', body: { constraints } }),
};
