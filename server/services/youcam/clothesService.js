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
import { hasCredentials, youcamFetch, pollTask } from './client.js';
import * as cache from '../cache.js';

const fingerprint = (s) =>
  crypto.createHash('sha256').update(String(s || 'none')).digest('hex').slice(0, 32);

/** Accepted by the API; anything else is rejected outright. */
const CATEGORIES = ['upper_body', 'lower_body', 'full_body', 'dress'];

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

  // The API needs a hosted garment image. Catalog items rendered as drawings
  // have no photograph to send, so there is nothing to try on yet.
  const garmentUrl = garments.map((g) => g.image_url).find(Boolean);

  if (!hasCredentials()) return mockResult(userImage, garments, 'no_credentials');
  if (!userImage) return mockResult(userImage, garments, 'no_user_photo');
  if (!garmentUrl) return mockResult(userImage, garments, 'no_garment_photo');

  try {
    const started = await youcamFetch('/s2s/v2.0/task/cloth-v4', {
      body: {
        src_file_url: userImage,
        ref_file_url: garmentUrl,
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

function categoryOf(garments) {
  if (garments.some((g) => g.category === 'dress')) return 'dress';
  if (garments.some((g) => g.body_area === 'full')) return 'full_body';
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
