/**
 * Sync Coordinator
 * Network-aware synchronization with priority ordering and intelligent data consistency
 */

import { cacheManager } from './cacheManager.js'

export class SyncCoordinator {
  constructor(apiService, rehydrationManager) {
    this.cache = cacheManager
    this.api = apiService
    this.rehydrationManager = rehydrationManager
    
    // Network state
    this.isOnline = navigator.onLine
    this.networkQuality = 'unknown' // fast, slow, offline
    this.lastSuccessfulSync = null
    
    // Sync queues by priority
    this.syncQueues = {
      critical: [],     // User preferences, active sessions
      high: [],         // Department configs, user data
      medium: [],       // RSS feeds for active departments
      low: []          // Background prefetching, non-critical data
    }
    
    // Sync state
    this.isSyncing = false
    this.syncInProgress = new Set()
    this.syncHistory = []
    this.failedSyncs = new Map()
    
    // Configuration
    this.config = {
      syncInterval: 5 * 60 * 1000,      // 5 minutes for periodic sync
      maxConcurrentSyncs: 3,            // Max parallel sync operations
      priorityWeights: {
        critical: 1000,
        high: 100,
        medium: 10,
        low: 1
      },
      networkTimeouts: {
        fast: 5000,     // 5s for fast networks
        slow: 15000,    // 15s for slow networks
        offline: 0      // No sync when offline
      },
      retryDelays: [1000, 3000, 10000], // Exponential backoff
      maxRetries: 3,
      headerCaching: true,              // Use If-Modified-Since headers
      syncBatchSize: 10                 // Max items per sync batch
    }
    
    this.setupNetworkListeners()
    this.setupPeriodicSync()
  }

  /**
   * Add item to sync queue with priority
   * @param {Object} syncItem - Sync item configuration
   * @param {string} priority - critical, high, medium, low
   */
  queueSync(syncItem, priority = 'medium') {
    const {
      key,
      category,
      fetchFn,
      lastModified = null,
      dependencies = [],
      metadata = {}
    } = syncItem

    // Don't queue if already in progress
    if (this.syncInProgress.has(key)) {
      console.log(`⏭️ Sync already in progress for: ${key}`)
      return
    }

    // Check if item is already queued
    const allQueues = Object.values(this.syncQueues).flat()
    const existingItem = allQueues.find(item => item.key === key)
    
    if (existingItem) {
      // Update priority if higher
      const currentPriority = this.findItemPriority(existingItem)
      if (this.config.priorityWeights[priority] > this.config.priorityWeights[currentPriority]) {
        this.removeFromQueue(key)
      } else {
        console.log(`⏭️ Sync already queued for: ${key}`)
        return
      }
    }

    const syncTask = {
      key,
      category,
      fetchFn,
      lastModified,
      dependencies,
      metadata,
      queuedAt: Date.now(),
      priority,
      retryCount: 0
    }

    this.syncQueues[priority].push(syncTask)
    console.log(`📋 Queued sync: ${key} (${priority} priority)`)

    // Trigger sync if not already running
    if (!this.isSyncing && this.isOnline) {
      setTimeout(() => this.processSyncQueue(), 100)
    }
  }

