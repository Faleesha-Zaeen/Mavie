/**
 * MAVIE PRE-FLIGHT
 *
 *   npm run preflight
 *
 * One command, run before demoing, that answers: will everything work right
 * now? It checks each dependency and — importantly — says what happens when
 * one is down, because MAVIE is built to degrade rather than fail.
 *
 * Never prints keys or tokens.
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { catalog } from '../data/catalog.js';
import { stats } from '../services/cache.js';
import { resilientFetch, hasCredentials } from '../services/youcam/client.js';
import { activeProvider } from '../services/ai/llm.js';

const DIR = path.dirname(fileURLToPath(import.meta.url));

const OK = '\x1b[32m✓\x1b[0m';
const WARN = '\x1b[33m!\x1b[0m';
const FAIL = '\x1b[31m✗\x1b[0m';
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

const rows = [];
const line = (mark, name, detail, note) => {
  rows.push({ mark, name, detail, note });
  console.log(`  ${mark} ${name.padEnd(20)} ${String(detail).padEnd(34)} ${note ? dim(note) : ''}`);
};

console.log('\n  💗 MAVIE · pre-flight\n');

/* ── Gemini ──────────────────────────────────────────────────────────── */
const provider = activeProvider();
if (provider === 'mock') {
  line(WARN, 'LLM', 'no key — deterministic reasoner', 'agents use templates');
} else {
  try {
    const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'ok' }] }], generationConfig: { maxOutputTokens: 800 } }) },
    );
    if (res.ok) line(OK, 'LLM', `${provider} · ${model}`, 'live');
    else if (res.status === 429) line(WARN, 'LLM', `${provider} · quota exhausted`, 'falls back to cache, then templates');
    else line(FAIL, 'LLM', `${provider} · HTTP ${res.status}`, 'falls back to templates');
  } catch (err) {
    line(FAIL, 'LLM', `unreachable`, err.message.slice(0, 40));
  }
}

/* ── Supabase ────────────────────────────────────────────────────────── */
if (!process.env.SUPABASE_URL) {
  line(WARN, 'Database', 'in-memory', 'closet and saved looks reset on restart');
} else {
  try {
    const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`, {
      headers: { apikey: process.env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}` },
    });
    if (res.ok) line(OK, 'Database', 'supabase', 'persists across restarts');
    else line(FAIL, 'Database', `HTTP ${res.status}`, 'falls back to in-memory');
  } catch {
    line(FAIL, 'Database', 'unreachable', 'falls back to in-memory');
  }
}

/* ── YouCam ──────────────────────────────────────────────────────────── */
let token = null;
if (!hasCredentials()) {
  line(WARN, 'YouCam auth', 'no credentials', 'skin + try-on are mocked');
} else {
  try {
    const secret = process.env.YOUCAM_SECRET_KEY.replace(/\s+/g, '');
    const pem = ['-----BEGIN PUBLIC KEY-----', ...(secret.match(/.{1,64}/g) || []), '-----END PUBLIC KEY-----'].join('\n');
    const idToken = crypto.publicEncrypt(
      { key: pem, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(`client_id=${process.env.YOUCAM_API_KEY}&timestamp=${Date.now()}`),
    ).toString('base64');

    const base = process.env.YOUCAM_API_BASE || 'https://yce-api-01.perfectcorp.com';
    const res = await resilientFetch(`${base}/s2s/v1.0/client/auth`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: process.env.YOUCAM_API_KEY, id_token: idToken }),
    });
    const data = await res.json().catch(() => ({}));
    token = data.result?.access_token || data.access_token;
    if (token) line(OK, 'YouCam auth', 'authenticated', 'via DNS-over-HTTPS');
    else line(FAIL, 'YouCam auth', `HTTP ${res.status}`, 'skin + try-on are mocked');
  } catch (err) {
    line(FAIL, 'YouCam auth', 'unreachable', err.message.slice(0, 40));
  }
}

/* ── YouCam credits and entitlements ─────────────────────────────────── */
if (token) {
  const base = process.env.YOUCAM_API_BASE || 'https://yce-api-01.perfectcorp.com';
  const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  try {
    const res = await resilientFetch(`${base}/s2s/v1.0/client/credit`, { method: 'GET', headers: H });
    const d = await res.json();
    const total = (d.results || []).reduce((n, c) => n + (c.amount || 0), 0);
    line(total > 0 ? OK : WARN, 'YouCam credits', `${total} remaining`, total > 0 ? '' : 'top up before demoing');
  } catch {
    line(WARN, 'YouCam credits', 'could not read', '');
  }

  // Distinguish "action not provisioned" from "parameters rejected" — they
  // need completely different fixes and only one of them is ours.
  // A hosted sample image, so the probe exercises the real parameter set.
  const SAMPLE = 'https://plugins-media.makeupar.com/strapi/assets/skin_analysis_01_5b5defd339.png';

  const probe = async (name, endpoint, body) => {
    try {
      const res = await resilientFetch(`${base}${endpoint}`, { method: 'POST', headers: H, body: JSON.stringify(body) });
      const text = await res.text();
      if (res.status === 404) return line(FAIL, name, 'endpoint 404', 'wrong path for this account');
      if (/action .* not found/i.test(text)) return line(FAIL, name, 'not provisioned', 'action missing on this plan');
      if (/is required|not one of the accepted/i.test(text)) return line(WARN, name, 'live, needs more params', 'shape not fully mapped');
      return line(OK, name, res.status === 200 ? 'live — task accepted' : `HTTP ${res.status}`, '');
    } catch (err) {
      return line(FAIL, name, 'error', err.message.slice(0, 40));
    }
  };

  await probe('Skin Analysis', '/s2s/v2.0/task/skin-analysis', { src_file_url: SAMPLE, dst_actions: ['wrinkle'], format: 'json' });
  await probe('Makeup VTO', '/s2s/v2.0/task/makeup-vto', { src_file_url: SAMPLE, effects: [] });
  await probe('Apparel VTO', '/s2s/v2.0/task/cloth-v4', { src_file_url: SAMPLE, ref_file_url: SAMPLE, garment_category: 'upper_body' });
}

/* ── Catalog and photography ─────────────────────────────────────────── */
const photos = (() => {
  const f = path.join(DIR, '..', 'data', 'catalog-images.json');
  return fs.existsSync(f) ? Object.keys(JSON.parse(fs.readFileSync(f, 'utf8'))).length : 0;
})();
line(OK, 'Catalog', `${catalog.length} garments`, `${photos} photographed, ${catalog.length - photos} drawn`);

/* ── Demo readiness ──────────────────────────────────────────────────── */
const cache = stats();
line(cache.entries > 0 ? OK : WARN, 'Demo cache', `${cache.entries} recorded responses`,
  cache.entries > 0 ? 'runs without keys or network' : 'run npm run demo:record');

/* ── Verdict ─────────────────────────────────────────────────────────── */
const fails = rows.filter((r) => r.mark === FAIL).length;
const warns = rows.filter((r) => r.mark === WARN).length;

console.log('');
if (!fails && !warns) console.log('\x1b[32m  READY — everything live.\x1b[0m\n');
else if (!fails) console.log(`\x1b[32m  READY\x1b[0m — ${warns} degraded, all with working fallbacks.\n`);
else console.log(`\x1b[33m  DEMOABLE\x1b[0m — ${fails} unavailable, ${warns} degraded. Fallbacks cover every one.\n`);
