import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';

/**
 * Occasion picker.
 *
 * Twenty chips laid out flat pushed the actual input — the sentence the user
 * writes — below the fold, which inverts the point of the page. This keeps the
 * same range behind one quiet control that opens only when wanted.
 *
 * Picking an occasion fills the box with real phrasing rather than a keyword,
 * so the context engine has something to read and the user can see what a good
 * description looks like, then edit it.
 */
export default function OccasionPicker({ groups, selected, onSelect, onClear }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click and on Escape — a panel that traps you is worse
  // than the wall of chips it replaced.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-3 px-5 py-3.5 rounded-[3px] border
                    transition-all duration-300 text-left group
                    ${open || selected
                      ? 'border-rose bg-surface/80'
                      : 'border-line bg-surface/60 hover:border-rose-soft'}`}
      >
        <span className="min-w-0">
          <span className="block text-[9px] uppercase tracking-editorial text-espresso-mute">
            {selected ? 'Starting from' : 'Not sure how to describe it?'}
          </span>
          <span className={`block font-display text-lg leading-snug truncate mt-0.5 ${
            selected ? 'text-espresso' : 'text-espresso-mute'
          }`}>
            {selected || 'Pick a moment'}
          </span>
        </span>

        <span className="flex items-center gap-2 shrink-0">
          {selected && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onClear(); setOpen(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onClear(); setOpen(false); } }}
              className="p-1 text-espresso-mute hover:text-rose transition-colors"
              aria-label="Clear occasion"
            >
              <X size={13} />
            </span>
          )}
          <ChevronDown
            size={15}
            className={`text-espresso-mute transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute z-40 left-0 right-0 mt-2 max-h-[340px] overflow-y-auto
                       rounded-[3px] border border-line bg-surface shadow-lift p-2"
          >
            {groups.map((section) => (
              <div key={section.group} className="px-2 py-2">
                <div className="text-[9px] uppercase tracking-editorial text-espresso-mute/70 px-1 pb-1.5">
                  {section.group}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {section.items.map((o) => (
                    <button
                      key={o.label}
                      type="button"
                      onClick={() => { onSelect(o); setOpen(false); }}
                      className={`text-left px-3 py-2 rounded-[2px] text-[13px] transition-colors duration-200
                                  ${selected === o.label
                                    ? 'bg-espresso text-ivory'
                                    : 'text-espresso-soft hover:bg-ivory-deep'}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
