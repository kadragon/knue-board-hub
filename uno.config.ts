import { defineConfig, presetWind, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
  preflights: [
    {
      getCSS: () => `
        :root {
          --knue-primary: #0066cc;
          --knue-secondary: #004499;
          --knue-accent: #3399ff;
          --gray-50: #f8f9fa;
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
      `
    }
  ],
  presets: [
    presetWind(),
    presetAttributify(),
    presetIcons({
      collections: {
        tabler: () => import('@iconify/json/json/tabler.json').then(i => i.default),
        material: () => import('@iconify/json/json/material-symbols.json').then(i => i.default)
      }
    })
  ],
  theme: {
    colors: {
      knue: {
        primary: '#0066cc',
        secondary: '#004499',
        accent: '#3399ff',
        gray: {
          50: '#f8f9fa',
          100: '#e9ecef',
          200: '#dee2e6',
          300: '#ced4da',
          400: '#adb5bd',
          500: '#6c757d',
          600: '#495057',
          700: '#343a40',
          800: '#212529',
          900: '#0d1117'
        }
      },
      department: {
        main: '#0066cc',
        academic: '#28a745',
        employment: '#17a2b8',
        scholarship: '#ffc107',
        event: '#e83e8c',
        research: '#6f42c1',
        library: '#fd7e14'
      }
    },
    screens: {
      xs: '375px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px'
    },
    spacing: {
      'safe-top': 'env(safe-area-inset-top)',
      'safe-bottom': 'env(safe-area-inset-bottom)',
      'safe-left': 'env(safe-area-inset-left)',
      'safe-right': 'env(safe-area-inset-right)'
    },
    fontFamily: {
      sans: [
        '-apple-system',
        'BlinkMacSystemFont',
        'Apple SD Gothic Neo',
        'Pretendard Variable',
        'Pretendard',
        'Roboto',
        'Noto Sans KR',
        'Segoe UI',
        'sans-serif'
      ]
    }
  },
  shortcuts: {
    // Layout shortcuts
    'container-mobile': 'max-w-screen-lg mx-auto px-4 sm:px-6',
    'container-safe': 'pl-safe-left pr-safe-right',
    'section-spacing': 'py-4 sm:py-6',
    
    // Card shortcuts
    'card-base': 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700',
    'card-hover': 'hover:shadow-md hover:scale-102 transition-all duration-200 ease-out',
    'card-touch': 'active:scale-98 touch-manipulation',
    'card-rss': 'card-base card-hover card-touch p-4 mb-3',
    
    // Button shortcuts
    'btn-base': 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 ease-out touch-manipulation',
    'btn-primary': 'btn-base bg-knue-primary text-white hover:bg-knue-secondary active:scale-95 shadow-sm',
    'btn-secondary': 'btn-base bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95',
    'btn-touch': 'min-h-11 px-4 py-2 min-w-11',
    'btn-icon': 'btn-base p-2 rounded-full',
    
    // Text shortcuts
    'text-title': 'text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight',
    'text-subtitle': 'text-base font-medium text-gray-700 dark:text-gray-300',
    'text-body': 'text-sm text-gray-600 dark:text-gray-400 leading-relaxed',
    'text-caption': 'text-xs text-gray-500 dark:text-gray-500',
    'text-link': 'text-knue-primary hover:text-knue-secondary underline-offset-2',
    
    // Department badges
    'badge-department': 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
    'badge-main': 'badge-department bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    'badge-academic': 'badge-department bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    'badge-employment': 'badge-department bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300',
    'badge-scholarship': 'badge-department bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    'badge-event': 'badge-department bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300',
    'badge-research': 'badge-department bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
    'badge-library': 'badge-department bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
    
    // Loading states
    'skeleton': 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded',
    'skeleton-text': 'skeleton h-4 w-full',
    'skeleton-title': 'skeleton h-5 w-3/4',
    'skeleton-circle': 'skeleton rounded-full',
    
    // Touch feedback
    'touch-feedback': 'active:bg-gray-50 dark:active:bg-gray-800 active:scale-98 transition-all duration-150',
    'ripple-effect': 'relative overflow-hidden before:absolute before:inset-0 before:bg-current before:opacity-0 before:scale-0 active:before:opacity-10 active:before:scale-100 before:transition-all before:duration-300',
    
    // Safe area
    'safe-area-top': 'pt-safe-top',
    'safe-area-bottom': 'pb-safe-bottom',
    
    // Responsive grid
    'grid-responsive': 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between'
  },
  rules: [
    // Custom touch target rule
    ['touch-target', { 'min-height': '44px', 'min-width': '44px' }],
    
    // Custom scroll behavior
    ['scroll-smooth', { 'scroll-behavior': 'smooth' }],
    
    // iOS momentum scrolling
    ['scroll-touch', { '-webkit-overflow-scrolling': 'touch' }],
    
    // Prevent text selection on touch devices
    ['select-none-touch', { 
      '-webkit-user-select': 'none',
      '-moz-user-select': 'none',
      'user-select': 'none',
      '-webkit-touch-callout': 'none'
    }],
    
    // Line clamp utilities
    [/^line-clamp-(\d+)$/, ([, num]) => ({
      'display': '-webkit-box',
      '-webkit-line-clamp': num,
      '-webkit-box-orient': 'vertical',
      'overflow': 'hidden'
    })]
  ],
  variants: [
    // Touch device variants
    (matcher) => {
      if (!matcher.startsWith('touch:')) return matcher
      return {
        matcher: matcher.slice(6),
        selector: s => `@media (hover: none) and (pointer: coarse) { ${s} }`
      }
    },
    
    // Desktop variants
    (matcher) => {
      if (!matcher.startsWith('desktop:')) return matcher
      return {
        matcher: matcher.slice(8),
        selector: s => `@media (hover: hover) and (pointer: fine) { ${s} }`
      }
    },
    
    // Dark mode support (class-based)
    (matcher) => {
      if (!matcher.startsWith('dark:')) return matcher
      return {
        matcher: matcher.slice(5),
        selector: s => `.dark ${s}`
      }
    }
  ],
  safelist: [
    // Department colors
    'bg-blue-100', 'text-blue-800',
    'bg-green-100', 'text-green-800', 
    'bg-cyan-100', 'text-cyan-800',
    'bg-yellow-100', 'text-yellow-800',
    'bg-pink-100', 'text-pink-800',
    'bg-purple-100', 'text-purple-800',
    'bg-orange-100', 'text-orange-800',
    
    // Animation classes
    'animate-spin', 'animate-pulse', 'animate-bounce',
    
    // Touch states
    'active:scale-95', 'active:scale-98', 'active:bg-gray-50',
    
    // Navigation icons
    'i-tabler-school', 'i-tabler-home', 'i-tabler-building', 'i-tabler-building-bank',
    'i-tabler-settings', 'i-tabler-info-circle', 'i-tabler-code',
    'i-tabler-menu-2', 'i-tabler-x', 'i-tabler-bookmark', 'i-tabler-bookmark-filled',
    'i-tabler-layout-dashboard', 'i-tabler-news',
    
    // RSS item action icons
    'i-tabler-share', 'i-tabler-external-link',
    
    // Icon sizes
    'w-5', 'h-5', 'w-4', 'h-4'
  ]
})