  /**
   * Process sync queue with priority ordering and network awareness
   */
  async processSyncQueue() {
    if (this.isSyncing || !this.isOnline) {
      return
    }

    this.isSyncing = true
    console.log(`🔄 Starting sync process (network: ${this.networkQuality})`)

    try {
      // Get all pending sync tasks sorted by priority
      const allTasks = this.getAllTasksSortedByPriority()
      
      if (allTasks.length === 0) {
        console.log(`✅ No sync tasks pending`)
        return
      }

      console.log(`📊 Processing ${allTasks.length} sync tasks`)

      // Process tasks with concurrency limit
      const activeSyncs = []
      const completedTasks = []
      
      while (allTasks.length > 0 || activeSyncs.length > 0) {
        // Start new syncs up to concurrency limit
        while (
          activeSyncs.length < this.config.maxConcurrentSyncs &&
          allTasks.length > 0
        ) {
          const task = allTasks.shift()
          
          // Check dependencies
          if (!this.areDependenciesSatisfied(task, completedTasks)) {
            // Put back at end of queue
            allTasks.push(task)
            continue
          }

          const syncPromise = this.executeSyncTask(task)
          activeSyncs.push({ task, promise: syncPromise })
        }

        // Wait for at least one sync to complete
        if (activeSyncs.length > 0) {
          try {
            await Promise.race(activeSyncs.map(sync => sync.promise))
          } catch (error) {
            console.warn('Sync task failed:', error)
          }

          // Remove completed syncs
          const stillActive = []
          for (const sync of activeSyncs) {
            try {
              const result = await Promise.race([
                sync.promise,
                Promise.resolve('pending')
              ])
              
              if (result !== 'pending') {
                completedTasks.push(sync.task)
                this.removeFromQueue(sync.task.key)
                console.log(`✅ Completed sync: ${sync.task.key}`)
              } else {
                stillActive.push(sync)
              }
            } catch (error) {
              // Task failed, handle retry
              await this.handleSyncFailure(sync.task, error)
              completedTasks.push(sync.task) // Mark as processed
            }
          }
          
          activeSyncs.length = 0
          activeSyncs.push(...stillActive)
        }
      }

      this.lastSuccessfulSync = Date.now()
      console.log(`🎉 Sync process completed successfully`)

    } catch (error) {
      console.error('Sync process failed:', error)
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * Execute individual sync task with differential sync support
   * @param {Object} task - Sync task
   */
  async executeSyncTask(task) {
    const { key, category, fetchFn, lastModified } = task
    
    this.syncInProgress.add(key)
    console.log(`🔄 Syncing: ${key}`)

    try {
      // Check if we have cached version with lastModified
      let cachedData = null
      let ifModifiedSince = null
      
      if (this.config.headerCaching) {
        cachedData = await this.cache.get(key, category, true) // Ignore TTL for sync
        if (cachedData && cachedData.data._metadata?.lastModified) {
          ifModifiedSince = cachedData.data._metadata.lastModified
        } else if (lastModified) {
          ifModifiedSince = lastModified
        }
      }

      // Create enhanced fetch function with If-Modified-Since header
      const enhancedFetchFn = async () => {
        // For RSS and dynamic content, add If-Modified-Since header
        if (ifModifiedSince && typeof fetchFn === 'function') {
          // Wrap the original fetch function to add headers
          const originalFetch = fetchFn
          return originalFetch({
            headers: {
              'If-Modified-Since': new Date(ifModifiedSince).toUTCString()
            }
          })
        }
        return fetchFn()
      }

      // Use rehydration manager for actual sync
      const timeout = this.config.networkTimeouts[this.networkQuality] || this.config.networkTimeouts.fast
      const result = await this.rehydrationManager.getData(
        key,
        enhancedFetchFn,
        {
          category,
          forceRefresh: true,
          timeout,
          allowStale: false
        }
      )

      // Record successful sync
      this.recordSyncSuccess(task, result)
      
      return result

    } catch (error) {
      console.warn(`❌ Sync failed for ${key}:`, error.message)
      throw error
    } finally {
      this.syncInProgress.delete(key)
    }
  }

  /**
   * Handle sync failure with retry logic
   * @param {Object} task - Failed sync task
   * @param {Error} error - Error that occurred
   */
  async handleSyncFailure(task, error) {
    const { key, retryCount = 0, priority } = task
    
    // Record failure
    this.recordSyncFailure(task, error)

    // Check if we should retry
    if (retryCount < this.config.maxRetries) {
      const delay = this.config.retryDelays[retryCount] || this.config.retryDelays[this.config.retryDelays.length - 1]
      
      console.log(`🔄 Retrying sync for ${key} in ${delay}ms (attempt ${retryCount + 1}/${this.config.maxRetries})`)
      
      // Schedule retry
      setTimeout(() => {
        const retryTask = {
          ...task,
          retryCount: retryCount + 1,
          lastError: error.message
        }
        
        this.queueSync(retryTask, priority)
      }, delay)
    } else {
      console.error(`❌ Sync permanently failed for ${key} after ${this.config.maxRetries} retries`)
      this.failedSyncs.set(key, {
        task,
        error: error.message,
        failedAt: Date.now(),
        retryCount
      })
    }
  }

  /**
   * Smart RSS sync for active departments only
   * @param {Array} activeDepartmentIds - IDs of active departments
   */
  async syncActiveDepartments(activeDepartmentIds = []) {
    if (!Array.isArray(activeDepartmentIds) || activeDepartmentIds.length === 0) {
      console.log('📊 No active departments to sync')
      return
    }

    console.log(`📊 Syncing ${activeDepartmentIds.length} active departments`)

    // Queue department configs first (high priority)
    for (const deptId of activeDepartmentIds) {
      this.queueSync({
        key: `department:${deptId}`,
        category: 'departments',
        fetchFn: () => this.api.getDepartment(deptId),
        metadata: { departmentId: deptId }
      }, 'high')
    }

    // Queue RSS feeds (medium priority)
    this.queueSync({
      key: `rss:active-departments:${activeDepartmentIds.join(',')}`,
      category: 'rssItems',
      fetchFn: () => this.api.getRssItems({ departments: activeDepartmentIds }),
      dependencies: activeDepartmentIds.map(id => `department:${id}`),
      metadata: { departments: activeDepartmentIds }
    }, 'medium')
  }

  /**
   * Sync user preferences (critical priority)
   * @param {string} userId - User ID
   */
  async syncUserPreferences(userId) {
    this.queueSync({
      key: `preferences:${userId}`,
      category: 'preferences',
      fetchFn: () => this.api.getUserPreferences(),
      metadata: { userId }
    }, 'critical')
  }

  /**
   * Network quality detection and adaptation
   */
  detectNetworkQuality() {
    if (!navigator.onLine) {
      this.networkQuality = 'offline'
      return
    }

    // Use connection API if available
    if ('connection' in navigator) {
      const connection = navigator.connection
      const effectiveType = connection.effectiveType || 'unknown'
      
      if (effectiveType === '4g' || effectiveType === '3g') {
        this.networkQuality = 'fast'
      } else if (effectiveType === '2g' || effectiveType === 'slow-2g') {
        this.networkQuality = 'slow'
      } else {
        this.networkQuality = 'unknown'
      }
    } else {
      // Fallback: simple ping test
      this.performNetworkSpeedTest()
    }

    console.log(`📶 Network quality detected: ${this.networkQuality}`)
  }

  /**
   * Simple network speed test
   */
  async performNetworkSpeedTest() {
    try {
      const startTime = Date.now()
      await this.api.healthCheck()
      const duration = Date.now() - startTime
      
      if (duration < 1000) {
        this.networkQuality = 'fast'
      } else if (duration < 3000) {
        this.networkQuality = 'slow'
      } else {
        this.networkQuality = 'slow'
      }
    } catch {
      this.networkQuality = 'slow'
    }
  }

  /**
   * Setup network event listeners
   */
  setupNetworkListeners() {
    // Online/offline detection
    window.addEventListener('online', () => {
      console.log('📶 Network online')
      this.isOnline = true
      this.detectNetworkQuality()
      
      // Resume sync after coming online
      setTimeout(() => this.processSyncQueue(), 1000)
    })

    window.addEventListener('offline', () => {
      console.log('📶 Network offline')
      this.isOnline = false
      this.networkQuality = 'offline'
    })

    // Connection change detection
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        this.detectNetworkQuality()
      })
    }

