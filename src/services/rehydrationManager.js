/**
 * Rehydration Manager
 * Implements cache-first pattern with background rehydration from authoritative source (D1)
 */

import { cacheManager } from './cacheManager.js'

export class RehydrationManager {
  constructor(apiService) {
    this.cache = cacheManager
    this.api = apiService
    this.rehydrationQueue = new Set()
    this.pendingRequests = new Map() // Prevent duplicate requests
    this.backgroundTaskQueue = []
    this.isProcessingQueue = false
    
    // Configuration
    this.config = {
      staleThreshold: 0.7, // Trigger background rehydration when cache is 70% of max age
      maxConcurrentRehydrations: 3,
      rehydrationDelay: 100, // ms delay before background rehydration
      maxRetries: 3,
      retryDelay: 1000 // ms delay between retries
    }

    this.setupBackgroundProcessor()
  }

  /**
   * Cache-first data retrieval with background rehydration
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Function to fetch fresh data
   * @param {Object} options - Configuration options
   * @returns {Promise<*>} Data with cache metadata
   */
  async getData(key, fetchFn, options = {}) {
    const {
      category = 'default',
      forceRefresh = false,
      allowStale = true,
      timeout = 10000
    } = options

    // Step 1: Check for pending request to avoid duplicates
    if (this.pendingRequests.has(key) && !forceRefresh) {
      console.log(`⏳ Waiting for pending request: ${key}`)
      try {
        return await this.pendingRequests.get(key)
      } catch (error) {
        console.warn(`❌ Pending request failed for ${key}:`, error)
        this.pendingRequests.delete(key)
      }
    }

    // Step 2: Try cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = await this.cache.get(key, category)
      if (cached) {
        const { data, age, accessCount } = cached
        const maxAge = this.cache.maxAge[category] || this.cache.maxAge.default
        const staleThreshold = maxAge * this.config.staleThreshold

        console.log(`💾 Cache hit for "${key}" (age: ${Math.round(age/1000)}s, accesses: ${accessCount})`)

        // Schedule background rehydration for stale data
        if (age > staleThreshold) {
          this.scheduleBackgroundRehydration(key, fetchFn, category)
        }

        return {
          ...data,
          _metadata: {
            cached: true,
            age,
            accessCount,
            stale: age > staleThreshold
          }
        }
      }
    }

    // Step 3: Fetch from authoritative source
    console.log(`🌐 Cache miss for "${key}", fetching from server...`)
    
    const fetchPromise = this.fetchWithTimeout(fetchFn, timeout, key)
    this.pendingRequests.set(key, fetchPromise)

