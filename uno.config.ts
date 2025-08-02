import {
  defineConfig,
  presetWind,
  presetAttributify,
  presetIcons,
} from "unocss";

export default defineConfig({
  preflights: [
    {
      getCSS: () => `
        :root {
          --knue-primary: #072D6E;
          --knue-secondary: #03519C;
          --knue-accent: #FFB800;
          --knue-surface: #FAFAFD;
          --transition-duration: 0.25s;
          --transition-timing: ease-out;
          --gray-50: #FAFAFD;
          --gray-100: #e9ecef;
          --gray-200: #dee2e6;
          --gray-300: #ced4da;
          --gray-400: #adb5bd;
          --gray-500: #6c757d;
          --gray-600: #495057;
          --gray-700: #343a40;
          --gray-800: #212529;
          --gray-900: #0d1117;
          --blue-50: #eff6ff;
          --blue-100: #dbeafe;
          --blue-800: #1e40af;
          --blue-900: #1e3a8a;
          --green-100: #dcfce7;
          --green-800: #166534;
          --cyan-100: #cffafe;
          --cyan-800: #155e75;
          --yellow-100: #fef3c7;
          --yellow-200: #fde68a;
          --yellow-800: #92400e;
          --pink-100: #fce7f3;
          --pink-800: #9d174d;
          --purple-50: #faf5ff;
          --purple-100: #f3e8ff;
          --purple-800: #6b21a8;
          --purple-900: #581c87;
          --orange-100: #fed7aa;
          --orange-800: #9a3412;
          --red-50: #fef2f2;
          --red-100: #fee2e2;
          --red-200: #fecaca;
          --red-700: #b91c1c;
        }

        /* Global accessibility and motion preferences */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }

        /* Focus management */
        *:focus-visible {
          outline: 2px solid var(--knue-accent);
          outline-offset: 2px;
        }

        /* Skip link for accessibility */
        .skip-link {
          position: absolute;
          top: -40px;
          left: 6px;
          background: var(--knue-primary);
          color: white;
          padding: 8px;
          text-decoration: none;
          border-radius: 4px;
          z-index: 1000;
        }

        .skip-link:focus {
          top: 6px;
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          :root {
            --knue-primary: #000000;
            --knue-secondary: #1a1a1a;
            --knue-accent: #FFD700;
          }
          
          .card-base,
          .btn-base,
          .badge-department {
            border: 2px solid currentColor !important;
          }
          
          .text-gray-500,
          .text-gray-600 {
            color: #000000 !important;
          }
        }
      `,
    },
  ],
  presets: [presetWind(), presetAttributify(), presetIcons()],
  theme: {
    colors: {
      knue: {
        primary: "#072D6E",
        secondary: "#03519C",
        accent: "#FFB800",
        surface: "#FAFAFD",
        gray: {
          50: "#f8f9fa",
          100: "#e9ecef",
          200: "#dee2e6",
          300: "#ced4da",
          400: "#adb5bd",
          500: "#6c757d",
          600: "#495057",
          700: "#343a40",
          800: "#212529",
          900: "#0d1117",
        },
      },
      department: {
        main: "#072D6E",
        academic: "#28a745",
        employment: "#17a2b8",
        scholarship: "#ffc107",
        event: "#e83e8c",
        research: "#6f42c1",
        library: "#fd7e14",
      },
    },
    screens: {
      xs: "375px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
    },
    spacing: {
      "safe-top": "env(safe-area-inset-top)",
      "safe-bottom": "env(safe-area-inset-bottom)",
      "safe-left": "env(safe-area-inset-left)",
      "safe-right": "env(safe-area-inset-right)",
    },
    fontFamily: {
      sans: [
        "Pretendard Variable",
        "Pretendard",
        "-apple-system",
        "BlinkMacSystemFont",
        "Apple SD Gothic Neo",
        "Noto Sans KR",
        "Roboto",
        "Segoe UI",
        "sans-serif",
      ],
    },
    lineHeight: {
      'tight': '1.4',
      'normal': '1.6',
      'relaxed': '1.8',
    },
  },
  shortcuts: {
    // Layout shortcuts (STYLE.md grid aligned)
    "container-mobile": "max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8",
    "container-safe": "pl-safe-left pr-safe-right",
    "section-spacing": "py-4 sm:py-6 lg:py-8",
    "grid-responsive-knue": "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8",
    "spacing-mobile": "px-4 py-4",
    "spacing-tablet": "px-6 py-6", 
    "spacing-desktop": "px-8 py-8",

    // Card shortcuts (STYLE.md aligned + enhanced separation)
    "card-base":
      "bg-white rounded-xl shadow-sm border border-gray-300",
    "card-hover":
      "hover:shadow-lg hover:border-knue-primary/30 hover:-translate-y-1 transition-all duration-250 ease-out",
    "card-touch": "active:scale-98 touch-manipulation",
    "card-rss": "card-base card-hover card-touch p-4 mb-3 md:p-5 md:mb-4 shadow-md",

    // Button shortcuts (STYLE.md aligned)
    "btn-base":
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-250 ease-out touch-manipulation focus:outline-none focus:ring-2 focus:ring-knue-accent focus:ring-offset-2",
    "btn-primary":
      "btn-base bg-knue-primary text-white hover:bg-knue-secondary active:scale-95 shadow-sm",
    "btn-secondary":
      "btn-base bg-knue-surface border border-gray-200 text-knue-primary hover:bg-gray-50 hover:border-knue-primary active:scale-95",
    "btn-touch": "min-h-11 px-4 py-2 min-w-11",
    "btn-icon": "btn-base p-2 rounded-full",

    // Text shortcuts (STYLE.md aligned)
    "text-headline": "text-2xl font-bold text-knue-primary leading-tight",
    "text-title": "text-lg font-semibold text-knue-primary leading-normal",
    "text-subtitle": "text-base font-medium text-gray-700 leading-normal",
    "text-body": "text-base text-gray-600 leading-normal",
    "text-caption": "text-sm text-gray-500 leading-normal",
    "text-small": "text-xs text-gray-500",
    "text-link":
      "text-knue-primary hover:text-knue-secondary underline-offset-2",

    // Department badges
    "badge-department":
      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
    "badge-main":
      "badge-department bg-blue-100 text-blue-800",
    "badge-academic":
      "badge-department bg-green-100 text-green-800",
    "badge-employment":
      "badge-department bg-cyan-100 text-cyan-800",
    "badge-scholarship":
      "badge-department bg-yellow-100 text-yellow-800",
    "badge-event":
      "badge-department bg-pink-100 text-pink-800",
    "badge-research":
      "badge-department bg-purple-100 text-purple-800",
    "badge-library":
      "badge-department bg-orange-100 text-orange-800",

    // Loading states (STYLE.md aligned)
    skeleton: "animate-pulse bg-gray-200 rounded",
    "skeleton-text": "skeleton h-4 w-full mb-2",
    "skeleton-title": "skeleton h-6 w-3/4 mb-3",
    "skeleton-subtitle": "skeleton h-4 w-1/2 mb-2",
    "skeleton-circle": "skeleton rounded-full",
    "skeleton-rss-card": "skeleton h-32 w-full rounded-xl mb-3",
    "skeleton-avatar": "skeleton w-10 h-10 rounded-full",

    // Touch feedback
    "touch-feedback":
      "active:bg-gray-50 active:scale-98 transition-all duration-150",
    "ripple-effect":
      "relative overflow-hidden before:absolute before:inset-0 before:bg-current before:opacity-0 before:scale-0 active:before:opacity-10 active:before:scale-100 before:transition-all before:duration-300",

    // Safe area
    "safe-area-top": "pt-safe-top",
    "safe-area-bottom": "pb-safe-bottom",

    // Responsive grid
    "grid-responsive": "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
    "flex-center": "flex items-center justify-center",
    "flex-between": "flex items-center justify-between",
    
    // Accessibility
    "sr-only": "absolute w-1 h-1 p-0 -m-1 overflow-hidden whitespace-nowrap border-0",
  },
  rules: [
    // Custom touch target rule
    ["touch-target", { "min-height": "44px", "min-width": "44px" }],

    // Custom scroll behavior
    ["scroll-smooth", { "scroll-behavior": "smooth" }],

    // iOS momentum scrolling
    ["scroll-touch", { "-webkit-overflow-scrolling": "touch" }],

    // Prevent text selection on touch devices
    [
      "select-none-touch",
      {
        "-webkit-user-select": "none",
        "-moz-user-select": "none",
        "user-select": "none",
        "-webkit-touch-callout": "none",
      },
    ],

    // Line clamp utilities
    [
      /^line-clamp-(\d+)$/,
      ([, num]) => ({
        display: "-webkit-box",
        "-webkit-line-clamp": num,
        "-webkit-box-orient": "vertical",
        overflow: "hidden",
      }),
    ],
  ],
  variants: [
    // Touch device variants
    (matcher) => {
      if (!matcher.startsWith("touch:")) return matcher;
      return {
        matcher: matcher.slice(6),
        selector: (s) => `@media (hover: none) and (pointer: coarse) { ${s} }`,
      };
    },

    // Desktop variants
    (matcher) => {
      if (!matcher.startsWith("desktop:")) return matcher;
      return {
        matcher: matcher.slice(8),
        selector: (s) => `@media (hover: hover) and (pointer: fine) { ${s} }`,
      };
    },

  ],
  safelist: [
    // Department colors
    "bg-blue-100",
    "text-blue-800",
    "bg-green-100",
    "text-green-800",
    "bg-cyan-100",
    "text-cyan-800",
    "bg-yellow-100",
    "text-yellow-800",
    "bg-pink-100",
    "text-pink-800",
    "bg-purple-100",
    "text-purple-800",
    "bg-orange-100",
    "text-orange-800",

    // Animation classes
    "animate-spin",
    "animate-pulse",
    "animate-bounce",

    // Touch states
    "active:scale-95",
    "active:scale-98",
    "active:bg-gray-50",

    // Navigation icons
    "i-tabler-school",
    "i-tabler-home",
    "i-tabler-building",
    "i-tabler-building-bank",
    "i-tabler-settings",
    "i-tabler-info-circle",
    "i-tabler-code",
    "i-tabler-menu-2",
    "i-tabler-x",
    "i-tabler-bookmark",
    "i-tabler-bookmark-filled",
    "i-tabler-layout-dashboard",
    "i-tabler-news",

    // RSS item action icons
    "i-tabler-share",
    "i-tabler-external-link",

    // Icon sizes
    "w-5",
    "h-5",
    "w-4",
    "h-4",
  ],
});
