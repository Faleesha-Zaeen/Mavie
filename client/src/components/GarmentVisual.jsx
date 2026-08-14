/**
 * Garment rendering.
 *
 * When a catalog item has real product photography (`image_url`) we use it.
 * Until then we render the garment ourselves — but as a studio shot rather
 * than a flat icon: a lit backdrop, a soft contact shadow, fabric shading that
 * follows the drape, and a weave texture. The point is that it should read as
 * a deliberate visual language, not as a placeholder someone forgot to replace.
 *
 * Every garment is drawn in its ACTUAL catalog colour, which is also what makes
 * the colour story across a look legible at a glance.
 */

const uid = (id, suffix) => `g${String(id).replace(/[^a-z0-9]/gi, '')}-${suffix}`;

/* Silhouettes drawn with drape rather than straight edges. */
const SHAPES = {
  top: (
    <path d="M31 24 L44 15 Q50 22 56 15 L69 24 L77 43 Q72 47 66 45 L64.5 66 Q65 80 63 88 Q50 92 37 88 Q35 80 35.5 66 L34 45 Q28 47 23 43 Z" />
  ),
  outerwear: (
    <path d="M29 24 L42 15 L50 32 L58 15 L71 24 L79 46 Q73 50 68 47 L66.5 70 Q67 82 65 90 Q50 94 35 90 Q33 82 33.5 70 L32 47 Q27 50 21 46 Z" />
  ),
  bottom: (
    <path d="M34 16 Q50 13 66 16 L69.5 38 Q68 62 65 90 Q59.5 92 54 90 Q51.5 66 50 47 Q48.5 66 46 90 Q40.5 92 35 90 Q32 62 30.5 38 Z" />
  ),
  dress: (
    <path d="M33 22 L44 14 Q50 21 56 14 L67 22 L64 40 Q69 62 75 88 Q50 95 25 88 Q31 62 36 40 Z" />
  ),
  shoes: (
    <path d="M24 60 Q27 40 38 39 L47 39 Q52 54 66 61 L74 66 Q79 71 74 76 L30 76 Q22 75 24 60 Z" />
  ),
  accessory: (
    <>
      <path d="M35 38 Q35 21 50 21 Q65 21 65 38" fill="none" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M27 37 L73 37 Q76 37 76 41 L74 74 Q74 78 70 78 L30 78 Q26 78 26 74 L24 41 Q24 37 27 37 Z" />
    </>
  ),
};

export default function GarmentVisual({ item, className = '', showLabel = false }) {
  if (!item) return null;

  const hex = item.hex || '#D9CDBB';
  const shape = SHAPES[item.category] || SHAPES.top;

  // Real photography always wins — but stock shots arrive with wildly different
  // white balance and saturation. A shared treatment (warm wash, slight
  // desaturation, soft vignette) pulls sixty unrelated photographs into one
  // coherent set that sits inside MAVIE's palette instead of fighting it.
  if (item.image_url) {
    return (
      <figure className={`relative w-full h-full overflow-hidden bg-ivory-deep m-0 group/photo ${className}`}>
        <img
          src={item.image_url}
          alt={item.image_alt || item.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'saturate(0.86) contrast(1.02) brightness(1.02)' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />

        {/* Warm wash keyed to the garment's own colour. */}
        <span
          className="absolute inset-0 pointer-events-none mix-blend-soft-light opacity-45"
          style={{ background: `linear-gradient(150deg, ${hex}, #F0E9DE)` }}
        />
        {/* Editorial vignette. */}
        <span
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 35%, transparent 52%, rgba(46,39,35,0.13) 100%)' }}
        />

        {item.image_credit && (
          <figcaption
            className="absolute bottom-1.5 right-2 text-[8px] tracking-wide text-white/0
                       group-hover/photo:text-white/75 transition-colors duration-500
                       drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] pointer-events-none"
          >
            {item.image_credit.name} · {item.image_credit.source}
          </figcaption>
        )}
      </figure>
    );
  }

  const light = shift(hex, 26);
  const dark = shift(hex, -34);
  const edge = shift(hex, -52);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
        <defs>
          {/* Studio backdrop: light falls from upper left, floor curves away. */}
          <radialGradient id={uid(item.id, 'bg')} cx="34%" cy="22%" r="88%">
            <stop offset="0%" stopColor="#FDFBF7" />
            <stop offset="55%" stopColor="#F3ECE1" />
            <stop offset="100%" stopColor="#E4DACB" />
          </radialGradient>

          {/* Fabric shading across the drape. */}
          <linearGradient id={uid(item.id, 'fabric')} x1="18%" y1="0%" x2="86%" y2="100%">
            <stop offset="0%" stopColor={light} />
            <stop offset="42%" stopColor={hex} />
            <stop offset="100%" stopColor={dark} />
          </linearGradient>

          {/* Sheen down the left of the garment. */}
          <linearGradient id={uid(item.id, 'sheen')} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.34" />
            <stop offset="34%" stopColor="#FFFFFF" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.10" />
          </linearGradient>

          {/* Woven texture, kept very low opacity so it reads as cloth. */}
          <pattern id={uid(item.id, 'weave')} width="3" height="3" patternUnits="userSpaceOnUse">
            <rect width="3" height="3" fill="none" />
            <path d="M0 1.5 H3 M1.5 0 V3" stroke="#000" strokeOpacity="0.05" strokeWidth="0.4" />
          </pattern>

          {/* Soft contact shadow beneath the garment. */}
          <radialGradient id={uid(item.id, 'shadow')} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3A2E24" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#3A2E24" stopOpacity="0" />
          </radialGradient>

          <clipPath id={uid(item.id, 'clip')}>{shape}</clipPath>
        </defs>

        <rect width="100" height="100" fill={`url(#${uid(item.id, 'bg')})`} />
        <ellipse cx="50" cy="92" rx="30" ry="5.5" fill={`url(#${uid(item.id, 'shadow')})`} />

        {/* The garment, then its shading layers clipped to the same silhouette. */}
        <g>
          <g fill={`url(#${uid(item.id, 'fabric')})`} stroke={edge} strokeWidth="0.7" strokeLinejoin="round">
            {shape}
          </g>
          <g clipPath={`url(#${uid(item.id, 'clip')})`}>
            <rect width="100" height="100" fill={`url(#${uid(item.id, 'weave')})`} />
            <rect width="100" height="100" fill={`url(#${uid(item.id, 'sheen')})`} />
          </g>
        </g>
      </svg>

      {showLabel && (
        <span className="absolute bottom-3 left-3 text-[10px] uppercase tracking-editorial text-espresso/45">
          {item.category}
        </span>
      )}
    </div>
  );
}

/** Lighten (positive) or deepen (negative) a hex colour by an absolute amount. */
function shift(hex, amount) {
  const h = hex.replace('#', '');
  const clamp = (n) => Math.max(0, Math.min(255, n));
  const [r, g, b] = [0, 2, 4].map((i) => clamp(parseInt(h.slice(i, i + 2), 16) + amount));
  return `rgb(${r}, ${g}, ${b})`;
}
