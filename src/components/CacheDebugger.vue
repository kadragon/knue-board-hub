<template>
  <div class="cache-debugger">
    <div class="debugger-header">
      <h3>🧪 Cache Debugger</h3>
      <button @click="toggleExpanded" class="toggle-btn">
        {{ expanded ? "▼" : "▶" }}
      </button>
    </div>

    <div v-if="expanded" class="debugger-content">
      <!-- Cache Statistics -->
      <div class="stats-section">
        <h4>📊 Cache Statistics</h4>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Total Entries:</span>
            <span class="stat-value">{{ cacheStats.totalEntries }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Size:</span>
            <span class="stat-value">{{ cacheStats.formattedSize }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Utilization:</span>
            <span class="stat-value">{{ cacheStats.utilizationPercent }}%</span>
          </div>
        </div>

        <div class="categories">
          <h5>By Category:</h5>
          <div
            v-for="(category, name) in cacheStats.categories"
            :key="name"
            class="category-item"
          >
            <span class="category-name">{{ name }}:</span>
            <span class="category-stats"
              >{{ category.count }} items,
              {{ formatBytes(category.size) }}</span
            >
          </div>
        </div>
      </div>

      <!-- Sync Coordinator Status -->
      <div class="sync-section">
        <h4>🔄 Sync Coordinator</h4>
        <div class="sync-stats">
          <div class="sync-item">
            <span class="sync-label">Network:</span>
            <span
              class="sync-value"
              :class="{
                online: syncStats.networkState?.isOnline,
                offline: !syncStats.networkState?.isOnline,
              }"
            >
              {{
                syncStats.networkState?.isOnline ? "🟢 Online" : "🔴 Offline"
              }}
              ({{ syncStats.networkState?.quality }})
            </span>
          </div>
          <div class="sync-item">
            <span class="sync-label">Syncing:</span>
            <span class="sync-value">{{
              syncStats.syncState?.isSyncing ? "🔄 Active" : "⏸️ Idle"
            }}</span>
          </div>
          <div class="sync-item">
            <span class="sync-label">Queued:</span>
            <span class="sync-value">{{
              syncStats.syncState?.totalQueued || 0
            }}</span>
          </div>
          <div class="sync-item">
            <span class="sync-label">Success Rate:</span>
            <span class="sync-value"
              >{{ syncStats.performance?.successRate || 100 }}%</span
            >
          </div>
        </div>

        <div class="sync-queues">
          <h5>Priority Queues:</h5>
          <div
            v-for="(count, priority) in syncStats.queues"
            :key="priority"
            class="queue-item"
          >
            <span class="queue-name" :class="`priority-${priority}`"
              >{{ priority }}:</span
            >
            <span class="queue-count">{{ count }}</span>
          </div>
        </div>
      </div>

      <!-- Department Cache Status -->
      <div class="departments-section">
        <h4>📋 Departments Cache</h4>
        <div class="cache-info">
          <div class="info-item">
            <span class="info-label">Loaded:</span>
            <span class="info-value">{{
              departmentStats.departmentsLoaded
            }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Initialized:</span>
            <span class="info-value">{{
              departmentStats.isInitialized ? "✅" : "❌"
            }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Last Fetch:</span>
            <span class="info-value">{{
              formatTime(departmentStats.lastFetch)
            }}</span>
          </div>
        </div>
      </div>

      <!-- RSS Cache Status -->
      <div class="rss-section">
        <h4>📰 RSS Cache</h4>
        <div class="cache-info">
          <div class="info-item">
            <span class="info-label">Feeds Loaded:</span>
            <span class="info-value">{{ rssStats.feedsLoaded }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Active Departments:</span>
            <span class="info-value">{{ rssStats.activeDepartments }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Total Items:</span>
            <span class="info-value">{{ rssStats.totalItems }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Last Update:</span>
            <span class="info-value">{{
              formatTime(rssStats.lastUpdate)
            }}</span>
          </div>
        </div>
      </div>

      <!-- Rehydration Status -->
      <div class="rehydration-section">
        <h4>🔄 Rehydration Status</h4>
        <div class="cache-info">
          <div class="info-item">
            <span class="info-label">Queued:</span>
            <span class="info-value">{{
              rehydrationStats.queuedRehydrations
            }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Background Tasks:</span>
            <span class="info-value">{{
              rehydrationStats.backgroundTasks
            }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Pending Requests:</span>
            <span class="info-value">{{
              rehydrationStats.pendingRequests
            }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Processing:</span>
            <span class="info-value">{{
              rehydrationStats.isProcessingQueue ? "🔄" : "⏸️"
            }}</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="actions-section">
        <button @click="refreshStats" class="action-btn">
          🔄 Refresh Stats
        </button>
        <button @click="clearCache" class="action-btn danger">
          🗑️ Clear Cache
        </button>
        <button @click="runPerformanceTest" class="action-btn">
          ⚡ Performance Test
        </button>
        <button @click="exportCacheData" class="action-btn">
          💾 Export Data
        </button>
      </div>

      <!-- Performance Test Results -->
      <div v-if="performanceResults" class="performance-section">
        <h4>⚡ Performance Results</h4>
        <div class="performance-results">
          <div class="result-item">
            <span class="result-label">Write Speed:</span>
            <span class="result-value"
              >{{ performanceResults.writeSpeed }}ms/op</span
            >
          </div>
          <div class="result-item">
            <span class="result-label">Read Speed:</span>
            <span class="result-value"
              >{{ performanceResults.readSpeed }}ms/op</span
            >
          </div>
          <div class="result-item">
            <span class="result-label">Operations:</span>
            <span class="result-value">{{
              performanceResults.operations
            }}</span>
          </div>
        </div>
      </div>

      <!-- Live Log -->
      <div class="log-section">
        <h4>📝 Cache Activity Log</h4>
        <div class="log-container">
          <div
            v-for="(log, index) in logs"
            :key="index"
            class="log-entry"
            :class="log.type"
          >
            <span class="log-time">{{ formatLogTime(log.timestamp) }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
        <button @click="clearLogs" class="action-btn small">Clear Logs</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useDepartments } from "../composables/useDepartments.js";
import { useRssFeed } from "../composables/useRssFeed.js";
import { useCache } from "../services/cacheManager.js";

const expanded = ref(false);
const cacheStats = ref({});
const departmentStats = ref({});
const rssStats = ref({});
const rehydrationStats = ref({});
const syncStats = ref({});
const performanceResults = ref(null);
const logs = ref([]);

const { getDepartmentCacheStats, getSyncCoordinator } = useDepartments();
const { getRssCacheStats } = useRssFeed();
const { getCacheStats, clearCache: clearCacheManager } = useCache();

let refreshInterval = null;

const toggleExpanded = () => {
  expanded.value = !expanded.value;
};

const refreshStats = async () => {
  try {
    // Get cache statistics
    cacheStats.value = getCacheStats();

    // Get department statistics
    departmentStats.value = getDepartmentCacheStats();

    // Get RSS statistics
    rssStats.value = getRssCacheStats();

    // Get rehydration statistics
    rehydrationStats.value = rssStats.value.rehydrationManager || {};

    // Get sync coordinator statistics
    const syncCoordinator = getSyncCoordinator();
    if (syncCoordinator) {
      syncStats.value = syncCoordinator.getStats();
    }

    addLog("📊 Statistics refreshed", "info");
  } catch (error) {
    addLog(`❌ Stats refresh failed: ${error.message}`, "error");
  }
};

const clearCache = async () => {
  if (confirm("Are you sure you want to clear all cache data?")) {
    try {
      clearCacheManager();
      await refreshStats();
      addLog("🗑️ Cache cleared successfully", "success");
    } catch (error) {
      addLog(`❌ Cache clear failed: ${error.message}`, "error");
    }
  }
};

const runPerformanceTest = async () => {
  addLog("⚡ Starting performance test...", "info");

  const iterations = 50;
  const testData = { test: "performance", items: new Array(20).fill("data") };

  try {
    // Test write performance
    const writeStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      localStorage.setItem(
        `knue-board-hub:perf-test-${i}`,
        JSON.stringify({
          data: testData,
          timestamp: Date.now(),
          category: "performance",
        })
      );
    }
    const writeTime = performance.now() - writeStart;

    // Test read performance
    const readStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      const stored = localStorage.getItem(`knue-board-hub:perf-test-${i}`);
      if (stored) JSON.parse(stored);
    }
    const readTime = performance.now() - readStart;

    // Clean up
    for (let i = 0; i < iterations; i++) {
      localStorage.removeItem(`knue-board-hub:perf-test-${i}`);
    }

    performanceResults.value = {
      writeSpeed: (writeTime / iterations).toFixed(2),
      readSpeed: (readTime / iterations).toFixed(2),
      operations: iterations,
    };

    addLog(
      `⚡ Performance test completed: ${performanceResults.value.writeSpeed}ms write, ${performanceResults.value.readSpeed}ms read`,
      "success"
    );
  } catch (error) {
    addLog(`❌ Performance test failed: ${error.message}`, "error");
  }
};

const exportCacheData = () => {
  try {
    const data = {
      timestamp: new Date().toISOString(),
      cacheStats: cacheStats.value,
      departmentStats: departmentStats.value,
      rssStats: rssStats.value,
      rehydrationStats: rehydrationStats.value,
      logs: logs.value,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cache-debug-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addLog("💾 Cache data exported successfully", "success");
  } catch (error) {
    addLog(`❌ Export failed: ${error.message}`, "error");
  }
};

const clearLogs = () => {
  logs.value = [];
};

const addLog = (message, type = "info") => {
  logs.value.unshift({
    timestamp: Date.now(),
    message,
    type,
  });

  // Keep only last 50 logs
  if (logs.value.length > 50) {
    logs.value = logs.value.slice(0, 50);
  }
};

const formatBytes = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatTime = (timestamp) => {
  if (!timestamp) return "Never";
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) return `${Math.round(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
  return `${Math.round(diff / 3600000)}h ago`;
};

const formatLogTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString();
};

// Listen for cross‑tab localStorage changes and update stats/logs
const watchStorageChanges = () => {
  const handler = (event) => {
    // Only react to our namespace keys
    if (!event.key || !event.key.startsWith("knue-board-hub")) return;

    // Refresh stats to reflect the latest cache state
    refreshStats();
    addLog(`🗂️ Storage change detected: ${event.key}`, "cache");
  };

  // Register listener
  window.addEventListener("storage", handler);

  // Cleanup when component is unmounted
  onUnmounted(() => {
    window.removeEventListener("storage", handler);
  });
};

// Create a logging wrapper for cache operations
const createCacheLogger = () => {
  // Retrieve the cache manager instance
  const cacheManager = useCache();

  // If the cache manager already exposes an internal logging hook, prefer that
  if (cacheManager.enableLogging) {
    cacheManager.enableLogging((operation, key, details) => {
      const message = details
        ? `${operation}: ${key} (${details})`
        : `${operation}: ${key}`;
      addLog(`💾 ${message}`, "cache");
    });
    return cacheManager;
  }

  // Otherwise, transparently proxy every function call so we can inject logging
  return new Proxy(cacheManager, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      if (typeof value === "function") {
        return (...args) => {
          // Heuristic: the first argument is usually the cache key
          const key = args[0];
          addLog(`💾 ${String(prop)}: ${key}`, "cache");
          return value.apply(target, args);
        };
      }

      return value;
    },
  });
};

createCacheLogger(); // Initialize cache logger

onMounted(async () => {
  await refreshStats();
  watchStorageChanges();

  // Auto-refresh every 10 seconds
  refreshInterval = setInterval(refreshStats, 10000);

  addLog("🧪 Cache Debugger initialized", "info");
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped>
.cache-debugger {
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  border-radius: 8px;
  padding: 12px;
  font-family: "Monaco", "Menlo", monospace;
  font-size: 12px;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  z-index: 9999;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.debugger-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.debugger-header h3 {
  margin: 0;
  font-size: 14px;
}

.toggle-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.stat-item,
.info-item,
.result-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.stat-label,
.info-label,
.result-label {
  color: #ccc;
}

.stat-value,
.info-value,
.result-value {
  font-weight: bold;
  color: #4ade80;
}

.categories {
  margin-top: 8px;
}

.category-item {
  padding: 2px 0;
  font-size: 11px;
}

.category-name {
  color: #fbbf24;
  font-weight: bold;
}

.departments-section,
.rss-section,
.rehydration-section,
.performance-section {
  margin-top: 16px;
  padding-top: 8px;
  border-top: 1px solid #333;
}

.departments-section h4,
.rss-section h4,
.rehydration-section h4,
.performance-section h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #60a5fa;
}

.actions-section {
  margin-top: 16px;
  padding-top: 8px;
  border-top: 1px solid #333;
}

.action-btn {
  background: #374151;
  border: 1px solid #4b5563;
  color: white;
  padding: 4px 8px;
  margin: 2px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
}

.action-btn:hover {
  background: #4b5563;
}

.action-btn.danger {
  background: #dc2626;
  border-color: #ef4444;
}

.action-btn.danger:hover {
  background: #ef4444;
}

.action-btn.small {
  font-size: 9px;
  padding: 2px 6px;
}

.log-section {
  margin-top: 16px;
  padding-top: 8px;
  border-top: 1px solid #333;
}

.log-container {
  max-height: 200px;
  overflow-y: auto;
  background: #111;
  padding: 8px;
  border-radius: 4px;
  margin: 8px 0;
}

.log-entry {
  padding: 2px 0;
  font-size: 10px;
  display: flex;
  gap: 8px;
}

.log-entry.info {
  color: #60a5fa;
}

.log-entry.success {
  color: #4ade80;
}

.log-entry.error {
  color: #f87171;
}

.log-entry.cache {
  color: #fbbf24;
}

.log-time {
  color: #6b7280;
  min-width: 60px;
}

.log-message {
  flex: 1;
}

/* Sync Coordinator Styles */
.sync-section {
  margin-bottom: 16px;
  padding: 8px;
  border: 1px solid #333;
  border-radius: 4px;
}

.sync-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.sync-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.sync-label {
  color: #ccc;
}

.sync-value {
  font-weight: bold;
  color: #4ade80;
}

.sync-value.online {
  color: #4ade80;
}

.sync-value.offline {
  color: #f87171;
}

.sync-queues {
  margin-top: 8px;
}

.queue-item {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  font-size: 11px;
}

.queue-name {
  text-transform: capitalize;
  font-weight: bold;
}

.queue-name.priority-critical {
  color: #f87171;
}

.queue-name.priority-high {
  color: #fb923c;
}

.queue-name.priority-medium {
  color: #60a5fa;
}

.queue-name.priority-low {
  color: #6b7280;
}

.queue-count {
  color: #4ade80;
  font-weight: bold;
}
</style>
