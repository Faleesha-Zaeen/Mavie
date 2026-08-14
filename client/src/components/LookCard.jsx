import { motion } from 'framer-motion';
import GarmentVisual from './GarmentVisual.jsx';
import { usd } from './ProductCard.jsx';

/** A complete look: real garments + coordinated makeup + its own scores. */
export default function LookCard({ look, index = 0, selected, isPick, onSelect }) {
  if (!look) return null;

  const garments = look.items.filter((i) => i.category !== 'accessory').slice(0, 3);

  return (
    <motion.button
      type="button"
      onClick={() => onSelect?.(look.id)}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative text-left w-full overflow-hidden rounded-[4px] border transition-all duration-500
        ${selected
          ? 'border-rose shadow-glow bg-surface/85'
          : 'border-line bg-surface/70 hover:border-rose-soft hover:shadow-lift hover:-translate-y-1'}`}
    >
      {isPick && (
        <div className="absolute top-0 right-0 z-10 bg-espresso text-ivory text-[9px] uppercase tracking-editorial px-3 py-1.5">
          MAVIE's pick
        </div>
      )}

      {/* Garment triptych */}
      <div className="grid grid-cols-3 gap-px bg-line aspect-[4/3]">
        {garments.map((item) => (
          <div key={item.id} className="relative overflow-hidden">
            <GarmentVisual item={item} className="transition-transform duration-700 group-hover:scale-105" />
          </div>
        ))}
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow">Look {String(index + 1).padStart(2, '0')}</div>
            <h3 className="font-display text-2xl font-light mt-0.5">{look.name}</h3>
          </div>
          <div className="text-right shrink-0">
            <div className="display text-3xl text-rose-text">{look.scores.overall}%</div>
            <div className="eyebrow">match</div>
          </div>
        </div>

        <div className="rule" />

        <ul className="space-y-1.5">
          {look.items.map((item) => (
            <li key={item.id} className="flex justify-between text-[12px] text-espresso-soft">
              <span className="truncate pr-3">{item.name}</span>
              <span className="tabular-nums shrink-0 text-espresso-mute">
                {item.owned ? 'owned' : usd(item.price)}
              </span>
            </li>
          ))}
        </ul>

        <div className="rule" />

        <div className="flex items-center justify-between">
          <span className="eyebrow">Total</span>
          <span className="font-display text-xl">{look.total === 0 ? 'Already yours' : usd(look.total)}</span>
        </div>

        {look.makeup && (
          <div className="flex items-center gap-2.5 pt-1">
            <div className="flex -space-x-1">
              {look.makeup.products?.slice(0, 4).map((p) => (
                <span key={p.id} className="w-4 h-4 rounded-full border border-white" style={{ background: p.hex }} />
              ))}
            </div>
            <span className="text-[11px] text-espresso-mute">{look.makeup.name} makeup</span>
          </div>
        )}
      </div>
    </motion.button>
  );
}
