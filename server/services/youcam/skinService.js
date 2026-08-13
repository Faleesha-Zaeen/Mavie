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

import { hasCredentials, youcamFetch, pollTask } from './client.js';

export const CONCERNS = [
  'spots', 'wrinkles', 'texture', 'dark_circles', 'redness', 'pores',
  'acne', 'oiliness', 'hydration', 'firmness', 'eye_bags', 'radiance',
  'droopy_upper_eyelid', 'droopy_lower_eyelid', 'skin_tone_evenness',
];

export async function analyseSkin({ imageUrl, imageBase64 }) {
  if (!hasCredentials()) {
    return { ...mockAnalysis(), mocked: true };
  }

  try {
    const task = await youcamFetch('/s2s/v1.1/task/skin-analysis', {
      body: {
        request_id: Date.now(),
        payload: {
          file_sets: { src_ids: [imageUrl || imageBase64] },
          actions: [{ id: 0, params: { dst_actions: CONCERNS } }],
        },
      },
    });

    const taskId = task.result?.task_id || task.task_id;
    const done = await pollTask(`/s2s/v1.1/task/skin-analysis?task_id=${taskId}`);
    const raw = normaliseScores(done.result?.results?.[0]?.data || done.result || {});

    return { ...toBeautyProfile(raw), raw, mocked: false };
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
