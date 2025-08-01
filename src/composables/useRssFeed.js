/**
 * RSS Feed Management Composable
 * Enhanced with localStorage cache-first pattern and intelligent rehydration
 */

import { ref, reactive, computed, watch, onMounted, onUnmounted, readonly } from 'vue'
import { sortItemsByDate, filterItemsByDate } from '../utils/rssParser.js'
import { RSS_CONFIG } from '../config/departments.js'
import { useDepartments } from './useDepartments.js'
import { RehydrationManager } from '../services/rehydrationManager.js'
import { cacheManager } from '../services/cacheManager.js'
import { apiService } from '../services/apiService.js'

/**
 * Main RSS feed composable
 * @param {Object} options - Configuration options
 * @returns {Object} Reactive RSS feed state and methods
 */
export function useRssFeed(options = {}) {
  // Use departments composable for efficient department data management
  const { getDepartment: getDepartmentFromComposable, fetchDepartments } = useDepartments()
  
  // Initialize rehydration manager for RSS data
  const rehydrationManager = new RehydrationManager(apiService)
  
  // Reactive state
  const feeds = ref(new Map()) // Map<departmentId, feedData>
  const loading = ref(false)
  const errors = ref(new Map()) // Map<departmentId, error>
  const lastUpdate = ref(null)
  const pendingFetches = ref(new Set()) // Track ongoing fetches to prevent duplicates
  let fetchDebounceTimer = null // Debounce timer to prevent rapid successive calls
  const initializedDepartments = ref(new Set()) // Track which departments have been initialized
  const activeDepartments = ref(new Set()) // Track currently active/selected departments
  
  // Configuration
  const config = reactive({
    timeout: options.timeout || RSS_CONFIG.timeout,
    retryAttempts: options.retryAttempts || RSS_CONFIG.retryAttempts,
    cacheDuration: options.cacheDuration || RSS_CONFIG.cacheDuration,
    autoRefresh: options.autoRefresh || false,
    refreshInterval: options.refreshInterval || 5 * 60 * 1000, // 5 minutes
    environment: options.environment || (import.meta.env.DEV ? 'development' : 'production')
  })

  // Auto-refresh timer
  let refreshTimer = null

  // localStorage keys for persisting user data
  const SELECTED_DEPARTMENTS_KEY = 'knue-board-hub:selected-departments'
  const RECENT_DEPARTMENTS_KEY = 'user:recent-departments'

  /**
   * Track recently accessed departments for predictive loading
   * @param {Array} departmentIds - Department IDs to track
   */
  async function trackRecentDepartments(departmentIds) {
    try {
      const cached = await cacheManager.get(RECENT_DEPARTMENTS_KEY, 'preferences')
      const recentDepts = cached?.data || []
      
      // Add new departments to the front, remove duplicates, keep last 10
      const updated = [
        ...departmentIds,
        ...recentDepts.filter(id => !departmentIds.includes(id))
      ].slice(0, 10)
      
      await cacheManager.set(RECENT_DEPARTMENTS_KEY, updated, 'preferences')
    } catch (error) {
      console.warn('📰 Failed to track recent departments:', error)
    }
  }

  /**
   * Get department data efficiently using useDepartments composable
   * @param {string} departmentId - Department identifier
   * @returns {Promise<Object>} Department data
   */
  async function getDepartment(departmentId) {
    const department = await getDepartmentFromComposable(departmentId, true)
    
    if (!department) {
      throw new Error(`Unknown department: ${departmentId}`)
    }

    return department
  }

  /**
   * Generate RSS URL for department
   * @param {string} departmentId - Department identifier
   * @param {Object} options - Additional URL parameters
   * @returns {Promise<string>} Complete RSS URL
   */
  async function generateRSSUrl(departmentId, options = {}) {
    const department = await getDepartment(departmentId)
    
    if (department.rssUrl) {
      // Use the rss_url from database if available
      const url = new URL(department.rssUrl)
      Object.entries(options).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
      return url.toString()
    } else {
      // Fallback to generating URL from bbsNo
      const baseUrl = 'https://www.knue.ac.kr/rssBbsNtt.do'
      const params = new URLSearchParams({
        bbsNo: department.bbsNo,
        ...options
      })
      return `${baseUrl}?${params.toString()}`
    }
  }

  /**
   * Generate proxy URL for CORS bypass
   * @param {string} rssUrl - Original RSS URL
   * @param {string} environment - Current environment
   * @returns {string} Proxy URL
   */
  function generateProxyUrl(rssUrl, environment = 'development') {
    if (environment === 'development') {
      return `/api/rss?url=${encodeURIComponent(rssUrl)}`
    } else {
      return `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`
    }
  }

  /**
   * Fetch RSS items with cache-first pattern and smart caching
   * @param {Array} departmentIds - Array of department identifiers
   * @param {Object} fetchOptions - Fetch options
   * @returns {Promise<Object>} RSS items data with cache metadata
   */
  async function fetchRssItems(departmentIds, fetchOptions = {}) {
    const {
      limit = 50,
      offset = 0,
      search = null,
      dateFilter = 'all',
      sortBy = 'date-desc',
      skipCache = false
    } = fetchOptions

    // Create smart cache key that includes all relevant parameters
    const sortedDeptIds = [...departmentIds].sort()
    const cacheKey = `rss:${sortedDeptIds.join(',')}:${JSON.stringify({
      limit, offset, search, dateFilter, sortBy
    })}`

    console.log(`📰 Fetching RSS items for departments: ${sortedDeptIds.join(', ')}${skipCache ? ' (force refresh)' : ' (cache-first)'}`)

    // Track recent departments for predictive loading
    await trackRecentDepartments(departmentIds)

    // Use rehydration manager for cache-first approach
    const result = await rehydrationManager.getData(
      cacheKey,
      async () => {
        // Fetch function that calls the API
        const params = new URLSearchParams({
          departments: departmentIds.join(','),
          limit: limit.toString(),
          offset: offset.toString(),
          sortBy
        })

        if (search) params.set('search', search)
        if (dateFilter !== 'all') params.set('dateFilter', dateFilter)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), config.timeout)

        try {
          const response = await fetch(`/api/rss/items?${params.toString()}`, {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const apiResult = await response.json()
          
          if (!apiResult.success) {
            throw new Error(apiResult.error || 'Failed to fetch RSS items')
          }

          return apiResult
        } catch (error) {
          clearTimeout(timeoutId)
          throw error
        }
      },
      {
        category: 'rssItems',
        forceRefresh: skipCache,
        allowStale: true,
        timeout: config.timeout
      }
    )

    // Log cache performance
    const cacheStatus = result._metadata?.cached ? 
      `from cache (age: ${Math.round((result._metadata.age || 0)/1000)}s${result._metadata.stale ? ', stale' : ''})` :
      result._metadata?.fallback ? 'from stale cache (network error)' : 'from server (fresh)'
    
    console.log(`📰 RSS items loaded ${cacheStatus}: ${result.data?.length || 0} items`)

    return result
  }

  /**
   * Refresh RSS feeds using the API endpoint
   * @param {Array} departmentIds - Optional array of department identifiers
   * @returns {Promise<Object>} Refresh result
   */
  async function refreshRssFeeds(departmentIds = null) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout)

    try {
      const body = departmentIds ? { departments: departmentIds } : {}
      
      const response = await fetch('/api/rss/refresh', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to refresh RSS feeds')
      }

      return result
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  /**
   * Ensure departments are loaded efficiently
   * @param {Array} departmentIds - Array of department identifiers
   * @returns {Promise<void>}
   */
  async function ensureDepartmentsLoaded(departmentIds) {
    console.log(`Ensuring ${departmentIds.length} departments are loaded: ${departmentIds.join(', ')}`)
    
    // The useDepartments composable handles efficient fetching
    // It will fetch all departments once if needed, instead of individual calls
    await fetchDepartments()
  }

  /**
   * Save selected departments to localStorage
   * @param {Array} departmentIds - Array of department identifiers
   */
  function saveSelectedDepartments(departmentIds) {
    try {
      localStorage.setItem(SELECTED_DEPARTMENTS_KEY, JSON.stringify(departmentIds))
    } catch (error) {
      console.warn('Failed to save selected departments to localStorage:', error)
    }
  }

  /**
   * Load selected departments from localStorage
   * @returns {Array} Array of department identifiers or empty array
   */
  function loadSelectedDepartments() {
    try {
      const stored = localStorage.getItem(SELECTED_DEPARTMENTS_KEY)
      if (!stored) return []
      
      const parsed = JSON.parse(stored)
      if (!Array.isArray(parsed)) return []
      
      // Filter out invalid department IDs
      return parsed.filter(id => 
        id && 
        typeof id === 'string' && 
        id.trim() !== '' && 
        id !== 'undefined' && 
        id !== 'null'
      )
    } catch (error) {
      console.warn('Failed to load selected departments from localStorage:', error)
      return []
    }
  }

  /**
   * Set active departments (departments that should be included in allItems)
   * @param {Array} departmentIds - Array of department identifiers
   * @param {boolean} persist - Whether to persist to localStorage (default: true)
   */
  function setActiveDepartments(departmentIds, persist = true) {
    activeDepartments.value.clear()
    departmentIds.forEach(id => activeDepartments.value.add(id))
    
    // Persist to localStorage by default
    if (persist) {
      saveSelectedDepartments(departmentIds)
    }
  }

  /**
   * Add department to active list
   * @param {string} departmentId - Department identifier
   */
  function addActiveDepartment(departmentId) {
    activeDepartments.value.add(departmentId)
  }

  /**
   * Remove department from active list
   * @param {string} departmentId - Department identifier
   */
  function removeActiveDepartment(departmentId) {
    activeDepartments.value.delete(departmentId)
  }

  /**
   * Get selected departments from localStorage or fall back to defaults
   * @returns {Promise<Array>} Array of department identifiers
   */
  async function getSelectedDepartments() {
    const storedDepartments = loadSelectedDepartments()
    
    if (storedDepartments.length > 0) {
      // Validate that stored departments still exist
      await fetchDepartments() // Ensure departments are loaded
      const validDepartments = []
      
      for (const deptId of storedDepartments) {
        const dept = await getDepartmentFromComposable(deptId, false)
        if (dept) {
          validDepartments.push(deptId)
        }
      }
      
      if (validDepartments.length > 0) {
        return validDepartments
      }
    }
    
    // Fall back to defaults if no valid stored departments
    const { getDefaultDepartments } = useDepartments()
    const defaultDepts = getDefaultDepartments()
    return defaultDepts.map(dept => dept.id)
  }

  /**
   * Fetch multiple department feeds
   * @param {Array} departmentIds - Array of department identifiers
   * @param {Object} options - Fetch options
   * @returns {Promise<void>}
   */
  async function fetchFeeds(departmentIds, options = {}) {
    if (!Array.isArray(departmentIds)) {
      departmentIds = [departmentIds]
    }

    // Update active departments to match the requested feeds
    setActiveDepartments(departmentIds)

    // Debounce rapid successive calls (unless skipCache is true for refresh)
    if (!options.skipCache) {
      if (fetchDebounceTimer) {
        clearTimeout(fetchDebounceTimer)
      }
      
      return new Promise((resolve) => {
        fetchDebounceTimer = setTimeout(async () => {
          fetchDebounceTimer = null
          const result = await performFetch(departmentIds, options)
          resolve(result)
        }, 100) // 100ms debounce
      })
    }
    
    return performFetch(departmentIds, options)
  }

  async function performFetch(departmentIds, options = {}) {
    // Skip if already fetching these departments and not forcing refresh
    if (!options.skipCache && departmentIds.every(id => 
      pendingFetches.value.has(id) || 
      (initializedDepartments.value.has(id) && feeds.value.has(id))
    )) {
      console.log('📰 All requested departments are already being fetched or initialized, skipping duplicate requests')
      return
    }

    // Mark departments as being fetched
    departmentIds.forEach(id => pendingFetches.value.add(id))

    loading.value = true
    const startTime = Date.now()

    try {
      // Ensure departments are loaded efficiently
      await ensureDepartmentsLoaded(departmentIds)

      // Clear previous errors for these departments
      departmentIds.forEach(id => errors.value.delete(id))

      // If forcing refresh, refresh feeds first
      if (options.skipCache) {
        try {
          await refreshRssFeeds(departmentIds)
          console.log('📰 RSS feeds refreshed successfully')
        } catch (error) {
          console.warn('📰 Failed to refresh RSS feeds:', error.message)
        }
      }

      // Fetch RSS items using the enhanced cache-first API
      const result = await fetchRssItems(departmentIds, { ...options, skipCache: options.skipCache })
      
      // Group items by department
      const departmentItems = new Map()
      
      result.data.forEach(item => {
        const deptId = item.department.id
        if (!departmentItems.has(deptId)) {
          departmentItems.set(deptId, [])
        }
        departmentItems.get(deptId).push({
          id: item.id,
          title: item.title,
          link: item.link,
          description: item.description,
          pubDate: item.pubDate,
          createdAt: item.createdAt
        })
      })

      // Create feed data for each department
      let successful = 0
      let failed = 0

      for (const departmentId of departmentIds) {
        try {
          const department = await getDepartment(departmentId)
          const items = departmentItems.get(departmentId) || []
          
          const feedData = {
            items,
            departmentId,
            department: {
              id: department.id,
              name: department.name,
              description: department.description || '',
              icon: department.icon || '📋',
              color: department.color || '#6B7280',
              bbsNo: department.bbs_no,
              priority: department.priority || 999
            },
            fetchedAt: new Date(),
            url: department.rss_url
          }
          
          feeds.value.set(departmentId, feedData)
          initializedDepartments.value.add(departmentId)
          successful++
        } catch (error) {
          errors.value.set(departmentId, {
            message: error.message,
            timestamp: new Date(),
            departmentId
          })
          failed++
        }
      }
      
      console.log(`RSS fetch completed: ${successful} successful, ${failed} failed (${Date.now() - startTime}ms)`)
      
      lastUpdate.value = new Date()
      
    } catch (error) {
      console.error('RSS fetch failed:', error)
      // Mark all departments as failed
      departmentIds.forEach(departmentId => {
        errors.value.set(departmentId, {
          message: error.message,
          timestamp: new Date(),
          departmentId
        })
      })
    } finally {
      // Clean up any remaining pending fetches
      departmentIds.forEach(id => pendingFetches.value.delete(id))
      loading.value = false
    }
  }

  /**
   * Refresh feeds with optimistic updates for better UX
   * @param {Object} options - Refresh options
   */
  async function refreshFeeds(options = {}) {
    const currentDepartments = Array.from(activeDepartments.value)
    if (currentDepartments.length === 0) return

    console.log('📰 Refreshing feeds with optimistic updates...')
    
    // Force clear all caches if skipCache is true
    if (options.skipCache) {
      await clearAllCaches()
    }
    
    // Step 1: Show existing cached data immediately if available
    if (!options.skipCache) {
      try {
        await fetchFeeds(currentDepartments, { ...options, skipCache: false })
        console.log('📰 Displaying cached data while refreshing in background')
      } catch (error) {
        console.warn('📰 Failed to load cached data:', error)
      }
    }

    // Step 2: Refresh in background after short delay
    setTimeout(async () => {
      try {
        await fetchFeeds(currentDepartments, { ...options, skipCache: true })
        console.log('📰 Background refresh completed')
      } catch (error) {
        console.warn('📰 Background refresh failed:', error)
      }
    }, 500)
  }

  /**
   * Intelligent prefetching based on user behavior
   * @returns {Promise<void>}
   */
  async function prefetchLikelyContent() {
    try {
      const recentDepts = await cacheManager.get(RECENT_DEPARTMENTS_KEY, 'preferences')
      const recentDepartments = recentDepts?.data || []
      
      if (recentDepartments.length === 0) return

      console.log('📰 Prefetching content for recently viewed departments:', recentDepartments.slice(0, 3).join(', '))
      
      // Prefetch top 3 recent departments in background
      recentDepartments.slice(0, 3).forEach((deptId, index) => {
        setTimeout(async () => {
          try {
            await fetchRssItems([deptId], { limit: 20 })
            console.log(`📰 Prefetched content for: ${deptId}`)
          } catch (error) {
            console.warn(`📰 Prefetch failed for ${deptId}:`, error.message)
          }
        }, Math.random() * 2000 + (index * 500)) // Stagger requests
      })
    } catch (error) {
      console.warn('📰 Prefetch operation failed:', error)
    }
  }

  /**
   * Get RSS cache statistics
   * @returns {Object} Cache statistics
   */
  function getRssCacheStats() {
    return {
      cacheManager: cacheManager.getStats(),
      rehydrationManager: rehydrationManager.getStats(),
      feedsLoaded: feeds.value.size,
      activeDepartments: activeDepartments.value.size,
      totalItems: totalItems.value,
      lastUpdate: lastUpdate.value
    }
  }

  /**
   * Clear cache using the new cache manager
   * @param {string} category - Optional specific category to clear
   */
  function clearCache(category = null) {
    if (category) {
      cacheManager.clear(category)
    } else {
      cacheManager.clear()
    }
    console.log('📰 RSS cache cleared')
  }

  /**
   * Force clear all caches including browser caches
   * @returns {Promise<void>}
   */
  async function clearAllCaches() {
    try {
      // Clear internal cache manager
      cacheManager.clear()
      
      // Clear localStorage and sessionStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('rss-feeds-cache')
        localStorage.removeItem('departments-cache')
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear()
      }
      
      // Clear the feeds state completely
      feeds.value.clear()
      errors.value.clear()
      
      console.log('🗑️ All RSS caches force cleared')
    } catch (error) {
      console.warn('⚠️ Failed to clear some caches:', error)
    }
  }


  /**
   * Setup auto-refresh if enabled
   */
  function setupAutoRefresh() {
    if (config.autoRefresh && !refreshTimer) {
      refreshTimer = setInterval(() => {
        if (!loading.value) {
          refreshFeeds({ skipCache: true })
        }
      }, config.refreshInterval)
    }
  }

  /**
   * Stop auto-refresh
   */
  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  // Computed properties
  const allItems = computed(() => {
    const items = []
    for (const feed of feeds.value.values()) {
      // Only include items from currently active departments
      if (feed.items && activeDepartments.value.has(feed.departmentId)) {
        items.push(...feed.items.map(item => ({
          ...item,
          departmentId: feed.departmentId,
          department: feed.department
        })))
      }
    }
    return sortItemsByDate(items)
  })

  const recentItems = computed(() => {
    return filterItemsByDate(allItems.value, 7) // Last 7 days
  })

  const hasErrors = computed(() => {
    return errors.value.size > 0
  })

  const isLoading = computed(() => {
    return loading.value
  })

  const feedCount = computed(() => {
    return feeds.value.size
  })

  const totalItems = computed(() => {
    return allItems.value.length
  })

  // Watchers
  watch(() => config.autoRefresh, (newVal) => {
    if (newVal) {
      setupAutoRefresh()
    } else {
      stopAutoRefresh()
    }
  })

  // Lifecycle
  onMounted(async () => {
    if (config.autoRefresh) {
      setupAutoRefresh()
    }
    
    // Start intelligent prefetching after short delay
    setTimeout(() => {
      prefetchLikelyContent()
    }, 2000)
  })

  onUnmounted(() => {
    stopAutoRefresh()
    // Clean up debounce timer
    if (fetchDebounceTimer) {
      clearTimeout(fetchDebounceTimer)
      fetchDebounceTimer = null
    }
  })

  return {
    // State
    feeds: readonly(feeds),
    loading: readonly(loading),
    errors: readonly(errors),
    lastUpdate: readonly(lastUpdate),
    config,

    // Computed
    allItems,
    recentItems,
    hasErrors,
    isLoading,
    feedCount,
    totalItems,

    // Methods
    fetchFeeds,
    refreshFeeds,
    clearCache,
    clearAllCaches,
    setupAutoRefresh,
    stopAutoRefresh,
    setActiveDepartments,
    addActiveDepartment,
    removeActiveDepartment,
    getSelectedDepartments,
    saveSelectedDepartments,
    loadSelectedDepartments,
    generateRSSUrl,
    generateProxyUrl,
    fetchRssItems,
    refreshRssFeeds,
    
    // Enhanced cache-first methods
    prefetchLikelyContent,
    getRssCacheStats,
    trackRecentDepartments
  }
}

/**
 * Simplified composable for single department
 * @param {string} departmentId - Department identifier
 * @param {Object} options - Configuration options
 * @returns {Object} Department-specific RSS state and methods
 */
export function useDepartmentFeed(departmentId, options = {}) {
  const { 
    feeds, 
    loading, 
    errors, 
    fetchFeeds, 
    refreshFeeds,
    ...rest 
  } = useRssFeed(options)

  const feed = computed(() => feeds.value.get(departmentId) || null)
  const items = computed(() => feed.value?.items || [])
  const error = computed(() => errors.value.get(departmentId) || null)
  const hasError = computed(() => !!error.value)

  const fetchFeed = (options) => fetchFeeds([departmentId], options)
  const refreshFeed = (options) => refreshFeeds(options)

  return {
    feed,
    items,
    error,
    hasError,
    loading,
    fetchFeed,
    refreshFeed,
    ...rest
  }
}