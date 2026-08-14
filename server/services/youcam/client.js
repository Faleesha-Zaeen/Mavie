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
import https from 'node:https';

/**
 * DNS-hijack bypass.
 *
 * Some ISPs (Reliance Jio in India, confirmed) intercept DNS and answer every
 * perfectcorp.com hostname with a single sinkhole address, so the API is
 * unreachable even though nothing is wrong with the account or the network
 * route. Verified: the system resolver returned 49.44.79.236 for every host,
 * while the real address is 32.187.59.159 — and connecting to the real address
 * directly succeeds. The block is DNS-only.
 *
 * So we resolve over DNS-over-HTTPS (which the ISP cannot intercept) and
 * connect to the real IP with the correct SNI and Host header. On a normal
 * network this behaves identically; it simply resolves correctly either way.
 *
 * Set YOUCAM_DOH=off to disable and use the system resolver.
 */

const ipCache = new Map();
const DOH_TTL = 5 * 60 * 1000;

async function resolveViaDoH(host) {
  if (process.env.YOUCAM_DOH === 'off') return [];

  const cached = ipCache.get(host);
  if (cached && Date.now() < cached.expires) return cached.ips;

  try {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${host}&type=A`, {
      headers: { accept: 'application/dns-json' },
    });
    const data = await res.json();
    const ips = (data.Answer || []).filter((a) => a.type === 1).map((a) => a.data);
    if (ips.length) {
      ipCache.set(host, { ips, expires: Date.now() + DOH_TTL });
      return ips;
    }
  } catch (err) {
    console.warn('[youcam] DoH resolve failed, using system DNS:', err.message);
  }
  return [];
}

/** HTTPS request pinned to a specific IP, preserving SNI and Host. */
function requestVia(ip, host, path, { method, headers = {}, body }) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: ip,
        servername: host, // SNI — required or TLS fails
        port: 443,
        path,
        method,
        timeout: 30000,
        headers: {
          ...headers,
          Host: host,
          ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        },
      },
      (res) => {
        let text = '';
        res.on('data', (c) => { text += c; });
        res.on('end', () => resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          text: () => Promise.resolve(text),
          json: () => Promise.resolve(JSON.parse(text)),
        }));
      },
    );
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

/**
 * fetch() replacement that routes around a hijacked resolver.
 * Falls back to normal fetch when DoH gives us nothing.
 */
export async function resilientFetch(url, options = {}) {
  const { hostname, pathname, search } = new URL(url);
  const ips = await resolveViaDoH(hostname);

  if (!ips.length) return fetch(url, options);

  let lastErr;
  for (const ip of ips) {
    try {
      return await requestVia(ip, hostname, pathname + search, options);
    } catch (err) {
      lastErr = err;
    }
  }
  // Every real IP failed — let plain fetch have the last word.
  console.warn(`[youcam] direct-IP attempts failed (${lastErr?.message}), falling back to system DNS`);
  return fetch(url, options);
}

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

  const res = await resilientFetch(`${BASE()}/s2s/v1.0/client/auth`, {
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
  const res = await resilientFetch(`${BASE()}${path}`, {
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