    // Initial network quality detection
    this.detectNetworkQuality()
  }

  /**
   * Setup periodic sync
   */
  setupPeriodicSync() {
    setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        console.log('⏰ Periodic sync triggered')
        this.processSyncQueue()
      }
    }, this.config.syncInterval)
  }

  /**
   * Get all tasks sorted by priority
   * @returns {Array} Sorted tasks
   */
  getAllTasksSortedByPriority() {
    const allTasks = []
    
    // Add tasks from all priority queues
    for (const [priority, tasks] of Object.entries(this.syncQueues)) {
      for (const task of tasks) {
        allTasks.push({
          ...task,
          priorityWeight: this.config.priorityWeights[priority] || 1
        })
      }
    }

    // Sort by priority weight (higher = more urgent) then by queue time
    return allTasks.sort((a, b) => {
      if (a.priorityWeight !== b.priorityWeight) {
        return b.priorityWeight - a.priorityWeight
      }
      return a.queuedAt - b.queuedAt
    })
  }

  /**
   * Check if task dependencies are satisfied
   * @param {Object} task - Task to check
   * @param {Array} completedTasks - List of completed tasks
   * @returns {boolean} Whether dependencies are satisfied
   */
  areDependenciesSatisfied(task, completedTasks) {
    if (!task.dependencies || task.dependencies.length === 0) {
      return true
    }

    const completedKeys = new Set(completedTasks.map(t => t.key))
    return task.dependencies.every(dep => completedKeys.has(dep))
  }

  /**
   * Find which queue contains an item
   * @param {Object} item - Item to find
   * @returns {string} Priority level
   */
  findItemPriority(item) {
    for (const [priority, tasks] of Object.entries(this.syncQueues)) {
      if (tasks.includes(item)) {
        return priority
      }
    }
    return 'low'
  }

  /**
   * Remove item from all queues
   * @param {string} key - Key to remove
   */
  removeFromQueue(key) {
    for (const tasks of Object.values(this.syncQueues)) {
      const index = tasks.findIndex(task => task.key === key)
      if (index !== -1) {
        tasks.splice(index, 1)
        break
      }
    }
  }

  /**
   * Record successful sync
   * @param {Object} task - Completed task
   * @param {*} result - Sync result
   */
  recordSyncSuccess(task, result) {
    this.syncHistory.push({
      key: task.key,
      category: task.category,
      priority: task.priority,
      startedAt: task.queuedAt,
      completedAt: Date.now(),
      duration: Date.now() - task.queuedAt,
      success: true,
      fromCache: result._metadata?.cached || false,
      retryCount: task.retryCount || 0
    })

    // Keep only last 100 sync records
    if (this.syncHistory.length > 100) {
      this.syncHistory.shift()
    }

    // Remove from failed syncs if it was there
    this.failedSyncs.delete(task.key)
  }

  /**
   * Record sync failure
   * @param {Object} task - Failed task
   * @param {Error} error - Error that occurred
   */
  recordSyncFailure(task, error) {
    this.syncHistory.push({
      key: task.key,
      category: task.category,
      priority: task.priority,
      startedAt: task.queuedAt,
      completedAt: Date.now(),
      duration: Date.now() - task.queuedAt,
      success: false,
      error: error.message,
      retryCount: task.retryCount || 0
    })

    // Keep only last 100 sync records
    if (this.syncHistory.length > 100) {
      this.syncHistory.shift()
    }
  }

  /**
   * Get sync coordinator statistics
   * @returns {Object} Sync statistics
   */
  getStats() {
    const queueStats = {}
    let totalQueued = 0
    
    for (const [priority, tasks] of Object.entries(this.syncQueues)) {
      queueStats[priority] = tasks.length
      totalQueued += tasks.length
    }

    const recentHistory = this.syncHistory.slice(-20)
    const successRate = recentHistory.length > 0 
      ? recentHistory.filter(h => h.success).length / recentHistory.length 
      : 1

    return {
      networkState: {
        isOnline: this.isOnline,
        quality: this.networkQuality
      },
      syncState: {
        isSyncing: this.isSyncing,
        lastSuccessfulSync: this.lastSuccessfulSync,
        totalQueued,
        syncInProgress: this.syncInProgress.size
      },
      queues: queueStats,
      performance: {
        successRate: Math.round(successRate * 100),
        failedSyncs: this.failedSyncs.size,
        avgSyncTime: recentHistory.length > 0 
          ? Math.round(recentHistory.reduce((sum, h) => sum + h.duration, 0) / recentHistory.length)
          : 0
      },
      history: {
        totalSyncs: this.syncHistory.length,
        recentSyncs: recentHistory.length
      }
    }
  }

  /**
   * Manual sync trigger for specific category
   * @param {string} category - Category to sync
   * @param {string} priority - Priority level
   */
  async triggerCategorySync(category, priority = 'medium') {
    console.log(`🎯 Triggering manual sync for category: ${category}`)
    
    // For demonstration, add a general category sync
    this.queueSync({
      key: `manual-sync:${category}:${Date.now()}`,
      category,
      fetchFn: async () => {
        // This would be category-specific logic
        switch (category) {
          case 'departments':
            return this.api.getDepartments()
          case 'rssItems':
            return this.api.getRssItems()
          default:
            throw new Error(`Unknown category: ${category}`)
        }
      },
      metadata: { manualTrigger: true, category }
    }, priority)
  }

  /**
   * Clear all sync queues and reset state
   */
  reset() {
    // Clear queues
    for (const queue of Object.values(this.syncQueues)) {
      queue.length = 0
    }
    
    // Clear state
    this.syncInProgress.clear()
    this.failedSyncs.clear()
    this.isSyncing = false
    
    console.log('🔄 SyncCoordinator reset completed')
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.reset()
    this.syncHistory.length = 0
    console.log('🧹 SyncCoordinator cleaned up')
  }
}

