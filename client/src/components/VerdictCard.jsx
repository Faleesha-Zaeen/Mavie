import { motion } from 'framer-motion';
import { Check, Clock, X } from 'lucide-react';

const STYLES = {
  BUY:  { color: '#7C8F76', bg: 'bg-sage/[0.08]',  border: 'border-sage/35',  Icon: Check, dot: 'bg-sage' },
  WAIT: { color: '#C9A227', bg: 'bg-amber/[0.08]', border: 'border-amber/35', Icon: Clock, dot: 'bg-amber' },
  SKIP: { color: '#B4614F', bg: 'bg-rust/[0.08]',  border: 'border-rust/35',  Icon: X,     dot: 'bg-rust' },
};

/** The moment the product becomes memorable. */
export default function VerdictCard({ decision }) {
  if (!decision) return null;

  const s = STYLES[decision.verdict] || STYLES.WAIT;
  const { Icon } = s;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden border ${s.border} ${s.bg} rounded-[4px] p-10 sm:p-14 text-center`}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${s.color}, transparent)` }}
      />

      <div className="eyebrow mb-6">MAVIE's verdict</div>

      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.25, type: 'spring', stiffness: 180, damping: 16 }}
        className="inline-flex items-center gap-4 mb-6"
      >
        <span
          className="w-11 h-11 rounded-full flex items-center justify-center border"
          style={{ borderColor: s.color, color: s.color }}
        >
          <Icon size={19} strokeWidth={1.6} />
        </span>
        <span className="display text-6xl sm:text-7xl" style={{ color: s.color }}>
          {decision.verdict_label}
        </span>
      </motion.div>

      <h3 className="font-display text-2xl sm:text-3xl font-light leading-snug max-w-2xl mx-auto text-balance">
        {decision.verdict_headline}
      </h3>

      <p className="mt-5 serif-body max-w-xl mx-auto text-pretty">
        {decision.verdict_reason}
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-14 gap-y-6">
        <Stat label="Buy confidence" value={`${decision.buy_confidence}%`} />
        <Stat label="Regret risk" value={decision.regret_risk} accent={s.color} />
        <Stat label="MAVIE Match" value={`${decision.match?.overall ?? '—'}%`} />
      </div>
    </motion.div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="text-center">
      <div className="display text-3xl" style={accent ? { color: accent } : undefined}>{value}</div>
      <div className="eyebrow mt-1.5">{label}</div>
    </div>
  );
}
