import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, RefreshCw } from 'lucide-react';

import { api } from '../services/api.js';
import { useMavie } from '../context/MavieContext.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import AgentDebate from '../components/AgentDebate.jsx';
import VerdictCard from '../components/VerdictCard.jsx';
import ErrorState from '../components/ErrorState.jsx';
import ScoreBar from '../components/ScoreBar.jsx';
import ProductCard from '../components/ProductCard.jsx';

const FEEDBACK = [
  { type: 'love', label: '♡ Love it' },
  { type: 'not_me', label: 'Not me' },
  { type: 'too_expensive', label: 'Too expensive' },
  { type: 'too_uncomfortable', label: 'Too uncomfortable' },
  { type: 'too_bold', label: 'Too bold' },
];

export default function Aftermath() {
  const { selectedLook, constraints, decision, setDecision, guest } = useMavie();

  const [loading, setLoading] = useState(false);
  const [alternatives, setAlternatives] = useState([]);
  const [sent, setSent] = useState(null);
  const [error, setError] = useState(null);

  // The verdict is the point of the whole product, so it should not appear in
  // the same instant as the argument that produced it. Let the agents land,
  // then the evidence, then the call.
  const [stage, setStage] = useState(0); // 0 debate · 1 evidence · 2 verdict

  useEffect(() => {
    if (selectedLook && !decision) analyse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLook?.id]);

  // Stage the reveal once the decision lands. Timings are tuned to roughly the
  // pace of reading the debate rather than to look busy.
  useEffect(() => {
    if (!decision) return setStage(0);
    // Deliberately short. The user has already waited on the API; this beat is
    // for weight, not for suspense. ~2s total from debate to verdict.
    const debateBeats = decision.panel?.debate?.length || 4;
    const evidenceAt = Math.min(700 + debateBeats * 150, 1500);
    const timers = [
      setTimeout(() => setStage(1), evidenceAt),
      setTimeout(() => setStage(2), evidenceAt + 900),
    ];
    return () => timers.forEach(clearTimeout);
  }, [decision]);

  async function analyse() {
    if (!selectedLook) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.analyseDecision({
        items: selectedLook.items.map((i) => ({ id: i.id })),
        constraints: constraints || {},
        matchScores: selectedLook.scores,
        guest,
      });
      setDecision(result);

      if (result.verdict !== 'BUY') {
        const { alternatives: alts } = await api.alternatives({
          items: selectedLook.items.map((i) => ({ id: i.id })),
          constraints: constraints || {},
        });
        setAlternatives(alts);
      } else {
        setAlternatives([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function sendFeedback(type) {
    setSent(type);
    try {
      await api.feedback({
        feedback_type: type,
        look_id: selectedLook?.id,
        style_tags: selectedLook?.items.flatMap((i) => i.style_tags).slice(0, 4),
      });
    } catch { /* feedback is best-effort — never block the user */ }
  }

  if (!selectedLook) {
    return <EmptyState title="Nothing to weigh up yet" body="Build a look first, then MAVIE will tell you whether it's actually worth buying." cta="Start with a moment" to="/" />;
  }

  if (loading || !decision) {
    return <Loader stage="aftermath" sub="The stylist and the skeptic are reviewing the same evidence." />;
  }

  const m = decision.metrics;

  return (
    <div className="max-w-5xl mx-auto px-6 py-14 space-y-16">
      <header className="space-y-4 max-w-2xl">
        <div className="eyebrow">The aftermath</div>
        <h1 className="display text-5xl sm:text-6xl text-balance">Before you buy.</h1>
        <p className="serif-body text-pretty">
          You like how it looks. That is one question answered. MAVIE now asks the
          harder one — is this a decision you&rsquo;ll still be happy with in a month?
        </p>
      </header>

      {/* The debate */}
      <section className="card p-8 sm:p-10">
        <AgentDebate panel={decision.panel} />
      </section>

      {/* Metrics */}
      <motion.section
        className="space-y-8"
        initial={{ opacity: 0, y: 16 }}
        animate={stage >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="font-display text-3xl font-light">The evidence</h2>

        <div className="grid sm:grid-cols-2 gap-x-14 gap-y-7">
          <ScoreBar label="Occasion match" value={m.occasion_match} delay={0} />
          <ScoreBar label="Style match" value={m.style_match} delay={0.08} />
          <ScoreBar label="Budget fit" value={m.budget_fit} delay={0.16} />
          <ScoreBar label="Versatility" value={m.versatility} delay={0.24}
            hint="How many different contexts these pieces can serve." />
          <ScoreBar label="Rewear potential" value={m.rewear_potential} delay={0.32}
            hint="How often you're realistically likely to reach for this." />
          <ScoreBar label="Closet overlap" value={m.closet_overlap} delay={0.4} inverse
            hint="Lower is better — how much you already own something similar." />
          <ScoreBar label="Maintenance burden" value={m.maintenance_burden} delay={0.48} inverse
            hint="Lower is better — dry-clean, delicate fabrics, ironing." />
          <ScoreBar label="Budget pressure" value={m.budget_pressure} delay={0.56} inverse
            hint="Lower is better — how much of your budget this consumes." />
        </div>

        <p className="text-[11px] leading-relaxed text-espresso-mute border-t border-line pt-5 max-w-2xl">
          {decision.disclaimer}
        </p>
      </motion.section>

      {/* Verdict — held back until the argument and the evidence have landed. */}
      {stage < 2 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-rose"
            animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.6, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="eyebrow">Weighing it up</span>
        </div>
      ) : (
        <VerdictCard decision={decision} />
      )}

      {/* Alternatives */}
      {stage >= 2 && alternatives.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="space-y-6"
        >
          <div className="space-y-2 max-w-xl">
            <h2 className="font-display text-3xl font-light">Something similar, lower risk</h2>
            <p className="text-[13px] text-espresso-mute leading-relaxed">
              Same aesthetic, better answers to the questions the skeptic raised.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {alternatives.map((alt, i) => (
              <div key={alt.id} className="space-y-3">
                <ProductCard item={alt} index={i} />
                <p className="text-[11px] text-espresso-mute leading-relaxed px-1">{alt.why}</p>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Feedback loop */}
      <motion.section
        className="card p-8 space-y-5"
        initial={{ opacity: 0 }}
        animate={stage >= 2 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <div className="space-y-1.5">
          <h2 className="font-display text-2xl font-light">Tell MAVIE what you think</h2>
          <p className="text-[12px] text-espresso-mute">
            Every answer sharpens the next recommendation.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {FEEDBACK.map((f) => (
            <button
              key={f.type}
              onClick={() => sendFeedback(f.type)}
              className={`chip ${sent === f.type ? 'chip-active' : ''}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {sent && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[12px] text-sage-text flex items-center gap-1.5">
            <Heart size={11} /> Noted. MAVIE will factor that in next time.
          </motion.p>
        )}

        <div className="pt-2 flex flex-wrap gap-3">
          <button onClick={() => { setDecision(null); analyse(); }} className="btn-ghost">
            <RefreshCw size={12} /> Re-run the analysis
          </button>
        </div>
      </motion.section>

      {error && <ErrorState message={error} onRetry={() => { setDecision(null); analyse(); }} />}
    </div>
  );
}
