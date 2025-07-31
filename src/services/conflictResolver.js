/**
 * Conflict Resolver
 * Data-type specific conflict resolution for concurrent updates in cache-first architecture
 */

export class ConflictResolver {
  constructor() {
    // Conflict resolution strategies by data type
    this.strategies = {
      departments: 'server_wins',      // Department configs: server is authoritative
      rssItems: 'merge_dedup',        // RSS items: merge and deduplicate by hash
      preferences: 'client_wins',      // User preferences: client takes precedence
      userState: 'timestamp_wins',     // User state: most recent timestamp wins
      default: 'timestamp_wins'        // Default: timestamp-based resolution
    }

    // Conflict history for debugging and metrics
    this.conflictHistory = []
    this.maxHistorySize = 100
  }

  /**
   * Resolve conflict between cached and fresh data
   * @param {string} key - Cache key
   * @param {string} category - Data category
   * @param {*} cachedData - Data from cache
   * @param {*} freshData - Fresh data from server
   * @param {Object} options - Resolution options
   * @returns {Object} Resolved data with conflict metadata
   */
  async resolveConflict(key, category, cachedData, freshData, options = {}) {
    const {
      strategy = null,
      clientTimestamp = Date.now(),
      serverTimestamp = null,
      forceStrategy = false
    } = options

    console.log(`🔀 Resolving conflict for "${key}" (${category})`)

    // Determine resolution strategy
    const resolverStrategy = strategy || this.getStrategy(key, category)
    
    try {
      let resolved
      let conflictType = 'none'

      // Pre-conflict validation
      if (!this.hasConflict(cachedData, freshData)) {
        console.log(`✅ No conflict detected for "${key}"`)
        return {
          data: freshData,
          conflictResolved: false,
          strategy: 'no_conflict',
          metadata: {
            hadConflict: false,
            resolvedAt: Date.now()
          }
        }
      }

      conflictType = this.detectConflictType(cachedData, freshData, category)
      console.log(`⚠️ Conflict detected: ${conflictType} for "${key}"`)

      // Apply resolution strategy
      switch (resolverStrategy) {
        case 'client_wins':
          resolved = await this.resolveClientWins(cachedData, freshData, options)
          break
        
        case 'server_wins':
          resolved = await this.resolveServerWins(cachedData, freshData, options)
          break
        
        case 'timestamp_wins':
          resolved = await this.resolveTimestampWins(cachedData, freshData, options)
          break
        
        case 'merge_dedup':
          resolved = await this.resolveMergeDedup(cachedData, freshData, options)
          break
        
        case 'field_level_merge':
          resolved = await this.resolveFieldLevelMerge(cachedData, freshData, options)
          break
        
        case 'user_prompt':
          resolved = await this.resolveUserPrompt(cachedData, freshData, options)
          break
        
        default:
          console.warn(`Unknown strategy: ${resolverStrategy}, falling back to timestamp_wins`)
          resolved = await this.resolveTimestampWins(cachedData, freshData, options)
      }

      // Record conflict resolution
      this.recordConflict({
        key,
        category,
        conflictType,
        strategy: resolverStrategy,
        resolvedAt: Date.now(),
        clientTimestamp,
        serverTimestamp,
        success: true
      })

      console.log(`✅ Conflict resolved for "${key}" using strategy: ${resolverStrategy}`)

      return {
        data: resolved.data,
        conflictResolved: true,
        strategy: resolverStrategy,
        conflictType,
        metadata: {
          hadConflict: true,
          resolvedAt: Date.now(),
          ...resolved.metadata
        }
      }

    } catch (error) {
      console.error(`❌ Conflict resolution failed for "${key}":`, error)
      
      // Record failed resolution
      this.recordConflict({
        key,
        category,
        conflictType,
        strategy: resolverStrategy,
        resolvedAt: Date.now(),
        success: false,
        error: error.message
      })

      // Fallback to server data on resolution failure
      return {
        data: freshData,
        conflictResolved: false,
        strategy: 'fallback_server',
        error: error.message,
        metadata: {
          hadConflict: true,
          resolutionFailed: true,
          resolvedAt: Date.now()
        }
      }
    }
  }

