/**
 * Performance Monitor
 * Real-time cache performance monitoring with metrics collection and alerting
 */

export class PerformanceMonitor {
  constructor() {
    // Performance metrics
    this.metrics = {
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        avgResponseTime: 0,
        totalResponseTime: 0,
        operations: 0,
        compressionSavings: 0,
        evictions: 0
      },
      sync: {
        successfulSyncs: 0,
        failedSyncs: 0,
        avgSyncTime: 0,
        totalSyncTime: 0,
        networkErrors: 0,
        retries: 0
      },
      predictions: {
        generated: 0,
        successful: 0,
        accuracy: 0,
        prefetchHits: 0,
        prefetchMisses: 0
      },
      system: {
        memoryUsage: 0,
        storageUsage: 0,
        networkLatency: 0,
        errorRate: 0
      }
    }
    
    // Performance history for trend analysis
    this.history = {
      snapshots: [],
      maxSnapshots: 100,
      snapshotInterval: 30000 // 30 seconds
    }
    
    // Performance thresholds and alerts
    this.thresholds = {
      cache: {
        minHitRate: 0.8,          // 80% minimum hit rate
        maxResponseTime: 200,     // 200ms max response time
        maxStorageUsage: 0.8      // 80% max storage usage
      },
      sync: {
        maxSyncTime: 5000,        // 5s max sync time
        maxErrorRate: 0.1         // 10% max error rate
      },
      predictions: {
        minAccuracy: 0.6          // 60% min prediction accuracy
      }
    }
    
    // Active performance observations
    this.observations = new Map()
    
    // Alert system
    this.alerts = {
      active: [],
      history: [],
      maxAlerts: 50
    }
    
    // Real-time monitoring
    this.monitoring = {
      enabled: true,
      interval: null,
      frequency: 10000 // 10 seconds
    }
    
