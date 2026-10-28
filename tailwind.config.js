/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: "hsl(var(--warning))",
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },

        // The Console's own two inks and the instrument blue. `--ink` and
        // `--ink-2` are HSL triples; the theme's own surfaces are oklch.
        ink: {
          DEFAULT: "hsl(var(--ink))",
          2: "hsl(var(--ink-2))",
        },
        cool: {
          DEFAULT: "var(--color-cool)",
          soft: "var(--color-cool-soft)",
        },
        paper: {
          DEFAULT: "var(--color-paper)",
          2: "var(--color-paper-2)",
          3: "var(--color-paper-3)",
        },
        rule: {
          DEFAULT: "var(--color-rule)",
          2: "var(--color-rule-2)",
        },
        // Materials that are not chrome: a board is wood, a chart series needs
        // a colour when the data has none.
        board: {
          wood: "var(--color-board-wood)",
          "wood-2": "var(--color-board-wood-2)",
          edge: "var(--color-board-edge)",
        },
        chart: {
          fallback: "var(--color-chart-fallback)",
        },
        swatch: {
          edge: "var(--color-swatch-edge)",
        },
        scrim: "var(--color-scrim)",
        land: "var(--board-land)",
        river: "var(--board-river)",
        trap: "var(--board-trap)",
        den: {
          blue: "var(--board-den-blue)",
          red: "var(--board-den-red)",
        },
        piece: {
          blue: "var(--piece-blue)",
          red: "var(--piece-red)",
          "blue-wash": "var(--piece-blue-wash)",
          "red-wash": "var(--piece-red-wash)",
        },

        // The greyscale is remapped onto the theme's own surfaces, so a
        // component written against Tailwind's stock greys still lands on
        // the Console ground and still reads in both colourways. The steps
        // keep their order: 50 is the lightest surface, 900 the ink.
        gray: {
          50: "hsl(var(--surface-raised))",
          100: "hsl(var(--surface-raised))",
          200: "hsl(var(--border))",
          300: "hsl(var(--border))",
          400: "hsl(var(--muted-foreground))",
          500: "hsl(var(--muted-foreground))",
          600: "hsl(var(--muted-foreground))",
          700: "hsl(var(--ink-2))",
          800: "hsl(var(--foreground))",
          900: "hsl(var(--foreground))",
        },
        grey: {
          50: "hsl(var(--surface-raised))",
          100: "hsl(var(--surface-raised))",
          200: "hsl(var(--border))",
          300: "hsl(var(--border))",
          400: "hsl(var(--muted-foreground))",
          500: "hsl(var(--muted-foreground))",
          600: "hsl(var(--muted-foreground))",
          700: "hsl(var(--ink-2))",
          800: "hsl(var(--foreground))",
          900: "hsl(var(--foreground))",
        },

        // White and black become the paper and the ink, never a pure
        // absolute (gate 7a): they are tinted toward the ground.
        white: "hsl(var(--background))",
        black: "hsl(var(--foreground))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        card: "var(--radius-card)",
        pill: "var(--radius-pill)",
      },
      fontFamily: {
        sans: ["var(--font-body)"],
        display: ["var(--font-display)"],
        mono: ["var(--font-outlier)"],
      },
      fontSize: {
        xs: "var(--text-xs)",
        sm: "var(--text-sm)",
        base: "var(--text-md)",
        lg: "var(--text-lg)",
        xl: "var(--text-xl)",
        "2xl": "var(--text-2xl)",
        "3xl": "var(--text-3xl)",
        section: "var(--text-section)",
        title: "var(--text-title)",
        lead: "var(--text-lead)",
        display: "var(--text-display)",
        "display-s": "var(--text-display-s)",
      },
      spacing: {
        "space-3xs": "var(--space-3xs)",
        "space-2xs": "var(--space-2xs)",
        "space-xs": "var(--space-xs)",
        "space-sm": "var(--space-sm)",
        "space-md": "var(--space-md)",
        "space-lg": "var(--space-lg)",
        "space-xl": "var(--space-xl)",
        "space-2xl": "var(--space-2xl)",
        "space-3xl": "var(--space-3xl)",
        "space-4xl": "var(--space-4xl)",
        "section-s": "var(--section-gap-s)",
        section: "var(--section-gap)",
        "section-l": "var(--section-gap-l)",
      },
      maxWidth: {
        canvas: "var(--container)",
      },
      transitionDuration: {
        micro: "var(--dur-micro)",
        short: "var(--dur-short)",
        long: "var(--dur-long)",
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
        in: "var(--ease-in)",
        "in-out": "var(--ease-in-out)",
      },
      zIndex: {
        base: "var(--z-base)",
        raised: "var(--z-raised)",
        dropdown: "var(--z-dropdown)",
        sticky: "var(--z-sticky)",
        "sticky-nav": "var(--z-sticky-nav)",
        modal: "var(--z-modal)",
        toast: "var(--z-toast)",
        tooltip: "var(--z-tooltip)",
      },
    },
  },
  plugins: [],
};
