import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, ShieldCheck } from 'lucide-react';

import { api } from '../services/api.js';
import { useMavie } from '../context/MavieContext.jsx';

export default function Profile() {
  const { beauty, userImage, setUserImage, setBeauty, guest, setGuest } = useMavie();

  const [profile, setProfile] = useState(null);
  const [health, setHealth] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api.getProfile().then(({ profile: p }) => setProfile(p)).catch(() => {});
    api.health().then(setHealth).catch(() => {});
  }, []);

  async function deleteEverything() {
    await api.deleteProfile();
    setUserImage(null);
    setBeauty(null);
    setMessage('Your profile, photos and closet have been deleted.');
    api.getProfile().then(({ profile: p }) => setProfile(p));
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-14 space-y-14">
      <header className="space-y-4">
        <div className="eyebrow">Your profile</div>
        <h1 className="display text-5xl sm:text-6xl">Style DNA</h1>
      </header>

      {profile && (
        <section className="grid sm:grid-cols-2 gap-10">
          <div className="space-y-6">
            <Block label="Style DNA">
              <div className="flex flex-wrap gap-2">
                {profile.style_dna.map((s) => (
                  <span key={s} className="chip chip-active cursor-default">{s}</span>
                ))}
              </div>
            </Block>

            <Block label="Preferred colours">
              <div className="flex flex-wrap gap-2">
                {profile.preferred_colors.map((c) => (
                  <span key={c} className="chip cursor-default">{c}</span>
                ))}
              </div>
            </Block>

            <Block label="Avoids">
              <div className="flex flex-wrap gap-2">
                {profile.avoided_colors.length
                  ? profile.avoided_colors.map((c) => (
                      <span key={c} className="chip cursor-default text-rust border-rust/30">{c}</span>
                    ))
                  : <span className="text-[12px] text-espresso-mute">Nothing yet.</span>}
              </div>
            </Block>
          </div>

          <div className="space-y-6">
            <Block label="Budget range">
              <p className="display text-3xl">
                ₹{profile.budget_range[0].toLocaleString('en-IN')} — ₹{profile.budget_range[1].toLocaleString('en-IN')}
              </p>
            </Block>

            <Block label="Comfort priority">
              <div className="flex items-center gap-4">
                <div className="flex-1 h-[3px] bg-line rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-rose rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${profile.comfort_priority * 100}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
                <span className="font-display text-xl">{Math.round(profile.comfort_priority * 100)}%</span>
              </div>
            </Block>

            {userImage && (
              <Block label="Your photo">
                <img src={userImage} alt="You" className="w-28 h-36 object-cover rounded-[3px] border border-line" />
              </Block>
            )}
          </div>
        </section>
      )}

      {/* Beauty */}
      {beauty && (
        <section className="card p-8 space-y-5">
          <div className="eyebrow">Beauty profile</div>
          <h2 className="display text-4xl">{beauty.headline}</h2>

          <div className="grid sm:grid-cols-3 gap-6 pt-2">
            <Detail label="Preferred finish" value={beauty.preferred_finish} />
            <Detail label="Makeup intensity" value={beauty.intensity} />
            <Detail label="Direction" value={beauty.direction?.join(' · ')} />
          </div>

          <p className="text-[11px] text-espresso-mute italic leading-relaxed pt-2 border-t border-line">
            {beauty.note}
          </p>

          {beauty.raw && (
            <>
              <button onClick={() => setShowRaw(!showRaw)} className="text-[10px] uppercase tracking-salon text-espresso-mute hover:text-rose transition-colors">
                {showRaw ? 'Hide' : 'View'} skin analysis
              </button>

              {showRaw && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid sm:grid-cols-3 gap-x-8 gap-y-2 pt-3">
                  {Object.entries(beauty.raw).map(([k, v]) => (
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
          <ShieldCheck size={15} className="text-sage" />
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
          <button onClick={() => { setUserImage(null); setBeauty(null); setMessage('Photo removed from this session.'); }} className="btn-ghost">
            Delete my photos
          </button>
          <button onClick={deleteEverything} className="btn-ghost text-rust border-rust/30 hover:border-rust">
            <Trash2 size={12} /> Delete my profile
          </button>
        </div>

        {message && <p className="text-[12px] text-sage">{message}</p>}
      </section>

      {/* Integration status — useful right before a demo */}
      {health && (
        <section className="space-y-4">
          <div className="eyebrow">System</div>
          <div className="grid sm:grid-cols-3 gap-4">
            {Object.entries(health.integrations).map(([k, v]) => (
              <div key={k} className="card p-4">
                <div className="eyebrow">{k}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    v === 'live' || v === 'openai' || v === 'gemini' || v === 'supabase' ? 'bg-sage' : 'bg-amber'
                  }`} />
                  <span className="font-display text-lg">{v}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
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
