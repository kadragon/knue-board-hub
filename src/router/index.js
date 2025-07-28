/**
 * Vue Router Configuration
 * Navigation setup for KNUE RSS Board Hub
 */

import { createRouter, createWebHistory } from 'vue-router'

// Lazy-loaded route components
const Home = () => import('../views/TestView.vue')
const Departments = () => import('../views/DepartmentsView.vue')
const Settings = () => import('../views/SettingsView.vue')
const About = () => import('../views/AboutView.vue')
const NotFound = () => import('../views/NotFoundView.vue')

// Route definitions
const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: {
      title: 'KNUE 게시판',
      description: '한국교원대학교 통합 공지사항',
      icon: 'i-tabler-home',
      showInNav: true,
      requiresOnline: true
    }
  },
  {
    path: '/departments',
    name: 'departments',
    component: Departments,
    meta: {
      title: '게시판 관리',
      description: '게시판 선택 및 설정',
      icon: 'i-tabler-building-bank',
      showInNav: true,
      requiresOnline: false
    }
  },
  {
    path: '/settings',
    name: 'settings',
    component: Settings,
    meta: {
      title: '설정',
      description: '앱 설정 및 환경설정',
      icon: 'i-tabler-settings',
      showInNav: true,
      requiresOnline: false
    }
  },
  {
    path: '/about',
    name: 'about',
    component: About,
    meta: {
      title: '정보',
      description: '앱 정보 및 도움말',
      icon: 'i-tabler-info-circle',
      showInNav: true,
      requiresOnline: false
    }
  },
  
  // Department-specific routes (optional for future use)
  {
    path: '/department/:id',
    name: 'department-detail',
    component: () => import('../views/DepartmentDetailView.vue'),
    props: true,
    meta: {
      title: '게시판 상세',
      showInNav: false,
      requiresOnline: true
    }
  },
  
  // Post detail route (optional for future use)
  {
    path: '/post/:id',
    name: 'post-detail',
    component: () => import('../views/PostDetailView.vue'),
    props: true,
    meta: {
      title: '게시글 상세',
      showInNav: false,
      requiresOnline: true
    }
  },
  
  // Bookmarks route (optional for future use)
  {
    path: '/bookmarks',
    name: 'bookmarks',
    component: () => import('../views/BookmarksView.vue'),
    meta: {
      title: '북마크',
      description: '저장된 게시글',
      icon: 'i-tabler-bookmark',
      showInNav: false,
      requiresOnline: false
    }
  },
  
  // Search route (optional for future use)
  {
    path: '/search',
    name: 'search',
    component: () => import('../views/SearchView.vue'),
    meta: {
      title: '검색',
      description: '게시글 검색',
      icon: 'i-tabler-search',
      showInNav: false,
      requiresOnline: true
    }
  },
  
  // 404 Not Found
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound,
    meta: {
      title: '페이지를 찾을 수 없습니다',
      showInNav: false,
      requiresOnline: false
    }
  }
]

// Create router instance
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Handle scroll behavior for better UX
    if (savedPosition) {
      // Return to saved position when using browser back/forward
      return savedPosition
    } else if (to.hash) {
      // Scroll to anchor
      return {
        el: to.hash,
        behavior: 'smooth'
      }
    } else if (to.name !== from.name) {
      // Scroll to top when navigating to different route
      return { top: 0, behavior: 'smooth' }
    }
    
    // Keep current scroll position for same route
    return {}
  }
})

// Global navigation guards
router.beforeEach((to, from, next) => {
  // Update document title
  if (to.meta.title) {
    document.title = `${to.meta.title} - KNUE 게시판`
  } else {
    document.title = 'KNUE 게시판 - 한국교원대학교'
  }
  
  // Update meta description
  if (to.meta.description) {
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.name = 'description'
      document.head.appendChild(metaDescription)
    }
    metaDescription.content = to.meta.description
  }
  
  // Check online requirement
  if (to.meta.requiresOnline && !navigator.onLine) {
    // Redirect to offline page or show error
    console.warn('Route requires online connection:', to.name)
    // For now, continue navigation - handle offline state in components
  }
  
  // Analytics tracking (if implemented)
  if (typeof gtag !== 'undefined') {
    gtag('config', 'GA_MEASUREMENT_ID', {
      page_title: to.meta.title,
      page_location: window.location.href
    })
  }
  
  next()
})

// Navigation error handling
router.onError((error) => {
  console.error('Router navigation error:', error)
  
  // Handle chunk loading errors (lazy loading failures)
  if (error.message.includes('Loading chunk')) {
    console.log('Chunk loading failed, reloading page...')
    window.location.reload()
  }
})

// Navigation helper functions
export function getNavRoutes() {
  return routes.filter(route => route.meta?.showInNav)
}

export function getCurrentRouteTitle() {
  return router.currentRoute.value.meta?.title || 'KNUE 게시판'
}

export function isCurrentRoute(routeName) {
  return router.currentRoute.value.name === routeName
}

export function navigateWithFallback(routeName, fallbackPath = '/') {
  router.push({ name: routeName }).catch(() => {
    router.push(fallbackPath)
  })
}

export default router