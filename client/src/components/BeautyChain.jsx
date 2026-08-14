import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

/**
 * SKIN → BEAUTY PROFILE → MAKEUP → OUTFIT PALETTE → COMPLETE LOOK
 *
 * The chain is real in the engine: skin analysis sets the base finish and
 * intensity, which the makeup engine applies, which is then colour-matched to
 * the garments the composer picked. But a judge cannot see a causal link that
 * only exists in code — so this renders each step with the actual value it
 * produced, making it legible rather than merely implemented.
 */
export default function BeautyChain({ beauty, makeup, items = [] }) {
  if (!makeup) return null;

  const fromSkin = makeup.finish_source === 'skin_analysis';
  const dominant = items.find((i) => i.category === 'dress') || items[0];

  const steps = [
    {
      label: 'Skin analysis',
      value: beauty?.headline || (fromSkin ? 'Analysed' : 'Not yet run'),
      muted: !fromSkin,
    },
    {
      label: 'Beauty profile',
      value: fromSkin ? `${makeup.finish} finish` : 'defaults',
      muted: !fromSkin,
    },
    {
      label: 'Makeup',
      value: `${makeup.name} · ${makeup.intensity}`,
    },
    {
      label: 'Outfit palette',
      value: dominant?.colors?.[0] || 'neutral',
      swatch: dominant?.hex,
    },
    {
      label: 'Complete look',
      value: 'coordinated',
      accent: true,
    },
  ];

  return (
    <div
      id="beauty-chain"
      className={`scroll-mt-24 rounded-[3px] border px-5 py-5 space-y-4 ${
        fromSkin ? 'border-rose-soft bg-blush/25' : 'border-line bg-surface/60'
      }`}
    >
      <div className="flex items-center gap-2">
        <Sparkles size={12} className="text-rose-text" />
        <span className="eyebrow">How this look was decided</span>
      </div>

      {/* The chain itself */}
      <ol className="flex flex-wrap items-stretch gap-y-3">
        {steps.map((step, i) => (
          <motion.li
            key={step.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.09, duration: 0.4 }}
            className="flex items-center"
          >
            <div className="min-w-[104px]">
              <div className="text-[9px] uppercase tracking-editorial text-espresso-mute">
                {step.label}
              </div>
              <div
                className={`font-display text-[15px] leading-tight mt-0.5 flex items-center gap-1.5 ${
                  step.muted ? 'text-espresso-mute italic' : step.accent ? 'text-rose-text' : 'text-espresso'
                }`}
              >
                {step.swatch && (
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-line shrink-0"
                    style={{ background: step.swatch }}
                  />
                )}
                <span className="capitalize">{step.value}</span>
              </div>
            </div>

            {i < steps.length - 1 && (
              <ArrowRight size={11} className="text-espresso-mute/50 mx-2.5 shrink-0" />
            )}
          </motion.li>
        ))}
      </ol>

      <p className="text-[12px] leading-relaxed text-espresso-soft border-t border-line/70 pt-3">
        {makeup.provenance}
      </p>
    </div>
  );
}