  /**
   * Detect if there's actually a conflict between cached and fresh data
   * @param {*} cachedData - Cached data
   * @param {*} freshData - Fresh data
   * @returns {boolean} Whether conflict exists
   */
  hasConflict(cachedData, freshData) {
    if (!cachedData || !freshData) return false
    
    // Deep comparison for objects
    if (typeof cachedData === 'object' && typeof freshData === 'object') {
      return JSON.stringify(cachedData) !== JSON.stringify(freshData)
    }
    
    // Simple comparison for primitives
    return cachedData !== freshData
  }

  /**
   * Detect the type of conflict
   * @param {*} cachedData - Cached data
   * @param {*} freshData - Fresh data
   * @param {string} category - Data category
   * @returns {string} Conflict type
   */
  detectConflictType(cachedData, freshData, category) {
    if (!cachedData) return 'missing_cache'
    if (!freshData) return 'missing_server'
    
    const cached = this.normalizeData(cachedData)
    const fresh = this.normalizeData(freshData)
    
    // Array conflicts (like RSS items)
    if (Array.isArray(cached) && Array.isArray(fresh)) {
      if (cached.length !== fresh.length) return 'length_mismatch'
      return 'content_difference'
    }
    
    // Object conflicts
    if (typeof cached === 'object' && typeof fresh === 'object') {
      const cachedKeys = Object.keys(cached)
      const freshKeys = Object.keys(fresh)
      
      if (cachedKeys.length !== freshKeys.length) return 'structure_difference'
      
      // Check for timestamp conflicts
      if (cached.timestamp && fresh.timestamp) {
        if (cached.timestamp !== fresh.timestamp) return 'timestamp_conflict'
      }
      
      return 'field_difference'
    }
    
    return 'value_difference'
  }

  /**
   * Client wins strategy - cached data takes precedence
   */
  async resolveClientWins(cachedData, freshData, options) {
    console.log('🔵 Applying client_wins strategy')
    
    return {
      data: cachedData,
      metadata: {
        strategy: 'client_wins',
        reason: 'Local changes preserved',
        originalServerData: freshData
      }
    }
  }

  /**
   * Server wins strategy - fresh data takes precedence
   */
  async resolveServerWins(cachedData, freshData, options) {
    console.log('🟢 Applying server_wins strategy')
    
    return {
      data: freshData,
      metadata: {
        strategy: 'server_wins',
        reason: 'Server data is authoritative',
        originalCachedData: cachedData
      }
    }
  }

  /**
   * Timestamp wins strategy - most recent data wins
   */
  async resolveTimestampWins(cachedData, freshData, options) {
    console.log('⏰ Applying timestamp_wins strategy')
    
    const cachedTimestamp = this.extractTimestamp(cachedData)
    const freshTimestamp = this.extractTimestamp(freshData)
    
    if (!cachedTimestamp && !freshTimestamp) {
      // No timestamps available, default to server
      return this.resolveServerWins(cachedData, freshData, options)
    }
    
    const winner = (freshTimestamp > cachedTimestamp) ? freshData : cachedData
    const winnerSource = (freshTimestamp > cachedTimestamp) ? 'server' : 'cache'
    
    return {
      data: winner,
      metadata: {
        strategy: 'timestamp_wins',
        winner: winnerSource,
        cachedTimestamp,
        freshTimestamp,
        reason: `${winnerSource} data is more recent`
      }
    }
  }

