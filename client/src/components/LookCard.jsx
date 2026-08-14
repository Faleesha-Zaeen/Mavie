import { motion } from 'framer-motion';
import GarmentVisual from './GarmentVisual.jsx';
import { usd } from './ProductCard.jsx';

/** A complete look: real garments + coordinated makeup + its own scores. */
export default function LookCard({ look, index = 0, selected, isPick, onSelect }) {
  if (!look) return null;

  /**
   * Which pieces to show, and in how many columns.
   *
   * Excluding accessories outright left a dress-and-necklace look with one
   * garment in a three-column grid — two empty cells reading as a broken
   * layout. So accessories are used to fill out a short look, and the grid
   * matches however many pieces there actually are.
   */
  const primary = look.items.filter((i) => i.category !== 'accessory');
  const extras = look.items.filter((i) => i.category === 'accessory');
  const garments = [...primary, ...extras].slice(0, 3);

  const columns = { 1: 'grid-cols-1', 2: 'grid-cols-2' }[garments.length] || 'grid-cols-3';

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
      {/* Two different things worth saying: which one MAVIE rated highest, and
          which one you are actually acting on. Without the second, choosing a
          look changed the page below with no acknowledgement up here. */}
      {isPick && (
        <div className="absolute top-0 right-0 z-10 bg-espresso text-ivory text-[9px] uppercase tracking-editorial px-3 py-1.5">
          MAVIE's pick
        </div>
      )}

      {selected && (
        <div className="absolute top-0 left-0 z-10 bg-rose text-white text-[9px] uppercase tracking-editorial px-3 py-1.5">
          Your choice
        </div>
      )}

      {/* Garment triptych. `contain` rather than `cover`: these are product
          shots, and cropping a garment to fill a narrow column defeats the
          point of photographing the whole thing. */}
      <div className={`grid ${columns} gap-px bg-line aspect-[4/3]`}>
        {garments.map((item) => (
          <div key={item.id} className="relative overflow-hidden bg-white">
            <GarmentVisual
              item={item}
              fit="contain"
              className="transition-transform duration-700 group-hover:scale-[1.04]"
            />
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