    try {
      const freshData = await fetchPromise
      
      // Cache the fresh data
      await this.cache.set(key, freshData, category)
      
      console.log(`✅ Fresh data cached for "${key}"`)
      
      return {
        ...freshData,
        _metadata: {
          cached: false,
          fresh: true,
          fetchedAt: Date.now()
        }
      }
    } catch (error) {
      console.warn(`❌ Fresh fetch failed for "${key}":`, error)
      
      // Step 4: Fallback to stale cache on network error
      if (allowStale) {
        const staleCache = await this.cache.get(key, category, true) // ignore TTL
        if (staleCache) {
          console.warn(`🚨 Using stale cache for "${key}" due to network error`)
          return {
            ...staleCache.data,
            _metadata: {
              cached: true,
              stale: true,
              error: error.message,
              fallback: true
            }
          }
        }
      }
      
      throw error
    } finally {
      this.pendingRequests.delete(key)
    }
  }

  /**
   * Fetch with timeout and retry logic
   * @param {Function} fetchFn - Fetch function
   * @param {number} timeout - Timeout in ms
   * @param {string} key - Key for logging
   * @returns {Promise<*>} Fetched data
   */
  async fetchWithTimeout(fetchFn, timeout, key) {
    let lastError
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
        })

        // Race between fetch and timeout
        const result = await Promise.race([fetchFn(), timeoutPromise])
        
        if (attempt > 1) {
          console.log(`✅ Fetch succeeded for "${key}" on attempt ${attempt}`)
        }
        
        return result
      } catch (error) {
        lastError = error
        console.warn(`❌ Fetch attempt ${attempt}/${this.config.maxRetries} failed for "${key}":`, error.message)
        
        if (attempt < this.config.maxRetries) {
          // Exponential backoff
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw lastError
  }

  /**
   * Schedule background rehydration (non-blocking)
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Fetch function
   * @param {string} category - Cache category
   */
  scheduleBackgroundRehydration(key, fetchFn, category) {
    if (this.rehydrationQueue.has(key)) {
      console.log(`⏭️ Background rehydration already queued for "${key}"`)
      return
    }

    console.log(`📅 Scheduling background rehydration for "${key}"`)
    this.rehydrationQueue.add(key)
    
    // Add to background task queue
    this.backgroundTaskQueue.push({
      key,
      fetchFn,
      category,
      scheduledAt: Date.now(),
      priority: this.getRehydrationPriority(key, category)
    })

    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      setTimeout(() => this.processBackgroundQueue(), this.config.rehydrationDelay)
    }
  }

  /**
   * Process background rehydration queue
   */
  async processBackgroundQueue() {
    if (this.isProcessingQueue || this.backgroundTaskQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true
    console.log(`🔄 Processing background rehydration queue (${this.backgroundTaskQueue.length} tasks)`)

    // Sort by priority (higher = more urgent)
    this.backgroundTaskQueue.sort((a, b) => b.priority - a.priority)

    // Process tasks with concurrency limit
    const activeTasks = []
    
    while (this.backgroundTaskQueue.length > 0 || activeTasks.length > 0) {
      // Start new tasks up to concurrency limit
      while (
        activeTasks.length < this.config.maxConcurrentRehydrations &&
        this.backgroundTaskQueue.length > 0
      ) {
        const task = this.backgroundTaskQueue.shift()
        const taskPromise = this.executeBackgroundRehydration(task)
        activeTasks.push(taskPromise)
      }

      // Wait for at least one task to complete
      if (activeTasks.length > 0) {
        try {
          await Promise.race(activeTasks)
        } catch (error) {
          console.warn('Background rehydration task failed:', error)
        }
        
        // Remove completed tasks
        const completedTasks = []
        for (let i = 0; i < activeTasks.length; i++) {
          const task = activeTasks[i]
          if (task.isSettled || await this.isPromiseSettled(task)) {
            completedTasks.push(i)
          }
        }
        
        // Remove completed tasks in reverse order to maintain indices
        completedTasks.reverse().forEach(index => {
          activeTasks.splice(index, 1)
        })
      }
    }

    this.isProcessingQueue = false
    console.log(`✅ Background rehydration queue processing completed`)
  }

  /**
   * Execute single background rehydration task
   * @param {Object} task - Rehydration task
   */
  async executeBackgroundRehydration(task) {
    const { key, fetchFn, category } = task
    
    try {
      console.log(`🔄 Background rehydration starting for "${key}"`)
      const freshData = await this.fetchWithTimeout(fetchFn, 15000, key) // Longer timeout for background
      await this.cache.set(key, freshData, category)
      console.log(`✅ Background rehydration completed for "${key}"`)
    } catch (error) {
      console.warn(`❌ Background rehydration failed for "${key}":`, error.message)
    } finally {
      this.rehydrationQueue.delete(key)
    }
  }

  /**
   * Get priority for background rehydration
   * @param {string} key - Cache key
   * @param {string} category - Cache category
   * @returns {number} Priority score (higher = more urgent)
   */
  getRehydrationPriority(key, category) {
    let priority = 5 // Base priority

    // Category-based priority
    const categoryPriority = {
      departments: 10,
      preferences: 8,
      rssItems: 6,
      default: 5
    }
    
    priority = categoryPriority[category] || categoryPriority.default

    // Key-based adjustments
    if (key.includes('main') || key.includes('academic')) priority += 2
    if (key.includes('user:')) priority += 1

    return priority
  }

  /**
   * Check if a promise is settled (resolved or rejected)
   * @param {Promise} promise - Promise to check
   * @returns {Promise<boolean>} Whether promise is settled
   */
  async isPromiseSettled(promise) {
    try {
      await Promise.race([
        promise,
        new Promise(resolve => setTimeout(() => resolve('timeout'), 0))
      ])
      return true
    } catch {
      return true
    }
  }

  /**
   * Setup background queue processor
   */
  setupBackgroundProcessor() {
    // Process queue periodically even if not triggered by new tasks
    setInterval(() => {
      if (this.backgroundTaskQueue.length > 0 && !this.isProcessingQueue) {
        this.processBackgroundQueue()
      }
    }, 30000) // Every 30 seconds
  }

  /**
   * Preemptively refresh cache for critical data
   * @param {Array} keys - Array of {key, fetchFn, category} objects
   * @returns {Promise<void>}
   */
  async preloadCriticalData(keys) {
    console.log(`🚀 Preloading ${keys.length} critical cache entries`)
    
    const preloadPromises = keys.map(async ({ key, fetchFn, category }) => {
      try {
        const cached = await this.cache.get(key, category)
        if (!cached) {
          // Only preload if not cached
          await this.getData(key, fetchFn, { category })
          console.log(`✅ Preloaded: ${key}`)
        }
      } catch (error) {
        console.warn(`❌ Preload failed for ${key}:`, error.message)
      }
    })

    await Promise.allSettled(preloadPromises)
    console.log(`🏁 Preloading completed`)
  }

  /**
   * Get rehydration manager statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      queuedRehydrations: this.rehydrationQueue.size,
      backgroundTasks: this.backgroundTaskQueue.length,
      pendingRequests: this.pendingRequests.size,
      isProcessingQueue: this.isProcessingQueue,
      config: this.config
    }
  }

  /**
   * Clear all pending operations (for cleanup)
   */
  cleanup() {
    this.rehydrationQueue.clear()
    this.backgroundTaskQueue.length = 0
    this.pendingRequests.clear()
    this.isProcessingQueue = false
    console.log('🧹 RehydrationManager cleaned up')
  }
}

/**
 * Vue composable for rehydration management
 * @param {Object} apiService - API service instance
 * @returns {Object} Rehydration management methods
 */
export function useRehydration(apiService) {
  const rehydrationManager = new RehydrationManager(apiService)

  return {
    rehydrationManager,
    
    /**
     * Get data with cache-first pattern
     */
    async getData(key, fetchFn, options = {}) {
      return rehydrationManager.getData(key, fetchFn, options)
    },

    /**
     * Preload critical data
     */
    async preloadCriticalData(keys) {
      return rehydrationManager.preloadCriticalData(keys)
    },

    /**
     * Get rehydration statistics
     */
    getRehydrationStats() {
      return rehydrationManager.getStats()
    },

    /**
     * Manual cleanup
     */
    cleanup() {
      rehydrationManager.cleanup()
    }
  }
}