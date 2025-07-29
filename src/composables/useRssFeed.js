/**
 * RSS Feed Management Composable
 * Vue 3 Composition API for handling RSS feed data and state
 */

import { ref, reactive, computed, watch, onMounted, onUnmounted, readonly, nextTick } from 'vue'
import { parseRSSFeed, validateRSSFeed, sortItemsByDate, filterItemsByDate } from '../utils/rssParser.js'
import { RSS_CONFIG } from '../config/departments.js'
import { useDepartments } from './useDepartments.js'

/**
 * Main RSS feed composable
 * @param {Object} options - Configuration options
 * @returns {Object} Reactive RSS feed state and methods
 */
export function useRssFeed(options = {}) {
  // Use departments composable for efficient department data management
  const { getDepartment: getDepartmentFromComposable, fetchDepartments } = useDepartments()
  
  // Reactive state
  const feeds = ref(new Map()) // Map<departmentId, feedData>
  const loading = ref(false)
  const errors = ref(new Map()) // Map<departmentId, error>
  const lastUpdate = ref(null)
  const cache = ref(new Map()) // Map<url, {data, timestamp}>
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
   * Fetch RSS feed for a specific department
   * @param {string} departmentId - Department identifier
   * @param {Object} fetchOptions - Fetch options
   * @returns {Promise<Object>} Parsed feed data
   */
  async function fetchDepartmentFeed(departmentId, fetchOptions = {}) {
    // Generate RSS URL using the dedicated function
    const rssUrl = await generateRSSUrl(departmentId)
    const proxyUrl = generateProxyUrl(rssUrl, config.environment)
    
    // Check cache first
    if (!fetchOptions.skipCache) {
      const cached = getCachedData(proxyUrl)
      if (cached) {
        return cached
      }
    }

    let lastError
    for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
      try {
        console.log(`Fetching RSS feed for ${department.name} (attempt ${attempt})`)
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), config.timeout)
        
        const response = await fetch(proxyUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/rss+xml, application/xml, text/xml',
            'User-Agent': 'KNUE-RSS-Aggregator/1.0'
          }
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const xmlText = await response.text()
        const parsedData = parseRSSFeed(xmlText)
        
        if (!validateRSSFeed(parsedData)) {
          throw new Error('Invalid RSS feed structure')
        }
        
        // Add department metadata (already in correct format from useDepartments)
        const departmentForFeed = {
          id: department.id,
          name: department.name,
          description: department.description || '',
          icon: department.icon || '📋',
          color: department.color || '#6B7280',
          bbsNo: department.bbsNo,
          priority: department.priority || 999
        }
        
        const feedData = {
          ...parsedData,
          departmentId,
          department: departmentForFeed,
          fetchedAt: new Date(),
          url: rssUrl
        }
        
        // Cache the result
        setCachedData(proxyUrl, feedData)
        
        return feedData
        
      } catch (error) {
        lastError = error
        console.warn(`Attempt ${attempt} failed for ${department.name}:`, error.message)
        
        if (attempt < config.retryAttempts) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }
    
    throw lastError
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
   * Set active departments (departments that should be included in allItems)
   * @param {Array} departmentIds - Array of department identifiers
   */
  function setActiveDepartments(departmentIds) {
    activeDepartments.value.clear()
    departmentIds.forEach(id => activeDepartments.value.add(id))
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
    // Filter out departments that are already being fetched or initialized (prevent duplicates)
    const filteredDepartmentIds = departmentIds.filter(id => {
      const isBeingFetched = pendingFetches.value.has(id)
      const isAlreadyInitialized = initializedDepartments.value.has(id) && feeds.value.has(id)
      return !isBeingFetched && !(isAlreadyInitialized && !options.skipCache)
    })
    
    if (filteredDepartmentIds.length === 0) {
      console.log('All requested departments are already being fetched or initialized, skipping duplicate requests')
      return
    }

    // Mark departments as being fetched
    filteredDepartmentIds.forEach(id => pendingFetches.value.add(id))

    loading.value = true
    const startTime = Date.now()

    try {
      // Ensure departments are loaded efficiently
      await ensureDepartmentsLoaded(filteredDepartmentIds)

      // Clear previous errors for these departments
      filteredDepartmentIds.forEach(id => errors.value.delete(id))

      // Fetch feeds concurrently
      const fetchPromises = filteredDepartmentIds.map(async (departmentId) => {
        try {
          const feedData = await fetchDepartmentFeed(departmentId, options)
          feeds.value.set(departmentId, feedData)
          initializedDepartments.value.add(departmentId) // Mark as successfully initialized
          return { departmentId, success: true, data: feedData }
        } catch (error) {
          errors.value.set(departmentId, {
            message: error.message,
            timestamp: new Date(),
            departmentId
          })
          return { departmentId, success: false, error }
        } finally {
          // Remove from pending fetches when done
          pendingFetches.value.delete(departmentId)
        }
      })

      const results = await Promise.allSettled(fetchPromises)
      
      // Log results
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
      const failed = results.filter(r => r.status === 'rejected' || !r.value?.success).length
      
      console.log(`RSS fetch completed: ${successful} successful, ${failed} failed (${Date.now() - startTime}ms)`)
      
      lastUpdate.value = new Date()
      
    } finally {
      // Clean up any remaining pending fetches
      filteredDepartmentIds.forEach(id => pendingFetches.value.delete(id))
      loading.value = false
    }
  }

  /**
   * Refresh all current feeds
   * @param {Object} options - Refresh options
   */
  async function refreshFeeds(options = {}) {
    const currentDepartments = Array.from(activeDepartments.value)
    if (currentDepartments.length > 0) {
      await fetchFeeds(currentDepartments, { ...options, skipCache: true })
    }
  }

  /**
   * Get cached data if still valid
   * @param {string} url - Cache key
   * @returns {Object|null} Cached data or null
   */
  function getCachedData(url) {
    const cached = cache.value.get(url)
    if (cached && Date.now() - cached.timestamp < config.cacheDuration) {
      // Reduce console spam by only logging occasionally
      if (Math.random() < 0.1) {
        console.log(`Using cached data for ${url}`)
      }
      return cached.data
    }
    return null
  }

  /**
   * Set data in cache
   * @param {string} url - Cache key
   * @param {Object} data - Data to cache
   */
  function setCachedData(url, data) {
    cache.value.set(url, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * Clear cache
   * @param {string} url - Optional specific URL to clear
   */
  function clearCache(url = null) {
    if (url) {
      cache.value.delete(url)
    } else {
      cache.value.clear()
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
  onMounted(() => {
    if (config.autoRefresh) {
      setupAutoRefresh()
    }
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
    fetchDepartmentFeed,
    refreshFeeds,
    clearCache,
    setupAutoRefresh,
    stopAutoRefresh,
    setActiveDepartments,
    addActiveDepartment,
    removeActiveDepartment,
    generateRSSUrl,
    generateProxyUrl
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