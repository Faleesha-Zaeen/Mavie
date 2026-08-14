import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ArrowRight } from 'lucide-react';

import { api } from '../services/api.js';
import { useMavie } from '../context/MavieContext.jsx';
import { readImage } from '../utils/image.js';
import VTOViewer from '../components/VTOViewer.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import ProductCard, { usd } from '../components/ProductCard.jsx';

export default function TryOn() {
  const navigate = useNavigate();
  const {
    looks, selectedLook, selectedLookId, setSelectedLookId,
    userImage, bodyImage, setBodyImage, vtoResult, setVtoResult,
  } = useMavie();

  const [makeupResult, setMakeupResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Try-on runs on the full-body photo. Falling back to the selfie is better
  // than nothing, but it is not silent — the user is told the result will be
  // limited, because a face crop has no legs to fit trousers to.
  const tryOnImage = bodyImage || userImage;
  const usingSelfieOnly = !bodyImage && Boolean(userImage);

  useEffect(() => {
    if (selectedLook) runTryOn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLookId, tryOnImage]);

  async function runTryOn() {
    if (!selectedLook) return;
    setLoading(true);
    setError(null);
    try {
      const [clothes, makeup] = await Promise.all([
        api.tryOnClothes({ userImage: tryOnImage, lookId: selectedLook.id, items: selectedLook.items.map((i) => ({ id: i.id })) }),
        // Makeup always reads the face, so it uses the selfie when there is one.
        selectedLook.makeup
          ? api.makeupVTO({ userImage: userImage || tryOnImage, makeup: selectedLook.makeup }).catch(() => null)
          : Promise.resolve(null),
      ]);
      setVtoResult(clothes.result);
      setMakeupResult(makeup?.result || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBodyImage(await readImage(file));
    } catch (err) {
      setError(err.message);
    }
  }

  if (!looks.length) {
    return <EmptyState title="Nothing to try on yet" body="MAVIE needs a moment before it can show you a look." cta="Start with a moment" to="/" />;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-14 space-y-12">
      <header className="space-y-4 max-w-2xl">
        <div className="eyebrow">Virtual try-on</div>
        <h1 className="display text-5xl sm:text-6xl">See yourself.</h1>
        <p className="serif-body text-pretty">
          These are the actual garments MAVIE selected — visualized on you, not on a model.
        </p>
      </header>

      {/* Look switcher */}
      <div className="flex flex-wrap gap-2">
        {looks.map((l, i) => (
          <button
            key={l.id}
            onClick={() => setSelectedLookId(l.id)}
            className={`chip ${selectedLookId === l.id ? 'chip-active' : ''}`}
          >
            Look {String(i + 1).padStart(2, '0')} · {l.name}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Viewer */}
        <div className="space-y-5">
          {loading ? (
            <div className="aspect-[3/4] rounded-[4px] border border-line shimmer" />
          ) : (
            <VTOViewer result={vtoResult} userImage={tryOnImage} />
          )}

          {/* Try-on wants a different photo from skin analysis, so ask for it
              here explicitly rather than silently reusing the selfie. */}
          <div className="space-y-2.5">
            <label className={`w-full cursor-pointer ${bodyImage ? 'btn-ghost' : 'btn-rose'}`}>
              <Camera size={13} />
              {bodyImage ? 'Use a different full-body photo' : 'Add a full-body photo'}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} className="hidden" />
            </label>

            <p className="text-[11px] leading-relaxed text-espresso-mute">
              {usingSelfieOnly
                ? 'Showing your selfie for now — try-on needs a full-body photo to fit clothes properly. Stand facing the camera, head to feet, in good light.'
                : bodyImage
                  ? 'Front-facing, head to feet, plain background gives the best result.'
                  : 'Stand facing the camera, head to feet, in good light. Different from the selfie MAVIE used for your skin.'}
            </p>
          </div>

          {error && <ErrorState message={error} onRetry={runTryOn} retryLabel="Try the look again" />}
        </div>

        {/* Look detail */}
        <div className="space-y-8">
          <div>
            <div className="eyebrow">Now showing</div>
            <h2 className="display text-4xl mt-1">{selectedLook?.name}</h2>
            <p className="mt-3 serif-body text-pretty">{selectedLook?.explanation}</p>
          </div>

          <div className="rule" />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {selectedLook?.items.map((item, i) => (
              <ProductCard key={item.id} item={item} index={i} compact />
            ))}
          </div>

          <div className="flex items-baseline justify-between pt-2 border-t border-line">
            <span className="eyebrow">Total</span>
            <span className="display text-3xl">{usd(selectedLook?.total)}</span>
          </div>

          {selectedLook?.makeup && (
            <div className="card p-5 space-y-3">
              <div className="eyebrow">{selectedLook.makeup.name} · {selectedLook.makeup.intensity}</div>
              <div className="flex flex-wrap gap-3">
                {selectedLook.makeup.products.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full border border-line" style={{ background: p.hex }} />
                    <div className="text-[11px] leading-tight">
                      <div className="text-espresso">{p.shade}</div>
                      <div className="text-espresso-mute">{p.category}</div>
                    </div>
                  </div>
                ))}
              </div>
              {makeupResult?.mocked && (
                <p className="text-[10px] text-espresso-mute italic">{makeupResult.message}</p>
              )}
            </div>
          )}

          <button onClick={() => navigate('/aftermath')} className="btn-rose w-full group">
            But should you buy it?
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
