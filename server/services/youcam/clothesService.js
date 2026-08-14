/**
 * YouCam APPAREL VTO — live.
 *
 * Workflow: a photo of the user plus a garment image, returning a generated
 * try-on. This is the visual evidence layer the decision engine reasons on top
 * of: seeing the actual garment on yourself is the question virtual try-on
 * answers, and MAVIE handles the four it doesn't.
 *
 * Endpoint discovery note: the correct path is /s2s/v2.0/task/cloth-v4 — the
 * v2.0 namespace, despite v4 of the API. Names like cloth-tryon under
 * /s2s/v1.0/ simply 404. Recovered from the vendor's sitemap
 * (npm run discover), since the documentation is client-rendered.
 */

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasCredentials, youcamFetch, pollTask } from './client.js';
import { uploadImage } from './upload.js';
import * as cache from '../cache.js';

const fingerprint = (s) =>
  crypto.createHash('sha256').update(String(s || 'none')).digest('hex').slice(0, 32);

/**
 * The three values cloth-v4 accepts. `dress` is NOT among them — it was in
 * this list, and since the composer routes every dress through it, dress
 * try-ons failed with a 400 that read as a generic validation error and got
 * swallowed into the composite fallback. Dresses go through `full_body`.
 */
const CATEGORIES = ['upper_body', 'lower_body', 'full_body'];

/** Catalog images live in the client's public directory. */
const PUBLIC_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)), '../../../client/public',
);

export async function tryOnClothes({ userImage, items = [] }) {
  const garments = items.filter((i) => ['upper', 'lower', 'full'].includes(i.body_area));
  const category = categoryOf(garments);

  const key = {
    image: fingerprint(userImage),
    garments: garments.map((g) => g.id).sort(),
    category,
  };
  const cached = cache.read('vto', key);
  if (cached) return { ...cached, cached: true };

  const raw = garments.map((g) => g.image_url).find(Boolean);

  if (!hasCredentials()) return mockResult(userImage, garments, 'no_credentials');
  if (!userImage) return mockResult(userImage, garments, 'no_user_photo');
  if (!raw) return mockResult(userImage, garments, 'no_garment_photo');

  try {
    // Both images are STAGED rather than linked. Perfect Corp fetches a
    // ref_file_url itself, which meant catalog paths like /catalog/top-101.jpg
    // were unreachable in development and try-on fell back to the composite
    // "until deployed". That was never actually necessary: uploading the bytes
    // needs no public origin, so photoreal try-on works on localhost.
    const [srcFileId, refFileId] = await Promise.all([
      uploadImage('cloth-v4', userImage),
      uploadImage('cloth-v4', await garmentSource(raw)),
    ]);

    const started = await youcamFetch('/s2s/v2.0/task/cloth-v4', {
      body: {
        src_file_id: srcFileId,
        ref_file_id: refFileId,
        garment_category: category,
      },
    });

    const taskId = started.data?.task_id || started.result?.task_id;
    if (!taskId) throw new Error('no task_id returned');

    const done = await pollTask(`/s2s/v2.0/task/cloth-v4/${taskId}`, { attempts: 30, intervalMs: 2000 });
    // v2.0 returns the image at data.results.url; older shapes are kept as
    // fallbacks so a version bump does not silently break the try-on.
    const url = done.data?.results?.url
      || done.data?.results?.output?.[0]?.url
      || done.data?.results?.dst_urls?.[0]
      || done.result?.url;

    if (!url) throw new Error('no try-on image returned');

    return cache.write('vto', key, {
      result_url: url,
      garments: garments.map((g) => g.id),
      category,
      mocked: false,
    });
  } catch (err) {
    console.warn('[vto] falling back to composite preview:', err.message);
    return mockResult(userImage, garments, 'live_call_failed');
  }
}

/**
 * Try on a garment MAVIE never curated — the screenshot from the "found this
 * online" flow. Same API, same staging, but the reference image is the user's
 * own picture of the piece rather than a catalog shot, so there is no id to
 * resolve and nothing to look up.
 */
