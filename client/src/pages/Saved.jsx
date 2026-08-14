import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

import { api } from '../services/api.js';
import LookCard from '../components/LookCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { usd } from '../components/ProductCard.jsx';

export default function Saved() {
  const [looks, setLooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.savedLooks()
      .then(({ looks: l }) => setLooks(l))
      .catch(() => setLooks([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-14 grid md:grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => <div key={i} className="card aspect-[3/4] shimmer" />)}
      </div>
    );
  }

  if (!looks.length) {
    return (
      <EmptyState
        title="No saved looks yet"
        body="When a look is right, save it. MAVIE keeps the pieces, the prices and the reason it chose them."
        cta="Start with a moment"
        to="/"
      />
    );
  }

  const total = looks.reduce((s, l) => s + (l.total || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-6 py-14 space-y-12">
      <header className="space-y-4 max-w-2xl">
        <div className="eyebrow">Saved</div>
        <h1 className="display text-5xl sm:text-6xl">Your looks.</h1>
        <p className="serif-body">
          {looks.length} saved · {usd(total)} across all of them.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        {looks.map((look, i) => (
          <div key={look.id} className="space-y-3">
            <LookCard look={look} index={i} />
            {look.explanation && (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-[11px] text-espresso-mute leading-relaxed px-1"
              >
                <Heart size={9} className="inline mr-1 text-rose" />
                {look.explanation}
              </motion.p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