  /**
   * Merge and deduplicate strategy - combine arrays and remove duplicates
   */
  async resolveMergeDedup(cachedData, freshData, options) {
    console.log('🔀 Applying merge_dedup strategy')
    
    const cached = this.normalizeData(cachedData)
    const fresh = this.normalizeData(freshData)
    
    // Handle array merging
    if (Array.isArray(cached) && Array.isArray(fresh)) {
      const merged = this.mergeArrays(cached, fresh, options)
      
      return {
        data: merged,
        metadata: {
          strategy: 'merge_dedup',
          originalCachedCount: cached.length,
          originalFreshCount: fresh.length,
          mergedCount: merged.length,
          reason: 'Arrays merged and deduplicated'
        }
      }
    }
    
    // Handle object merging
    if (typeof cached === 'object' && typeof fresh === 'object') {
      const merged = { ...cached, ...fresh }
      
      return {
        data: merged,
        metadata: {
          strategy: 'merge_dedup',
          reason: 'Objects merged with server values taking precedence'
        }
      }
    }
    
    // Fallback to server wins for non-mergeable types
    return this.resolveServerWins(cachedData, freshData, options)
  }

  /**
   * Field-level merge strategy - merge objects field by field
   */
  async resolveFieldLevelMerge(cachedData, freshData, options) {
    console.log('🎯 Applying field_level_merge strategy')
    
    const cached = this.normalizeData(cachedData)
    const fresh = this.normalizeData(freshData)
    
    if (typeof cached !== 'object' || typeof fresh !== 'object') {
      return this.resolveTimestampWins(cachedData, freshData, options)
    }
    
    const merged = {}
    const allKeys = new Set([...Object.keys(cached), ...Object.keys(fresh)])
    const conflicts = []
    
    for (const key of allKeys) {
      const cachedValue = cached[key]
      const freshValue = fresh[key]
      
      if (cachedValue === freshValue) {
        merged[key] = freshValue
      } else if (cachedValue === undefined) {
        merged[key] = freshValue
      } else if (freshValue === undefined) {
        merged[key] = cachedValue
      } else {
        // Field-level conflict - apply resolution rules
        const fieldStrategy = this.getFieldStrategy(key, options)
        merged[key] = fieldStrategy === 'client_wins' ? cachedValue : freshValue
        conflicts.push({ key, cachedValue, freshValue, resolved: merged[key] })
      }
    }
    
    return {
      data: merged,
      metadata: {
        strategy: 'field_level_merge',
        fieldConflicts: conflicts,
        reason: 'Objects merged with field-level conflict resolution'
      }
    }
  }

  /**
   * User prompt strategy - ask user to resolve conflicts
   */
  async resolveUserPrompt(cachedData, freshData, options) {
    console.log('👤 Applying user_prompt strategy')
    
    // In a real implementation, this would show a UI prompt
    // For now, we'll fall back to timestamp resolution
    console.warn('User prompt not implemented, falling back to timestamp_wins')
    return this.resolveTimestampWins(cachedData, freshData, options)
  }

  /**
   * Merge two arrays with deduplication
   * @param {Array} cached - Cached array
   * @param {Array} fresh - Fresh array
   * @param {Object} options - Merge options
   * @returns {Array} Merged array
   */
  mergeArrays(cached, fresh, options = {}) {
    const { dedupeBy = 'id', keepOrder = 'fresh' } = options
    
    // Create a map for deduplication
    const itemMap = new Map()
    
    // Add cached items first
    for (const item of cached) {
      const key = typeof item === 'object' ? item[dedupeBy] || JSON.stringify(item) : item
      itemMap.set(key, { ...item, _source: 'cache' })
    }
    
    // Add fresh items (will overwrite cached items with same key)
    for (const item of fresh) {
      const key = typeof item === 'object' ? item[dedupeBy] || JSON.stringify(item) : item
      itemMap.set(key, { ...item, _source: 'server' })
    }
    
    // Convert back to array
    const merged = Array.from(itemMap.values())
    
    // Sort based on keepOrder preference
    if (keepOrder === 'timestamp' && merged[0]?.timestamp) {
      merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    }
    
    return merged
  }

