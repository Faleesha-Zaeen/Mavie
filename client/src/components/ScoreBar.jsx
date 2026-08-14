import { motion } from 'framer-motion';

export default function ScoreBar({ label, value = 0, delay = 0, inverse = false, hint }) {
  // `inverse` means lower is better (risk metrics), so the colour scale flips.
  const good = inverse ? value <= 35 : value >= 85;
  const mid = inverse ? value <= 60 : value >= 70;
  // Bar fill uses the brand tone; the number uses the AA-compliant variant.
  const fill = good ? '#75886F' : mid ? '#BF9822' : '#AC5A48';
  const color = good ? '#56684F' : mid ? '#806115' : '#9A4B3A';

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="font-sans text-[11px] uppercase tracking-salon text-espresso-soft">{label}</span>
        <span className="font-display text-lg tabular-nums" style={{ color }}>{Math.round(value)}%</span>
      </div>

      <div className="h-[3px] w-full bg-line rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: fill }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {hint && <p className="text-[11px] text-espresso-mute leading-relaxed">{hint}</p>}
    </div>
  );
}