    this.startMonitoring()
  }

  /**
   * Record cache operation performance
   * @param {string} operation - Operation type (hit, miss, set, delete)
   * @param {number} responseTime - Response time in milliseconds
   * @param {Object} metadata - Additional metadata
   */
  recordCacheOperation(operation, responseTime, metadata = {}) {
    const timestamp = Date.now()
    
    this.metrics.cache.operations++
    this.metrics.cache.totalResponseTime += responseTime
    this.metrics.cache.avgResponseTime = this.metrics.cache.totalResponseTime / this.metrics.cache.operations
    
    switch (operation) {
      case 'hit':
        this.metrics.cache.hits++
        break
      case 'miss':
        this.metrics.cache.misses++
        break
      case 'eviction':
        this.metrics.cache.evictions++
        break
    }
    
    // Calculate hit rate
    const totalCacheOps = this.metrics.cache.hits + this.metrics.cache.misses
    if (totalCacheOps > 0) {
      this.metrics.cache.hitRate = this.metrics.cache.hits / totalCacheOps
    }
    
    // Record compression savings if provided
    if (metadata.compressionSavings) {
      this.metrics.cache.compressionSavings += metadata.compressionSavings
    }
    
    // Check performance thresholds
    this.checkCacheThresholds(responseTime)
    
    console.log(`📊 Cache ${operation}: ${responseTime}ms (hit rate: ${Math.round(this.metrics.cache.hitRate * 100)}%)`)
  }

  /**
   * Record sync operation performance
   * @param {string} operation - Operation type (success, failure, retry)
   * @param {number} duration - Operation duration in milliseconds
   * @param {Object} metadata - Additional metadata
   */
  recordSyncOperation(operation, duration, metadata = {}) {
    const timestamp = Date.now()
    
    switch (operation) {
      case 'success':
        this.metrics.sync.successfulSyncs++
        this.metrics.sync.totalSyncTime += duration
        this.metrics.sync.avgSyncTime = this.metrics.sync.totalSyncTime / this.metrics.sync.successfulSyncs
        break
      case 'failure':
        this.metrics.sync.failedSyncs++
        if (metadata.networkError) {
          this.metrics.sync.networkErrors++
        }
        break
      case 'retry':
        this.metrics.sync.retries++
        break
    }
    
    // Check sync thresholds
    this.checkSyncThresholds(duration)
    
    console.log(`🔄 Sync ${operation}: ${duration}ms`)
  }

  /**
   * Record prediction performance
   * @param {string} operation - Operation type (generated, hit, miss)
   * @param {Object} metadata - Additional metadata
   */
  recordPredictionOperation(operation, metadata = {}) {
    switch (operation) {
      case 'generated':
        this.metrics.predictions.generated++
        break
      case 'hit':
        this.metrics.predictions.successful++
        this.metrics.predictions.prefetchHits++
        break
      case 'miss':
        this.metrics.predictions.prefetchMisses++
        break
    }
    
    // Calculate prediction accuracy
    const totalPredictions = this.metrics.predictions.prefetchHits + this.metrics.predictions.prefetchMisses
    if (totalPredictions > 0) {
      this.metrics.predictions.accuracy = this.metrics.predictions.prefetchHits / totalPredictions
    }
    
    console.log(`🔮 Prediction ${operation} (accuracy: ${Math.round(this.metrics.predictions.accuracy * 100)}%)`)
  }

  /**
   * Start real-time monitoring
   */
  startMonitoring() {
    if (this.monitoring.interval) {
      return // Already monitoring
    }
    
    this.monitoring.interval = setInterval(() => {
      this.collectSystemMetrics()
      this.takeSnapshot()
      this.checkAllThresholds()
    }, this.monitoring.frequency)
    
    console.log(`📊 Performance monitoring started (${this.monitoring.frequency}ms interval)`)
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoring.interval) {
      clearInterval(this.monitoring.interval)
      this.monitoring.interval = null
      console.log('📊 Performance monitoring stopped')
    }
  }

  /**
   * Collect system-level metrics
   */
  collectSystemMetrics() {
    // Memory usage (approximate)
    if (performance.memory) {
      this.metrics.system.memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit
    }
    
    // Storage usage
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(estimate => {
        this.metrics.system.storageUsage = estimate.usage / estimate.quota
      }).catch(() => {
        // Fallback: estimate localStorage usage
        let localStorageSize = 0
        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            localStorageSize += localStorage[key].length + key.length
          }
        }
        this.metrics.system.storageUsage = localStorageSize / (5 * 1024 * 1024) // Assume 5MB quota
      })
    }
    
    // Network latency (simple ping test)
    this.measureNetworkLatency()
    
    // Error rate calculation
    const totalOps = this.metrics.cache.operations + this.metrics.sync.successfulSyncs + this.metrics.sync.failedSyncs
    const totalErrors = this.metrics.sync.failedSyncs
    this.metrics.system.errorRate = totalOps > 0 ? totalErrors / totalOps : 0
  }

  /**
   * Measure network latency with simple ping
   */
  async measureNetworkLatency() {
    try {
      const startTime = performance.now()
      
      // Use a small image for latency testing
      const img = new Image()
      img.onload = img.onerror = () => {
        const latency = performance.now() - startTime
        this.metrics.system.networkLatency = latency
      }
      img.src = `data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7?t=${Date.now()}`
    } catch (error) {
      // Fallback: use fetch to a fast endpoint
      try {
        const startTime = performance.now()
        await fetch('/', { method: 'HEAD', cache: 'no-cache' })
        this.metrics.system.networkLatency = performance.now() - startTime
      } catch {
        this.metrics.system.networkLatency = -1 // Unknown
      }
    }
  }

  /**
   * Take performance snapshot for history
   */
  takeSnapshot() {
    const snapshot = {
      timestamp: Date.now(),
      metrics: JSON.parse(JSON.stringify(this.metrics)), // Deep copy
      alerts: this.alerts.active.length
    }
    
    this.history.snapshots.push(snapshot)
    
    // Keep history size manageable
    if (this.history.snapshots.length > this.history.maxSnapshots) {
      this.history.snapshots.shift()
    }
  }

  /**
   * Check cache performance thresholds
   * @param {number} responseTime - Response time to check
   */
  checkCacheThresholds(responseTime) {
    // Check hit rate
    if (this.metrics.cache.hitRate < this.thresholds.cache.minHitRate && this.metrics.cache.operations > 10) {
      this.createAlert('cache_hit_rate', 'warning', 
        `Cache hit rate (${Math.round(this.metrics.cache.hitRate * 100)}%) below threshold (${Math.round(this.thresholds.cache.minHitRate * 100)}%)`)
    }
    
    // Check response time
    if (responseTime > this.thresholds.cache.maxResponseTime) {
      this.createAlert('cache_response_time', 'warning',
        `Cache response time (${responseTime}ms) above threshold (${this.thresholds.cache.maxResponseTime}ms)`)
    }
    
    // Check storage usage
    if (this.metrics.system.storageUsage > this.thresholds.cache.maxStorageUsage) {
      this.createAlert('storage_usage', 'critical',
        `Storage usage (${Math.round(this.metrics.system.storageUsage * 100)}%) above threshold (${Math.round(this.thresholds.cache.maxStorageUsage * 100)}%)`)
    }
  }

  /**
   * Check sync performance thresholds
   * @param {number} duration - Sync duration to check
   */
  checkSyncThresholds(duration) {
    // Check sync time
    if (duration > this.thresholds.sync.maxSyncTime) {
      this.createAlert('sync_time', 'warning',
        `Sync time (${duration}ms) above threshold (${this.thresholds.sync.maxSyncTime}ms)`)
    }
    
    // Check error rate
    if (this.metrics.system.errorRate > this.thresholds.sync.maxErrorRate) {
      const errorPercent = Math.round(this.metrics.system.errorRate * 100)
      const thresholdPercent = Math.round(this.thresholds.sync.maxErrorRate * 100)
      this.createAlert('error_rate', 'critical',
        `Error rate (${errorPercent}%) above threshold (${thresholdPercent}%)`)
    }
  }

  /**
   * Check all performance thresholds
   */
  checkAllThresholds() {
    // Check prediction accuracy
    if (this.metrics.predictions.accuracy < this.thresholds.predictions.minAccuracy && 
        this.metrics.predictions.prefetchHits + this.metrics.predictions.prefetchMisses > 5) {
      this.createAlert('prediction_accuracy', 'info',
        `Prediction accuracy (${Math.round(this.metrics.predictions.accuracy * 100)}%) below threshold (${Math.round(this.thresholds.predictions.minAccuracy * 100)}%)`)
    }
    
    // Clear resolved alerts
    this.clearResolvedAlerts()
  }

  /**
   * Create performance alert
   * @param {string} type - Alert type
   * @param {string} severity - Alert severity (info, warning, critical)
   * @param {string} message - Alert message
   */
  createAlert(type, severity, message) {
    // Check if alert already exists
    const existingAlert = this.alerts.active.find(alert => alert.type === type)
    if (existingAlert) {
      existingAlert.count++
      existingAlert.lastSeen = Date.now()
      return
    }
    
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      createdAt: Date.now(),
      lastSeen: Date.now(),
      count: 1,
      resolved: false
    }
    
    this.alerts.active.push(alert)
    console.warn(`🚨 Performance Alert [${severity.toUpperCase()}]: ${message}`)
    
    // Trigger custom event for UI notifications
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('performance-alert', { detail: alert }))
    }
  }

  /**
   * Clear resolved alerts
   */
  clearResolvedAlerts() {
    const now = Date.now()
    const resolvedAlerts = []
    
    this.alerts.active = this.alerts.active.filter(alert => {
      // Consider alert resolved if it hasn't been seen for 5 minutes
      const isResolved = (now - alert.lastSeen) > 5 * 60 * 1000
      
      if (isResolved) {
        alert.resolved = true
        alert.resolvedAt = now
        resolvedAlerts.push(alert)
        return false
      }
      
      return true
    })
    
    // Move resolved alerts to history
    this.alerts.history.push(...resolvedAlerts)
    
    // Keep alert history manageable
    if (this.alerts.history.length > this.alerts.maxAlerts) {
      this.alerts.history = this.alerts.history.slice(-this.alerts.maxAlerts)
    }
  }

  /**
   * Start performance observation for a specific operation
   * @param {string} operationId - Unique operation identifier
   * @param {string} type - Operation type
   * @returns {Function} Function to end the observation
   */
  startObservation(operationId, type) {
    const observation = {
      id: operationId,
      type,
      startTime: performance.now(),
      startTimestamp: Date.now()
    }
    
    this.observations.set(operationId, observation)
    
    // Return function to end observation
    return (metadata = {}) => {
      this.endObservation(operationId, metadata)
    }
  }

  /**
   * End performance observation
   * @param {string} operationId - Operation identifier
   * @param {Object} metadata - Additional metadata
   */
  endObservation(operationId, metadata = {}) {
    const observation = this.observations.get(operationId)
    if (!observation) {
      console.warn(`⚠️ Observation not found: ${operationId}`)
      return
    }
    
    const duration = performance.now() - observation.startTime
    
    // Record based on operation type
    switch (observation.type) {
      case 'cache':
        this.recordCacheOperation(metadata.operation || 'unknown', duration, metadata)
        break
      case 'sync':
        this.recordSyncOperation(metadata.operation || 'success', duration, metadata)
        break
      case 'prediction':
        this.recordPredictionOperation(metadata.operation || 'generated', metadata)
        break
    }
    
    this.observations.delete(operationId)
  }

  /**
   * Get performance statistics
   * @returns {Object} Performance statistics
   */
  getStats() {
    const currentSnapshot = this.history.snapshots[this.history.snapshots.length - 1]
    const previousSnapshot = this.history.snapshots[this.history.snapshots.length - 2]
    
    // Calculate trends
    const trends = {}
    if (currentSnapshot && previousSnapshot) {
      trends.hitRate = currentSnapshot.metrics.cache.hitRate - previousSnapshot.metrics.cache.hitRate
      trends.avgResponseTime = currentSnapshot.metrics.cache.avgResponseTime - previousSnapshot.metrics.cache.avgResponseTime
      trends.errorRate = currentSnapshot.metrics.system.errorRate - previousSnapshot.metrics.system.errorRate
    }
    
    return {
      current: this.metrics,
      trends,
      alerts: {
        active: this.alerts.active.length,
        total: this.alerts.history.length,
        recent: this.alerts.active.slice(-5)
      },
      history: {
        snapshots: this.history.snapshots.length,
        maxSnapshots: this.history.maxSnapshots,
        oldestSnapshot: this.history.snapshots[0]?.timestamp,
        newestSnapshot: this.history.snapshots[this.history.snapshots.length - 1]?.timestamp
      },
      thresholds: this.thresholds,
      monitoring: {
        enabled: this.monitoring.enabled,
        frequency: this.monitoring.frequency,
        activeObservations: this.observations.size
      }
    }
  }

  /**
   * Get performance report
   * @returns {Object} Detailed performance report
   */
  generateReport() {
    const stats = this.getStats()
    const report = {
      generated: Date.now(),
      summary: {
        overall: this.getOverallHealth(),
        cachePerformance: this.getCachePerformanceRating(),
        syncPerformance: this.getSyncPerformanceRating(),
        predictionAccuracy: this.getPredictionAccuracyRating()
      },
      metrics: stats.current,
      alerts: stats.alerts,
      recommendations: this.generateRecommendations()
    }
    
    return report
  }

  /**
   * Get overall system health rating
   * @returns {string} Health rating (excellent, good, fair, poor)
   */
  getOverallHealth() {
    let score = 100
    
    // Cache performance (40% weight)
    if (this.metrics.cache.hitRate < 0.9) score -= (0.9 - this.metrics.cache.hitRate) * 40
    if (this.metrics.cache.avgResponseTime > 100) score -= Math.min(20, (this.metrics.cache.avgResponseTime - 100) / 10)
    
    // Sync performance (30% weight)
    if (this.metrics.system.errorRate > 0.05) score -= Math.min(30, this.metrics.system.errorRate * 600)
    
    // System resources (20% weight)
    if (this.metrics.system.storageUsage > 0.7) score -= (this.metrics.system.storageUsage - 0.7) * 67
    
    // Prediction accuracy (10% weight)
    if (this.metrics.predictions.accuracy < 0.7) score -= (0.7 - this.metrics.predictions.accuracy) * 10
    
    if (score >= 90) return 'excellent'
    if (score >= 75) return 'good'
    if (score >= 60) return 'fair'
    return 'poor'
  }

  getCachePerformanceRating() {
    if (this.metrics.cache.hitRate >= 0.9 && this.metrics.cache.avgResponseTime <= 100) return 'excellent'
    if (this.metrics.cache.hitRate >= 0.8 && this.metrics.cache.avgResponseTime <= 200) return 'good'
    if (this.metrics.cache.hitRate >= 0.7) return 'fair'
    return 'poor'
  }

  getSyncPerformanceRating() {
    if (this.metrics.system.errorRate <= 0.02 && this.metrics.sync.avgSyncTime <= 2000) return 'excellent'
    if (this.metrics.system.errorRate <= 0.05 && this.metrics.sync.avgSyncTime <= 3000) return 'good'
    if (this.metrics.system.errorRate <= 0.1) return 'fair'
    return 'poor'
  }

  getPredictionAccuracyRating() {
    if (this.metrics.predictions.accuracy >= 0.8) return 'excellent'
    if (this.metrics.predictions.accuracy >= 0.7) return 'good'
    if (this.metrics.predictions.accuracy >= 0.6) return 'fair'
    return 'poor'
  }

  /**
   * Generate performance recommendations
   * @returns {Array} Array of recommendations
   */
  generateRecommendations() {
    const recommendations = []
    
    // Cache recommendations
    if (this.metrics.cache.hitRate < 0.8) {
      recommendations.push({
        type: 'cache',
        priority: 'high',
        title: 'Improve Cache Hit Rate',
        description: 'Consider increasing cache TTL or improving prefetching strategies',
        impact: 'High performance improvement expected'
      })
    }
    
    if (this.metrics.cache.avgResponseTime > 200) {
      recommendations.push({
        type: 'cache',
        priority: 'medium',
        title: 'Optimize Cache Response Time',
        description: 'Enable compression or optimize cache storage format',
        impact: 'Medium performance improvement expected'
      })
    }
    
    // Sync recommendations
    if (this.metrics.system.errorRate > 0.1) {
      recommendations.push({
        type: 'sync',
        priority: 'high',
        title: 'Reduce Sync Error Rate',
        description: 'Improve error handling and retry logic',
        impact: 'Critical for system reliability'
      })
    }
    
    // Storage recommendations
    if (this.metrics.system.storageUsage > 0.8) {
      recommendations.push({
        type: 'storage',
        priority: 'high',
        title: 'Reduce Storage Usage',
        description: 'Enable cache cleanup or increase compression',
        impact: 'Prevents storage quota exceeded errors'
      })
    }
    
    // Prediction recommendations
    if (this.metrics.predictions.accuracy < 0.6) {
      recommendations.push({
        type: 'prediction',
        priority: 'low',
        title: 'Improve Prediction Accuracy',
        description: 'Tune prediction models or collect more behavior data',
        impact: 'Better user experience through smart prefetching'
      })
    }
    
    return recommendations
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = {
      cache: { hits: 0, misses: 0, hitRate: 0, avgResponseTime: 0, totalResponseTime: 0, operations: 0, compressionSavings: 0, evictions: 0 },
      sync: { successfulSyncs: 0, failedSyncs: 0, avgSyncTime: 0, totalSyncTime: 0, networkErrors: 0, retries: 0 },
      predictions: { generated: 0, successful: 0, accuracy: 0, prefetchHits: 0, prefetchMisses: 0 },
      system: { memoryUsage: 0, storageUsage: 0, networkLatency: 0, errorRate: 0 }
    }
    
    this.history.snapshots = []
    this.alerts.active = []
    this.alerts.history = []
    this.observations.clear()
    
    console.log('📊 Performance metrics reset')
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopMonitoring()
    this.reset()
    console.log('🧹 Performance monitor cleaned up')
  }
}

