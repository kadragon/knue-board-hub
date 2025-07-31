/**
 * Predictive Loader
 * User behavior pattern tracking and intelligent prefetching
 */

import { cacheManager } from './cacheManager.js'

export class PredictiveLoader {
  constructor(apiService, syncCoordinator) {
    this.cache = cacheManager
    this.api = apiService
    this.syncCoordinator = syncCoordinator
    
    // User behavior tracking
    this.userBehavior = {
      pageViews: [],
      departmentAccess: new Map(),
      timePatterns: new Map(),
      sequencePatterns: [],
      sessionData: {
        startTime: Date.now(),
        interactions: 0,
        uniqueDepartments: new Set()
      }
    }
    
    // Prediction models
    this.models = {
      timeBasedWeight: 0.3,        // Weight for time-based predictions
      sequenceWeight: 0.4,         // Weight for sequence-based predictions  
      frequencyWeight: 0.3,        // Weight for frequency-based predictions
      minConfidence: 0.6,          // Minimum confidence threshold for predictions
      maxPredictions: 5            // Maximum predictions per request
    }
    
    // Prefetching configuration
    this.prefetchConfig = {
      enabled: true,
      maxConcurrent: 2,            // Max concurrent prefetch operations
      throttleDelay: 1000,         // Delay between prefetch operations
      backgroundOnly: true,        // Only prefetch in background
      respectNetworkConditions: true
    }
    
    // Active prefetch operations
    this.activePrefetches = new Set()
    this.prefetchQueue = []
    this.isProcessingQueue = false
    
    // Behavior patterns storage key
    this.storageKey = 'knue-board-hub:user-behavior'
    
    this.loadBehaviorData()
    this.setupPageVisibilityHandling()
  }

  /**
   * Track user page view and interaction
   * @param {string} route - Current route/page
   * @param {Object} context - Additional context data
   */
  trackPageView(route, context = {}) {
    const timestamp = Date.now()
    const interaction = {
      route,
      timestamp,
      timeOnPage: context.timeOnPage || 0,
      scrollDepth: context.scrollDepth || 0,
      interactions: context.interactions || 0,
      departmentId: context.departmentId || null,
      referrer: context.referrer || null
    }
    
    // Add to page views history
    this.userBehavior.pageViews.push(interaction)
    
    // Keep only last 100 page views
    if (this.userBehavior.pageViews.length > 100) {
      this.userBehavior.pageViews.shift()
    }
    
    // Update department access patterns
    if (interaction.departmentId) {
      this.trackDepartmentAccess(interaction.departmentId, timestamp)
      this.userBehavior.sessionData.uniqueDepartments.add(interaction.departmentId)
    }
    
    // Update time patterns
    this.trackTimePattern(route, timestamp)
    
    // Update sequence patterns
    this.updateSequencePatterns(route)
    
    // Update session data
    this.userBehavior.sessionData.interactions++
    
    console.log(`📊 Tracked page view: ${route}${interaction.departmentId ? ` (dept: ${interaction.departmentId})` : ''}`)
    
    // Trigger predictions after tracking
    setTimeout(() => this.generatePredictions(), 500)
    
    // Persist behavior data
    this.saveBehaviorData()
  }

  /**
   * Track department access patterns
   * @param {string} departmentId - Department ID
   * @param {number} timestamp - Access timestamp
   */
  trackDepartmentAccess(departmentId, timestamp) {
    if (!this.userBehavior.departmentAccess.has(departmentId)) {
      this.userBehavior.departmentAccess.set(departmentId, {
        count: 0,
        firstAccessed: timestamp,
        lastAccessed: timestamp,
        timeSpent: 0,
        avgTimeSpent: 0,
        accessTimes: []
      })
    }
    
    const deptData = this.userBehavior.departmentAccess.get(departmentId)
    const timeSinceLastAccess = timestamp - deptData.lastAccessed
    
    deptData.count++
    deptData.lastAccessed = timestamp
    deptData.accessTimes.push(timestamp)
    
    // Keep only last 20 access times per department
    if (deptData.accessTimes.length > 20) {
      deptData.accessTimes.shift()
    }
    
    // Calculate average time spent (rough estimate)
    if (timeSinceLastAccess < 30 * 60 * 1000) { // If less than 30 minutes
      deptData.timeSpent += timeSinceLastAccess
      deptData.avgTimeSpent = deptData.timeSpent / deptData.count
    }
  }

