/**
 * Editorial garment silhouettes.
 *
 * Catalog products carry a real colour (`hex`) and a category. Until real
 * product photography is wired in, we render a drawn silhouette in the actual
 * product colour — which reads as intentional design rather than a broken
 * <img>. When `image_url` exists we use the photograph instead.
 */

const PATHS = {
  top: (
    <>
      <path d="M30 22 L44 14 Q50 20 56 14 L70 22 L76 40 L66 44 L64 86 Q50 90 36 86 L34 44 L24 40 Z" />
      <path d="M44 14 Q50 24 56 14" className="opacity-0" />
    </>
  ),
  outerwear: (
    <>
      <path d="M28 22 L42 14 L50 30 L58 14 L72 22 L78 44 L68 48 L66 88 Q50 92 34 88 L32 48 L22 44 Z" />
      <path d="M50 30 L50 88" strokeWidth="1" />
    </>
  ),
  bottom: (
    <>
      <path d="M34 16 L66 16 L70 40 L64 90 L54 90 L50 48 L46 90 L36 90 L30 40 Z" />
    </>
  ),
  dress: (
    <>
      <path d="M32 20 L44 13 Q50 19 56 13 L68 20 L64 40 L74 88 Q50 94 26 88 L36 40 Z" />
    </>
  ),
  shoes: (
    <>
      <path d="M22 62 Q28 40 40 40 L48 40 Q54 56 68 62 L76 68 Q78 76 70 76 L26 76 Q20 74 22 62 Z" />
    </>
  ),
  accessory: (
    <>
      <path d="M34 36 Q34 20 50 20 Q66 20 66 36" fill="none" strokeWidth="3" />
      <rect x="26" y="36" width="48" height="40" rx="3" />
    </>
  ),
};

export default function GarmentVisual({ item, className = '', showLabel = false }) {
  if (!item) return null;

  const path = PATHS[item.category] || PATHS.top;
  const hex = item.hex || '#D9CDBB';

  if (item.image_url) {
    return <img src={item.image_url} alt={item.name} className={`w-full h-full object-cover ${className}`} />;
  }

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: `linear-gradient(160deg, ${tint(hex, 0.9)} 0%, ${tint(hex, 0.72)} 100%)` }}
    >
      {/* soft editorial vignette */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.5), transparent 60%)' }}
      />
      <svg viewBox="0 0 100 100" className="relative w-[62%] h-[62%] drop-shadow-sm">
        <g fill={hex} stroke={shade(hex, 0.82)} strokeWidth="1.5" strokeLinejoin="round">
          {path}
        </g>
      </svg>
      {showLabel && (
        <span className="absolute bottom-3 left-3 eyebrow text-espresso/50">{item.category}</span>
      )}
    </div>
  );
}

/** Mix a colour toward ivory for the card background. */
function tint(hex, amount) {
  const { r, g, b } = rgb(hex);
  const mix = (c, target) => Math.round(c + (target - c) * amount);
  return `rgb(${mix(r, 250)}, ${mix(g, 247)}, ${mix(b, 242)})`;
}

/** Darken for the outline so light garments still have a visible edge. */
function shade(hex, factor) {
  const { r, g, b } = rgb(hex);
  return `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`;
}

function rgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}