/**
 * Vue composable for performance monitoring
 * @returns {Object} Performance monitoring methods
 */
export function usePerformanceMonitor() {
  const performanceMonitor = new PerformanceMonitor()

  return {
    performanceMonitor,

    /**
     * Record cache operation
     */
    recordCacheOperation(operation, responseTime, metadata = {}) {
      return performanceMonitor.recordCacheOperation(operation, responseTime, metadata)
    },

    /**
     * Record sync operation
     */
    recordSyncOperation(operation, duration, metadata = {}) {
      return performanceMonitor.recordSyncOperation(operation, duration, metadata)
    },

    /**
     * Record prediction operation
     */
    recordPredictionOperation(operation, metadata = {}) {
      return performanceMonitor.recordPredictionOperation(operation, metadata)
    },

    /**
     * Start performance observation
     */
    startObservation(operationId, type) {
      return performanceMonitor.startObservation(operationId, type)
    },

    /**
     * Get performance statistics
     */
    getPerformanceStats() {
      return performanceMonitor.getStats()
    },

    /**
     * Generate performance report
     */
    generatePerformanceReport() {
      return performanceMonitor.generateReport()
    },

    /**
     * Reset metrics
     */
    resetMetrics() {
      performanceMonitor.reset()
    },

    /**
     * Cleanup
     */
    cleanup() {
      performanceMonitor.cleanup()
    }
  }
}