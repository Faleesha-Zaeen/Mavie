import { motion } from 'framer-motion';

/** The MAVIE Match dial. Not an attractiveness score — a requirements-fit score. */
export default function MatchRing({ value = 0, size = 168, label = 'MAVIE Match', accent = '#C98B94' }) {
  const stroke = size > 120 ? 3 : 2.5;
  const r = (size - stroke * 2) / 2 - 8;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5DACB" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * Math.min(value, 100)) / 100 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="display"
          style={{ fontSize: size * 0.3 }}
        >
          {Math.round(value)}
          <span className="text-espresso-mute" style={{ fontSize: size * 0.14 }}>%</span>
        </motion.span>
        <span className="eyebrow mt-1">{label}</span>
      </div>
    </div>
  );
}
