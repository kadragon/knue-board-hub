/**
 * localStorage Cache Manager
 * Provides cache-first storage with TTL validation and intelligent cleanup
 */

export class CacheManager {
  constructor() {
    this.prefix = 'knue-board-hub:'
    this.maxAge = {
      departments: 24 * 60 * 60 * 1000, // 24 hours
      rssItems: 30 * 60 * 1000,         // 30 minutes
      preferences: 7 * 24 * 60 * 60 * 1000, // 7 days
      default: 5 * 60 * 1000             // 5 minutes
    }
    this.maxStorageSize = 10 * 1024 * 1024 // 10MB limit
    this.compressionEnabled = this.checkCompressionSupport()
  }

  /**
   * Cache-first read with TTL validation
   * @param {string} key - Cache key
   * @param {string} category - Cache category for TTL
   * @param {boolean} ignoreTTL - Skip TTL validation
   * @returns {Object|null} Cached data with metadata or null
   */
  async get(key, category = 'default', ignoreTTL = false) {
    try {
      const stored = localStorage.getItem(`${this.prefix}${key}`)
      if (!stored) return null

      const cacheEntry = JSON.parse(stored)
      const { data, timestamp, accessCount = 0, compressed = false } = cacheEntry
      const maxAge = this.maxAge[category] || this.maxAge.default

      // Check TTL unless explicitly ignored
      if (!ignoreTTL && Date.now() - timestamp > maxAge) {
        this.delete(key)
        return null
      }

      // Update access count for LRU tracking
      cacheEntry.accessCount = accessCount + 1
      cacheEntry.lastAccessed = Date.now()
      localStorage.setItem(`${this.prefix}${key}`, JSON.stringify(cacheEntry))

      // Decompress if needed
      let finalData = data
      if (compressed) {
        finalData = await this.decompress(data)
      }

      return {
        data: finalData,
        fromCache: true,
        age: Date.now() - timestamp,
        accessCount: cacheEntry.accessCount
      }
    } catch (error) {
      console.warn(`Cache read error for key "${key}":`, error)
      // Clean up corrupted cache entry
      this.delete(key)
      return null
    }
  }

