import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

/**
 * Failures stay in character.
 *
 * A judge should never see a status code or a stack trace. Every message here
 * reads like the rest of MAVIE and offers the user a way forward.
 */

// Map the API's error codes to something a person would say.
const FRIENDLY = {
  rate_limited: 'MAVIE is thinking a little slower than usual. Give it a moment.',
  invalid_request: "Something in that request didn't look right. Try again?",
  no_looks: "MAVIE couldn't build a complete look inside those constraints. Try widening the budget a little.",
  closet_too_small: 'Add a few more pieces and MAVIE can style what you already own.',
  unknown_items: "MAVIE couldn't find those pieces in the catalog.",
  server_error: "Something went wrong on MAVIE's side. Please try that again.",
};

export default function ErrorState({ message, code, onRetry, retryLabel = 'Try again' }) {
  const text = FRIENDLY[code] || message || FRIENDLY.server_error;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="border border-rust/25 bg-rust/[0.05] rounded-[3px] px-6 py-5 space-y-3"
    >
      <p className="font-display text-lg leading-snug text-espresso text-pretty">{text}</p>

      {onRetry && (
        <button onClick={onRetry} className="btn-ghost text-espresso-soft">
          <RefreshCw size={12} /> {retryLabel}
        </button>
      )}
    </motion.div>
  );
}
