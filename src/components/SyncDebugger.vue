<template>
  <div class="sync-debugger bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-4xl">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">
        🔄 Sync Coordinator Debug
      </h3>
      <div class="flex items-center gap-2">
        <button
          @click="refreshStats"
          class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Refresh
        </button>
        <button
          @click="clearHistory"
          class="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>

    <!-- Network Status -->
    <div class="mb-6">
      <h4 class="text-md font-medium text-gray-800 mb-2">📶 Network Status</h4>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white p-3 rounded border">
          <div class="text-xs text-gray-500 uppercase tracking-wide">Status</div>
          <div class="flex items-center gap-2">
            <div 
              :class="[
                'w-2 h-2 rounded-full',
                stats.networkState.isOnline ? 'bg-green-400' : 'bg-red-400'
              ]"
            ></div>
            <span class="font-medium">
              {{ stats.networkState.isOnline ? 'Online' : 'Offline' }}
            </span>
          </div>
        </div>
        <div class="bg-white p-3 rounded border">
          <div class="text-xs text-gray-500 uppercase tracking-wide">Quality</div>
          <div class="font-medium capitalize">{{ stats.networkState.quality }}</div>
        </div>
        <div class="bg-white p-3 rounded border">
          <div class="text-xs text-gray-500 uppercase tracking-wide">Success Rate</div>
          <div class="font-medium">{{ stats.performance.successRate }}%</div>
        </div>
        <div class="bg-white p-3 rounded border">
          <div class="text-xs text-gray-500 uppercase tracking-wide">Avg Sync Time</div>
          <div class="font-medium">{{ stats.performance.avgSyncTime }}ms</div>
        </div>
      </div>
    </div>

    <!-- Sync State -->
    <div class="mb-6">
      <h4 class="text-md font-medium text-gray-800 mb-2">⚡ Sync State</h4>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white p-3 rounded border">
          <div class="text-xs text-gray-500 uppercase tracking-wide">Syncing</div>
          <div class="flex items-center gap-2">
            <div 
              :class="[
                'w-2 h-2 rounded-full',
                stats.syncState.isSyncing ? 'bg-blue-400 animate-pulse' : 'bg-gray-300'
              ]"
            ></div>
            <span class="font-medium">
              {{ stats.syncState.isSyncing ? 'Active' : 'Idle' }}
            </span>
          </div>
        </div>
        <div class="bg-white p-3 rounded border">
          <div class="text-xs text-gray-500 uppercase tracking-wide">Queued</div>
          <div class="font-medium">{{ stats.syncState.totalQueued }}</div>
        </div>
        <div class="bg-white p-3 rounded border">
          <div class="text-xs text-gray-500 uppercase tracking-wide">In Progress</div>
          <div class="font-medium">{{ stats.syncState.syncInProgress }}</div>
        </div>
        <div class="bg-white p-3 rounded border">
          <div class="text-xs text-gray-500 uppercase tracking-wide">Failed</div>
          <div class="font-medium text-red-600">{{ stats.performance.failedSyncs }}</div>
        </div>
      </div>
    </div>

    <!-- Priority Queues -->
    <div class="mb-6">
      <h4 class="text-md font-medium text-gray-800 mb-2">📋 Priority Queues</h4>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          v-for="(count, priority) in stats.queues" 
          :key="priority"
          class="bg-white p-3 rounded border"
        >
          <div class="text-xs uppercase tracking-wide mb-1" :class="getPriorityColor(priority)">
            {{ priority }}
          </div>
          <div class="font-medium">{{ count }} items</div>
          <div class="w-full bg-gray-200 rounded-full h-1 mt-2">
            <div 
              class="h-1 rounded-full transition-all duration-300"
              :class="getPriorityBarColor(priority)"
              :style="{ width: `${Math.min(count * 20, 100)}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Manual Sync Controls -->
    <div class="mb-6">
      <h4 class="text-md font-medium text-gray-800 mb-2">🎯 Manual Controls</h4>
      <div class="flex flex-wrap gap-2">
        <button
          @click="triggerDepartmentSync"
          :disabled="stats.syncState.isSyncing"
          class="px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Sync Departments
        </button>
        <button
          @click="triggerRssSync"
          :disabled="stats.syncState.isSyncing"
          class="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Sync RSS Feeds
        </button>
        <button
          @click="triggerCriticalSync"
          :disabled="stats.syncState.isSyncing"
          class="px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Critical Sync
        </button>
        <button
          @click="simulateOffline"
          class="px-3 py-2 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
        >
          {{ isSimulatingOffline ? 'Stop' : 'Simulate' }} Offline
        </button>
      </div>
    </div>

    <!-- Last Sync -->
    <div v-if="stats.syncState.lastSuccessfulSync">
      <h4 class="text-md font-medium text-gray-800 mb-2">⏰ Last Successful Sync</h4>
      <div class="bg-white p-3 rounded border text-sm text-gray-600">
        {{ formatTime(stats.syncState.lastSuccessfulSync) }}
      </div>
    </div>

    <!-- Raw Stats (Collapsible) -->
    <div class="mt-6">
      <button
        @click="showRawStats = !showRawStats"
        class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        <span>{{ showRawStats ? '▼' : '▶' }}</span>
        Raw Stats
      </button>
      <div v-if="showRawStats" class="mt-2 bg-gray-900 text-green-400 p-3 rounded text-xs font-mono overflow-auto max-h-60">
        <pre>{{ JSON.stringify(stats, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const stats = ref({
  networkState: { isOnline: true, quality: 'unknown' },
  syncState: { 
    isSyncing: false, 
    lastSuccessfulSync: null, 
    totalQueued: 0, 
    syncInProgress: 0 
  },
  queues: { critical: 0, high: 0, medium: 0, low: 0 },
  performance: { successRate: 100, failedSyncs: 0, avgSyncTime: 0 },
  history: { totalSyncs: 0, recentSyncs: 0 }
})

const showRawStats = ref(false)
const isSimulatingOffline = ref(false)
let refreshInterval = null

// Props
const props = defineProps({
  syncCoordinator: {
    type: Object,
    required: true
  }
})

// Methods
const refreshStats = () => {
  if (props.syncCoordinator) {
    stats.value = props.syncCoordinator.getStats()
  }
}

const clearHistory = () => {
  if (props.syncCoordinator) {
    props.syncCoordinator.reset()
    refreshStats()
  }
}

const triggerDepartmentSync = async () => {
  if (props.syncCoordinator) {
    await props.syncCoordinator.triggerCategorySync('departments', 'high')
    refreshStats()
  }
}

const triggerRssSync = async () => {
  if (props.syncCoordinator) {
    await props.syncCoordinator.triggerCategorySync('rssItems', 'medium')
    refreshStats()
  }
}

const triggerCriticalSync = async () => {
  if (props.syncCoordinator) {
    // Simulate a critical sync
    props.syncCoordinator.queueSync({
      key: `critical-test-${Date.now()}`,
      category: 'preferences',
      fetchFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        return { testData: 'critical sync completed' }
      },
      metadata: { test: true }
    }, 'critical')
    refreshStats()
  }
}

const simulateOffline = () => {
  isSimulatingOffline.value = !isSimulatingOffline.value
  
  if (isSimulatingOffline.value) {
    // Simulate offline by temporarily overriding network state
    if (props.syncCoordinator) {
      props.syncCoordinator.isOnline = false
      props.syncCoordinator.networkQuality = 'offline'
    }
  } else {
    // Restore online state
    if (props.syncCoordinator) {
      props.syncCoordinator.isOnline = navigator.onLine
      props.syncCoordinator.detectNetworkQuality()
    }
  }
  
  refreshStats()
}

const getPriorityColor = (priority) => {
  const colors = {
    critical: 'text-red-600',
    high: 'text-orange-600',
    medium: 'text-blue-600',
    low: 'text-gray-600'
  }
  return colors[priority] || 'text-gray-600'
}

const getPriorityBarColor = (priority) => {
  const colors = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-blue-500',
    low: 'bg-gray-500'
  }
  return colors[priority] || 'bg-gray-500'
}

const formatTime = (timestamp) => {
  if (!timestamp) return 'Never'
  
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) {
    return `${Math.floor(diff / 1000)} seconds ago`
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} minutes ago`
  } else {
    return date.toLocaleString()
  }
}

// Lifecycle
onMounted(() => {
  refreshStats()
  
  // Auto-refresh stats every 2 seconds
  refreshInterval = setInterval(refreshStats, 2000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  
  // Restore online state if simulating offline
  if (isSimulatingOffline.value && props.syncCoordinator) {
    props.syncCoordinator.isOnline = navigator.onLine
    props.syncCoordinator.detectNetworkQuality()
  }
})
</script>

<style scoped>
.sync-debugger {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}
</style>