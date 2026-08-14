/**
 * YouCam SKIN ANALYSIS — live.
 *
 * MAVIE translates the returned concern scores into BEAUTY PERSONALIZATION:
 * preferred finish, beauty direction, makeup intensity. It never renders
 * "your face is 78/100" and never names a medical condition. Raw values stay
 * available behind an explicit disclosure so the feature is transparent
 * without becoming diagnostic.
 *
 * Endpoint discovery note: the correct path is /s2s/v2.0/task/skin-analysis.
 * A /s2s/v1.0/task/skin-analysis also exists and authenticates, but it is a
 * different, older API whose parameters silently reject the v2 concern names —
 * which is why it kept returning "dst_actions cannot be empty". Paths were
 * recovered from the vendor's sitemap (npm run discover).
 */

import crypto from 'node:crypto';
import https from 'node:https';
import { hasCredentials, youcamFetch, pollTask } from './client.js';
import * as cache from '../cache.js';

const fingerprint = (s) =>
  crypto.createHash('sha256').update(String(s || 'none')).digest('hex').slice(0, 32);

/** Concern identifiers accepted by the v2.0 API. */
export const CONCERNS = (process.env.YOUCAM_SKIN_CONCERNS || [
  'wrinkle', 'texture', 'pore', 'acne', 'oiliness', 'moisture', 'radiance', 'redness',
].join(',')).split(',').map((s) => s.trim()).filter(Boolean);

export async function analyseSkin({ imageUrl, imageBase64 }) {
  const key = { image: fingerprint(imageUrl || imageBase64), concerns: CONCERNS };
  const cached = cache.read('skin', key);
  if (cached) return { ...cached, cached: true };

  if (!hasCredentials()) return { ...mockAnalysis(), mocked: true };

  try {
    // A hosted image can be passed straight through; an uploaded one has to be
    // staged first, since the API takes a URL or a file id, never raw bytes.
    const source = imageUrl
      ? { src_file_url: imageUrl }
      : { src_file_id: await uploadImage(imageBase64) };

    const started = await youcamFetch('/s2s/v2.0/task/skin-analysis', {
      body: {
        ...source,
        dst_actions: CONCERNS,
        miniserver_args: { enable_mask_overlay: false },
        format: 'json',
      },
    });

    const taskId = started.data?.task_id || started.result?.task_id;
    if (!taskId) throw new Error('no task_id returned');

    const done = await pollTask(`/s2s/v2.0/task/skin-analysis/${taskId}`);
    const raw = normaliseScores(done.data?.results?.output || []);

    return cache.write('skin', key, { ...toBeautyProfile(raw), raw, mocked: false });
  } catch (err) {
    console.warn('[skin] falling back to mock analysis:', err.message);
    return { ...mockAnalysis(), mocked: true, error: 'live_call_failed' };
  }
}

/** Reserve an upload slot, PUT the bytes, return the file id. */
async function uploadImage(image) {
  const bytes = Buffer.from(String(image).replace(/^data:[^,]+,/, ''), 'base64');

  const reserved = await youcamFetch('/s2s/v1.0/file/skin-analysis', {
    body: { files: [{ content_type: 'image/png', file_name: 'user.png', file_size: bytes.length }] },
  });

  const file = reserved.result?.files?.[0];
  if (!file) throw new Error('no upload slot returned');

  const put = file.requests[0];
  const url = new URL(put.url);

  await new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: url.hostname,
        path: url.pathname + url.search,
        method: put.method || 'PUT',
        headers: { ...(put.headers || {}), 'Content-Length': bytes.length },
      },
      (res) => {
        res.resume();
        res.on('end', () => (res.statusCode < 300 ? resolve() : reject(new Error(`upload ${res.statusCode}`))));
      },
    );
    req.on('error', reject);
    req.write(bytes);
    req.end();
  });

  return file.file_id;
}

/**
 * The important translation: clinical-looking numbers become styling direction.
 * This is where MAVIE stops being a skin analyzer and becomes a beauty input.
 */
export function toBeautyProfile(raw) {
  const oiliness = raw.oiliness ?? 50;
  const moisture = raw.moisture ?? 60;
  const radiance = raw.radiance ?? 65;
  const redness = raw.redness ?? 40;
  const texture = raw.texture ?? 60;

  const preferred_finish =
    oiliness < 45 ? 'natural'
      : radiance < 70 || moisture < 60 ? 'luminous'
        : 'natural';

  const intensity = redness < 70 || texture < 60 ? 'light-medium' : 'light';

  const direction = [
    moisture < 60 ? 'hydrating' : 'fresh',
    radiance < 70 ? 'luminous' : 'soft',
    redness < 70 ? 'evening' : 'polished',
  ];

  return {
    preferred_finish,
    intensity,
    direction,
    headline: `${direction[0]} + ${direction[1]} + ${direction[2]}`.replace(/\b\w/g, (c) => c.toUpperCase()),
    guidance: [
      preferred_finish === 'luminous'
        ? 'A luminous base will suit you better than a flat matte one.'
        : 'A natural, skin-like finish will read best on you.',
      intensity === 'light'
        ? 'Light coverage is enough — let your skin show through.'
        : 'Light-to-medium coverage gives you evenness without looking heavy.',
      'Cream formulas will sit more comfortably than heavy powders.',
    ],
    note: 'This is beauty personalization, not a medical assessment. MAVIE does not diagnose skin conditions.',
  };
}

/** The API returns one entry per concern; a higher ui_score is better skin. */
function normaliseScores(output) {
  const out = {};
  output.forEach((o) => {
    if (!o?.type) return;
    const value = o.ui_score ?? o.score;
    if (typeof value === 'number') out[o.type] = Math.round(value);
  });
  return out;
}

function mockAnalysis() {
  const raw = {
    wrinkle: 71, texture: 74, pore: 79, acne: 99,
    oiliness: 65, moisture: 65, radiance: 77, redness: 97,
  };
  return { ...toBeautyProfile(raw), raw };
}
