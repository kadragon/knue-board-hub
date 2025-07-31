<template>
  <div class="phase4-dashboard">
    <div class="dashboard-header">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">
        🚀 Phase 4: Performance Optimization Dashboard
      </h2>
      <div class="flex gap-2 mb-6">
        <button
          @click="refreshAllStats"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          🔄 Refresh All
        </button>
        <button
          @click="resetAllMetrics"
          class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          🗑️ Reset Metrics
        </button>
        <button
          @click="generateReport"
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          📊 Generate Report
        </button>
      </div>
    </div>

    <!-- Performance Overview -->
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      <!-- Overall Health -->
      <div class="performance-card">
        <div class="card-header">
          <h3 class="text-lg font-semibold">🏥 System Health</h3>
        </div>
        <div class="card-content">
          <div class="health-indicator" :class="`health-${overallHealth}`">
            {{ overallHealth.toUpperCase() }}
          </div>
          <div class="text-sm text-gray-600 mt-2">
            {{ getHealthDescription(overallHealth) }}
          </div>
        </div>
      </div>

      <!-- Cache Performance -->
      <div class="performance-card">
        <div class="card-header">
          <h3 class="text-lg font-semibold">💾 Cache Performance</h3>
        </div>
        <div class="card-content">
          <div class="metric">
            <span class="metric-label">Hit Rate:</span>
            <span class="metric-value">{{ Math.round((performanceStats.current?.cache?.hitRate || 0) * 100) }}%</span>
          </div>
          <div class="metric">
            <span class="metric-label">Avg Response:</span>
            <span class="metric-value">{{ Math.round(performanceStats.current?.cache?.avgResponseTime || 0) }}ms</span>
          </div>
          <div class="metric">
            <span class="metric-label">Compression:</span>
            <span class="metric-value">{{ compressionStats.averageCompressionPercent || 0 }}% saved</span>
          </div>
        </div>
      </div>

      <!-- Sync Performance -->
      <div class="performance-card">
        <div class="card-header">
          <h3 class="text-lg font-semibold">🔄 Sync Performance</h3>
        </div>
        <div class="card-content">
          <div class="metric">
            <span class="metric-label">Success Rate:</span>
            <span class="metric-value">{{ syncSuccessRate }}%</span>
          </div>
          <div class="metric">
            <span class="metric-label">Avg Time:</span>
            <span class="metric-value">{{ Math.round(performanceStats.current?.sync?.avgSyncTime || 0) }}ms</span>
          </div>
          <div class="metric">
            <span class="metric-label">Queue Length:</span>
            <span class="metric-value">{{ syncStats.syncState?.totalQueued || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- Predictive Loading -->
      <div class="performance-card">
        <div class="card-header">
          <h3 class="text-lg font-semibold">🔮 Predictive Loading</h3>
        </div>
        <div class="card-content">
          <div class="metric">
            <span class="metric-label">Accuracy:</span>
            <span class="metric-value">{{ Math.round((performanceStats.current?.predictions?.accuracy || 0) * 100) }}%</span>
          </div>
          <div class="metric">
            <span class="metric-label">Prefetch Hits:</span>
            <span class="metric-value">{{ performanceStats.current?.predictions?.prefetchHits || 0 }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Predictions:</span>
            <span class="metric-value">{{ performanceStats.current?.predictions?.generated || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Advanced Features Section -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
      <!-- Conflict Resolution -->
      <div class="feature-section">
        <h3 class="text-xl font-semibold mb-4">🔀 Conflict Resolution</h3>
        <div class="bg-white rounded-lg border p-4">
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Total Conflicts:</span>
              <span class="stat-value">{{ conflictStats.totalConflicts || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Resolution Rate:</span>
              <span class="stat-value">{{ conflictStats.successRate || 100 }}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Most Used Strategy:</span>
              <span class="stat-value">{{ getMostUsedStrategy() }}</span>
            </div>
          </div>
          
          <div class="mt-4">
            <h4 class="font-medium mb-2">Resolution Strategies Used:</h4>
            <div class="strategy-list">
              <div 
                v-for="(count, strategy) in conflictStats.strategiesUsed" 
                :key="strategy"
                class="strategy-item"
              >
                <span class="strategy-name">{{ strategy.replace('_', ' ') }}:</span>
                <span class="strategy-count">{{ count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- User Behavior Tracking -->
      <div class="feature-section">
        <h3 class="text-xl font-semibold mb-4">📊 User Behavior Analytics</h3>
        <div class="bg-white rounded-lg border p-4">
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Session Duration:</span>
              <span class="stat-value">{{ predictiveStats.session?.durationFormatted || '0s' }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Interactions:</span>
              <span class="stat-value">{{ predictiveStats.session?.interactions || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Unique Departments:</span>
              <span class="stat-value">{{ predictiveStats.session?.uniqueDepartments || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Page Views:</span>
              <span class="stat-value">{{ predictiveStats.behavior?.totalPageViews || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Time Patterns:</span>
              <span class="stat-value">{{ predictiveStats.behavior?.timePatterns || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Sequence Patterns:</span>
              <span class="stat-value">{{ predictiveStats.behavior?.sequencePatterns || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Alerts -->
    <div v-if="performanceStats.alerts?.recent?.length > 0" class="mb-8">
      <h3 class="text-xl font-semibold mb-4">🚨 Performance Alerts</h3>
      <div class="alerts-container">
        <div 
          v-for="alert in performanceStats.alerts.recent" 
          :key="alert.id"
          class="alert-item"
          :class="`alert-${alert.severity}`"
        >
          <div class="alert-header">
            <span class="alert-type">{{ alert.type.replace('_', ' ').toUpperCase() }}</span>
            <span class="alert-severity">{{ alert.severity.toUpperCase() }}</span>
          </div>
          <div class="alert-message">{{ alert.message }}</div>
          <div class="alert-meta">
            Count: {{ alert.count }} | Last seen: {{ formatTime(alert.lastSeen) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Recommendations -->
    <div v-if="recommendations.length > 0" class="mb-8">
      <h3 class="text-xl font-semibold mb-4">💡 Performance Recommendations</h3>
      <div class="recommendations-container">
        <div 
          v-for="(rec, index) in recommendations" 
          :key="index"
          class="recommendation-item"
          :class="`priority-${rec.priority}`"
        >
          <div class="recommendation-header">
            <h4 class="recommendation-title">{{ rec.title }}</h4>
            <span class="recommendation-priority">{{ rec.priority.toUpperCase() }}</span>
          </div>
          <div class="recommendation-description">{{ rec.description }}</div>
          <div class="recommendation-impact">Expected Impact: {{ rec.impact }}</div>
        </div>
      </div>
    </div>

    <!-- Detailed Metrics Tables -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <!-- Cache Metrics Detail -->
      <div class="metrics-table">
        <h3 class="text-xl font-semibold mb-4">📈 Cache Metrics Detail</h3>
        <div class="bg-white rounded-lg border overflow-hidden">
          <table class="w-full">
            <tbody>
              <tr>
                <td class="table-cell">Total Operations</td>
                <td class="table-cell">{{ performanceStats.current?.cache?.operations || 0 }}</td>
              </tr>
              <tr>
                <td class="table-cell">Cache Hits</td>
                <td class="table-cell">{{ performanceStats.current?.cache?.hits || 0 }}</td>
              </tr>
              <tr>
                <td class="table-cell">Cache Misses</td>
                <td class="table-cell">{{ performanceStats.current?.cache?.misses || 0 }}</td>
              </tr>
              <tr>
                <td class="table-cell">Evictions</td>
                <td class="table-cell">{{ performanceStats.current?.cache?.evictions || 0 }}</td>
              </tr>
              <tr>
                <td class="table-cell">Compression Savings</td>
                <td class="table-cell">{{ formatBytes(compressionStats.totalSavings || 0) }}</td>
              </tr>
              <tr>
                <td class="table-cell">Total Compressions</td>
                <td class="table-cell">{{ compressionStats.totalCompressions || 0 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- System Metrics Detail -->
      <div class="metrics-table">
        <h3 class="text-xl font-semibold mb-4">🖥️ System Metrics Detail</h3>
        <div class="bg-white rounded-lg border overflow-hidden">
          <table class="w-full">
            <tbody>
              <tr>
                <td class="table-cell">Memory Usage</td>
                <td class="table-cell">{{ Math.round((performanceStats.current?.system?.memoryUsage || 0) * 100) }}%</td>
              </tr>
              <tr>
                <td class="table-cell">Storage Usage</td>
                <td class="table-cell">{{ Math.round((performanceStats.current?.system?.storageUsage || 0) * 100) }}%</td>
              </tr>
              <tr>
                <td class="table-cell">Network Latency</td>
                <td class="table-cell">{{ Math.round(performanceStats.current?.system?.networkLatency || 0) }}ms</td>
              </tr>
              <tr>
                <td class="table-cell">Error Rate</td>
                <td class="table-cell">{{ Math.round((performanceStats.current?.system?.errorRate || 0) * 100) }}%</td>
              </tr>
              <tr>
                <td class="table-cell">Active Alerts</td>
                <td class="table-cell">{{ performanceStats.alerts?.active || 0 }}</td>
              </tr>
              <tr>
                <td class="table-cell">Total Alert History</td>
                <td class="table-cell">{{ performanceStats.alerts?.total || 0 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Debug Actions -->
    <div class="mt-8 p-4 bg-gray-50 rounded-lg">
      <h3 class="text-lg font-semibold mb-4">🔧 Debug Actions</h3>
      <div class="flex flex-wrap gap-2">
        <button
          @click="triggerCacheTest"
          class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Cache Operations
        </button>
        <button
          @click="triggerSyncTest"
          class="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
        >
          Test Sync Operations
        </button>
        <button
          @click="triggerPredictionTest"
          class="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Test Predictions
        </button>
        <button
          @click="clearBehaviorData"
          class="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Clear Behavior Data
        </button>
        <button
          @click="exportData"
          class="px-3 py-1 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600"
        >
          Export Performance Data
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDepartments } from '../composables/useDepartments.js'
import { useCache } from '../services/cacheManager.js'
import { usePerformanceMonitor } from '../services/performanceMonitor.js'
import { useConflictResolver } from '../services/conflictResolver.js'
import { usePredictiveLoader } from '../services/predictiveLoader.js'

// Reactive data
const performanceStats = ref({})
const syncStats = ref({})
const conflictStats = ref({})
const predictiveStats = ref({})
const compressionStats = ref({})
const overallHealth = ref('unknown')
const recommendations = ref([])

// Composables
const { getSyncCoordinator, getDepartmentCacheStats } = useDepartments()
const { getCacheStats } = useCache()
const { 
  performanceMonitor, 
  getPerformanceStats, 
  generatePerformanceReport,
  resetMetrics 
} = usePerformanceMonitor()
const { conflictResolver, getConflictStats } = useConflictResolver()

// Auto-refresh interval
let refreshInterval = null

// Computed properties
const syncSuccessRate = computed(() => {
  const successful = performanceStats.value.current?.sync?.successfulSyncs || 0
  const failed = performanceStats.value.current?.sync?.failedSyncs || 0
  const total = successful + failed
  return total > 0 ? Math.round((successful / total) * 100) : 100
})

// Methods
const refreshAllStats = async () => {
  try {
    // Get all statistics
    performanceStats.value = getPerformanceStats()
    conflictStats.value = getConflictStats()
    
    // Get sync coordinator stats
    const syncCoordinator = getSyncCoordinator()
    if (syncCoordinator) {
      syncStats.value = syncCoordinator.getStats()
    }
    
    // Get cache stats with compression info
    const cacheStats = getCacheStats()
    compressionStats.value = cacheStats.compression || {}
    
    // Generate performance report for recommendations
    const report = generatePerformanceReport()
    overallHealth.value = report.summary.overall
    recommendations.value = report.recommendations
    
    console.log('📊 Phase 4 Dashboard refreshed')
  } catch (error) {
    console.error('❌ Failed to refresh Phase 4 stats:', error)
  }
}

const resetAllMetrics = () => {
  if (confirm('Are you sure you want to reset all performance metrics?')) {
    resetMetrics()
    conflictResolver.clearHistory()
    refreshAllStats()
  }
}

const generateReport = () => {
  const report = generatePerformanceReport()
  console.log('📊 Performance Report:', report)
  
  // Download report as JSON
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const triggerCacheTest = async () => {
  console.log('🧪 Running cache performance test...')
  
  // Simulate cache operations
  for (let i = 0; i < 10; i++) {
    const startTime = performance.now()
    
    // Simulate cache hit/miss
    const isHit = Math.random() > 0.3
    const responseTime = Math.random() * 200 + 50
    
    performanceMonitor.recordCacheOperation(
      isHit ? 'hit' : 'miss',
      responseTime,
      { compressionSavings: isHit ? Math.random() * 1000 : 0 }
    )
    
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  refreshAllStats()
}

const triggerSyncTest = async () => {
  console.log('🧪 Running sync performance test...')
  
  // Simulate sync operations
  for (let i = 0; i < 5; i++) {
    const startTime = performance.now()
    const duration = Math.random() * 2000 + 500
    const isSuccess = Math.random() > 0.2
    
    performanceMonitor.recordSyncOperation(
      isSuccess ? 'success' : 'failure',
      duration,
      { networkError: !isSuccess && Math.random() > 0.5 }
    )
    
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  refreshAllStats()
}

const triggerPredictionTest = () => {
  console.log('🧪 Running prediction test...')
  
  // Simulate prediction operations
  for (let i = 0; i < 3; i++) {
    performanceMonitor.recordPredictionOperation('generated')
    
    // Simulate prediction hits/misses
    const isHit = Math.random() > 0.4
    performanceMonitor.recordPredictionOperation(isHit ? 'hit' : 'miss')
  }
  
  refreshAllStats()
}

const clearBehaviorData = () => {
  if (confirm('Clear all user behavior data?')) {
    // Clear predictive loader behavior data if available
    console.log('🧹 Clearing behavior data...')
    refreshAllStats()
  }
}

const exportData = () => {
  const exportData = {
    timestamp: Date.now(),
    performance: performanceStats.value,
    conflicts: conflictStats.value,
    sync: syncStats.value,
    predictions: predictiveStats.value,
    compression: compressionStats.value
  }
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `phase4-data-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// Utility methods
const getMostUsedStrategy = () => {
  if (!conflictStats.value.strategiesUsed) return 'none'
  
  const strategies = conflictStats.value.strategiesUsed
  const mostUsed = Object.keys(strategies).reduce((a, b) => 
    strategies[a] > strategies[b] ? a : b, 'none'
  )
  
  return mostUsed.replace('_', ' ')
}

const getHealthDescription = (health) => {
  const descriptions = {
    excellent: 'All systems performing optimally',
    good: 'Performance is above average',
    fair: 'Some areas need attention',
    poor: 'Critical issues detected',
    unknown: 'Collecting performance data...'
  }
  return descriptions[health] || descriptions.unknown
}

const formatTime = (timestamp) => {
  if (!timestamp) return 'Unknown'
  
  const diff = Date.now() - timestamp
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return new Date(timestamp).toLocaleTimeString()
}

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Lifecycle
onMounted(async () => {
  await refreshAllStats()
  
  // Auto-refresh every 30 seconds
  refreshInterval = setInterval(refreshAllStats, 30000)
  
  // Listen for performance alerts
  window.addEventListener('performance-alert', (event) => {
    console.log('🚨 Performance Alert:', event.detail)
  })
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.phase4-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.performance-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.card-header {
  background: #f9fafb;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.card-content {
  padding: 1rem;
}

.health-indicator {
  font-size: 1.2rem;
  font-weight: bold;
  padding: 0.5rem;
  border-radius: 4px;
  text-align: center;
}

.health-excellent { background: #d1fae5; color: #065f46; }
.health-good { background: #dbeafe; color: #1e40af; }
.health-fair { background: #fef3c7; color: #92400e; }
.health-poor { background: #fee2e2; color: #991b1b; }
.health-unknown { background: #f3f4f6; color: #6b7280; }

.metric {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.metric-label {
  color: #6b7280;
  font-size: 0.875rem;
}

.metric-value {
  font-weight: 600;
  color: #1f2937;
}

.feature-section {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.stat-label {
  color: #6b7280;
  font-size: 0.875rem;
}

.stat-value {
  font-weight: 600;
  color: #1f2937;
}

.strategy-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.strategy-item {
  background: #e5e7eb;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.strategy-name {
  text-transform: capitalize;
  margin-right: 0.25rem;
}

.strategy-count {
  font-weight: 600;
}

.alerts-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.alert-item {
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid;
}

.alert-info {
  background: #eff6ff;
  border-left-color: #3b82f6;
}

.alert-warning {
  background: #fffbeb;
  border-left-color: #f59e0b;
}

.alert-critical {
  background: #fef2f2;
  border-left-color: #ef4444;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.alert-message {
  margin-bottom: 0.5rem;
}

.alert-meta {
  font-size: 0.75rem;
  color: #6b7280;
}

.recommendations-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recommendation-item {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 1rem;
  border-left: 4px solid;
}

.priority-high {
  border-left-color: #ef4444;
}

.priority-medium {
  border-left-color: #f59e0b;
}

.priority-low {
  border-left-color: #3b82f6;
}

.recommendation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.recommendation-title {
  font-weight: 600;
  font-size: 1.1rem;
}

.recommendation-priority {
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.recommendation-description {
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.recommendation-impact {
  font-size: 0.875rem;
  font-style: italic;
  color: #059669;
}

.metrics-table table {
  border-collapse: collapse;
}

.table-cell {
  padding: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.table-cell:first-child {
  font-weight: 500;
  color: #6b7280;
  background: #f9fafb;
}

.table-cell:last-child {
  font-weight: 600;
  text-align: right;
}
</style>