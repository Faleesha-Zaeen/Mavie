import { motion } from 'framer-motion';

/**
 * Loading states are part of the design, not an afterthought.
 * AI calls take real seconds — the copy carries the brand through them.
 */
const COPY = {
  skin: 'Reading your beauty profile…',
  outfit: 'Finding pieces that fit your moment…',
  vto: 'Putting your look together…',
  aftermath: 'Looking beyond the first impression…',
  context: 'Understanding your moment…',
  closet: 'Going through what you already own…',
};

export default function Loader({ stage = 'outfit', sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative w-16 h-16 mb-8">
        <motion.span
          className="absolute inset-0 rounded-full border border-rose-soft"
          animate={{ scale: [1, 1.35, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="absolute inset-2 rounded-full border border-rose"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-xl">💗</span>
      </div>

      <motion.p
        key={stage}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-2xl font-light text-espresso-soft"
      >
        {COPY[stage] || COPY.outfit}
      </motion.p>

      {sub && <p className="mt-3 text-xs tracking-wide text-espresso-mute max-w-xs">{sub}</p>}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-[3/4] shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-2 w-16 shimmer rounded" />
        <div className="h-4 w-3/4 shimmer rounded" />
        <div className="h-3 w-20 shimmer rounded" />
      </div>
    </div>
  );
}
