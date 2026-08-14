import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, ShieldCheck, X, Plus } from 'lucide-react';

import { api } from '../services/api.js';
import { useMavie } from '../context/MavieContext.jsx';

/**
 * Style words the catalog is actually tagged with. Offering anything else
 * would let you pick an identity nothing in the catalog can match, so the
 * setting would look like it worked and change nothing.
 */
const STYLE_TAGS = [
  'minimal', 'feminine', 'elegant', 'classic', 'edgy', 'romantic', 'streetwear',
  'preppy', 'boho', 'sleek', 'soft', 'bold', 'relaxed', 'quiet-luxury',
  'clean-girl', 'coquette', 'model-off-duty', 'gen-z', 'timeless', 'playful',
  'comfort', 'professional', 'evening', 'coastal',
];

export default function Profile() {
  const { beauty, userImage, setUserImage, bodyImage, setBodyImage, setBeauty, guest, setGuest } = useMavie();

  // There are two photos now — a privacy control that clears only one of them
  // would be worse than not offering it.
  const clearPhotos = () => { setUserImage(null); setBodyImage(null); setBeauty(null); };

  const [profile, setProfile] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [message, setMessage] = useState(null);

  // Editable copies, so typing doesn't fire a request per keystroke.
  const [budget, setBudget] = useState([0, 0]);
  const [comfort, setComfort] = useState(0.8);
  const [name, setName] = useState('');

  useEffect(() => {
    api.getProfile().then(({ profile: p }) => {
      setProfile(p);
      setBudget(p.budget_range);
      setComfort(p.comfort_priority);
      setName(p.name || '');
    }).catch(() => {});
  }, []);

  async function patch(body, note) {
    const { profile: p } = await api.updateProfile(body);
    setProfile(p);
    setMessage(note);
    setTimeout(() => setMessage(null), 2600);
    return p;
  }

  // Saving on blur loses the edit whenever someone types a number and clicks
  // straight into the nav, so the range is committed explicitly. The button
  // only appears once the values actually differ from what's stored.
  const budgetChanged = profile
    && (Number(budget[0]) !== profile.budget_range[0] || Number(budget[1]) !== profile.budget_range[1]);

  function saveBudget() {
    // A reversed or empty range would silently filter the whole catalog out.
    const low = Math.max(0, Number(budget[0]) || 0);
    const high = Math.max(low + 1, Number(budget[1]) || low + 1);
    setBudget([low, high]);
    patch({ budget_range: [low, high] }, `Budget set to $${low}—$${high}.`).catch(() => {});
  }

  const nameChanged = profile && name.trim() !== (profile.name || '');

  function saveName() {
    const value = name.trim();
    setName(value);
    patch(
      { name: value || null },
      value ? `MAVIE will call you ${value}.` : 'Name cleared.',
    ).catch(() => {});
  }

  const saveComfort = () =>
    patch({ comfort_priority: comfort }, `Comfort priority set to ${Math.round(comfort * 100)}%.`).catch(() => {});

  const dropColour = (list, colour, key, note) =>
    patch({ [key]: profile[key].filter((c) => c !== colour) }, note).catch(() => {});

  function addColour(key, note) {
    const value = prompt(key === 'preferred_colors' ? 'Colour you love?' : 'Colour to avoid?');
    if (!value?.trim()) return;
    const colour = value.trim().toLowerCase();
    if (profile[key].includes(colour)) return;
    patch({ [key]: [...profile[key], colour] }, note).catch(() => {});
  }

  // The beauty profile is saved server-side, so it should survive a reload.
  // Reading only from session state made it vanish whenever the page was
  // refreshed, which looked like the skin analysis had been lost.
  const savedBeauty = profile?.beauty;
  const beautyProfile = beauty || (savedBeauty && {
    ...savedBeauty,
    headline: savedBeauty.direction
      ? savedBeauty.direction.join(' + ').replace(/\b\w/g, (c) => c.toUpperCase())
      : null,
    note: 'This is beauty personalization, not a medical assessment. MAVIE does not diagnose skin conditions.',
  });

  async function deleteEverything() {
    await api.deleteProfile();
    clearPhotos();
    setMessage('Your profile, photos and closet have been deleted.');
    api.getProfile().then(({ profile: p }) => setProfile(p));
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-14 space-y-14">
      <header className="space-y-4">
        <div className="eyebrow">Your profile</div>
        <h1 className="display text-5xl sm:text-6xl">Style DNA</h1>
      </header>

      {/* Name sits above everything else because it is the one field that is
          about you rather than about your clothes. Committed explicitly, for
          the same reason as the budget: blur loses the edit if you type and
          click straight into the nav. */}
      {profile && (
        <section className="space-y-2.5">
          <div className="eyebrow">Your name</div>
          <div className="flex items-center gap-2.5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveName()}
              placeholder="What should MAVIE call you?"
              maxLength={40}
              className="flex-1 max-w-sm bg-surface/75 border border-line rounded-[3px] px-4 py-2.5
                         font-display text-2xl focus:outline-none focus:border-rose transition-colors"
              aria-label="Your name"
            />
            {nameChanged && (
              <button onClick={saveName} className="btn-primary shrink-0">Save</button>
            )}
          </div>
        </section>
      )}

      {profile && (
        <section className="grid sm:grid-cols-2 gap-10">
          <div className="space-y-6">
            <Block label="Style DNA">
              <div className="flex flex-wrap gap-2">
                {profile.style_dna.map((s) => (
                  <button
                    key={s}
                    onClick={() => patch(
                      { style_dna: profile.style_dna.filter((x) => x !== s) },
                      `Dropped ${s} from your Style DNA.`,
                    ).catch(() => {})}
                    className="chip chip-active group"
                    title={`Remove ${s}`}
                  >
                    {s} <X size={10} className="opacity-50 group-hover:opacity-100" />
                  </button>
                ))}
              </div>

              {/* Suggestions come from the tags the catalog actually carries —
                  a free-text box would let you type a word nothing matches. */}
              <div className="flex flex-wrap gap-2 mt-2.5">
                {STYLE_TAGS.filter((t) => !profile.style_dna.includes(t)).map((t) => (
                  <button
                    key={t}
                    onClick={() => patch(
                      { style_dna: [...profile.style_dna, t] },
                      `Added ${t} to your Style DNA.`,
                    ).catch(() => {})}
                    className="chip opacity-55 hover:opacity-100"
                  >
                    <Plus size={10} /> {t}
                  </button>
                ))}
              </div>
            </Block>

            {/* These start as sensible defaults and get corrected by what you
                actually pick — but they were read-only, so a wrong guess had
                no way out except waiting for the feedback loop to catch up. */}
            <Block label="Preferred colours">
              <div className="flex flex-wrap gap-2">
                {profile.preferred_colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => dropColour(profile.preferred_colors, c, 'preferred_colors', `Removed ${c}.`)}
                    className="chip group"
                    title={`Remove ${c}`}
                  >
                    {c} <X size={10} className="opacity-40 group-hover:opacity-100" />
                  </button>
                ))}
                <button onClick={() => addColour('preferred_colors', 'Colour added.')} className="chip">
                  <Plus size={10} /> add
                </button>
              </div>
            </Block>

            <Block label="Avoids">
              <div className="flex flex-wrap gap-2">
                {profile.avoided_colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => dropColour(profile.avoided_colors, c, 'avoided_colors', `No longer avoiding ${c}.`)}
                    className="chip group text-rust-text border-rust/30"
                    title={`Stop avoiding ${c}`}
                  >
                    {c} <X size={10} className="opacity-40 group-hover:opacity-100" />
                  </button>
                ))}
                <button onClick={() => addColour('avoided_colors', 'MAVIE will avoid it.')} className="chip">
                  <Plus size={10} /> add
                </button>
              </div>
            </Block>
          </div>

          <div className="space-y-6">
            {/* MAVIE infers a budget from what you say and what you skip, but
                nobody should have to talk their way to a number they already
                know. Typed values win, and become the default the composer
                uses when a moment doesn't state one. */}
            <Block label="Budget range">
              <div className="flex items-center gap-2.5">
                <span className="font-display text-2xl text-espresso-mute">$</span>
                <input
                  type="number"
                  min="0"
                  value={budget[0]}
                  onChange={(e) => setBudget([e.target.value, budget[1]])}
                  onKeyDown={(e) => e.key === 'Enter' && saveBudget()}
                  className="w-24 bg-surface/75 border border-line rounded-[3px] px-3 py-2
                             font-display text-2xl tabular-nums focus:outline-none focus:border-rose
                             transition-colors"
                  aria-label="Lowest you would spend"
                />
                <span className="text-espresso-mute">—</span>
                <span className="font-display text-2xl text-espresso-mute">$</span>
                <input
                  type="number"
                  min="0"
                  value={budget[1]}
                  onChange={(e) => setBudget([budget[0], e.target.value])}
                  onKeyDown={(e) => e.key === 'Enter' && saveBudget()}
                  className="w-24 bg-surface/75 border border-line rounded-[3px] px-3 py-2
                             font-display text-2xl tabular-nums focus:outline-none focus:border-rose
                             transition-colors"
                  aria-label="Most you would spend"
                />
                {budgetChanged && (
                  <button onClick={saveBudget} className="btn-primary shrink-0">Save</button>
                )}
              </div>
              <p className="text-[11px] text-espresso-mute mt-2">
                The upper number is the ceiling MAVIE assumes when a moment doesn't name one.
              </p>
            </Block>

            <Block label="Comfort priority">
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(comfort * 100)}
                  onChange={(e) => setComfort(Number(e.target.value) / 100)}
                  onMouseUp={saveComfort}
                  onTouchEnd={saveComfort}
                  onKeyUp={saveComfort}
                  className="flex-1 accent-rose cursor-pointer"
                  aria-label="How much comfort matters to you"
                />
                <span className="font-display text-xl tabular-nums w-14 text-right">
                  {Math.round(comfort * 100)}%
                </span>
              </div>
              <p className="text-[11px] text-espresso-mute mt-2">
                Higher means MAVIE will drop a look that photographs well but you'd regret by hour three.
              </p>
            </Block>

            {(userImage || bodyImage) && (
              <Block label="Your photos">
                <div className="flex gap-3">
                  {userImage && (
                    <figure className="m-0">
                      <img src={userImage} alt="Selfie" className="w-24 h-32 object-cover rounded-[3px] border border-line" />
                      <figcaption className="eyebrow mt-1.5">selfie · skin</figcaption>
                    </figure>
                  )}
                  {bodyImage && (
                    <figure className="m-0">
                      <img src={bodyImage} alt="Full body" className="w-24 h-32 object-cover rounded-[3px] border border-line" />
                      <figcaption className="eyebrow mt-1.5">full body · try-on</figcaption>
                    </figure>
                  )}
                </div>
              </Block>
            )}
          </div>
        </section>
      )}

      {/* Beauty */}
      {beautyProfile && (
        <section className="card p-8 space-y-5">
          <div className="eyebrow">Beauty profile</div>
          <h2 className="display text-4xl">{beautyProfile.headline}</h2>

          <div className="grid sm:grid-cols-3 gap-6 pt-2">
            <Detail label="Preferred finish" value={beautyProfile.preferred_finish} />
            <Detail label="Makeup intensity" value={beautyProfile.intensity} />
            <Detail label="Direction" value={beautyProfile.direction?.join(' · ')} />
          </div>

          <p className="text-[11px] text-espresso-mute italic leading-relaxed pt-2 border-t border-line">
            {beautyProfile.note}
          </p>

          {beautyProfile.raw && (
            <>
              <button onClick={() => setShowRaw(!showRaw)} className="text-[10px] uppercase tracking-salon text-espresso-mute hover:text-rose transition-colors">
                {showRaw ? 'Hide' : 'View'} skin analysis
              </button>

              {showRaw && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid sm:grid-cols-3 gap-x-8 gap-y-2 pt-3">
                  {Object.entries(beautyProfile.raw).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[11px] border-b border-line/60 py-1.5">
                      <span className="text-espresso-mute capitalize">{k.replace(/_/g, ' ')}</span>
                      <span className="tabular-nums">{v}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </>
          )}
        </section>
      )}

      {/* Privacy */}
      <section className="card p-8 space-y-5">
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} className="text-sage-text" />
          <h2 className="font-display text-2xl font-light">Your photos, your call</h2>
        </div>

        <p className="text-[13px] leading-relaxed text-espresso-soft max-w-xl">
          Your photo is used to generate your personalized experience — the beauty profile
          and the virtual try-on. Guest mode processes your photo and stores nothing.
        </p>

        <div className="flex flex-wrap gap-3 pt-1">
          <button onClick={() => setGuest(!guest)} className={`btn-ghost ${guest ? 'border-espresso' : ''}`}>
            Guest mode {guest ? 'on' : 'off'}
          </button>
          <button
            onClick={() => { clearPhotos(); setMessage('Both photos removed from this session.'); }}
            className="btn-ghost"
          >
            Delete my photos
          </button>
          <button onClick={deleteEverything} className="btn-ghost text-rust-text border-rust/30 hover:border-rust">
            <Trash2 size={12} /> Delete my profile
          </button>
        </div>

      </section>

      {/* Edits happen at the top of the page; a confirmation buried at the
          bottom would never be seen. */}
      {message && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-[3px]
                     bg-espresso text-cream text-[12px] shadow-lg"
        >
          {message}
        </motion.p>
      )}

      {/* Integration status used to live here. It is operator information —
          which APIs are live, which database is attached — and belongs to
          `npm run preflight`, not to a page about the user's own style. */}

      {/* What MAVIE has learned, which is the point of having a profile. */}
      <section className="space-y-4">
        <div className="eyebrow">How MAVIE learns</div>
        <p className="serif-body max-w-xl text-pretty">
          Every look you love, skip or call too expensive adjusts what you see next.
          Your budget range, comfort priority and Style DNA above are not settings you
          filled in — they are what MAVIE has inferred from your decisions so far.
        </p>
      </section>
    </div>
  );
}

function Block({ label, children }) {
  return (
    <div className="space-y-2.5">
      <div className="eyebrow">{label}</div>
      {children}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className="font-display text-xl mt-1 capitalize">{value || '—'}</div>
    </div>
  );
}