  /**
   * Track time-based access patterns
   * @param {string} route - Route accessed
   * @param {number} timestamp - Access timestamp
   */
  trackTimePattern(route, timestamp) {
    const hour = new Date(timestamp).getHours()
    const dayOfWeek = new Date(timestamp).getDay()
    const timeKey = `${dayOfWeek}-${hour}`
    
    if (!this.userBehavior.timePatterns.has(timeKey)) {
      this.userBehavior.timePatterns.set(timeKey, {
        routes: new Map(),
        totalAccess: 0
      })
    }
    
    const timePattern = this.userBehavior.timePatterns.get(timeKey)
    timePattern.totalAccess++
    
    if (!timePattern.routes.has(route)) {
      timePattern.routes.set(route, 0)
    }
    timePattern.routes.set(route, timePattern.routes.get(route) + 1)
  }

  /**
   * Update sequence patterns (route transitions)
   * @param {string} currentRoute - Current route
   */
  updateSequencePatterns(currentRoute) {
    const recentViews = this.userBehavior.pageViews.slice(-5) // Last 5 views
    
    if (recentViews.length >= 2) {
      const sequence = recentViews.map(view => view.route).join(' → ')
      
      // Find existing sequence or create new one
      let existingSequence = this.userBehavior.sequencePatterns.find(
        pattern => pattern.sequence === sequence
      )
      
      if (existingSequence) {
        existingSequence.count++
        existingSequence.lastSeen = Date.now()
      } else {
        this.userBehavior.sequencePatterns.push({
          sequence,
          count: 1,
          firstSeen: Date.now(),
          lastSeen: Date.now(),
          routes: recentViews.map(view => view.route)
        })
      }
    }
    
    // Keep only top 50 sequence patterns
    this.userBehavior.sequencePatterns.sort((a, b) => b.count - a.count)
    if (this.userBehavior.sequencePatterns.length > 50) {
      this.userBehavior.sequencePatterns = this.userBehavior.sequencePatterns.slice(0, 50)
    }
  }

  /**
   * Generate predictions based on user behavior patterns
   * @returns {Array} Array of predictions with confidence scores
   */
  generatePredictions() {
    if (!this.prefetchConfig.enabled) {
      return []
    }
    
    const predictions = []
    const currentTime = Date.now()
    const currentHour = new Date().getHours()
    const currentDayOfWeek = new Date().getDay()
    const currentRoute = this.getCurrentRoute()
    
    // Time-based predictions
    const timePredictions = this.generateTimeBasedPredictions(currentDayOfWeek, currentHour)
    predictions.push(...timePredictions)
    
    // Sequence-based predictions
    const sequencePredictions = this.generateSequenceBasedPredictions(currentRoute)
    predictions.push(...sequencePredictions)
    
    // Frequency-based predictions
    const frequencyPredictions = this.generateFrequencyBasedPredictions()
    predictions.push(...frequencyPredictions)
    
    // Combine and rank predictions
    const rankedPredictions = this.rankPredictions(predictions)
    
    // Filter by confidence threshold
    const highConfidencePredictions = rankedPredictions.filter(
      pred => pred.confidence >= this.models.minConfidence
    )
    
    // Take top predictions
    const topPredictions = highConfidencePredictions.slice(0, this.models.maxPredictions)
    
    console.log(`🔮 Generated ${topPredictions.length} predictions:`, topPredictions.map(p => `${p.type}:${p.departmentId || p.route} (${Math.round(p.confidence * 100)}%)`))
    
    // Queue prefetching for top predictions
    this.queuePrefetching(topPredictions)
    
    return topPredictions
  }

  /**
   * Generate time-based predictions
   * @param {number} dayOfWeek - Current day of week
   * @param {number} hour - Current hour
   * @returns {Array} Time-based predictions
   */
  generateTimeBasedPredictions(dayOfWeek, hour) {
    const predictions = []
    const timeKey = `${dayOfWeek}-${hour}`
    
    // Check current time pattern
    if (this.userBehavior.timePatterns.has(timeKey)) {
      const pattern = this.userBehavior.timePatterns.get(timeKey)
      
      for (const [route, count] of pattern.routes) {
        const confidence = (count / pattern.totalAccess) * this.models.timeBasedWeight
        
        predictions.push({
          type: 'time-based',
          route,
          confidence,
          reason: `Accessed ${count} times at ${hour}:00 on ${this.getDayName(dayOfWeek)}`,
          metadata: { timeKey, count, totalAccess: pattern.totalAccess }
        })
      }
    }
    
    // Check nearby time slots (±1 hour)
    for (const hourOffset of [-1, 1]) {
      const nearbyHour = (hour + hourOffset + 24) % 24
      const nearbyTimeKey = `${dayOfWeek}-${nearbyHour}`
      
      if (this.userBehavior.timePatterns.has(nearbyTimeKey)) {
        const pattern = this.userBehavior.timePatterns.get(nearbyTimeKey)
        
        for (const [route, count] of pattern.routes) {
          const confidence = (count / pattern.totalAccess) * this.models.timeBasedWeight * 0.7 // Reduced confidence for nearby times
          
          predictions.push({
            type: 'time-nearby',
            route,
            confidence,
            reason: `Accessed ${count} times at nearby time (${nearbyHour}:00)`,
            metadata: { timeKey: nearbyTimeKey, count, totalAccess: pattern.totalAccess }
          })
        }
      }
    }
    
    return predictions
  }

