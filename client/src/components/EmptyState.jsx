import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function EmptyState({ title, body, cta, to }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-md mx-auto px-6 py-32 text-center space-y-5"
    >
      <span className="text-3xl">💗</span>
      <h2 className="display text-4xl">{title}</h2>
      <p className="serif-body text-pretty">{body}</p>
      {cta && to && (
        <div className="pt-3">
          <Link to={to} className="btn-primary">{cta}</Link>
        </div>
      )}
    </motion.div>
  );
}
