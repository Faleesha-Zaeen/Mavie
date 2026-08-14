import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Camera, Sparkles, X } from 'lucide-react';

import { api } from '../services/api.js';
import { useMavie } from '../context/MavieContext.jsx';
import { readImage } from '../utils/image.js';
import Loader from '../components/Loader.jsx';
import ErrorState from '../components/ErrorState.jsx';
import OccasionPicker from '../components/OccasionPicker.jsx';

const VIBES = ['Soft', 'Minimal', 'Elegant', 'Bold', 'Feminine', 'Comfortable'];

/**
 * A starting point for people who don't want to write a sentence.
 *
 * Each one seeds the box with real phrasing rather than a bare keyword, so the
 * context engine gets something to actually read — and so the user can see what
 * a good description looks like and edit from there.
 *
 * Grouped, because a flat list of twenty is a menu, not a choice.
 */
const OCCASIONS = [
  {
    group: 'Work',
    items: [
      { label: 'Job interview', text: 'I have a job interview tomorrow. I want to look professional but still feminine, and comfortable.' },
      { label: 'Presentation', text: 'I am presenting to my team tomorrow. I want to look confident and put together.' },
      { label: 'First day', text: 'First day at a new job. I want to look polished but approachable.' },
      { label: 'Office day', text: 'A normal day at the office. Smart but comfortable, nothing fussy.' },
    ],
  },
  {
    group: 'Evening',
    items: [
      { label: 'Dinner date', text: 'Dinner date tonight. I want to feel feminine but not overdressed.' },
      { label: 'Birthday dinner', text: 'Birthday dinner with my friends tonight — cute but not overdressed.' },
      { label: 'Party', text: 'A party this weekend. I want something with a bit of presence.' },
      { label: 'Drinks after work', text: 'Drinks after work. Something I can wear straight from the office.' },
    ],
  },
  {
    group: 'Occasion',
    items: [
      { label: 'Wedding guest', text: "A friend's wedding next month. I want to feel elegant and a little special." },
      { label: 'Graduation', text: 'My graduation ceremony. Elegant, feminine and sophisticated.' },
      { label: 'Family event', text: 'A family gathering this weekend. Modest, polished and comfortable.' },
      { label: 'Photoshoot', text: 'I have photos being taken. I want something that photographs well and feels like me.' },
    ],
  },
  {
    group: 'Everyday',
    items: [
      { label: 'Brunch', text: 'Weekend brunch with friends. Relaxed but put together.' },
      { label: 'Coffee', text: 'Coffee with a friend. Nothing fancy, just easy and nice.' },
      { label: 'College', text: 'A normal day at college. Comfortable, and I still want to look good.' },
      { label: 'Errands', text: 'Running errands all day. Comfortable above everything.' },
    ],
  },
  {
    group: 'Away',
    items: [
      { label: 'Travel day', text: 'A long travel day. Comfortable, easy to move in, still presentable.' },
      { label: 'Holiday dinner', text: 'Dinner out while on holiday somewhere warm. Feminine and relaxed.' },
      { label: 'Sightseeing', text: 'A day of sightseeing and walking. Comfortable and practical.' },
      { label: 'Beach day', text: 'A beach day with friends. Light, easy and relaxed.' },
    ],
  },
];

export default function Moment() {
  const navigate = useNavigate();
  const { setConstraints, setLooks, setSelectedLookId, userImage, setUserImage, beauty, setBeauty, guest } = useMavie();

  const [text, setText] = useState('');
  const [vibes, setVibes] = useState([]);
  const [selectedOccasion, setSelectedOccasion] = useState(null);
  const [budget, setBudget] = useState(150);
  const [stage, setStage] = useState(null);
  const [error, setError] = useState(null);

  // The greeting reads the persisted profile rather than session state, so it
  // survives a reload the same way the rest of the profile does.
  const [name, setName] = useState('');
  useEffect(() => {
    api.getProfile().then(({ profile }) => setName(profile?.name || '')).catch(() => {});
  }, []);

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
      const enriched = [text, vibes.length ? `I want to feel ${vibes.join(' and ')}.` : '', `My budget is $${budget}.`]
        .filter(Boolean)
        .join(' ');

      const { constraints } = await api.parseContext(enriched);
      setConstraints(constraints);

      setStage('outfit');
      const { looks, pick } = await api.composeLooks(constraints, guest, beauty);
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
          <h1 className="display text-6xl sm:text-8xl">MAVIE</h1>

          <p className="mt-4 font-display italic text-xl sm:text-2xl text-espresso-mute font-light">
            A look made for your life.
          </p>

          <div className="mt-10 mx-auto w-14 rule" />

          {/* Greeting only once there is a name to greet — "Hello, there."
              is worse than no greeting at all. */}
          {name && (
            <p className="mt-9 font-display italic text-2xl sm:text-3xl text-espresso-soft font-light">
              Hello, {name}.
            </p>
          )}

          <h2 className={`${name ? 'mt-3' : 'mt-10'} display text-4xl sm:text-5xl text-balance`}>
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
            onChange={(e) => { setText(e.target.value); setSelectedOccasion(null); }}
            rows={3}
            placeholder="Dinner with my friends tonight — I want something cute but not overdressed…"
            className="field resize-none"
          />

        </div>

        {/* Twenty chips laid out flat pushed the input itself below the fold,
            which inverts the point of the page. Same range, one quiet control. */}
        <OccasionPicker
          groups={OCCASIONS}
          selected={selectedOccasion}
          onSelect={(o) => { setText(o.text); setSelectedOccasion(o.label); }}
          onClear={() => { setText(''); setSelectedOccasion(null); }}
        />

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
            <span className="font-display text-2xl">${budget.toLocaleString('en-US')}</span>
          </div>
          <input
            type="range"
            min={25}
            max={500}
            step={5}
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
            <span>$25</span><span>$500</span>
          </div>
        </div>

        {/* Photo + skin */}
        <div className="card p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="eyebrow">Optional</div>
              <h3 className="font-display text-xl mt-1">Add a selfie</h3>
              {/* Say what the photo is FOR and what it should look like. Skin
                  analysis needs the face large in frame; a full-body shot gives
                  a face too small to read. Try-on asks for its own photo. */}
              <p className="text-[12px] text-espresso-mute mt-1.5 max-w-sm leading-relaxed">
                A clear, front-facing photo of your face — MAVIE reads your skin from it
                and sets your beauty profile. You&rsquo;ll add a full-body photo later for try-on.
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
                <Sparkles size={12} className="text-rose-text" />
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

        {error && <ErrorState message={error} onRetry={() => setError(null)} retryLabel="Dismiss" />}

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
              <div className="eyebrow text-rose-text">{s.n}</div>
              <h3 className="font-display text-2xl font-light">{s.t}</h3>
              <p className="text-[13px] leading-relaxed text-espresso-mute">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
