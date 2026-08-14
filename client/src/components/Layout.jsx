import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EyeOff } from 'lucide-react';
import { useMavie } from '../context/MavieContext.jsx';

const NAV = [
  { to: '/', label: 'Moment', end: true },
  { to: '/looks', label: 'Looks' },
  { to: '/try-on', label: 'Try on' },
  { to: '/aftermath', label: 'Aftermath' },
  { to: '/found', label: 'Found it?' },
  { to: '/trip', label: 'Trip' },
  { to: '/closet', label: 'Closet' },
  { to: '/saved', label: 'Saved' },
  { to: '/profile', label: 'Profile' },
];

export default function Layout({ children }) {
  const { guest, setGuest } = useMavie();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-ivory/80 border-b border-line">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <Link to="/" className="group flex items-baseline gap-2.5 shrink-0">
            <span className="font-display text-2xl tracking-[0.14em] group-hover:text-rose transition-colors duration-500">
              MAVIE
            </span>
            <span className="hidden sm:block text-[10px] italic font-display text-espresso-mute">
              a look made for your life
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className="relative px-3.5 py-2">
                {({ isActive }) => (
                  <>
                    <span className={`text-[10px] uppercase tracking-salon transition-colors duration-300 ${
                      isActive ? 'text-espresso' : 'text-espresso-mute hover:text-espresso'
                    }`}>
                      {n.label}
                    </span>
                    {isActive && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute inset-x-3 -bottom-px h-px bg-rose"
                        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <button
            onClick={() => setGuest(!guest)}
            title="Guest Mode stores nothing on MAVIE's servers"
            className={`chip shrink-0 ${guest ? 'chip-active' : ''}`}
          >
            <EyeOff size={11} />
            <span className="hidden sm:inline">Guest</span>
          </button>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex items-center gap-1 overflow-x-auto px-6 pb-2.5 no-scrollbar">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `whitespace-nowrap text-[10px] uppercase tracking-salon px-3 py-1.5 rounded-full border transition-colors ${
                  isActive ? 'bg-espresso text-ivory border-espresso' : 'border-line text-espresso-mute'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {guest && (
        <div className="bg-espresso text-ivory/90 text-[10px] uppercase tracking-salon text-center py-2 px-6">
          Guest mode · nothing you upload is stored
        </div>
      )}

      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 w-full"
      >
        {children}
      </motion.main>

      <footer className="border-t border-line mt-24">
        <div className="max-w-6xl mx-auto px-6 py-12 space-y-6">
          <p className="font-display text-xl font-light max-w-lg text-balance">
            Looking good in something and making a good decision about buying it
            are not the same thing.
          </p>

          <div className="rule" />

          <div className="flex flex-wrap items-center justify-between gap-4 text-[10px] uppercase tracking-salon text-espresso-mute">
            <span>MAVIE · AI decision intelligence for personal appearance</span>
            <span>Skin analysis is beauty personalization, not medical advice</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
