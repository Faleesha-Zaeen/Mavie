import { motion } from 'framer-motion';

/**
 * THE STYLIST 🟢 vs THE SKEPTIC 🔴
 *
 * Rendered as an actual exchange, alternating sides. Neither agent decides —
 * each turn cites which piece of evidence it rests on, which is what keeps
 * this from being two chatbots talking nonsense.
 */
export default function AgentDebate({ panel }) {
  if (!panel?.debate?.length) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-8 pb-2">
        <Legend dot="bg-sage" title="The Stylist" sub="argues for" />
        <Legend dot="bg-rust" title="The Skeptic" sub="argues against" />
      </div>

      <div className="space-y-3">
        {panel.debate.map((turn, i) => {
          const stylist = turn.side === 'stylist';
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: stylist ? -18 : 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.28, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className={`flex ${stylist ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[82%] sm:max-w-[70%] px-5 py-4 rounded-[3px] border shadow-soft ${
                  stylist
                    ? 'bg-sage/[0.07] border-sage/30 rounded-tl-none'
                    : 'bg-rust/[0.07] border-rust/30 rounded-tr-none'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${stylist ? 'bg-sage' : 'bg-rust'}`} />
                  <span className="eyebrow">{stylist ? 'The Stylist' : 'The Skeptic'}</span>
                  {turn.severity && (
                    <span className={`text-[9px] uppercase tracking-salon px-1.5 py-0.5 rounded-full border ${
                      turn.severity === 'high'
                        ? 'border-rust/40 text-rust-text'
                        : turn.severity === 'medium'
                          ? 'border-amber/40 text-amber-text'
                          : 'border-line text-espresso-mute'
                    }`}>
                      {turn.severity}
                    </span>
                  )}
                </div>

                <p className="font-display text-[17px] leading-relaxed text-espresso text-pretty">
                  {turn.claim}
                </p>

                <p className="mt-2.5 text-[10px] uppercase tracking-salon text-espresso-mute">
                  based on · {String(turn.basis).replace(/_/g, ' ')}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <p className="pt-4 text-[11px] leading-relaxed text-espresso-mute border-t border-line">
        Both agents receive identical evidence and are instructed not to invent facts.
        Neither one decides — MAVIE's decision engine weighs their arguments against
        your constraints, the catalog data and your closet.
      </p>
    </div>
  );
}

function Legend({ dot, title, sub }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      <span className="font-display text-base">{title}</span>
      <span className="text-[10px] uppercase tracking-salon text-espresso-mute">{sub}</span>
    </div>
  );
}
