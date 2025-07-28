/**
 * RSS Feed Management Composable
 * Vue 3 Composition API for handling RSS feed data and state
 */

import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { parseRSSFeed, validateRSSFeed, sortItemsByDate, filterItemsByDate } from '../utils/rssParser.js'
import { getDepartment, generateRSSUrl, generateProxyUrl, RSS_CONFIG } from '../config/departments.js'

/**
 * Main RSS feed composable
 * @param {Object} options - Configuration options
 * @returns {Object} Reactive RSS feed state and methods
 */
export function useRssFeed(options = {}) {
  // Reactive state
  const feeds = ref(new Map()) // Map<departmentId, feedData>
  const loading = ref(false)
  const errors = ref(new Map()) // Map<departmentId, error>
  const lastUpdate = ref(null)
  const cache = ref(new Map()) // Map<url, {data, timestamp}>
  
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
   * Fetch RSS feed for a specific department
   * @param {string} departmentId - Department identifier
   * @param {Object} fetchOptions - Fetch options
   * @returns {Promise<Object>} Parsed feed data
   */
  async function fetchDepartmentFeed(departmentId, fetchOptions = {}) {
    const department = getDepartment(departmentId)
    if (!department) {
      throw new Error(`Unknown department: ${departmentId}`)
    }

    const rssUrl = generateRSSUrl(departmentId, fetchOptions)
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
        
        // Add department metadata
        const feedData = {
          ...parsedData,
          departmentId,
          department,
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
   * Fetch multiple department feeds
   * @param {Array} departmentIds - Array of department identifiers
   * @param {Object} options - Fetch options
   * @returns {Promise<void>}
   */
  async function fetchFeeds(departmentIds, options = {}) {
    if (!Array.isArray(departmentIds)) {
      departmentIds = [departmentIds]
    }

    loading.value = true
    const startTime = Date.now()

    try {
      // Clear previous errors for these departments
      departmentIds.forEach(id => errors.value.delete(id))

      // Fetch feeds concurrently
      const fetchPromises = departmentIds.map(async (departmentId) => {
        try {
          const feedData = await fetchDepartmentFeed(departmentId, options)
          feeds.value.set(departmentId, feedData)
          return { departmentId, success: true, data: feedData }
        } catch (error) {
          errors.value.set(departmentId, {
            message: error.message,
            timestamp: new Date(),
            departmentId
          })
          return { departmentId, success: false, error }
        }
      })

      const results = await Promise.allSettled(fetchPromises)
      
      // Log results
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
      const failed = results.filter(r => r.status === 'rejected' || !r.value?.success).length
      
      console.log(`RSS fetch completed: ${successful} successful, ${failed} failed (${Date.now() - startTime}ms)`)
      
      lastUpdate.value = new Date()
      
    } finally {
      loading.value = false
    }
  }

  /**
   * Refresh all current feeds
   * @param {Object} options - Refresh options
   */
  async function refreshFeeds(options = {}) {
    const currentDepartments = Array.from(feeds.value.keys())
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
      console.log(`Using cached data for ${url}`)
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
      if (feed.items) {
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
    stopAutoRefresh
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