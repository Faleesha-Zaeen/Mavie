import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import GarmentVisual from './GarmentVisual.jsx';

export const usd = (n) => `$${Number(n || 0).toLocaleString('en-US')}`;

export default function ProductCard({ item, index = 0, compact = false, onClick }) {
  if (!item) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className={`card-lift overflow-hidden group ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={compact ? 'aspect-square' : 'aspect-[3/4]'}>
        <GarmentVisual item={item} className="transition-transform duration-700 group-hover:scale-[1.04]" />
      </div>

      <div className="p-4 space-y-1.5">
        <div className="eyebrow">{item.category}</div>
        <h4 className="font-display text-lg leading-snug">{item.name}</h4>

        <div className="flex items-baseline justify-between pt-1">
          <span className="font-sans text-sm tracking-wide">
            {item.owned ? <span className="text-sage">Owned</span> : usd(item.price)}
          </span>
          {!compact && (
            <span className="text-[10px] text-espresso-mute tracking-wide">
              versatility {item.versatility}%
            </span>
          )}
        </div>

        {!compact && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {item.style_tags?.slice(0, 3).map((t) => (
              <span key={t} className="text-[10px] tracking-wide text-espresso-mute border border-line rounded-full px-2 py-0.5">
                {t}
              </span>
            ))}
          </div>
        )}

        {!compact && item.product_url && (
          <a
            href={item.product_url}
            target="_blank"
            rel="noreferrer noopener"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-salon text-espresso-mute
                       hover:text-rose transition-colors pt-2"
          >
            View product <ExternalLink size={11} />
          </a>
        )}
      </div>
    </motion.div>
  );
}