  /**
   * Get resolution strategy for specific key/category
   * @param {string} key - Cache key
   * @param {string} category - Data category
   * @returns {string} Resolution strategy
   */
  getStrategy(key, category) {
    // Key-specific overrides
    if (key.includes('user:') || key.includes('preferences:')) {
      return 'client_wins'
    }
    
    if (key.includes('rss:') || key.includes('feed:')) {
      return 'merge_dedup'
    }
    
    // Category-based strategy
    return this.strategies[category] || this.strategies.default
  }

  /**
   * Get field-specific resolution strategy
   * @param {string} fieldName - Field name
   * @param {Object} options - Options
   * @returns {string} Field strategy
   */
  getFieldStrategy(fieldName, options = {}) {
    const clientWinsFields = ['preferences', 'settings', 'userState', 'lastViewed']
    const serverWinsFields = ['version', 'updatedAt', 'id', 'createdAt']
    
    if (clientWinsFields.includes(fieldName)) return 'client_wins'
    if (serverWinsFields.includes(fieldName)) return 'server_wins'
    
    return options.defaultFieldStrategy || 'server_wins'
  }

  /**
   * Extract timestamp from data
   * @param {*} data - Data to extract timestamp from
   * @returns {number} Timestamp or 0
   */
  extractTimestamp(data) {
    if (!data) return 0
    
    // Check common timestamp fields
    const timestampFields = ['timestamp', 'updatedAt', 'lastModified', 'modifiedAt', '_timestamp']
    
    for (const field of timestampFields) {
      if (data[field]) {
        const timestamp = new Date(data[field]).getTime()
        if (!isNaN(timestamp)) return timestamp
      }
    }
    
    // Check metadata
    if (data._metadata?.timestamp) {
      return new Date(data._metadata.timestamp).getTime()
    }
    
    return 0
  }

  /**
   * Normalize data for comparison
   * @param {*} data - Data to normalize
   * @returns {*} Normalized data
   */
  normalizeData(data) {
    if (!data) return data
    
    // Remove metadata for comparison
    if (typeof data === 'object' && data._metadata) {
      const { _metadata, ...normalized } = data
      return normalized
    }
    
    return data
  }

  /**
   * Record conflict resolution for metrics
   * @param {Object} conflict - Conflict details
   */
  recordConflict(conflict) {
    this.conflictHistory.push({
      ...conflict,
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    })
    
    // Keep history size manageable
    if (this.conflictHistory.length > this.maxHistorySize) {
      this.conflictHistory.shift()
    }
  }

  /**
   * Get conflict resolution statistics
   * @returns {Object} Conflict statistics
   */
  getStats() {
    const totalConflicts = this.conflictHistory.length
    const successfulResolutions = this.conflictHistory.filter(c => c.success).length
    const strategies = {}
    const categories = {}
    
    for (const conflict of this.conflictHistory) {
      strategies[conflict.strategy] = (strategies[conflict.strategy] || 0) + 1
      categories[conflict.category] = (categories[conflict.category] || 0) + 1
    }
    
    return {
      totalConflicts,
      successfulResolutions,
      successRate: totalConflicts > 0 ? Math.round((successfulResolutions / totalConflicts) * 100) : 100,
      strategiesUsed: strategies,
      categoriesAffected: categories,
      recentConflicts: this.conflictHistory.slice(-10)
    }
  }

  /**
   * Clear conflict history
   */
  clearHistory() {
    this.conflictHistory.length = 0
    console.log('🧹 Conflict resolution history cleared')
  }
}

/**
 * Vue composable for conflict resolution
 * @returns {Object} Conflict resolution methods
 */
export function useConflictResolver() {
  const conflictResolver = new ConflictResolver()

  return {
    conflictResolver,

    /**
     * Resolve conflict between cached and fresh data
     */
    async resolveConflict(key, category, cachedData, freshData, options = {}) {
      return conflictResolver.resolveConflict(key, category, cachedData, freshData, options)
    },

    /**
     * Get conflict resolution statistics
     */
    getConflictStats() {
      return conflictResolver.getStats()
    },

    /**
     * Clear conflict history
     */
    clearConflictHistory() {
      conflictResolver.clearHistory()
    }
  }
}