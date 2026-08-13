/**
 * MAKEUP ENGINE
 *
 * Makeup is never generated in isolation — it is coordinated with the outfit,
 * the occasion and the user's beauty profile. That coordination is the whole
 * reason Skin AI and Apparel VTO belong in the same product.
 */

import { beautyCatalog } from '../../data/catalog.js';

const INTENSITY_BY_FORMALITY = {
  casual: 'light',
  'smart-casual': 'light-medium',
  formal: 'medium',
  statement: 'medium-bold',
};

export function recommendMakeup(constraints = {}, profile = {}, items = []) {
  const goals = constraints.goal || [];
  const formality = constraints.formality || 'casual';

  const wantsBold = goals.includes('bold') || formality === 'statement';
  const wantsSoft = goals.includes('feminine') || goals.includes('minimal') || goals.includes('comfortable');

  // The beauty profile derived from Skin Analysis sets the base finish.
  const finish = profile?.beauty?.preferred_finish
    || (goals.includes('elegant') ? 'luminous' : 'natural');

  // Coordinate the lip with the dominant garment colour so the look reads as one.
  const dominant = items.find((i) => i.category === 'dress') || items[0];
  const warm = dominant ? isWarm(dominant.hex) : true;

  const lip = wantsBold
    ? product('bty-714')
    : warm ? product('bty-713') : product('bty-715');

  const blush = warm ? product('bty-704') : product('bty-705');
  const eyes = wantsBold ? product('bty-710') : product('bty-709');
  const base = finish === 'luminous' ? product('bty-702') : product('bty-701');

  const intensity = wantsBold
    ? 'medium-bold'
    : wantsSoft ? 'light' : INTENSITY_BY_FORMALITY[formality] || 'light-medium';

  const name = wantsBold ? 'Defined Evening' : wantsSoft ? 'Soft Professional' : 'Polished Natural';

  return {
    name,
    intensity,
    finish,
    products: [base, eyes, blush, lip].filter(Boolean),
    direction: {
      base: `${base?.shade || 'Natural'} — ${finish} finish`,
      eyes: eyes?.shade || 'Soft brown',
      cheeks: blush?.shade || 'Muted peach',
      lips: lip?.shade || 'Rose nude',
    },
    // Payload shape for the YouCam Makeup VTO call.
    vto_payload: {
      foundation: base?.hex,
      eyeshadow: eyes?.hex,
      blush: blush?.hex,
      lipstick: lip?.hex,
      intensity,
    },
    why: wantsBold
      ? 'You asked for something with presence, so MAVIE raised the definition on the eyes and deepened the lip.'
      : 'You asked to look put together without looking heavily made up, so MAVIE kept the base light and let the skin show through.',
  };
}

const product = (id) => beautyCatalog.find((b) => b.id === id) || null;

function isWarm(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return r >= b;
}