/**
 * Vue composable for sync coordination
 * @param {Object} apiService - API service instance
 * @param {Object} rehydrationManager - Rehydration manager instance
 * @returns {Object} Sync coordination methods
 */
export function useSyncCoordinator(apiService, rehydrationManager) {
  const syncCoordinator = new SyncCoordinator(apiService, rehydrationManager)

  return {
    syncCoordinator,
    
    /**
     * Queue sync with priority
     */
    queueSync(syncItem, priority = 'medium') {
      return syncCoordinator.queueSync(syncItem, priority)
    },

    /**
     * Sync active departments
     */
    async syncActiveDepartments(departmentIds) {
      return syncCoordinator.syncActiveDepartments(departmentIds)
    },

    /**
     * Sync user preferences
     */
    async syncUserPreferences(userId) {
      return syncCoordinator.syncUserPreferences(userId)
    },

    /**
     * Manual category sync
     */
    async triggerCategorySync(category, priority = 'medium') {
      return syncCoordinator.triggerCategorySync(category, priority)
    },

    /**
     * Get sync statistics
     */
    getSyncStats() {
      return syncCoordinator.getStats()
    },

    /**
     * Check network state
     */
    getNetworkState() {
      return {
        isOnline: syncCoordinator.isOnline,
        quality: syncCoordinator.networkQuality
      }
    },

    /**
     * Manual cleanup
     */
    cleanup() {
      syncCoordinator.cleanup()
    }
  }
}