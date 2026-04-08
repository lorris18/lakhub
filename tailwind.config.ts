import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        "surface-base": "var(--surface-base)",
        "surface-panel": "var(--surface-panel)",
        "surface-elevated": "var(--surface-elevated)",
        "surface-muted": "var(--surface-muted)",
        "border-subtle": "var(--border-subtle)",
        "border-strong": "var(--border-strong)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "brand-primary": "var(--brand-primary)",
        "brand-accent": "var(--brand-accent)",
        "brand-accent-soft": "var(--brand-accent-soft)",
        "status-success": "var(--status-success)",
        "status-warning": "var(--status-warning)",
        "status-danger": "var(--status-danger)"
      },
      fontFamily: {
        display: ["Source Serif 4", "Georgia", "serif"],
        sans: ["Source Sans 3", "Segoe UI", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 40px rgba(19, 31, 59, 0.08)",
        panel: "0 8px 24px rgba(19, 31, 59, 0.08)"
      },
      borderRadius: {
        "2xl": "1.25rem"
      },
      screens: {
        "3xl": "1440px"
      }
    }
  },
  plugins: []
};

export default config;

