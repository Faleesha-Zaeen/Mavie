/**
 * YouCam connectivity check.
 *
 *   npm run check:youcam
 *
 * Tells you exactly which step fails: network, credentials, or endpoint path.
 * Deliberately never prints the access token or your keys.
 */

import 'dotenv/config';
import crypto from 'node:crypto';
import { resilientFetch } from '../services/youcam/client.js';

const BASE = process.env.YOUCAM_API_BASE || 'https://yce-api-01.perfectcorp.com';
const ok = (s) => `\x1b[32m✓\x1b[0m ${s}`;
const bad = (s) => `\x1b[31m✗\x1b[0m ${s}`;
const info = (s) => `  \x1b[2m${s}\x1b[0m`;

console.log('\n  💗 MAVIE · YouCam check\n');

/* ── 1. Credentials present ─────────────────────────────────────────── */
if (!process.env.YOUCAM_API_KEY || !process.env.YOUCAM_SECRET_KEY) {
  console.log(bad('No credentials in server/.env'));
  console.log(info('Set YOUCAM_API_KEY and YOUCAM_SECRET_KEY, then re-run.'));
  process.exit(1);
}
console.log(ok('Credentials found in server/.env'));

/* ── 2. Network reachability ────────────────────────────────────────── */
try {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 10000);
  await resilientFetch(BASE, { method: 'GET' }).catch((e) => { throw e; });
  clearTimeout(timer);
  console.log(ok(`Reached ${BASE}`));
} catch (err) {
  console.log(bad(`Cannot reach ${BASE}`));
  console.log(info(`Reason: ${err.cause?.code || err.name}`));
  console.log(info('Check your internet, VPN, firewall or corporate proxy.'));
  console.log(info('If you are on college wifi, try a phone hotspot.'));
  process.exit(1);
}

/* ── 3. RSA id_token construction ───────────────────────────────────── */
let idToken;
try {
  const secret = process.env.YOUCAM_SECRET_KEY.replace(/\s+/g, '');
  const pem = [
    '-----BEGIN PUBLIC KEY-----',
    ...(secret.match(/.{1,64}/g) || []),
    '-----END PUBLIC KEY-----',
  ].join('\n');

  idToken = crypto
    .publicEncrypt(
      { key: pem, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(`client_id=${process.env.YOUCAM_API_KEY}&timestamp=${Date.now()}`, 'utf8'),
    )
    .toString('base64');

  console.log(ok('Built RSA id_token from your secret key'));
} catch (err) {
  console.log(bad('Could not build id_token from YOUCAM_SECRET_KEY'));
  console.log(info(`Reason: ${err.message}`));
  console.log(info('The secret key should be the base64 RSA public key from the'));
  console.log(info('Perfect Corp console — one long line, no BEGIN/END headers.'));
  process.exit(1);
}

/* ── 4. Authenticate ────────────────────────────────────────────────── */
let token;
try {
  const res = await resilientFetch(`${BASE}/s2s/v1.0/client/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: process.env.YOUCAM_API_KEY, id_token: idToken }),
  });

  const data = await res.json().catch(() => ({}));
  token = data.result?.access_token || data.access_token;

  if (!token) {
    console.log(bad(`Auth failed — HTTP ${res.status}`));
    console.log(info(`Response: ${JSON.stringify({ error: data.error, error_code: data.error_code, message: data.message })}`));
    console.log(info('Usually means the key pair is wrong, expired, or not activated.'));
    process.exit(1);
  }

  console.log(ok('Authenticated — access token received'));
} catch (err) {
  console.log(bad(`Auth request threw: ${err.message}`));
  process.exit(1);
}

/* ── 5. Endpoint paths ──────────────────────────────────────────────── */
console.log('\n  Checking endpoint paths (these vary by account):\n');

const ENDPOINTS = [
  ['Skin Analysis', '/s2s/v1.1/task/skin-analysis'],
  ['Apparel VTO', '/s2s/v1.0/task/cloth-tryon'],
  ['Makeup VTO', '/s2s/v1.0/task/makeup-tryon'],
];

for (const [name, path] of ENDPOINTS) {
  try {
    const res = await resilientFetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ request_id: Date.now(), payload: {} }),
    });

    // 400/422 means the path EXISTS and simply rejected our empty payload —
    // that is the result we want here. 404 means the path is wrong.
    if (res.status === 404) {
      console.log(bad(`${name.padEnd(15)} ${path} → 404 (wrong path for your account)`));
    } else if (res.status === 401 || res.status === 403) {
      console.log(bad(`${name.padEnd(15)} ${path} → ${res.status} (not enabled on your plan)`));
    } else {
      console.log(ok(`${name.padEnd(15)} ${path} → ${res.status} (endpoint exists)`));
    }
  } catch (err) {
    console.log(bad(`${name.padEnd(15)} ${path} → ${err.message}`));
  }
}

console.log('\n  Send this whole output to Claude to fix any ✗ lines.\n');
