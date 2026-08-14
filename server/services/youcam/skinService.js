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
import { hasCredentials, youcamFetch, pollTask } from './client.js';
import { uploadImage } from './upload.js';
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
      : { src_file_id: await uploadImage('skin-analysis', imageBase64) };

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

    // A real portrait completes in a few seconds, but the default 30s window is
    // too tight for a large upload on a slow connection — and a timeout drops
    // the user to mock analysis, which looks like success.
    const done = await pollTask(`/s2s/v2.0/task/skin-analysis/${taskId}`, { attempts: 40, intervalMs: 2000 });
    const raw = normaliseScores(done.data?.results?.output || []);

    return cache.write('skin', key, { ...toBeautyProfile(raw), raw, mocked: false });
  } catch (err) {
    console.warn('[skin] falling back to mock analysis:', err.message);
    return { ...mockAnalysis(), mocked: true, error: 'live_call_failed' };
  }
}

/**
 * The important translation: clinical-looking numbers become styling direction.
 * This is where MAVIE stops being a skin analyzer and becomes a beauty input.
 */
/**
 * Turn concern scores into styling direction.
 *
 * Every line here has to be EARNED by the numbers. A previous version ended
 * with a fixed sentence about cream formulas that was shown to everyone
 * regardless of their skin — advice that is true of nobody in particular reads
 * as filler, and it undermines the readings that are real.
 *
 * Higher ui_score means better skin in this API, so a low score marks the areas
 * worth speaking to.
 */
export function toBeautyProfile(raw) {
  const s = {
    oiliness: raw.oiliness ?? 65,
    moisture: raw.moisture ?? 65,
    radiance: raw.radiance ?? 70,
    redness: raw.redness ?? 80,
    texture: raw.texture ?? 70,
    pore: raw.pore ?? 75,
    wrinkle: raw.wrinkle ?? 75,
    acne: raw.acne ?? 85,
  };

  // Oily skin sits better under a natural finish; dull or dry skin lifts with
  // a luminous one.
  const preferred_finish = s.oiliness < 55 ? 'natural'
    : (s.radiance < 72 || s.moisture < 62) ? 'luminous'
      : 'natural';

  // Coverage tracks how much there is to even out.
  const evenness = Math.min(s.redness, s.texture, s.acne);
  const intensity = evenness < 62 ? 'medium' : evenness < 78 ? 'light-medium' : 'light';

  const direction = [
    s.moisture < 62 ? 'hydrating' : s.oiliness < 55 ? 'balancing' : 'fresh',
    s.radiance < 72 ? 'luminous' : 'soft',
    s.redness < 75 ? 'evening' : s.texture < 70 ? 'smoothing' : 'polished',
  ];

  // Speak to the two lowest-scoring concerns by name.
  const ADVICE = {
    oiliness: 'Your T-zone runs oily, so a longwear base will hold better than a rich cream.',
    moisture: 'Your skin reads dry, so hydrate before base — makeup will sit far more evenly.',
    radiance: 'Radiance is the number to lift here: a luminous base and a touch of highlighter do more than coverage.',
    redness: 'There is some redness to even out, so a colour-correcting base beats piling on foundation.',
    texture: 'Texture is worth smoothing with primer rather than hiding under heavier product.',
    pore: 'Pores show a little, so a blurring primer around the centre of the face will help.',
    wrinkle: 'Fine lines read more with powder, so keep the finish creamy where you can.',
    acne: 'Spot-conceal rather than covering the whole face — it will look lighter and last longer.',
  };

  // Only speak to concerns that are genuinely low. Taking the two lowest
  // regardless of value produced advice for skin that was doing fine — and on
  // balanced skin it paired "your T-zone runs oily" with "your skin reads dry",
  // which is self-contradicting nonsense.
  const CONCERN_THRESHOLD = 70;
  const ranked = Object.entries(s)
    .filter(([, value]) => value < CONCERN_THRESHOLD)
    .sort((a, b) => a[1] - b[1])
    .map(([key]) => key);

  // Oiliness and dryness cannot both be the headline; keep whichever scored lower.
  const opposites = ['oiliness', 'moisture'];
  const firstOpposite = ranked.find((k) => opposites.includes(k));
  const concerns = ranked.filter((k) => !opposites.includes(k) || k === firstOpposite);

  const weakest = concerns.slice(0, 2).map((key) => ADVICE[key]).filter(Boolean);

  // Balanced skin deserves to be told so, rather than handed invented problems.
  if (!weakest.length) {
    weakest.push(
      intensity === 'light'
        ? 'Nothing here needs correcting — light coverage is genuinely enough.'
        : 'No single concern stands out, so keep the base light and spot-conceal where you want to.',
    );
  }

  return {
    preferred_finish,
    intensity,
    direction,
    headline: direction.join(' + ').replace(/\b\w/g, (c) => c.toUpperCase()),
    guidance: [
      preferred_finish === 'luminous'
        ? 'A luminous base will suit you better than a flat matte one.'
        : 'A natural, skin-like finish will read best on you.',
      ...weakest,
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
