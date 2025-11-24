/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // activează dark mode bazat pe clasă
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        mono: ["Geist Mono", "ui-monospace", "SFMono-Regular"],
      },
      colors: {
        // DARK MODE (implicit - fără prefix)
        background: "#0b0f19",                   // fundal principal
        card: "#111827",                         // carduri
        border: "#2e2e35",                       // margini
        primary: "#3b82f6",                      // accent albastru
        secondary: "#1f2937",                    // gri închis
        accent: "#10b981",                       // accent verde
        muted: "#6b7280",                        // gri text
        "card-foreground": "#f5f5f5",            // text pe carduri
        "muted-foreground": "#9ca3af",           // gri subtil

        // LIGHT MODE (prefix light)
        light: {
          background: "#ffffff",                // fundal alb
          card: "#f9fafb",                      // carduri gri deschis
          border: "#d1d5db",                    // margini gri deschis
          primary: "#3b82f6",                   // accent albastru (același)
          secondary: "#e5e7eb",                 // gri deschis
          accent: "#22c55e",                    // accent verde
          muted: "#6b7280",                     // gri text
          "card-foreground": "#111827",         // text pe carduri
          "muted-foreground": "#4b5563",        // gri subtil
        },
      },
      borderRadius: {
        xl: "1rem",
        '2xl': "1.5rem",
      },
      boxShadow: {
        glow: "0 0 20px rgba(59, 130, 246, 0.4)",
      },
    },
  },
  plugins: [],
};