  /**
   * Generate sequence-based predictions
   * @param {string} currentRoute - Current route
   * @returns {Array} Sequence-based predictions
   */
  generateSequenceBasedPredictions(currentRoute) {
    const predictions = []
    const recentRoutes = this.userBehavior.pageViews.slice(-3).map(view => view.route)
    
    // Find patterns that match recent navigation
    for (const pattern of this.userBehavior.sequencePatterns) {
      const patternRoutes = pattern.routes
      
      // Check if current navigation matches beginning of this pattern
      const matchLength = this.findSequenceMatch(recentRoutes, patternRoutes)
      
      if (matchLength > 0 && matchLength < patternRoutes.length) {
        // Predict the next step in the sequence
        const nextRoute = patternRoutes[matchLength]
        const confidence = (pattern.count / this.userBehavior.sequencePatterns.length) * 
                          this.models.sequenceWeight * 
                          (matchLength / patternRoutes.length) // Higher confidence for longer matches
        
        predictions.push({
          type: 'sequence-based',
          route: nextRoute,
          confidence,
          reason: `Next step in sequence pattern (${pattern.count} occurrences)`,
          metadata: { 
            pattern: pattern.sequence, 
            matchLength, 
            totalLength: patternRoutes.length,
            patternCount: pattern.count 
          }
        })
      }
    }
    
    return predictions
  }

  /**
   * Generate frequency-based predictions
   * @returns {Array} Frequency-based predictions
   */
  generateFrequencyBasedPredictions() {
    const predictions = []
    const totalDepartmentAccess = Array.from(this.userBehavior.departmentAccess.values())
      .reduce((sum, dept) => sum + dept.count, 0)
    
    if (totalDepartmentAccess === 0) return predictions
    
    // Sort departments by access frequency and recency
    const sortedDepartments = Array.from(this.userBehavior.departmentAccess.entries())
      .map(([deptId, data]) => ({
        departmentId: deptId,
        ...data,
        score: this.calculateDepartmentScore(data, totalDepartmentAccess)
      }))
      .sort((a, b) => b.score - a.score)
    
    // Generate predictions for top departments
    for (const dept of sortedDepartments.slice(0, 3)) {
      const confidence = dept.score * this.models.frequencyWeight
      
      predictions.push({
        type: 'frequency-based',
        departmentId: dept.departmentId,
        route: `/department/${dept.departmentId}`,
        confidence,
        reason: `Frequently accessed department (${dept.count} times, avg ${Math.round(dept.avgTimeSpent / 1000)}s)`,
        metadata: {
          accessCount: dept.count,
          avgTimeSpent: dept.avgTimeSpent,
          lastAccessed: dept.lastAccessed,
          score: dept.score
        }
      })
    }
    
    return predictions
  }

  /**
   * Calculate department score based on frequency and recency
   * @param {Object} deptData - Department access data
   * @param {number} totalAccess - Total access count across all departments
   * @returns {number} Department score
   */
  calculateDepartmentScore(deptData, totalAccess) {
    const frequencyScore = deptData.count / totalAccess
    const recencyScore = Math.max(0, 1 - ((Date.now() - deptData.lastAccessed) / (7 * 24 * 60 * 60 * 1000))) // Decay over 7 days
    const timeSpentScore = Math.min(1, deptData.avgTimeSpent / (5 * 60 * 1000)) // Normalize to 5 minutes max
    
    return (frequencyScore * 0.5) + (recencyScore * 0.3) + (timeSpentScore * 0.2)
  }

  /**
   * Rank and combine predictions
   * @param {Array} predictions - Raw predictions
   * @returns {Array} Ranked predictions
   */
  rankPredictions(predictions) {
    // Group predictions by route/department
    const grouped = new Map()
    
    for (const prediction of predictions) {
      const key = prediction.departmentId || prediction.route
      
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key).push(prediction)
    }
    
