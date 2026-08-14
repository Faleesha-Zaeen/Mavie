/**
 * Disk cache for external API responses.
 *
 * Every successful call to an LLM or to YouCam is written to server/.cache and
 * replayed on any identical later call. This exists for one reason: a demo must
 * never fail because a daily quota ran out or a network blocked a host.
 *
 * The cache is checked BEFORE the provider is chosen, so a fresh clone with no
 * API keys at all still replays real recorded responses. That is what makes the
 * demo path work with zero configuration.
 *
 * Set MAVIE_CACHE=off to bypass entirely (useful when re-recording).
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.cache');

export const enabled = () => process.env.MAVIE_CACHE !== 'off';

const keyFor = (namespace, payload) =>
  `${namespace}-${crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 24)}`;

const fileFor = (namespace, payload) => path.join(DIR, `${keyFor(namespace, payload)}.json`);

export function read(namespace, payload) {
  if (!enabled()) return null;
  try {
    const file = fileFor(namespace, payload);
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8')).value;
  } catch {
    return null;
  }
}

export function write(namespace, payload, value) {
  if (!enabled() || value == null) return value;
  try {
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(
      fileFor(namespace, payload),
      JSON.stringify({ namespace, recorded_at: new Date().toISOString(), value }, null, 2),
    );
  } catch (err) {
    console.warn('[cache] could not write:', err.message);
  }
  return value;
}

/** Cache-first wrapper. Only successful, non-null results are recorded. */
export async function through(namespace, payload, fn) {
  const hit = read(namespace, payload);
  if (hit != null) return hit;
  const value = await fn();
  return write(namespace, payload, value);
}

export function stats() {
  try {
    const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json'));
    const byNamespace = {};
    files.forEach((f) => {
      const ns = f.split('-')[0];
      byNamespace[ns] = (byNamespace[ns] || 0) + 1;
    });
    return { entries: files.length, byNamespace };
  } catch {
    return { entries: 0, byNamespace: {} };
  }
}
