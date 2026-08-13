import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

import { api } from '../services/api.js';
import { useMavie } from '../context/MavieContext.jsx';
import GarmentVisual from '../components/GarmentVisual.jsx';
import LookCard from '../components/LookCard.jsx';

const CATEGORIES = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory'];
const COLORS = [
  ['black', '#1F1B19'], ['white', '#F7F4EE'], ['ivory', '#F2E9DC'], ['beige', '#D7C6AC'],
  ['navy', '#2C3A4F'], ['dusty rose', '#C98B94'], ['sage', '#A8B49A'], ['charcoal', '#403A36'],
];

export default function Closet() {
  const { constraints } = useMavie();

  const [items, setItems] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [looks, setLooks] = useState([]);
  const [draft, setDraft] = useState({ category: 'top', color: 'black', name: '' });
  const [error, setError] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [{ items: list }, a] = await Promise.all([api.closet(), api.analyseCloset()]);
      setItems(list);
      setAnalysis(a);
    } catch (err) {
      setError(err.message);
    }
  }

  async function add() {
    const hex = COLORS.find(([c]) => c === draft.color)?.[1] || '#CFC6B8';
    try {
      await api.addClosetItem({
        category: draft.category,
        color: draft.color,
        colors: [draft.color],
        hex,
        name: draft.name || `${draft.color} ${draft.category}`,
      });
      setDraft({ ...draft, name: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    await api.removeClosetItem(id);
    load();
  }

  async function styleIt() {
    try {
      const { looks: result } = await api.styleCloset(constraints || { occasion: 'casual' });
      setLooks(result);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-14 space-y-14">
      <header className="space-y-4 max-w-2xl">
        <div className="eyebrow">Your closet</div>
        <h1 className="display text-5xl sm:text-6xl">Style more. Buy less.</h1>
        <p className="serif-body text-pretty">
          What you already own is the cheapest wardrobe you will ever have. It also
          tells MAVIE when a new purchase would just be a duplicate.
        </p>
      </header>

      {/* Counts */}
      {analysis && (
        <div className="flex flex-wrap gap-x-12 gap-y-5">
          {CATEGORIES.map((c) => (
            <div key={c}>
              <div className="display text-4xl">{analysis.counts[c] || 0}</div>
              <div className="eyebrow mt-1">{c}s</div>
            </div>
          ))}
        </div>
      )}

      {/* Add */}
      <section className="card p-6 space-y-5">
        <h2 className="font-display text-xl">Add a piece</h2>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setDraft({ ...draft, category: c })}
              className={`chip ${draft.category === c ? 'chip-active' : ''}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2.5">
          {COLORS.map(([name, hex]) => (
            <button
              key={name}
              onClick={() => setDraft({ ...draft, color: name })}
              title={name}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                draft.color === name ? 'border-espresso scale-110' : 'border-line hover:border-rose-soft'
              }`}
              style={{ background: hex }}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Name (optional)"
            className="flex-1 min-w-[200px] bg-white/70 border border-line rounded-[3px] px-4 py-2.5
                       text-sm focus:outline-none focus:border-rose transition-colors"
          />
          <button onClick={add} className="btn-primary">
            <Plus size={13} /> Add
          </button>
        </div>
      </section>

      {/* Grid */}
      {items.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl font-light">{items.length} pieces</h2>
            <button onClick={styleIt} className="btn-rose">Style my closet</button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-4">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="group relative card overflow-hidden"
              >
                <div className="aspect-square">
                  <GarmentVisual item={item} />
                </div>
                <div className="p-2">
                  <div className="text-[10px] truncate text-espresso-soft">{item.name}</div>
                </div>
                <button
                  onClick={() => remove(item.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 text-espresso-mute
                             opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center
                             hover:text-rust"
                  aria-label="Remove"
                >
                  <Trash2 size={11} />
                </button>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Overlap warnings — this is exactly what the Skeptic cites */}
      {analysis?.duplicates?.length > 0 && (
        <section className="border border-amber/30 bg-amber/[0.06] rounded-[4px] p-6 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-amber" />
            <h3 className="eyebrow text-espresso">What MAVIE noticed</h3>
          </div>
          <ul className="space-y-1.5">
            {analysis.duplicates.map((d, i) => (
              <li key={i} className="font-display text-lg text-espresso-soft">{d.note}</li>
            ))}
          </ul>
          <p className="text-[11px] text-espresso-mute">
            The skeptic will raise this the next time you consider something similar.
          </p>
        </section>
      )}

      {/* Closet looks */}
      {looks.length > 0 && (
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="font-display text-3xl font-light">Built from what you own</h2>
            <p className="text-[13px] text-espresso-mute">Total cost: ₹0.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {looks.map((look, i) => (
              <LookCard key={look.id} look={look} index={i} />
            ))}
          </div>
        </section>
      )}

      {items.length === 0 && (
        <p className="serif-body">Your closet is empty. Add a few pieces above and MAVIE will style them.</p>
      )}

      {error && <p className="text-[12px] text-rust">{error}</p>}
    </div>
  );
}