    // Combine predictions for same route/department
    const combined = []
    for (const [key, preds] of grouped) {
      if (preds.length === 1) {
        combined.push(preds[0])
      } else {
        // Combine multiple predictions
        const combinedConfidence = preds.reduce((sum, pred) => sum + pred.confidence, 0) / preds.length
        const reasons = preds.map(pred => pred.reason).join('; ')
        const types = [...new Set(preds.map(pred => pred.type))].join(', ')
        
        combined.push({
          ...preds[0],
          type: types,
          confidence: Math.min(1, combinedConfidence), // Cap at 100%
          reason: reasons,
          metadata: {
            combinedFrom: preds.length,
            originalPredictions: preds.map(p => ({ type: p.type, confidence: p.confidence }))
          }
        })
      }
    }
    
    // Sort by confidence
    return combined.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Queue prefetching for predictions
   * @param {Array} predictions - Predictions to prefetch
   */
  queuePrefetching(predictions) {
    if (!this.prefetchConfig.enabled || !this.shouldPrefetch()) {
      return
    }
    
    for (const prediction of predictions) {
      if (prediction.departmentId) {
        // Queue department data prefetch
        this.prefetchQueue.push({
          type: 'department',
          departmentId: prediction.departmentId,
          confidence: prediction.confidence,
          reason: prediction.reason,
          queuedAt: Date.now()
        })
      }
    }
    
    // Process queue
    if (!this.isProcessingQueue && this.prefetchQueue.length > 0) {
      setTimeout(() => this.processPrefetchQueue(), this.prefetchConfig.throttleDelay)
    }
  }

  /**
   * Process prefetch queue
   */
  async processPrefetchQueue() {
    if (this.isProcessingQueue || this.prefetchQueue.length === 0) {
      return
    }
    
    this.isProcessingQueue = true
    console.log(`🚀 Processing prefetch queue (${this.prefetchQueue.length} items)`)
    
    while (this.prefetchQueue.length > 0 && this.activePrefetches.size < this.prefetchConfig.maxConcurrent) {
      const item = this.prefetchQueue.shift()
      
      if (this.activePrefetches.has(item.departmentId)) {
        continue // Already prefetching this item
      }
      
      // Start prefetch operation
      this.prefetchItem(item)
    }
    
    this.isProcessingQueue = false
    
    // Schedule next processing if queue still has items
    if (this.prefetchQueue.length > 0) {
      setTimeout(() => this.processPrefetchQueue(), this.prefetchConfig.throttleDelay)
    }
  }

  /**
   * Prefetch individual item
   * @param {Object} item - Item to prefetch
   */
  async prefetchItem(item) {
    const { type, departmentId, confidence, reason } = item
    
    try {
      this.activePrefetches.add(departmentId)
      console.log(`⬇️ Prefetching ${type} ${departmentId} (confidence: ${Math.round(confidence * 100)}%)`)
      
      if (type === 'department') {
        // Queue sync for department
        this.syncCoordinator.queueSync({
          key: `department:${departmentId}`,
          category: 'departments',
          fetchFn: () => this.api.getDepartment(departmentId),
          metadata: { 
            predictive: true, 
            confidence,
            reason
          }
        }, 'low') // Use low priority for predictive loading
        
        // Also prefetch RSS for this department
        this.syncCoordinator.queueSync({
          key: `rss:predictive:${departmentId}`,
          category: 'rssItems',
          fetchFn: () => this.api.getRssItems({ departments: [departmentId] }),
          dependencies: [`department:${departmentId}`],
          metadata: { 
            predictive: true, 
            confidence,
            departmentId
          }
        }, 'low')
      }
      
    } catch (error) {
      console.warn(`❌ Prefetch failed for ${type} ${departmentId}:`, error)
    } finally {
      this.activePrefetches.delete(departmentId)
    }
  }

  /**
   * Check if prefetching should be enabled based on conditions
   * @returns {boolean} Whether to prefetch
   */
  shouldPrefetch() {
    if (!this.prefetchConfig.enabled) return false
    
    // Check if background only and page is visible
    if (this.prefetchConfig.backgroundOnly && !document.hidden) {
      return false
    }
    
    // Check network conditions
    if (this.prefetchConfig.respectNetworkConditions) {
      // Don't prefetch on slow connections
      if (navigator.connection && navigator.connection.effectiveType) {
        const connectionType = navigator.connection.effectiveType
        if (connectionType === 'slow-2g' || connectionType === '2g') {
          return false
        }
      }
      
      // Don't prefetch if data saver is enabled
      if (navigator.connection && navigator.connection.saveData) {
        return false
      }
    }
    
    return true
  }

