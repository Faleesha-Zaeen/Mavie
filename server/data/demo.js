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

export const DEMO_SELECT_CATEGORY = 'dress';

/**
 * The piece she saw online — the moment MAVIE exists for.
 *
 * The WAIT belongs here, not on a composed look. The composer only builds
 * outfits it can defend, so asking it to produce a regrettable one means either
 * tuning the scoring until it lies, or seeding a closet contrived enough to
 * force a collision. Both are staged.
 *
 * A piece the user brings in herself is different: nothing filtered it. This
 * velvet dress is beautiful and genuinely wrong for a weeknight dinner —
 * versatility 34, care burden 84, cut for formal events. That verdict falls
 * straight out of the evidence.
 */
export const DEMO_FOUND_ITEM = {
  id: 'found-demo-1',
  name: 'Burgundy Velvet Evening Dress',
  category: 'dress',
  body_area: 'full',
  price: 98,
  currency: 'USD',
  hex: '#5E2233',
  colors: ['burgundy'],
  material: 'velvet',
  formality: 'formal',
  style_tags: ['luxe', 'statement', 'elegant'],
  occasion_tags: ['formal', 'wedding', 'party'],
  fit: 'fitted',
  season: 'winter',
  versatility: 34,
  maintenance: 84,
  found: true,
};

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
/**
 * A believable wardrobe, in colours the catalog also carries — so every closet
 * tile can borrow a matching product shot instead of sitting there as a drawing
 * beside a fully photographed catalog.
 *
 * Three black dresses is the detail that gives the Skeptic something concrete
 * to say the moment she considers a fourth.
 */
export const DEMO_CLOSET = [
  { name: 'Black slip dress', category: 'dress', color: 'black', colors: ['black'], hex: '#1C1917', style_tags: ['minimal', 'elegant'] },
  { name: 'Black wrap dress', category: 'dress', color: 'black', colors: ['black'], hex: '#211D1B', style_tags: ['feminine', 'elegant'] },
  { name: 'Black mini dress', category: 'dress', color: 'black', colors: ['black'], hex: '#232019', style_tags: ['feminine', 'evening'] },

  { name: 'White button-down shirt', category: 'top', color: 'white', colors: ['white'], hex: '#FBFAF7', style_tags: ['classic', 'minimal'] },
  { name: 'Beige wide-leg trousers', category: 'bottom', color: 'beige', colors: ['beige'], hex: '#D7C6AC', style_tags: ['minimal', 'comfort'] },
  { name: 'Black ballet flats', category: 'shoes', color: 'black', colors: ['black'], hex: '#201C1A', style_tags: ['minimal', 'comfort'] },
];

/**
 * A neutral portrait stand-in, generated rather than shipped as a binary, so
 * the repo carries no photograph of a real person. Try-on renders the real
 * garment colours over it.
 */
/**
 * Skin Analysis needs an actual face. A generated stand-in is rejected under
 * 480px ("error_below_min_image_size") and, once large enough, simply runs
 * forever because there is no face to detect — which silently degrades the demo
 * to mock analysis while looking like it worked.
 *
 * So the demo uses the vendor's own published sample portrait. It exercises the
 * real API end to end, and the repo carries no photograph of a real person.
 */
export const DEMO_PHOTO_URL =
  'https://plugins-media.makeupar.com/strapi/assets/skin_analysis_01_5b5defd339.png';

export const DEMO_PHOTO_SIZE = { width: 600, height: 800 };

export function demoPhoto() {
  const { width: W, height: H } = DEMO_PHOTO_SIZE;
  const scale = W / 240;
  const px = (x, y) => {
    const cx = W / 2;
    // head
    if (Math.hypot(x - cx, y - 74 * scale) < 46 * scale) return [232, 206, 186];
    // neck
    if (y > 112 * scale && y < 140 * scale && Math.abs(x - cx) < 20 * scale) return [224, 196, 176];
    // shoulders and torso
    if (y >= 138 * scale) {
      const spread = (58 + (y / scale - 138) * 0.16) * scale;
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