export async function tryOnFound({ userImage, garmentImage, category = 'upper_body', name }) {
  const safeCategory = CATEGORIES.includes(category) ? category : 'upper_body';
  const key = {
    image: fingerprint(userImage),
    garment: fingerprint(garmentImage),
    category: safeCategory,
  };

  const cached = cache.read('vto', key);
  if (cached) return { ...cached, cached: true };

  const stand = [{ id: 'found', name: name || 'This piece', hex: '#CFC6B8', body_area: 'upper', fit: 'regular' }];
  if (!hasCredentials()) return mockResult(userImage, stand, 'no_credentials');
  if (!userImage) return mockResult(userImage, stand, 'no_user_photo');
  if (!garmentImage) return mockResult(userImage, stand, 'no_garment_photo');

  try {
    const [srcFileId, refFileId] = await Promise.all([
      uploadImage('cloth-v4', userImage),
      uploadImage('cloth-v4', garmentImage),
    ]);

    const started = await youcamFetch('/s2s/v2.0/task/cloth-v4', {
      body: { src_file_id: srcFileId, ref_file_id: refFileId, garment_category: safeCategory },
    });

    const taskId = started.data?.task_id || started.result?.task_id;
    if (!taskId) throw new Error('no task_id returned');

    const done = await pollTask(`/s2s/v2.0/task/cloth-v4/${taskId}`, { attempts: 30, intervalMs: 2000 });
    const url = done.data?.results?.url || done.data?.results?.output?.[0]?.url || done.result?.url;
    if (!url) throw new Error('no try-on image returned');

    return cache.write('vto', key, { result_url: url, category: safeCategory, found: true, mocked: false });
  } catch (err) {
    console.warn('[vto:found] falling back to composite preview:', err.message);
    return mockResult(userImage, stand, 'live_call_failed');
  }
}

/**
 * Something uploadable for a garment: a data URL from a closet photo, an
 * absolute URL, or bytes read straight off disk for a catalog path.
 */
async function garmentSource(url) {
  if (/^(data:|https?:\/\/)/i.test(url)) return url;

  // Site-relative catalog path. Resolve inside the public directory only —
  // image_url reaches here from closet entries, so a traversal attempt must
  // not be able to read arbitrary files.
  const resolved = path.resolve(PUBLIC_DIR, `.${url.startsWith('/') ? '' : '/'}${url}`);
  if (!resolved.startsWith(PUBLIC_DIR)) throw new Error('garment path outside public directory');

  return fs.readFile(resolved);
}

/** Dresses and full outfits both go through full_body; `dress` is not valid. */
function categoryOf(garments) {
  if (garments.some((g) => g.category === 'dress' || g.body_area === 'full')) return 'full_body';
  const hasUpper = garments.some((g) => g.body_area === 'upper');
  const hasLower = garments.some((g) => g.body_area === 'lower');
  if (hasUpper && hasLower) return 'full_body';
  return hasLower ? 'lower_body' : 'upper_body';
}

/**
 * Structured composite the client renders as an editorial preview: the user's
 * photo plus the real colour and silhouette of each garment. Used whenever a
 * photoreal try-on is not possible, rather than showing an error.
 */
function mockResult(userImage, garments, reason) {
  const message = {
    no_credentials: 'Preview generated locally. Add YouCam credentials for a photoreal try-on.',
    no_user_photo: 'Add a photo of yourself to see a photoreal try-on.',
    no_garment_photo: 'This piece has no product photograph yet, so MAVIE is showing its real colour and cut instead.',
    live_call_failed: "MAVIE couldn't reach the try-on service just now, so this is a local preview of the same garments.",
  }[reason];

  return {
    result_url: null,
    mocked: true,
    reason,
    composite: {
      user_image: userImage || null,
      layers: garments.map((g) => ({
        id: g.id,
        name: g.name,
        hex: g.hex,
        body_area: g.body_area,
        fit: g.fit,
      })),
    },
    garments: garments.map((g) => g.id),
    message,
  };
}

export { CATEGORIES };