  /**
   * Write to cache with metadata and quota handling
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   * @param {string} category - Cache category
   * @returns {boolean} Success status
   */
  async set(key, data, category = 'default') {
    const serialized = JSON.stringify(data)
    
    // Compress large payloads (>10KB)
    const shouldCompress = serialized.length > 10240 && this.compressionEnabled
    const finalData = shouldCompress ? await this.compress(serialized) : data

    try {
      const cacheEntry = {
        data: finalData,
        timestamp: Date.now(),
        version: 1,
        category,
        compressed: shouldCompress,
        accessCount: 1,
        lastAccessed: Date.now(),
        size: JSON.stringify(finalData).length
      }

      const serializedEntry = JSON.stringify(cacheEntry)
      const fullKey = `${this.prefix}${key}`

      // Check if we need to clean up before writing
      if (this.needsCleanup(serializedEntry.length)) {
        await this.cleanup()
      }

      localStorage.setItem(fullKey, serializedEntry)
      console.log(`💾 Cached "${key}" (${category}) - ${serializedEntry.length} bytes${shouldCompress ? ' (compressed)' : ''}`)
      return true

    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.warn('💾 localStorage quota exceeded, cleaning up...')
        await this.cleanup()
        
        // Retry once after cleanup
        try {
          const retryCacheEntry = {
            data: finalData,
            timestamp: Date.now(),
            version: 1,
            category,
            compressed: shouldCompress,
            accessCount: 1,
            lastAccessed: Date.now()
          }
          localStorage.setItem(`${this.prefix}${key}`, JSON.stringify(retryCacheEntry))
          console.log(`💾 Cached "${key}" after cleanup`)
          return true
        } catch (retryError) {
          console.error(`💾 Failed to cache "${key}" even after cleanup:`, retryError)
        }
      } else {
        console.warn(`💾 Cache write error for key "${key}":`, error)
      }
      return false
    }
  }

  /**
   * Delete cache entry
   * @param {string} key - Cache key
   */
  delete(key) {
    try {
      localStorage.removeItem(`${this.prefix}${key}`)
    } catch (error) {
      console.warn(`Cache delete error for key "${key}":`, error)
    }
  }

  /**
   * Clear all cache entries or entries for specific category
   * @param {string} category - Optional category to clear
   */
  clear(category = null) {
    try {
      const keysToDelete = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.prefix)) {
          if (!category) {
            keysToDelete.push(key)
          } else {
            // Check category by reading the entry
            try {
              const entry = JSON.parse(localStorage.getItem(key) || '{}')
              if (entry.category === category) {
                keysToDelete.push(key)
              }
            } catch {
              // If we can't parse, delete it anyway
              keysToDelete.push(key)
            }
          }
        }
      }

      keysToDelete.forEach(key => localStorage.removeItem(key))
      console.log(`🧹 Cleared ${keysToDelete.length} cache entries${category ? ` for category "${category}"` : ''}`)
    } catch (error) {
      console.warn('Cache clear error:', error)
    }
  }

  /**
   * Intelligent cache cleanup using LRU + priority
   * Evicts least recently used items with lowest priority
   */
  async cleanup() {
    const allKeys = []
    
    // Collect all our cache keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(this.prefix)) {
        allKeys.push(key)
      }
    }

    if (allKeys.length === 0) return

    // Calculate cache scores (priority + recency + frequency)
    const cacheScores = []
    
    for (const fullKey of allKeys) {
      try {
        const item = JSON.parse(localStorage.getItem(fullKey) || '{}')
        const key = fullKey.replace(this.prefix, '')
        const age = Date.now() - (item.lastAccessed || item.timestamp || 0)
        const priority = this.getPriority(key, item.category)
        const accessCount = item.accessCount || 0
        const size = item.size || fullKey.length + JSON.stringify(item).length

        // Higher score = more valuable, less likely to evict
        const score = priority * 1000 - (age / 1000) + (accessCount * 10)

        cacheScores.push({
          key: fullKey,
          cleanKey: key,
          score,
          size,
          age,
          priority,
          accessCount
        })
      } catch (error) {
        // Corrupted entry, mark for deletion
        cacheScores.push({
          key: fullKey,
          cleanKey: fullKey.replace(this.prefix, ''),
          score: -1000, // Lowest priority
          size: 0,
          age: 0,
          priority: 0,
          accessCount: 0
        })
      }
    }

    // Sort by score (lower = more likely to evict)
    cacheScores.sort((a, b) => a.score - b.score)

    // Evict bottom 30% or until we free enough space
    const evictionTarget = Math.max(
      Math.ceil(cacheScores.length * 0.3), // At least 30%
      5 // But at least 5 items
    )
    
    const toEvict = cacheScores.slice(0, Math.min(evictionTarget, cacheScores.length))
    let freedSpace = 0

    for (const item of toEvict) {
      localStorage.removeItem(item.key)
      freedSpace += item.size
      console.log(`🗑️ Evicted cache entry: ${item.cleanKey} (score: ${item.score.toFixed(1)}, age: ${Math.round(item.age/1000)}s)`)
      
      // Stop if we've freed enough space (2MB)
      if (freedSpace > 2 * 1024 * 1024) break
    }

    console.log(`🧹 Cache cleanup completed: evicted ${toEvict.length} items, freed ${this.formatBytes(freedSpace)}`)
  }

  /**
   * Get priority score for cache key
   * @param {string} key - Cache key
   * @param {string} category - Cache category
   * @returns {number} Priority score (higher = more important)
   */
  getPriority(key, category) {
    // Category-based priority
    const categoryPriority = {
      departments: 10,      // Critical - department info
      preferences: 9,       // High - user settings
      rssItems: 7,         // Medium - content
      default: 5           // Default
    }

    // Key-based priority adjustments
    let keyPriority = 0
    if (key.includes('main') || key.includes('academic')) keyPriority += 2
    if (key.includes('user:') || key.includes('active-')) keyPriority += 1

    return (categoryPriority[category] || categoryPriority.default) + keyPriority
  }

  /**
   * Check if cleanup is needed before writing
   * @param {number} newItemSize - Size of item being written
   * @returns {boolean} Whether cleanup is needed
   */
  needsCleanup(newItemSize) {
    const currentSize = this.getCacheSize()
    const projectedSize = currentSize + newItemSize
    
    // Cleanup if we'll exceed 80% of our limit
    return projectedSize > (this.maxStorageSize * 0.8)
  }

  /**
   * Get total cache size
   * @returns {number} Total size in bytes
   */
  getCacheSize() {
    let totalSize = 0
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(this.prefix)) {
        const value = localStorage.getItem(key) || ''
        totalSize += key.length + value.length
      }
    }
    
    return totalSize
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const stats = {
      totalEntries: 0,
      totalSize: 0,
      categories: {},
      oldestEntry: Date.now(),
      newestEntry: 0
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(this.prefix)) {
        const value = localStorage.getItem(key) || ''
        const size = key.length + value.length
        
        stats.totalEntries++
        stats.totalSize += size

        try {
          const entry = JSON.parse(value)
          const category = entry.category || 'unknown'
          
          if (!stats.categories[category]) {
            stats.categories[category] = { count: 0, size: 0 }
          }
          stats.categories[category].count++
          stats.categories[category].size += size

          if (entry.timestamp) {
            stats.oldestEntry = Math.min(stats.oldestEntry, entry.timestamp)
            stats.newestEntry = Math.max(stats.newestEntry, entry.timestamp)
          }
        } catch {
          // Ignore parsing errors for stats
        }
      }
    }

    return {
      ...stats,
      formattedSize: this.formatBytes(stats.totalSize),
      utilizationPercent: Math.round((stats.totalSize / this.maxStorageSize) * 100)
    }
  }

  /**
   * Check if compression is supported
   * @returns {boolean} Whether compression is available
   */
  checkCompressionSupport() {
    // For now, we'll implement simple JSON minification
    // In the future, we could add LZ-string or similar
    return true
  }

  /**
   * Compress data (placeholder for future implementation)
   * @param {string} data - Data to compress
   * @returns {string} Compressed data
   */
  async compress(data) {
    // Simple minification by removing unnecessary whitespace
    try {
      const parsed = JSON.parse(data)
      return JSON.stringify(parsed) // This removes formatting whitespace
    } catch {
      return data // Return as-is if not JSON
    }
  }

  /**
   * Decompress data (placeholder for future implementation)
   * @param {string} data - Compressed data
   * @returns {*} Decompressed data
   */
  async decompress(data) {
    try {
      return JSON.parse(data)
    } catch {
      return data // Return as-is if not JSON
    }
  }

  /**
   * Format bytes into human readable string
   * @param {number} bytes - Bytes to format
   * @returns {string} Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

// Create singleton instance
export const cacheManager = new CacheManager()

/**
 * Vue composable for cache management
 * @returns {Object} Cache management methods
 */
export function useCache() {
  return {
    cacheManager,
    
    /**
     * Get cache statistics for debugging
     */
    getCacheStats() {
      return cacheManager.getStats()
    },

    /**
     * Manual cache cleanup
     */
    async cleanupCache() {
      await cacheManager.cleanup()
    },

    /**
     * Clear cache for specific category
     */
    clearCache(category = null) {
      cacheManager.clear(category)
    }
  }
}