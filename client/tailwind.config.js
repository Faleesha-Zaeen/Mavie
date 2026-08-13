/** MAVIE design tokens — editorial fashion magazine × premium beauty app × modern AI. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ivory: { DEFAULT: '#FAF7F2', deep: '#F3EDE4', warm: '#EFE7DA' },
        espresso: { DEFAULT: '#2E2723', soft: '#4A403A', mute: '#7A6E65' },
        rose: { DEFAULT: '#C98B94', deep: '#A86A75', soft: '#E0B5BB' },
        blush: { DEFAULT: '#E8D3D1', light: '#F4E6E4' },
        champagne: { DEFAULT: '#E3CDA4', deep: '#C9AE7E' },
        sage: '#7C8F76',
        amber: '#C9A227',
        rust: '#B4614F',
        line: '#E5DACB',
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
