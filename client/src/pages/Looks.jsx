import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Heart } from 'lucide-react';

import { api } from '../services/api.js';

import { useMavie } from '../context/MavieContext.jsx';
import LookCard from '../components/LookCard.jsx';
import MatchRing from '../components/MatchRing.jsx';
import ScoreBar from '../components/ScoreBar.jsx';
import EmptyState from '../components/EmptyState.jsx';

const FACTORS = [
  ['occasion', 'Occasion'],
  ['style', 'Style'],
  ['preference', 'Preferences'],
  ['budget', 'Budget'],
  ['comfort', 'Comfort'],
  ['beauty', 'Beauty compatibility'],
];

export default function Looks() {
  const navigate = useNavigate();
  const { looks, selectedLook, selectedLookId, setSelectedLookId, constraints } = useMavie();
  const [saved, setSaved] = useState(false);

  async function saveLook() {
    const look = selectedLook || looks[0];
    if (!look) return;
    try {
      await api.saveLook(look);
      setSaved(true);
    } catch { /* saving is best-effort — never block the journey */ }
  }

  if (!looks.length) {
    return <EmptyState title="No looks yet" body="Tell MAVIE what the moment is and it will build three complete looks from real products." cta="Start with a moment" to="/" />;
  }

  const pick = looks[0];

  return (
    <div className="max-w-6xl mx-auto px-6 py-14 space-y-16">
      {/* Header */}
      <header className="space-y-4 max-w-2xl">
        <div className="eyebrow">Three complete looks</div>
        <h1 className="display text-5xl sm:text-6xl text-balance">
          Three versions of you.
        </h1>
        {constraints?.summary && (
          <p className="serif-body text-pretty">{constraints.summary}</p>
        )}
      </header>

      {/* The three looks */}
      <section className="grid md:grid-cols-3 gap-6">
        {looks.map((look, i) => (
          <LookCard
            key={look.id}
            look={look}
            index={i}
            selected={selectedLookId === look.id}
            isPick={look.id === pick.id}
            onSelect={setSelectedLookId}
          />
        ))}
      </section>

      {/* Comparison table */}
      <section className="space-y-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-3xl font-light">MAVIE Match</h2>
          <span className="text-[11px] text-espresso-mute max-w-xs text-right leading-relaxed">
            Not an attractiveness score — how well each look satisfies what you asked for.
            Beauty compatibility comes from your skin analysis.
          </span>
        </div>

        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left eyebrow p-5 font-medium">Factor</th>
                {looks.map((l) => (
                  <th key={l.id} className="p-5 text-right">
                    <div className="font-display text-lg font-light">{l.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTORS.map(([key, label]) => {
                const best = Math.max(...looks.map((l) => l.scores[key] ?? 0));
                const isBeauty = key === 'beauty';
                return (
                  <tr key={key} className="border-b border-line/60">
                    <td className="p-5 text-[12px] text-espresso-soft">
                      {isBeauty ? (
                        // Links back to the line explaining how skin analysis
                        // set this look's makeup — the score should be
                        // traceable, not an unexplained number.
                        <a
                          href="#beauty-chain"
                          className="inline-flex items-center gap-1 border-b border-dotted border-line
                                     hover:border-rose hover:text-rose-text transition-colors"
                        >
                          {label}
                          <Sparkles size={10} className="text-rose-text" />
                        </a>
                      ) : label}
                    </td>
                    {looks.map((l) => {
                      const v = l.scores[key] ?? 0;
                      return (
                        <td key={l.id} className={`p-5 text-right tabular-nums font-display text-lg ${
                          v === best ? 'text-rose-text' : 'text-espresso-mute'
                        }`}>
                          {v}%
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr className="bg-ivory-deep/50">
                <td className="p-5 eyebrow">Overall</td>
                {looks.map((l) => (
                  <td key={l.id} className="p-5 text-right">
                    <span className={`display text-2xl ${l.id === pick.id ? 'text-rose-text' : ''}`}>
                      {l.scores.overall}%
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* MAVIE's pick */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="card p-8 sm:p-12"
      >
        <div className="grid lg:grid-cols-[auto,1fr] gap-12 items-center">
          <div className="flex justify-center">
            <MatchRing value={pick.scores.overall} size={188} />
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={13} className="text-rose-text" />
                <span className="eyebrow">MAVIE's pick</span>
              </div>
              <h3 className="display text-4xl">{pick.name}</h3>
            </div>

            <p className="serif-body text-pretty">{pick.explanation}</p>

            <div className="grid sm:grid-cols-2 gap-x-10 gap-y-5">
              {FACTORS.slice(0, 4).map(([key, label], i) => (
                <ScoreBar key={key} label={label} value={pick.scores[key]} delay={i * 0.1} />
              ))}
            </div>

            {selectedLook?.makeup && (
              <div id="beauty-chain" className="pt-5 border-t border-line space-y-3 scroll-mt-24">
                <div className="eyebrow">Complete the look</div>

                {/* The combined-track chain, stated in one line so it is
                    legible on screen and not just true in the code. */}
                <div className={`flex items-start gap-2.5 rounded-[3px] px-4 py-3 border ${
                  selectedLook.makeup.finish_source === 'skin_analysis'
                    ? 'border-rose-soft bg-blush/25'
                    : 'border-line bg-surface/60'
                }`}>
                  <Sparkles size={12} className="text-rose-text mt-0.5 shrink-0" />
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-editorial text-espresso-mute">
                      <span>Skin</span><ArrowRight size={9} />
                      <span>Makeup</span><ArrowRight size={9} />
                      <span>Outfit</span>
                    </div>
                    <p className="text-[12px] leading-relaxed text-espresso-soft">
                      {selectedLook.makeup.provenance}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {Object.entries(selectedLook.makeup.direction).map(([part, value]) => (
                    <div key={part} className="text-[12px]">
                      <span className="text-espresso-mute capitalize">{part}: </span>
                      <span className="text-espresso">{value}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[12px] text-espresso-mute italic leading-relaxed">
                  {selectedLook.makeup.why}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <button onClick={() => navigate('/try-on')} className="btn-rose group">
                Try this look
                <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              <button onClick={() => navigate('/aftermath')} className="btn-ghost">
                Should I buy it?
              </button>
              <button onClick={saveLook} disabled={saved} className="btn-ghost">
                <Heart size={12} className={saved ? 'fill-rose text-rose-text' : ''} />
                {saved ? 'Saved' : 'Save look'}
              </button>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
