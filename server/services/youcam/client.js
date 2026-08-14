/**
 * Perfect Corp. / YouCam shared client.
 *
 * Keys live ONLY on the server. Never expose them to the browser.
 *
 * Perfect Corp. uses a two-step auth (id_token exchange) and a
 * upload → run task → poll workflow. The exact endpoint paths differ by
 * account and API version, so each service declares its own path and this
 * module handles auth, retries and the mock fallback.
 */

import crypto from 'node:crypto';

const BASE = () => process.env.YOUCAM_API_BASE || 'https://yce-api-01.perfectcorp.com';

export const hasCredentials = () =>
  Boolean(process.env.YOUCAM_API_KEY && process.env.YOUCAM_SECRET_KEY);

let cachedToken = null;
let tokenExpiry = 0;

/**
 * Perfect Corp. does NOT accept the secret key directly.
 * The secret is an RSA public key; the id_token is
 *   base64( RSA_PKCS1_encrypt( "client_id=<key>&timestamp=<ms>" ) )
 * The timestamp makes each token single-use, so this is rebuilt per auth.
 */
function buildIdToken() {
  const secret = process.env.YOUCAM_SECRET_KEY.replace(/\s+/g, '');
  const pem = [
    '-----BEGIN PUBLIC KEY-----',
    ...(secret.match(/.{1,64}/g) || []),
    '-----END PUBLIC KEY-----',
  ].join('\n');

  const payload = `client_id=${process.env.YOUCAM_API_KEY}&timestamp=${Date.now()}`;

  return crypto
    .publicEncrypt(
      { key: pem, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(payload, 'utf8'),
    )
    .toString('base64');
}

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await fetch(`${BASE()}/s2s/v1.0/client/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.YOUCAM_API_KEY,
      id_token: buildIdToken(),
    }),
  });

  if (!res.ok) throw new Error(`YouCam auth failed (${res.status})`);
  const data = await res.json();
  cachedToken = data.result?.access_token || data.access_token;
  if (!cachedToken) throw new Error('YouCam auth returned no access token');

  // Refresh a little early to avoid mid-demo expiry.
  tokenExpiry = Date.now() + 1000 * 60 * 50;
  return cachedToken;
}

export async function youcamFetch(path, { method = 'POST', body, headers = {} } = {}) {
  const token = await getToken();
  const res = await fetch(`${BASE()}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`YouCam ${path} → ${res.status} ${detail.slice(0, 200)}`);
  }
  return res.json();
}

/** Poll a task until it completes. Perfect Corp. tasks are asynchronous. */
export async function pollTask(pollPath, { attempts = 20, intervalMs = 1500 } = {}) {
  for (let i = 0; i < attempts; i++) {
    const data = await youcamFetch(pollPath, { method: 'GET' });
    const status = data.result?.status || data.status;
    if (status === 'success' || status === 'completed') return data;
    if (status === 'error' || status === 'failed') {
      throw new Error(`YouCam task failed: ${JSON.stringify(data).slice(0, 200)}`);
    }
    await sleep(intervalMs);
  }
  throw new Error('YouCam task timed out');
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
