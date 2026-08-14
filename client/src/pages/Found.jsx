import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Sparkles, Shirt } from 'lucide-react';

import { api } from '../services/api.js';
import { useMavie } from '../context/MavieContext.jsx';
import { readImage } from '../utils/image.js';
import Loader from '../components/Loader.jsx';
import VerdictCard from '../components/VerdictCard.jsx';
import AgentDebate from '../components/AgentDebate.jsx';
import ScoreBar from '../components/ScoreBar.jsx';
import ProductCard, { usd } from '../components/ProductCard.jsx';
import ErrorState from '../components/ErrorState.jsx';

/**
 * "I found this online."
 *
 * The second entry point into MAVIE. A screenshot from Instagram or a store
 * page goes through the exact same decision engine as a curated look — which
 * is the argument that MAVIE is a decision layer, not a catalogue.
 */
export default function Found() {
  const { constraints, guest, bodyImage, setBodyImage } = useMavie();

  const [image, setImage] = useState(null);
  const [price, setPrice] = useState('');
  const [product, setProduct] = useState(null);
  const [decision, setDecision] = useState(null);
  const [tryOn, setTryOn] = useState(null);
  const [stage, setStage] = useState(null);
  const [error, setError] = useState(null);
  const bodyInput = useRef(null);

  /**
   * Try the found piece on. The screenshot doubles as the garment reference,
   * so nothing extra is needed beyond a full-body photo of the user — which
   * is the same one the curated try-on uses, not the face selfie.
   */
  async function tryItOn(candidate) {
    // Only ever a data URL. Anything else means a caller passed an event.
    const photo = typeof candidate === 'string' ? candidate : bodyImage;

    if (!photo) return bodyInput.current?.click();
    if (!image) return;

    setError(null);
    setStage('tryon');
    try {
      const { result } = await api.tryOnFound({
        userImage: photo,
        garmentImage: image,
        product,
      });
      setTryOn(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setStage(null);
    }
  }

  async function pickBodyPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImage(file);
      setBodyImage(dataUrl);
      // Carry straight on rather than making them press the button twice —
      // state hasn't landed yet, so pass the photo through directly.
      tryItOn(dataUrl);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setProduct(null);
    setDecision(null);

    try {
      const dataUrl = await readImage(file);
      setImage(dataUrl);

      setStage('vision');
      const { product: found } = await api.analyseProduct({
        imageBase64: dataUrl,
        price: price ? Number(price) : null,
      });
      setProduct(found);
    } catch (err) {
      setError(err.message);
    } finally {
      setStage(null);
    }
  }

  async function shouldIBuy() {
    if (!product) return;
    setError(null);
    setStage('aftermath');
    try {
      const withPrice = price ? { ...product, price: Number(price), price_known: true } : product;
      const result = await api.productBuyConfidence({
        product: withPrice,
        constraints: constraints || {},
        guest,
      });
      setDecision(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setStage(null);
    }
  }

  function reset() {
    setImage(null); setProduct(null); setDecision(null); setPrice(''); setError(null);
  }

  if (stage === 'vision') {
    return <Loader stage="context" sub="MAVIE is reading the product from your screenshot." />;
  }
  if (stage === 'tryon') {
    return <Loader stage="vto" sub={`MAVIE is putting ${product?.name || 'this piece'} on your photo.`} />;
  }
  if (stage === 'aftermath') {
    return <Loader stage="aftermath" sub="The stylist and the skeptic are reviewing the same evidence." />;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-14 space-y-14">
      <header className="space-y-4 max-w-2xl">
        <div className="eyebrow">Found this online?</div>
        <h1 className="display text-5xl sm:text-6xl text-balance">
          Thinking about buying this?
        </h1>
        <p className="serif-body text-pretty">
          Screenshot it from Instagram or a store page. MAVIE reads the piece,
          checks it against your style, budget and closet, and tells you
          whether it&rsquo;s actually worth it.
        </p>
      </header>

      {/* Upload */}
      {!image && (
        <section className="card p-10 sm:p-14 text-center space-y-6">
          <label className="cursor-pointer inline-flex flex-col items-center gap-5">
            <span className="w-16 h-16 rounded-full border border-line flex items-center justify-center
                             text-espresso-mute hover:border-rose hover:text-rose transition-colors duration-500">
              <Upload size={20} strokeWidth={1.3} />
            </span>
            <span className="font-display text-2xl font-light">Upload a screenshot</span>
            <span className="text-[12px] text-espresso-mute">JPG, PNG or WebP · up to 8MB</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="hidden" />
          </label>

          <div className="pt-4 max-w-xs mx-auto">
            <label className="eyebrow block mb-2">Price, if you know it</label>
            <div className="flex items-center gap-2">
              <span className="font-display text-xl text-espresso-mute">$</span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="89"
                className="flex-1 bg-surface/75 border border-line rounded-[3px] px-4 py-2.5 text-sm
                           focus:outline-none focus:border-rose transition-colors"
              />
            </div>
          </div>
        </section>
      )}

      {/* Extracted product */}
      {image && product && (
        <section className="grid md:grid-cols-2 gap-10">
          <div className="relative">
            <img src={image} alt="The piece you found" className="w-full rounded-[4px] border border-line shadow-lift" />
            <button
              onClick={reset}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-espresso text-ivory
                         flex items-center justify-center hover:bg-rose transition-colors"
              aria-label="Start over"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={13} className="text-rose-text" />
                <span className="eyebrow">What MAVIE sees</span>
              </div>
              <h2 className="display text-4xl">{product.name}</h2>
              {product.notes && (
                <p className="mt-2 text-[13px] text-espresso-mute leading-relaxed">{product.notes}</p>
              )}
            </div>

            <div className="rule" />

            <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
              <Row label="Category" value={product.category} />
              <Row label="Fit" value={product.fit} />
              <Row label="Colours" value={product.colors?.join(', ')} />
              <Row label="Season" value={product.season} />
              <Row label="Versatility" value={`${product.versatility}%`} />
              <Row label="Care burden" value={`${product.maintenance}%`} />
            </dl>

            <div className="flex flex-wrap gap-1.5">
              {product.style_tags?.map((t) => (
                <span key={t} className="chip cursor-default">{t}</span>
              ))}
            </div>

            {/* Price is load-bearing for the budget maths, so ask if unknown. */}
            <div className="space-y-2">
              <label className="eyebrow block">
                {product.price_known ? 'Price' : 'MAVIE could not see a price — what does it cost?'}
              </label>
              <div className="flex items-center gap-2 max-w-[200px]">
                <span className="font-display text-xl text-espresso-mute">$</span>
                <input
                  type="number"
                  value={price || (product.price_known ? product.price : '')}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="89"
                  className="flex-1 bg-surface/75 border border-line rounded-[3px] px-4 py-2.5 text-sm
                             focus:outline-none focus:border-rose transition-colors"
                />
              </div>
            </div>

            {product.confidence > 0 && (
              <p className="text-[11px] text-espresso-mute">
                Reading confidence {Math.round(product.confidence * 100)}% — correct anything above before deciding.
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button onClick={shouldIBuy} className="btn-rose flex-1 min-w-[200px]">
                Should I buy this?
              </button>
              {/* Seeing it on yourself is part of deciding, so it belongs
                  beside the verdict rather than only in the curated flow. */}
              {/* Called with no argument on purpose — passing the handler
                  directly hands React's click event in as the photo. */}
              <button onClick={() => tryItOn()} className="btn-ghost flex-1 min-w-[180px] justify-center">
                <Shirt size={13} /> Try it on me
              </button>
            </div>

            {/* Opened by "Try it on me" when no full-body photo exists yet. */}
            <input
              ref={bodyInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={pickBodyPhoto}
              className="hidden"
            />

            {!bodyImage && (
              <p className="text-[11px] text-espresso-mute">
                Try-on needs a full-body photo of you — MAVIE will ask for one.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Try-on */}
      {tryOn && (
        <section className="card p-8 sm:p-10 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="eyebrow">On you</div>
              <h2 className="display text-3xl mt-1">{product?.name}</h2>
            </div>
            <button onClick={() => setTryOn(null)} className="btn-ghost shrink-0">
              <X size={12} /> Close
            </button>
          </div>

          {tryOn.result_url ? (
            <img
              src={tryOn.result_url}
              alt={`${product?.name} on you`}
              className="w-full max-w-md mx-auto rounded-[3px] border border-line"
            />
          ) : (
            <div className="space-y-3">
              {tryOn.composite?.user_image && (
                <img
                  src={tryOn.composite.user_image}
                  alt="You"
                  className="w-full max-w-xs mx-auto rounded-[3px] border border-line"
                />
              )}
              <p className="text-[12px] text-espresso-mute text-center">{tryOn.message}</p>
            </div>
          )}
        </section>
      )}

      {/* Decision */}
      {decision && (
        <>
          <section className="card p-8 sm:p-10">
            <AgentDebate panel={decision.panel} />
          </section>

          <section className="space-y-8">
            <h2 className="font-display text-3xl font-light">The evidence</h2>
            <div className="grid sm:grid-cols-2 gap-x-14 gap-y-7">
              <ScoreBar label="Occasion match" value={decision.metrics.occasion_match} />
              <ScoreBar label="Style match" value={decision.metrics.style_match} delay={0.08} />
              <ScoreBar label="Budget fit" value={decision.metrics.budget_fit} delay={0.16} />
              <ScoreBar label="Versatility" value={decision.metrics.versatility} delay={0.24} />
              <ScoreBar label="Rewear potential" value={decision.metrics.rewear_potential} delay={0.32} />
              <ScoreBar label="Closet overlap" value={decision.metrics.closet_overlap} delay={0.4} inverse
                hint="Lower is better — how much you already own something similar." />
            </div>
            <p className="text-[11px] text-espresso-mute border-t border-line pt-5 max-w-2xl leading-relaxed">
              {decision.disclaimer}
            </p>
          </section>

          <VerdictCard decision={decision} />

          {decision.alternatives?.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-2 max-w-xl">
                <h2 className="font-display text-3xl font-light">Find a better match</h2>
                <p className="text-[13px] text-espresso-mute leading-relaxed">
                  Same feel, fewer of the concerns the skeptic raised.
                </p>
              </div>
              <div className="grid sm:grid-cols-3 gap-6">
                {decision.alternatives.map((alt, i) => (
                  <div key={alt.id} className="space-y-3">
                    <ProductCard item={alt} index={i} />
                    <p className="text-[11px] text-espresso-mute leading-relaxed px-1">{alt.why}</p>
                  </div>
                ))}
              </div>
            </motion.section>
          )}
        </>
      )}

      {error && <ErrorState message={error} onRetry={() => setError(null)} retryLabel="Dismiss" />}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="font-display text-lg mt-0.5 capitalize">{value || '—'}</dd>
    </div>
  );
}
