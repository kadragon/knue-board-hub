/**
 * localStorage Cache Manager
 * Provides cache-first storage with TTL validation, intelligent cleanup, and advanced compression
 */

import LZString from 'lz-string'

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
    this.compressionThreshold = 5 * 1024 // Compress items larger than 5KB
    this.compressionStats = {
      totalCompressions: 0,
      totalBytesOriginal: 0,
      totalBytesCompressed: 0,
      averageCompressionRatio: 0
    }
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
        finalData = await this.decompress(data, true) // true = is compressed
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
    const originalSize = serialized.length
    
    // Determine if compression is beneficial
    const shouldCompress = originalSize > this.compressionThreshold && this.compressionEnabled
    let finalData = data
    let compressionRatio = 1
    
    if (shouldCompress) {
      const compressed = await this.compress(serialized)
      const compressedSize = compressed.length
      compressionRatio = originalSize / compressedSize
      
      // Only use compression if it saves significant space (>15% reduction)
      if (compressionRatio > 1.15) {
        finalData = compressed
        this.updateCompressionStats(originalSize, compressedSize)
        console.log(`🗜️ Compressed "${key}": ${this.formatBytes(originalSize)} → ${this.formatBytes(compressedSize)} (${Math.round((1 - compressionRatio) * -100)}%)`)
      } else {
        // Compression not beneficial, use original data
        shouldCompress = false
        finalData = data
      }
    }

    try {
      const cacheEntry = {
        data: finalData,
        timestamp: Date.now(),
        version: 1,
        category,
        compressed: shouldCompress,
        accessCount: 1,
        lastAccessed: Date.now(),
        size: JSON.stringify(finalData).length,
        originalSize: originalSize,
        compressionRatio: shouldCompress ? compressionRatio : 1
      }

      const serializedEntry = JSON.stringify(cacheEntry)
      const fullKey = `${this.prefix}${key}`

      // Check if we need to clean up before writing
      if (this.needsCleanup(serializedEntry.length)) {
        await this.cleanup()
      }

      localStorage.setItem(fullKey, serializedEntry)
      const compressionInfo = shouldCompress ? ` (LZ-compressed: ${Math.round((1 - compressionRatio) * -100)}% reduction)` : ''
      console.log(`💾 Cached "${key}" (${category}) - ${this.formatBytes(serializedEntry.length)}${compressionInfo}`)
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

        // Use advanced ML-based scoring
        const score = this.calculateAdvancedCacheScore(item, key)

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
   * Get priority score for cache key using ML-based scoring
   * @param {string} key - Cache key
   * @param {string} category - Cache category
   * @param {Object} cacheEntry - Cache entry data
   * @returns {number} Priority score (higher = more important)
   */
  getPriority(key, category, cacheEntry = null) {
    // Base category priority
    const categoryPriority = {
      departments: 10,      // Critical - department info
      preferences: 9,       // High - user settings
      rssItems: 7,         // Medium - content
      default: 5           // Default
    }

    let baseScore = categoryPriority[category] || categoryPriority.default

    // Key-based priority adjustments
    if (key.includes('main') || key.includes('academic')) baseScore += 2
    if (key.includes('user:') || key.includes('active-')) baseScore += 1
    if (key.includes('predictive:')) baseScore -= 1 // Lower priority for predictive loading

    // ML-based scoring enhancements
    if (cacheEntry) {
      const mlScore = this.calculateMLScore(key, category, cacheEntry)
      return baseScore + mlScore
    }

    return baseScore
  }

  /**
   * Calculate ML-based priority score
   * @param {string} key - Cache key
   * @param {string} category - Cache category  
   * @param {Object} cacheEntry - Cache entry data
   * @returns {number} ML score adjustment (-5 to +5)
   */
  calculateMLScore(key, category, cacheEntry) {
    let score = 0
    const now = Date.now()
    
    // Feature extraction
    const features = {
      // Recency features
      age: (now - (cacheEntry.timestamp || 0)) / (1000 * 60 * 60), // Age in hours
      lastAccessed: (now - (cacheEntry.lastAccessed || cacheEntry.timestamp || 0)) / (1000 * 60 * 60), // Hours since last access
      
      // Frequency features
      accessCount: cacheEntry.accessCount || 0,
      accessRate: (cacheEntry.accessCount || 0) / Math.max(1, (now - (cacheEntry.timestamp || now)) / (1000 * 60 * 60)), // Accesses per hour
      
      // Size features
      size: cacheEntry.size || 0,
      compressionRatio: cacheEntry.compressionRatio || 1,
      originalSize: cacheEntry.originalSize || cacheEntry.size || 0,
      
      // Time-based features
      hourOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      isWeekend: new Date().getDay() === 0 || new Date().getDay() === 6,
      
      // Content features
      isPredictive: key.includes('predictive:'),
      isUserSpecific: key.includes('user:'),
      isDepartmentSpecific: key.includes('department:'),
      isRSSContent: category === 'rssItems'
    }
    
    // ML-inspired scoring model (simplified decision tree approach)
    
    // High-value indicators (positive score)
    if (features.accessCount > 5) score += Math.min(2, Math.log(features.accessCount))
    if (features.accessRate > 1) score += Math.min(1.5, features.accessRate)
    if (features.lastAccessed < 1) score += 2 // Recently accessed
    if (features.compressionRatio > 1.5) score += 0.5 // Good compression
    if (features.isUserSpecific && !features.isPredictive) score += 1
    
    // Medium-value indicators
    if (features.age < 6 && features.accessCount > 2) score += 1 // Recent and used
    if (features.isDepartmentSpecific && features.accessCount > 3) score += 0.5
    
    // Time-based patterns (office hours preference)
    if (features.hourOfDay >= 9 && features.hourOfDay <= 17 && !features.isWeekend) {
      score += 0.3
    }
    
    // Low-value indicators (negative score)
    if (features.isPredictive && features.accessCount === 0) score -= 2
    if (features.age > 24 && features.accessCount <= 1) score -= 1.5 // Old and unused
    if (features.lastAccessed > 12) score -= 1 // Not accessed in 12 hours
    if (features.size > 100000 && features.accessCount <= 2) score -= 1 // Large but unused
    
    // Penalize very old predictive content
    if (features.isPredictive && features.age > 6) score -= Math.min(2, features.age / 6)
    
    // Bonus for weekend content on weekends (news might be more relevant)
    if (features.isRSSContent && features.isWeekend) score += 0.2
    
    // Clamp score to reasonable range
    return Math.max(-5, Math.min(5, score))
  }

  /**
   * Advanced cache scoring with machine learning features
   * @param {Object} cacheEntry - Cache entry
   * @param {string} key - Cache key
   * @returns {number} Advanced cache score
   */
  calculateAdvancedCacheScore(cacheEntry, key) {
    const age = Date.now() - (cacheEntry.lastAccessed || cacheEntry.timestamp || 0)
    const priority = this.getPriority(key, cacheEntry.category, cacheEntry)
    const accessCount = cacheEntry.accessCount || 0
    const size = cacheEntry.size || 0
    
    // Multi-factor scoring algorithm
    let score = priority * 1000 // Base priority weight
    
    // Recency factor (exponential decay)
    const recencyWeight = Math.exp(-age / (24 * 60 * 60 * 1000)) // 24 hour half-life
    score += recencyWeight * 500
    
    // Frequency factor (log scale)
    if (accessCount > 0) {
      score += Math.log(accessCount) * 100
    }
    
    // Size penalty (larger items are more expensive to keep)
    score -= Math.sqrt(size) * 0.1
    
    // Compression bonus
    if (cacheEntry.compressionRatio > 1) {
      score += cacheEntry.compressionRatio * 50
    }
    
    // Predictive loading penalty
    if (key.includes('predictive:') && accessCount === 0) {
      score -= 200
    }
    
    // User-specific bonus
    if (key.includes('user:')) {
      score += 150
    }
    
    return score
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
      utilizationPercent: Math.round((stats.totalSize / this.maxStorageSize) * 100),
      compression: {
        enabled: this.compressionEnabled,
        threshold: this.formatBytes(this.compressionThreshold),
        ...this.compressionStats,
        totalSavings: this.compressionStats.totalBytesOriginal - this.compressionStats.totalBytesCompressed,
        totalSavingsFormatted: this.formatBytes(this.compressionStats.totalBytesOriginal - this.compressionStats.totalBytesCompressed),
        averageCompressionPercent: this.compressionStats.averageCompressionRatio > 0 ? 
          Math.round((1 - (1 / this.compressionStats.averageCompressionRatio)) * 100) : 0
      }
    }
  }

  /**
   * Check if compression is supported
   * @returns {boolean} Whether compression is available
   */
  checkCompressionSupport() {
    try {
      // Test LZ-string compression
      const testString = 'test compression'
      const compressed = LZString.compress(testString)
      const decompressed = LZString.decompress(compressed)
      return decompressed === testString
    } catch (error) {
      console.warn('⚠️ LZ-string compression not available:', error)
      return false
    }
  }

  /**
   * Compress data using LZ-string algorithm
   * @param {string} data - Data to compress
   * @returns {string} Compressed data
   */
  async compress(data) {
    try {
      if (!this.compressionEnabled) {
        return data
      }
      
      // Use LZ-string compression for optimal space savings
      const compressed = LZString.compress(data)
      
      if (!compressed) {
        console.warn('⚠️ LZ-string compression failed, using original data')
        return data
      }
      
      return compressed
    } catch (error) {
      console.warn('⚠️ Compression error:', error)
      return data // Return original data on compression failure
    }
  }

  /**
   * Decompress data using LZ-string algorithm
   * @param {string} data - Compressed data
   * @param {boolean} isCompressed - Whether data is actually compressed
   * @returns {*} Decompressed data
   */
  async decompress(data, isCompressed = false) {
    try {
      if (!isCompressed || !this.compressionEnabled) {
        // Data is not compressed, return as parsed JSON
        return typeof data === 'string' ? JSON.parse(data) : data
      }
      
      // Decompress using LZ-string
      const decompressed = LZString.decompress(data)
      
      if (decompressed === null) {
        console.warn('⚠️ LZ-string decompression failed')
        // Try to parse as regular JSON fallback
        return typeof data === 'string' ? JSON.parse(data) : data
      }
      
      // Parse the decompressed JSON
      return JSON.parse(decompressed)
    } catch (error) {
      console.warn('⚠️ Decompression error:', error)
      // Fallback: try to use data as-is
      try {
        return typeof data === 'string' ? JSON.parse(data) : data
      } catch {
        return data
      }
    }
  }

  /**
   * Update compression statistics
   * @param {number} originalSize - Original data size
   * @param {number} compressedSize - Compressed data size
   */
  updateCompressionStats(originalSize, compressedSize) {
    this.compressionStats.totalCompressions++
    this.compressionStats.totalBytesOriginal += originalSize
    this.compressionStats.totalBytesCompressed += compressedSize
    
    // Calculate running average compression ratio
    this.compressionStats.averageCompressionRatio = 
      this.compressionStats.totalBytesOriginal / this.compressionStats.totalBytesCompressed
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