import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      // -----------------------------------------------------------------------
      // PALETA DE MARCA — Lobo Alquileres
      // Fuente única de verdad. Usar estos tokens en lugar de valores hex sueltos.
      // -----------------------------------------------------------------------
      colors: {
        // Corporate teal — navbars, sidebar, elementos corporativos
        corporate: {
          DEFAULT:    "#1A4F59",
          50:         "#EFF7F8",
          100:        "#CEEAED",
          200:        "#9DD5DB",
          300:        "#6CBFC9",
          400:        "#3BAAB6",
          500:        "#1A4F59",  // base
          600:        "#16424B",
          700:        "#11343C",
          800:        "#0D272D",
          900:        "#081A1E",
          foreground: "#FFFFFF",
        },
        // Accent red — CTAs principales, highlights, acciones importantes
        accent: {
          DEFAULT:    "#A92F2F",
          50:         "#FDF2F2",
          100:        "#FCE4E4",
          200:        "#F8C5C5",
          300:        "#F39292",
          400:        "#E85A5A",
          500:        "#A92F2F",  // base
          600:        "#8B2121",
          700:        "#6D1818",
          800:        "#501111",
          900:        "#320B0B",
          foreground: "#FFFFFF",
        },
        // Carbon gray — texto principal, iconos sobre fondo claro
        carbon: {
          DEFAULT:    "#333333",
          50:         "#F5F5F5",
          100:        "#E9E9E9",
          200:        "#D1D1D1",
          300:        "#ABABAB",
          400:        "#848484",
          500:        "#333333",  // base
          600:        "#2B2B2B",
          700:        "#1F1F1F",
          800:        "#141414",
          900:        "#0A0A0A",
        },

        // -----------------------------------------------------------------------
        // TOKENS SEMÁNTICOS — shadcn/ui (se conectan con las CSS variables en index.css)
        // -----------------------------------------------------------------------
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        border: "hsl(var(--border))",
        input:  "hsl(var(--input))",
        ring:   "hsl(var(--ring))",
        // Para gráficos del dashboard
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },

      // -----------------------------------------------------------------------
      // TIPOGRAFÍA
      // Plus Jakarta Sans: moderna, legible, transmite profesionalismo.
      // JetBrains Mono: para montos, porcentajes y datos numéricos — lectura rápida.
      // -----------------------------------------------------------------------
      fontFamily: {
        sans:  ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        mono:  ["JetBrains Mono", "Fira Code", "monospace"],
      },

      fontSize: {
        // Escala tipográfica consistente para tablas de datos y formularios
        "table-header": ["0.75rem",  { lineHeight: "1rem",    letterSpacing: "0.05em", fontWeight: "600" }],
        "table-cell":   ["0.875rem", { lineHeight: "1.25rem" }],
        "money":        ["1rem",     { lineHeight: "1.5rem",  fontFamily: "JetBrains Mono" }],
        "money-lg":     ["1.25rem",  { lineHeight: "1.75rem", fontFamily: "JetBrains Mono" }],
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--accordion-content-height)" },
          to:   { height: "0" },
        },
        "slide-in-from-top": {
          from: { transform: "translateY(-8px)", opacity: "0" },
          to:   { transform: "translateY(0)",    opacity: "1" },
        },
      },
      animation: {
        "accordion-down":      "accordion-down 0.2s ease-out",
        "accordion-up":        "accordion-up 0.2s ease-out",
        "slide-in-from-top":   "slide-in-from-top 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
