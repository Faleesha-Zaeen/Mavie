import { motion } from 'framer-motion';
import { Camera, Info } from 'lucide-react';

/**
 * Apparel VTO result.
 *
 * When YouCam returns a photoreal image we show it. When credentials are
 * absent the backend returns a structured composite — the user's photo plus
 * the real colour and silhouette of each garment — which we render as an
 * editorial preview rather than an error state.
 */
export default function VTOViewer({ result, userImage }) {
  const hasReal = result?.result_url;

  return (
    <div className="space-y-4">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[4px] border border-line bg-ivory-deep shadow-lift">
        {hasReal ? (
          <img src={result.result_url} alt="Your virtual try-on" className="w-full h-full object-cover" />
        ) : (
          <CompositePreview composite={result?.composite} userImage={userImage} />
        )}

        {/* The makeup swatches used to be overlaid here. They repeated the
            palette already shown beside the look — with names attached, which
            these lacked — and sat on top of the garment labels. */}
      </div>

      {result?.mocked && (
        <div className="flex items-start gap-2.5 text-[11px] leading-relaxed text-espresso-mute">
          <Info size={13} className="mt-0.5 shrink-0" />
          <p>{result.message || 'Preview generated locally. Add YouCam credentials for a photoreal try-on.'}</p>
        </div>
      )}
    </div>
  );
}

function CompositePreview({ composite, userImage }) {
  const photo = composite?.user_image || userImage;
  const layers = composite?.layers || [];

  return (
    <div className="relative w-full h-full">
      {photo ? (
        <img src={photo} alt="You" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-espresso-mute">
          <Camera size={26} strokeWidth={1.2} />
          <span className="text-[11px] uppercase tracking-salon">Add a photo to see yourself</span>
        </div>
      )}

      {/* The real garment colours, layered over the photo. Only meaningful when
          there IS a photo — without one this filled the frame with a solid
          block of colour, which reads as a rendering fault rather than a
          prompt to upload. */}
      {photo && (
        <div className="absolute inset-0">
          {layers.map((layer, i) => (
            <motion.div
              key={layer.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.18, duration: 0.8 }}
              className="absolute inset-x-0"
              style={{
                ...bandFor(layer.body_area),
                background: `linear-gradient(180deg, ${layer.hex}D9, ${layer.hex}A6)`,
                mixBlendMode: 'multiply',
              }}
            />
          ))}
        </div>
      )}

      {/* No photo: show the pieces themselves as a quiet colour story. */}
      {!photo && layers.length > 0 && (
        <div className="absolute inset-x-0 bottom-20 flex items-center justify-center gap-2">
          {layers.map((layer) => (
            <span
              key={layer.id}
              title={layer.name}
              className="w-9 h-9 rounded-full border-2 border-white shadow-soft"
              style={{ background: layer.hex }}
            />
          ))}
        </div>
      )}

      {/* The dark scrim only earns its place over a photograph. */}
      <div className={`absolute inset-x-0 bottom-0 p-4 ${photo ? 'bg-gradient-to-t from-espresso/55 to-transparent' : ''}`}>
        <div className="flex flex-wrap gap-2">
          {layers.map((l) => (
            <span
              key={l.id}
              className={`text-[10px] tracking-wide backdrop-blur-sm px-2.5 py-1 rounded-full ${
                photo
                  ? 'text-white/95 bg-espresso/45'
                  : 'text-espresso-soft bg-surface/80 border border-line'
              }`}
            >
              {l.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const bandFor = (area) =>
  ({
    upper: { top: '18%', height: '34%' },
    lower: { top: '52%', height: '40%' },
    full: { top: '18%', height: '74%' },
  }[area] || { top: '0', height: '0' });
