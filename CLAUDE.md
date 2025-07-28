# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KNUE Board Hub is a Vue 3 RSS aggregator Progressive Web App (PWA) that consolidates bulletin board feeds from Korea National University of Education (KNUE). The app provides a mobile-first experience for accessing university announcements across multiple departments.

## Development Commands

**Development server:**
```bash
npm run dev          # Start development server on localhost:5173
npm run serve        # Start preview server on port 4173
```

**Build and validation:**
```bash
npm run build        # Production build with chunk optimization
npm run preview      # Preview production build
npm run lint         # ESLint with auto-fix for Vue/JS/TS files
npm run type-check   # TypeScript type checking without emit
```

## Architecture Overview

### Core Technologies
- **Vue 3** with Composition API and `<script setup>` syntax
- **Vue Router 4** with lazy-loaded route components
- **Pinia** for state management (though primarily using composables)
- **UnoCSS** with custom theme, shortcuts, and icon presets
- **Vite** with RSS-specific chunk splitting and CORS proxy

### Key Architectural Patterns

**Composables Pattern:**
The app uses Vue 3 composables extensively for shared logic:
- `useRssFeed.js` - RSS data fetching, caching, and state management
- `useNotifications.js` - Global notification system

**Department-Driven Architecture:**
All RSS feeds are organized around department configurations in `src/config/departments.js`. Each department has:
- `bbsNo` - KNUE bulletin board number for RSS endpoint
- Visual identity (icon, color, priority)
- Localized names and descriptions

**Mobile-First PWA Design:**
- Responsive layouts with UnoCSS breakpoints (`xs`, `sm`, `md`, `lg`, `xl`)
- PWA manifest with shortcuts to department-specific feeds
- Touch-optimized interactions and bottom navigation
- Offline-aware components with connection status handling

### RSS Feed System

**Data Flow:**
1. Department configs → RSS URLs (`generateRSSUrl()`)
2. CORS proxy handling (dev: Vite proxy, prod: allorigins.win)
3. RSS parsing and validation (`src/utils/rssParser.js`)
4. Caching with timestamp-based invalidation
5. Reactive display through `useRssFeed` composable

**CORS Strategy:**
- Development: Vite proxy to `https://www.knue.ac.kr/rssBbsNtt.do`
- Production: External CORS proxy service
- Custom headers for RSS acceptance and user agent identification

### UnoCSS Configuration

**Custom Theme Extensions:**
- KNUE brand colors (`knue.primary`, `knue.secondary`)
- Department-specific color palette
- Korean typography with web font stack
- Mobile-safe spacing with safe area insets

**Utility Shortcuts:**
- `container-mobile` - Responsive container with proper padding
- `card-*` variations - Consistent card styling with hover states
- `btn-*` patterns - Touch-optimized button styles
- `badge-department` - Department-specific badge colors

### Component Architecture

**Smart vs Presentational Components:**
- Smart: `RssFeedList.vue` (data fetching), `DepartmentSelector.vue` (filter logic)
- Presentational: `RssItem.vue`, `EmptyState.vue`, `LoadingSpinner.vue`

**View Layer Organization:**
- Route-based lazy loading for all views
- Shared layout through `App.vue` with responsive navigation
- Mobile bottom navigation for primary routes
- Desktop header navigation with responsive hiding

### State Management Strategy

**Primarily Composable-Based:**
- No global Pinia stores (though Pinia is installed)
- RSS state managed through `useRssFeed` composable
- Notification state through `useNotifications` composable
- Local component state with `ref`/`reactive`

**Persistence:**
- localStorage for user preferences (bookmarks, recent searches)
- RSS caching with TTL in composable memory
- PWA installation prompt dismissal tracking

### Development Considerations

**RSS Feed Testing:**
RSS feeds require network access to KNUE servers. In development, the Vite proxy handles CORS. Test with actual network connectivity for realistic behavior.

**Mobile Testing:**
The app is optimized for mobile with specific touch interactions, safe area handling, and responsive breakpoints. Test on actual mobile devices or browser dev tools with device simulation.

**Icon System:**
Icons use Tabler and Material Symbols through UnoCSS presets. Use format `i-tabler-icon-name` or `i-material-icon-name` in class attributes.

**Build Optimization:**
The build separates vendor code (Vue) from RSS-specific utilities for optimal caching. Manual chunks are configured for the RSS parsing and feed management modules.