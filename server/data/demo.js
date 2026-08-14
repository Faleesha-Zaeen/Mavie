/**
 * THE DEMO PATH
 *
 * One seeded profile, closet and scenario that produces a known-good run:
 *
 *   three looks → try-on → WAIT → alternative → BUY
 *
 * The WAIT is not staged. It falls out of the evidence: the demo closet already
 * contains several black occasion pieces, so the pick MAVIE likes visually is
 * also the one the user already effectively owns. That is the whole thesis in a
 * single screen, and it only reads as honest because the numbers produce it.
 *
 * Combined with the disk cache, this runs on a fresh clone with no keys.
 */

export const DEMO_SCENARIO =
  'Dinner out tonight. I want to feel feminine but not overdressed, and comfortable. My budget is $100.';

/**
 * The demo user chooses the DRESS, not MAVIE's top-scoring pick — which is what
 * people actually do. She likes it (85% match) and it is comfortably inside her
 * budget. The WAIT comes from one place only: she already owns three dresses
 * doing the same job.
 */
export const DEMO_SELECT_CATEGORY = 'dress';

export const DEMO_PROFILE = {
  id: 'demo-user',
  style_dna: ['minimal', 'feminine', 'elegant'],
  preferred_colors: ['ivory', 'beige', 'black', 'dusty rose'],
  avoided_colors: ['neon'],
  comfort_priority: 0.85,
  budget_range: [50, 120],
  beauty: null, // set by the skin analysis step so the chain stays real
};

/**
 * Deliberately duplicate-heavy around black occasion wear. This is what gives
 * the Skeptic something true and specific to say.
 */
export const DEMO_CLOSET = [
  // Three dresses in the same family as the one she is about to buy. This is
  // the whole reason the verdict is WAIT — nothing else is doing the work.
  { name: 'Dusty rose midi dress', category: 'dress', color: 'dusty rose', colors: ['dusty rose'], hex: '#C98B94', style_tags: ['feminine', 'elegant'] },
  { name: 'Dusty rose wrap dress', category: 'dress', color: 'dusty rose', colors: ['dusty rose'], hex: '#CE97A0', style_tags: ['feminine', 'soft'] },
  { name: 'Dusty rose slip dress', category: 'dress', color: 'dusty rose', colors: ['dusty rose'], hex: '#D9A0A6', style_tags: ['feminine', 'minimal'] },

  // The rest of a believable wardrobe, none of which collides with the pick.
  { name: 'Ivory silk blouse', category: 'top', color: 'ivory', colors: ['ivory'], hex: '#F2E9DC', style_tags: ['feminine', 'minimal'] },
  { name: 'Beige trousers', category: 'bottom', color: 'beige', colors: ['beige'], hex: '#D7C6AC', style_tags: ['minimal', 'comfort'] },
  { name: 'Black pointed flats', category: 'shoes', color: 'black', colors: ['black'], hex: '#201C1A', style_tags: ['minimal', 'comfort'] },
];

/**
 * A neutral portrait stand-in, generated rather than shipped as a binary, so
 * the repo carries no photograph of a real person. Try-on renders the real
 * garment colours over it.
 */
export function demoPhoto() {
  const W = 240;
  const H = 320;
  const px = (x, y) => {
    const cx = W / 2;
    // head
    if (Math.hypot(x - cx, y - 74) < 46) return [232, 206, 186];
    // neck
    if (y > 112 && y < 140 && Math.abs(x - cx) < 20) return [224, 196, 176];
    // shoulders and torso
    if (y >= 138) {
      const spread = 58 + (y - 138) * 0.16;
      if (Math.abs(x - cx) < spread) return [212, 200, 188];
    }
    return [233, 226, 215]; // backdrop
  };

  const raw = Buffer.alloc((W * 3 + 1) * H);
  let o = 0;
  for (let y = 0; y < H; y++) {
    raw[o++] = 0;
    for (let x = 0; x < W; x++) {
      const [r, g, b] = px(x, y);
      raw[o++] = r; raw[o++] = g; raw[o++] = b;
    }
  }
  return raw;
}

export const DEMO_STEPS = [
  'Seed the demo profile and closet',
  'Describe the moment (cached context parse)',
  'Compose three looks from the real catalog',
  'Try the look on (cached or local composite)',
  'Aftermath → WAIT, because the closet already covers it',
  'Take the suggested alternative → BUY',
];
