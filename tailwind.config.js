/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        at: {
          // M'atelier identity — teal + warm cream
          teal:     '#0D9488',   // primary — deep teal
          teal2:    '#14B8A6',   // lighter teal
          teal3:    '#CCFBF1',   // teal wash
          gold:     '#D97706',   // warm amber
          gold2:    '#FEF3C7',   // gold wash
          cream:    '#FAFAF8',   // warm white background
          warm:     '#F5F0E8',   // warm off-white
          ink:      '#1C1917',   // near-black
          plum:     '#44403C',   // warm dark grey text
          muted:    '#78716C',   // muted text
          border:   '#E7E5E4',   // subtle border
          // Status colors
          active:   '#0D9488',   // teal = active
          planning: '#D97706',   // amber = planning
          wrap:     '#7C3AED',   // purple = wrap
          complete: '#059669',   // green = complete
          cancelled:'#9CA3AF',   // grey = cancelled
          // Shared palette compatibility
          pink:     '#EC4899',
          lavender: '#C8A8E9',
        }
      },
      fontFamily: {
        display: ['Josefin Sans', 'system-ui', 'sans-serif'],
        body:    ['DM Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        pill: '9999px',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        soft:   '0 4px 24px rgba(13,148,136,0.08)',
        glow:   '0 0 20px rgba(13,148,136,0.2)',
        card:   '0 2px 12px rgba(0,0,0,0.05)',
        gold:   '0 0 20px rgba(217,119,6,0.2)',
      },
      backgroundImage: {
        'gradient-teal': 'linear-gradient(135deg, #0D9488, #14B8A6)',
        'gradient-gold': 'linear-gradient(135deg, #D97706, #F59E0B)',
        'gradient-bg':   'linear-gradient(160deg, #FAFAF8 0%, #F0FDF9 100%)',
      },
    },
  },
  plugins: [],
}
