export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#EEF2FF",
          100: "#DBEAFE",
          400: "#3B6DB5",
          600: "#1B3A6B",
          800: "#0F2347",
          900: "#091629",
        },
        accent: {
          300: "#FFE566",
          400: "#FFD700",
          500: "#E6C200",
        },
        verde: {
          50:  "#E1F5EE",
          400: "#1D9E75",
          600: "#0F6E56",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft':   '0 2px 8px rgba(27,58,107,0.08), 0 1px 2px rgba(27,58,107,0.04)',
        'medium': '0 4px 16px rgba(27,58,107,0.12), 0 2px 4px rgba(27,58,107,0.08)',
        'large':  '0 8px 32px rgba(27,58,107,0.16), 0 4px 8px rgba(27,58,107,0.08)',
      },
      animation: {
        'fade-in':  'fadeIn 0.3s ease forwards',
        'slide-up': 'slideUp 0.3s ease forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}