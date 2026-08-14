/** MAVIE design tokens — editorial fashion magazine × premium beauty app × modern AI. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Warm sand rather than near-white. The old #FAF7F2 base with white
        // cards on top read as glare; this keeps the editorial lightness but
        // drops the luminance enough to be comfortable to sit in front of.
        ivory: { DEFAULT: '#F0E9DE', deep: '#E7DED1', warm: '#DFD5C5' },
        // Raised surfaces are a soft cream, never pure white.
        surface: { DEFAULT: '#FAF6EF', deep: '#F5EFE5' },
        espresso: { DEFAULT: '#2E2723', soft: '#4A403A', mute: '#6E6158' },
        // `rose` is the brand fill (borders, bars, dots). `rose-text` is the
        // AA-compliant variant for type — dropping the background luminance
        // pushed the lighter accents below 4.5:1 for small text.
        rose: { DEFAULT: '#C08089', deep: '#A2626D', soft: '#DCACB3', text: '#92535F' },
        blush: { DEFAULT: '#E4CDCB', light: '#F0E0DE' },
        champagne: { DEFAULT: '#DEC69B', deep: '#C4A876' },
        sage: { DEFAULT: '#75886F', text: '#56684F' },
        amber: { DEFAULT: '#BF9822', text: '#806115' },
        rust: { DEFAULT: '#AC5A48', text: '#9A4B3A' },
        line: '#DCD0BE',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        editorial: '0.28em',
salon: '0.16em',
      },
      boxShadow: {
        soft: '0 2px 20px -8px rgba(46, 39, 35, 0.12)',
        lift: '0 18px 50px -22px rgba(46, 39, 35, 0.28)',
        glow: '0 0 0 1px rgba(201, 139, 148, 0.25), 0 20px 60px -30px rgba(201, 139, 148, 0.6)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-500px 0' },
          '100%': { backgroundPosition: '500px 0' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.04)' },
        },
        rise: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.4s linear infinite',
        breathe: 'breathe 3.2s ease-in-out infinite',
        rise: 'rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
