/**
 * Colour naming for closet pieces.
 *
 * A colour wheel gives any hex, but MAVIE reasons in colour WORDS — closet
 * overlap compares "black dress" to "black dress", and catalog look-alikes are
 * matched by name. So a picked colour has to be resolved to the nearest name in
 * the vocabulary the catalog already uses, or duplicate detection quietly stops
 * working for anything not picked from a preset swatch.
 */

/** The vocabulary the catalog itself uses, so matches actually land. */
export const NAMED_COLOURS = [
  ['black', '#1F1B19'],
  ['charcoal', '#403A36'],
  ['grey', '#9A9A96'],
  ['white', '#F7F4EE'],
  ['ivory', '#F2E9DC'],
  ['cream', '#EDE3D4'],
  ['beige', '#D7C6AC'],
  ['stone', '#CFC6B8'],
  ['tan', '#B98B60'],
  ['camel', '#B08D62'],
  ['brown', '#6B4A32'],
  ['chocolate', '#4A3729'],
  ['nude', '#D6C3AC'],
  ['gold', '#D6BA85'],
  ['champagne', '#E0CBA2'],
  ['navy', '#2A3550'],
  ['blue', '#5C7290'],
  ['baby blue', '#BCD4E6'],
  ['powder blue', '#BFD0E0'],
  ['indigo', '#33455E'],
  ['light denim', '#9DB3CC'],
  ['sage', '#A8B49A'],
  ['olive', '#6B7355'],
  ['emerald', '#1F5245'],
  ['green', '#4B7A4E'],
  ['red', '#B8232F'],
  ['burgundy', '#6E2C3A'],
  ['pink', '#E7C3C8'],
  ['blush', '#E5CFCB'],
  ['dusty rose', '#C98B94'],
  ['purple', '#6E4A85'],
  ['yellow', '#D9C15A'],
  ['orange', '#C97A3E'],
];

const rgb = (hex) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) || 0);
};

/** Weighted RGB distance — green carries most perceptual weight. */
const distance = (a, b) => {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  return Math.sqrt(2 * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + 3 * (b1 - b2) ** 2);
};

/** Nearest catalog colour word for any picked hex. */
export function nameForHex(hex) {
  return NAMED_COLOURS.reduce(
    (best, [name, value]) => (distance(hex, value) < distance(hex, best[1]) ? [name, value] : best),
    NAMED_COLOURS[0],
  )[0];
}