  /**
   * Utility methods
   */

  getCurrentRoute() {
    return window.location.pathname || '/'
  }

  getDayName(dayOfWeek) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[dayOfWeek] || 'Unknown'
  }

  findSequenceMatch(recent, pattern) {
    for (let i = 0; i < Math.min(recent.length, pattern.length); i++) {
      if (recent[recent.length - 1 - i] !== pattern[pattern.length - 1 - i]) {
        return i
      }
    }
    return Math.min(recent.length, pattern.length)
  }

  /**
   * Setup page visibility handling for background prefetching
   */
  setupPageVisibilityHandling() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.prefetchQueue.length > 0) {
        // Page is hidden, process prefetch queue
        setTimeout(() => this.processPrefetchQueue(), 1000)
      }
    })
  }

  /**
   * Load behavior data from localStorage
   */
  loadBehaviorData() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        
        // Restore Maps and Sets
        this.userBehavior.departmentAccess = new Map(data.departmentAccess || [])
        this.userBehavior.timePatterns = new Map(data.timePatterns || [])
        this.userBehavior.pageViews = data.pageViews || []
        this.userBehavior.sequencePatterns = data.sequencePatterns || []
        
        console.log('📊 Loaded user behavior data:', {
          pageViews: this.userBehavior.pageViews.length,
          departments: this.userBehavior.departmentAccess.size,
          timePatterns: this.userBehavior.timePatterns.size,
          sequences: this.userBehavior.sequencePatterns.length
        })
      }
    } catch (error) {
      console.warn('⚠️ Failed to load behavior data:', error)
    }
  }

  /**
   * Save behavior data to localStorage
   */
  saveBehaviorData() {
    try {
      const data = {
        pageViews: this.userBehavior.pageViews,
        departmentAccess: Array.from(this.userBehavior.departmentAccess.entries()),
        timePatterns: Array.from(this.userBehavior.timePatterns.entries()),
        sequencePatterns: this.userBehavior.sequencePatterns,
        lastSaved: Date.now()
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.warn('⚠️ Failed to save behavior data:', error)
    }
  }

  /**
   * Get predictive loading statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const sessionDuration = Date.now() - this.userBehavior.sessionData.startTime
    
    return {
      session: {
        duration: sessionDuration,
        durationFormatted: this.formatDuration(sessionDuration),
        interactions: this.userBehavior.sessionData.interactions,
        uniqueDepartments: this.userBehavior.sessionData.uniqueDepartments.size
      },
      behavior: {
        totalPageViews: this.userBehavior.pageViews.length,
        departmentsTracked: this.userBehavior.departmentAccess.size,
        timePatterns: this.userBehavior.timePatterns.size,
        sequencePatterns: this.userBehavior.sequencePatterns.length
      },
      prefetching: {
        enabled: this.prefetchConfig.enabled,
        queueLength: this.prefetchQueue.length,
        activePrefetches: this.activePrefetches.size,
        maxConcurrent: this.prefetchConfig.maxConcurrent
      },
      models: this.models
    }
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  /**
   * Clear behavior data
   */
  clearBehaviorData() {
    this.userBehavior.pageViews = []
    this.userBehavior.departmentAccess.clear()
    this.userBehavior.timePatterns.clear()
    this.userBehavior.sequencePatterns = []
    
    localStorage.removeItem(this.storageKey)
    console.log('🧹 Cleared user behavior data')
  }
}

/**
 * Vue composable for predictive loading
 * @param {Object} apiService - API service instance
 * @param {Object} syncCoordinator - Sync coordinator instance
 * @returns {Object} Predictive loading methods
 */
export function usePredictiveLoader(apiService, syncCoordinator) {
  const predictiveLoader = new PredictiveLoader(apiService, syncCoordinator)

  return {
    predictiveLoader,

    /**
     * Track page view
     */
    trackPageView(route, context = {}) {
      return predictiveLoader.trackPageView(route, context)
    },

    /**
     * Generate predictions
     */
    generatePredictions() {
      return predictiveLoader.generatePredictions()
    },

    /**
     * Get statistics
     */
    getPredictiveStats() {
      return predictiveLoader.getStats()
    },

    /**
     * Clear behavior data
     */
    clearBehaviorData() {
      predictiveLoader.clearBehaviorData()
    }
  }
}