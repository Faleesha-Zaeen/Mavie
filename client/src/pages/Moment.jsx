import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Camera, Sparkles, X } from 'lucide-react';

import { api } from '../services/api.js';
import { useMavie } from '../context/MavieContext.jsx';
import { readImage } from '../utils/image.js';
import Loader from '../components/Loader.jsx';

const VIBES = ['Soft', 'Minimal', 'Elegant', 'Bold', 'Feminine', 'Comfortable'];

const EXAMPLES = [
  'I have a placement interview tomorrow. I want to look professional but still feminine. Nothing uncomfortable, and I have ₹3,000.',
  'Birthday dinner with my friends tonight — cute but not overdressed.',
  'Graduation ceremony. Elegant, feminine and sophisticated. Budget ₹3,000.',
];

export default function Moment() {
  const navigate = useNavigate();
  const { setConstraints, setLooks, setSelectedLookId, userImage, setUserImage, beauty, setBeauty, guest } = useMavie();

  const [text, setText] = useState('');
  const [vibes, setVibes] = useState([]);
  const [budget, setBudget] = useState(3000);
  const [stage, setStage] = useState(null);
  const [error, setError] = useState(null);

  const toggleVibe = (v) =>
    setVibes((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await readImage(file);
      setUserImage(dataUrl);
      setStage('skin');
      const { beauty: profile } = await api.analyseSkin({ imageBase64: dataUrl, guest });
      setBeauty(profile);
    } catch (err) {
      setError(err.message);
    } finally {
      setStage(null);
    }
  }

  async function createLook() {
    if (text.trim().length < 3) {
      setError('Tell MAVIE a little about the moment first.');
      return;
    }
    setError(null);

    try {
      setStage('context');
      const enriched = [text, vibes.length ? `I want to feel ${vibes.join(' and ')}.` : '', `My budget is ₹${budget}.`]
        .filter(Boolean)
        .join(' ');

      const { constraints } = await api.parseContext(enriched);
      setConstraints(constraints);

      setStage('outfit');
      const { looks, pick } = await api.composeLooks(constraints, guest);
      setLooks(looks);
      setSelectedLookId(pick);

      navigate('/looks');
    } catch (err) {
      setError(err.message);
      setStage(null);
    }
  }

  if (stage) {
    return (
      <Loader
        stage={stage}
        sub={stage === 'outfit' ? 'MAVIE is searching real products, not imagining them.' : undefined}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="pt-20 pb-14 text-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="eyebrow mb-7">AI decision intelligence for personal appearance</div>

          <h1 className="display text-6xl sm:text-8xl">MAVIE</h1>

          <p className="mt-4 font-display italic text-xl sm:text-2xl text-espresso-mute font-light">
            A look made for your life.
          </p>

          <div className="mt-10 mx-auto w-14 rule" />

          <h2 className="mt-10 display text-4xl sm:text-5xl text-balance">
            What&rsquo;s the moment?
          </h2>
        </motion.div>
      </section>

      {/* ── Input ────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-9"
      >
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Dinner with my friends tonight — I want something cute but not overdressed…"
            className="field resize-none"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => setText(ex)}
                className="text-[10px] tracking-wide text-espresso-mute hover:text-rose transition-colors
                           border-b border-dotted border-line hover:border-rose"
              >
                {ex.slice(0, 42)}…
              </button>
            ))}
          </div>
        </div>

        {/* Vibe */}
        <div className="space-y-3.5">
          <div className="eyebrow">Your vibe</div>
          <div className="flex flex-wrap gap-2">
            {VIBES.map((v) => (
              <button
                key={v}
                onClick={() => toggleVibe(v)}
                className={`chip ${vibes.includes(v) ? 'chip-active' : ''}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div className="space-y-3.5">
          <div className="flex items-baseline justify-between">
            <span className="eyebrow">Your budget</span>
            <span className="font-display text-2xl">₹{budget.toLocaleString('en-IN')}</span>
          </div>
          <input
            type="range"
            min={500}
            max={10000}
            step={250}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full h-px bg-line appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5
                       [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-rose [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:border-0
                       [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-rose"
          />
          <div className="flex justify-between text-[10px] tracking-wide text-espresso-mute">
            <span>₹500</span><span>₹10,000</span>
          </div>
        </div>

        {/* Photo + skin */}
        <div className="card p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="eyebrow">Optional</div>
              <h3 className="font-display text-xl mt-1">Add a photo</h3>
              <p className="text-[12px] text-espresso-mute mt-1.5 max-w-sm leading-relaxed">
                MAVIE uses it for your beauty profile and to show you the look on yourself.
                {guest && ' Guest mode is on — nothing is stored.'}
              </p>
            </div>

            {userImage ? (
              <div className="relative shrink-0">
                <img src={userImage} alt="You" className="w-20 h-24 object-cover rounded-[3px] border border-line" />
                <button
                  onClick={() => { setUserImage(null); setBeauty(null); }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-espresso text-ivory
                             flex items-center justify-center hover:bg-rose transition-colors"
                  aria-label="Remove photo"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className="btn-ghost shrink-0 cursor-pointer">
                <Camera size={13} /> Upload
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} className="hidden" />
              </label>
            )}
          </div>

          {beauty && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-4 border-t border-line space-y-2.5"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={12} className="text-rose" />
                <span className="eyebrow">Your beauty direction</span>
              </div>
              <p className="font-display text-2xl font-light">{beauty.headline}</p>
              <ul className="space-y-1">
                {beauty.guidance?.map((g, i) => (
                  <li key={i} className="text-[12px] text-espresso-soft leading-relaxed">— {g}</li>
                ))}
              </ul>
              <p className="text-[10px] text-espresso-mute pt-1 italic">{beauty.note}</p>
            </motion.div>
          )}
        </div>

        {error && (
          <p className="text-[12px] text-rust border border-rust/25 bg-rust/[0.05] px-4 py-3 rounded-[3px]">
            {error}
          </p>
        )}

        <div className="flex justify-center pb-8">
          <button onClick={createLook} className="btn-rose group">
            Create my look
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </motion.section>

      {/* ── Thesis ───────────────────────────────────────────── */}
      <section className="py-16 border-t border-line">
        <div className="grid sm:grid-cols-3 gap-10">
          {[
            { n: '01', t: 'Personalize', d: 'Your occasion, style, budget, comfort, skin and closet — not a generic trend feed.' },
            { n: '02', t: 'Visualize', d: 'Real catalog garments on your own photo, with makeup coordinated to the outfit.' },
            { n: '03', t: 'Decide', d: 'A stylist and a skeptic argue over the evidence, then MAVIE says buy, wait or skip.' },
          ].map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6 }}
              className="space-y-2.5"
            >
              <div className="eyebrow text-rose">{s.n}</div>
              <h3 className="font-display text-2xl font-light">{s.t}</h3>
              <p className="text-[13px] leading-relaxed text-espresso-mute">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
