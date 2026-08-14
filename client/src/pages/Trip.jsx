import { useState } from 'react';
import { motion } from 'framer-motion';
import { Luggage } from 'lucide-react';

import { api } from '../services/api.js';
import Loader from '../components/Loader.jsx';
import GarmentVisual from '../components/GarmentVisual.jsx';
import { usd } from '../components/ProductCard.jsx';

const EXAMPLES = [
  'I am going to Lisbon for four days, mostly walking around plus one nice dinner',
  'Three days in Tokyo for a conference, one team dinner',
  'A week at the beach in Goa with friends',
];

export default function Trip() {
  const [text, setText] = useState('');
  const [budget, setBudget] = useState(250);
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function plan() {
    if (text.trim().length < 3) {
      setError('Tell MAVIE where you are going.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { trip: result } = await api.planTrip({ text, budget });
      setTrip(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loader stage="outfit" sub="Building the smallest set of pieces that covers every day." />;

  return (
    <div className="max-w-6xl mx-auto px-6 py-14 space-y-14">
      <header className="space-y-4 max-w-2xl">
        <div className="eyebrow">Trip mode</div>
        <h1 className="display text-5xl sm:text-6xl text-balance">Pack once. Wear everything twice.</h1>
        <p className="serif-body text-pretty">
          MAVIE doesn&rsquo;t build one outfit per day. It builds a capsule — a small set
          of pieces that recombine across the whole trip, starting with what you already own.
        </p>
      </header>

      {/* Input */}
      <section className="space-y-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="I'm going to Lisbon for four days…"
          className="field resize-none"
        />

        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => setText(ex)}
              className="text-[10px] tracking-wide text-espresso-mute hover:text-rose transition-colors
                         border-b border-dotted border-line hover:border-rose"
            >
              {ex.slice(0, 40)}…
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-8">
          <div className="flex-1 min-w-[220px] space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="eyebrow">Trip budget</span>
              <span className="font-display text-2xl">${budget.toLocaleString('en-US')}</span>
            </div>
            <input
              type="range" min={50} max={1000} step={25}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full h-px bg-line appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5
                         [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-rose [&::-moz-range-thumb]:w-3.5
                         [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:border-0
                         [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-rose"
            />
          </div>

          <button onClick={plan} className="btn-rose">
            <Luggage size={13} /> Plan my trip
          </button>
        </div>

        {error && <p className="text-[12px] text-rust">{error}</p>}
      </section>

      {trip && (
        <>
          {/* Stats */}
          <motion.section
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="card p-8 space-y-6"
          >
            <div>
              <div className="eyebrow">{trip.destination || 'Your trip'} · {trip.days} days · {trip.climate}</div>
              <p className="serif-body mt-2 text-pretty">{trip.summary}</p>
            </div>

            <div className="rule" />

            <div className="flex flex-wrap gap-x-14 gap-y-6">
              <Stat value={trip.stats.pieces} label="pieces packed" />
              <Stat value={trip.stats.from_closet} label="from your closet" accent="#7C8F76" />
              <Stat value={trip.stats.to_buy} label="to buy" />
              <Stat value={usd(trip.stats.spend)} label="trip spend" />
              <Stat value={`${trip.stats.wears_per_piece}×`} label="worn per piece" accent="#C98B94" />
            </div>

            <p className="text-[11px] text-espresso-mute leading-relaxed">
              Every piece earns its place in the bag by being worn more than once.
            </p>
          </motion.section>

          {/* Capsule */}
          <section className="space-y-6">
            <h2 className="font-display text-3xl font-light">The capsule</h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-4">
              {trip.capsule.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="card overflow-hidden"
                >
                  <div className="aspect-square"><GarmentVisual item={item} /></div>
                  <div className="p-2.5 space-y-0.5">
                    <div className="text-[11px] leading-tight truncate">{item.name}</div>
                    <div className="text-[10px] tracking-wide">
                      {item.owned
                        ? <span className="text-sage">owned</span>
                        : <span className="text-espresso-mute">{usd(item.price)}</span>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Day by day */}
          <section className="space-y-6">
            <h2 className="font-display text-3xl font-light">Day by day</h2>
            <div className="space-y-4">
              {trip.outfits.map((day, i) => (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.09 }}
                  className="card p-6 grid sm:grid-cols-[110px,1fr] gap-6 items-start"
                >
                  <div>
                    <div className="display text-4xl text-rose">{String(day.day).padStart(2, '0')}</div>
                    <div className="eyebrow mt-1">{day.label}</div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {day.items.map((item) => (
                        <span key={item.id} className="chip cursor-default">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.hex }} />
                          {item.name}
                        </span>
                      ))}
                    </div>

                    {day.makeup && (
                      <div className="flex items-center gap-2.5">
                        <div className="flex -space-x-1">
                          {day.makeup.products?.slice(0, 4).map((p) => (
                            <span key={p.id} className="w-4 h-4 rounded-full border border-white" style={{ background: p.hex }} />
                          ))}
                        </div>
                        <span className="text-[11px] text-espresso-mute">{day.makeup.name}</span>
                      </div>
                    )}

                    <p className="text-[11px] text-espresso-mute italic">{day.note}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ value, label, accent }) {
  return (
    <div>
      <div className="display text-4xl" style={accent ? { color: accent } : undefined}>{value}</div>
      <div className="eyebrow mt-1">{label}</div>
    </div>
  );
}
