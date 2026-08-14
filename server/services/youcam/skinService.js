/**
 * YouCam SKIN ANALYSIS
 *
 * The API returns structured scores across 15+ skin concerns.
 * MAVIE translates those into BEAUTY PERSONALIZATION — preferred finish,
 * beauty direction, makeup intensity.
 *
 * MAVIE never renders "your face is 78/100" and never names a medical condition.
 * Raw values stay available behind an explicit "View skin analysis" disclosure.
 */

import crypto from 'node:crypto';
import https from 'node:https';
import { hasCredentials, youcamFetch, pollTask } from './client.js';
import * as cache from '../cache.js';

const fingerprint = (s) =>
  crypto.createHash('sha256').update(String(s || 'none')).digest('hex').slice(0, 32);

/**
 * Concern identifiers, taken from Perfect Corp's own playground bundle.
 * Lowercase singular, with parallel `hd_` variants for HD analysis.
 *
 * NOTE: the live API currently filters every one of these to empty and replies
 * "dst_actions cannot be empty", on an account where auth and file upload both
 * succeed. That pattern points to the concern set not being provisioned for
 * this plan rather than to a wrong identifier. Overridable so it is a one-line
 * change once Perfect Corp confirms the entitled set.
 */
export const CONCERNS = (process.env.YOUCAM_SKIN_CONCERNS || [
  'wrinkle', 'texture', 'pore', 'acne', 'oiliness', 'moisture',
  'radiance', 'redness', 'firmness', 'eye_bag', 'dark_circle',
  'age_spot', 'droopy_upper_eyelid', 'droopy_lower_eyelid',
  'tear_trough', 'skin_type',
].join(',')).split(',').map((s) => s.trim()).filter(Boolean);

/**
 * Reserve an upload slot, PUT the image, return the file_id the task needs.
 * The API hands back a presigned URL rather than accepting bytes inline.
 */
async function uploadImage(image) {
  const bytes = Buffer.from(String(image).replace(/^data:[^,]+,/, ''), 'base64');

  const reserved = await youcamFetch('/s2s/v1.0/file/skin-analysis', {
    body: { files: [{ content_type: 'image/png', file_name: 'user.png', file_size: bytes.length }] },
  });

  const file = reserved.result?.files?.[0];
  if (!file) throw new Error('No upload slot returned');

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

export async function analyseSkin({ imageUrl, imageBase64 }) {
  // Replay a recorded analysis before anything else, so the demo path never
  // depends on the network or on credentials.
  const key = { image: fingerprint(imageUrl || imageBase64) };
  const cached = cache.read('skin', key);
  if (cached) return { ...cached, cached: true };

  if (!hasCredentials()) {
    return { ...mockAnalysis(), mocked: true };
  }

  try {
    // Verified against the live API:
    //   · path is v1.0, not v1.1 (v1.1 returns 404)
    //   · it is a two-step flow — reserve an upload slot, PUT the bytes, then
    //     run the task against the returned file_id
    //   · request_id must be a small integer; a timestamp is rejected
    const fileId = await uploadImage(imageBase64 || imageUrl);

    const task = await youcamFetch('/s2s/v1.0/task/skin-analysis', {
      body: {
        request_id: 1,
        payload: {
          file_sets: { src_ids: [fileId] },
          actions: [{ id: 0, params: { dst_actions: CONCERNS } }],
        },
      },
    });

    const taskId = task.result?.task_id || task.task_id;
    const done = await pollTask(`/s2s/v1.0/task/skin-analysis?task_id=${taskId}`);
    const raw = normaliseScores(done.result?.results?.[0]?.data || done.result || {});

    return cache.write('skin', key, { ...toBeautyProfile(raw), raw, mocked: false });
  } catch (err) {
    console.warn('[skin] falling back to mock analysis:', err.message);
    return { ...mockAnalysis(), mocked: true, error: 'live_call_failed' };
  }
}

/**
 * The important translation step: clinical-looking numbers → beauty direction.
 * This is where MAVIE stops being a skin analyzer and becomes a styling input.
 */
export function toBeautyProfile(raw) {
  const oiliness = raw.oiliness ?? 50;
  const hydration = raw.hydration ?? 60;
  const radiance = raw.radiance ?? 65;
  const redness = raw.redness ?? 40;
  const texture = raw.texture ?? 60;

  const preferred_finish =
    oiliness > 65 ? 'natural'
      : radiance < 55 || hydration < 55 ? 'luminous'
        : 'natural';

  const intensity = redness > 60 || texture < 50 ? 'light-medium' : 'light';

  const direction = [
    hydration < 55 ? 'hydrating' : 'fresh',
    radiance < 55 ? 'luminous' : 'soft',
    redness > 60 ? 'evening' : 'polished',
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

function normaliseScores(data) {
  const out = {};
  CONCERNS.forEach((c) => {
    const v = data[c]?.score ?? data[c]?.raw_score ?? data[c];
    if (typeof v === 'number') out[c] = Math.round(v);
  });
  return out;
}

/** Deterministic stand-in so the full pipeline is demoable without keys. */
function mockAnalysis() {
  const raw = {
    spots: 78, wrinkles: 86, texture: 72, dark_circles: 64, redness: 58,
    pores: 70, acne: 82, oiliness: 55, hydration: 61, firmness: 80,
    eye_bags: 68, radiance: 66, skin_tone_evenness: 74,
  };
  return { ...toBeautyProfile(raw), raw };
}
