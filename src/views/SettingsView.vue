<template>
  <div class="settings-view">
    <div class="container-mobile section-spacing">
      <!-- Header -->
      <header class="view-header">
        <div class="header-content">
          <h1 class="view-title">
            <i class="i-tabler-settings w-6 h-6 mr-3 text-knue-primary" />
            설정
          </h1>
          <p class="view-description">
            앱 사용 환경을 맞춤 설정하세요
          </p>
        </div>
      </header>

      <!-- Settings Sections -->
      <main class="main-content">
        <!-- General Settings -->
        <section class="settings-section">
          <div class="section-header">
            <h2 class="section-title">
              <i class="i-tabler-adjustments w-5 h-5 mr-2" />
              일반 설정
            </h2>
          </div>
          
          <div class="settings-list">
            <div class="setting-item">
              <div class="setting-info">
                <h3 class="setting-title">자동 새로고침</h3>
                <p class="setting-description">게시판을 자동으로 새로고침합니다</p>
              </div>
              <label class="toggle-switch">
                <input
                  v-model="settings.autoRefresh"
                  type="checkbox"
                  class="toggle-input"
                />
                <span class="toggle-slider" />
              </label>
            </div>

            <div v-if="settings.autoRefresh" class="setting-item sub-setting">
              <div class="setting-info">
                <h3 class="setting-title">새로고침 간격</h3>
                <p class="setting-description">{{ getRefreshIntervalLabel(settings.refreshInterval) }}</p>
              </div>
              <select
                v-model="settings.refreshInterval"
                class="setting-select"
              >
                <option :value="1 * 60 * 1000">1분</option>
                <option :value="5 * 60 * 1000">5분</option>
                <option :value="10 * 60 * 1000">10분</option>
                <option :value="30 * 60 * 1000">30분</option>
              </select>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <h3 class="setting-title">내용 미리보기</h3>
                <p class="setting-description">게시글 내용을 미리 보여줍니다</p>
              </div>
              <label class="toggle-switch">
                <input
                  v-model="settings.showDescriptions"
                  type="checkbox"
                  class="toggle-input"
                />
                <span class="toggle-slider" />
              </label>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <h3 class="setting-title">날짜별 그룹화</h3>
                <p class="setting-description">게시글을 날짜별로 그룹화합니다</p>
              </div>
              <label class="toggle-switch">
                <input
                  v-model="settings.groupByDate"
                  type="checkbox"
                  class="toggle-input"
                />
                <span class="toggle-slider" />
              </label>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <h3 class="setting-title">무한 스크롤</h3>
                <p class="setting-description">스크롤하면 자동으로 더 많은 게시글을 로드합니다</p>
              </div>
              <label class="toggle-switch">
                <input
                  v-model="settings.infiniteScroll"
                  type="checkbox"
                  class="toggle-input"
                />
                <span class="toggle-slider" />
              </label>
            </div>
          </div>
        </section>

        <!-- Display Settings -->
        <section class="settings-section">
          <div class="section-header">
            <h2 class="section-title">
              <i class="i-tabler-palette w-5 h-5 mr-2" />
              화면 설정
            </h2>
          </div>
          
          <div class="settings-list">

            <div class="setting-item">
              <div class="setting-info">
                <h3 class="setting-title">글자 크기</h3>
                <p class="setting-description">{{ getFontSizeLabel(settings.fontSize) }}</p>
              </div>
              <div class="font-size-controls">
                <button
                  @click="adjustFontSize(-1)"
                  :disabled="settings.fontSize <= 0"
                  class="font-size-btn"
                >
                  <i class="i-tabler-minus w-4 h-4" />
                </button>
                <span class="font-size-value">{{ settings.fontSize }}</span>
                <button
                  @click="adjustFontSize(1)"
                  :disabled="settings.fontSize >= 4"
                  class="font-size-btn"
                >
                  <i class="i-tabler-plus w-4 h-4" />
                </button>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <h3 class="setting-title">컴팩트 모드</h3>
                <p class="setting-description">더 많은 정보를 한 번에 표시합니다</p>
              </div>
              <label class="toggle-switch">
                <input
                  v-model="settings.compactMode"
                  type="checkbox"
                  class="toggle-input"
                />
                <span class="toggle-slider" />
              </label>
            </div>
          </div>
        </section>

        <!-- Notification Settings -->
        <section class="settings-section">
          <div class="section-header">
            <h2 class="section-title">
              <i class="i-tabler-bell w-5 h-5 mr-2" />
              알림 설정
            </h2>
          </div>
          
          <div class="settings-list">
            <div class="setting-item">
              <div class="setting-info">
                <h3 class="setting-title">새 게시글 알림</h3>
                <p class="setting-description">새로운 게시글이 올라오면 알림을 받습니다</p>
              </div>
              <label class="toggle-switch">
                <input
                  v-model="settings.notifications.newPosts"
                  type="checkbox"
                  class="toggle-input"
                />
                <span class="toggle-slider" />
              </label>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <h3 class="setting-title">업데이트 알림</h3>
                <p class="setting-description">앱 업데이트 정보를 알려줍니다</p>
              </div>
              <label class="toggle-switch">
                <input
                  v-model="settings.notifications.updates"
                  type="checkbox"
                  class="toggle-input"
                />
                <span class="toggle-slider" />
              </label>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <h3 class="setting-title">알림 위치</h3>
                <p class="setting-description">알림이 표시될 위치를 선택하세요</p>
              </div>
              <select
                v-model="settings.notifications.position"
                class="setting-select"
              >
                <option value="top-right">우측 상단</option>
                <option value="top-left">좌측 상단</option>
                <option value="bottom-right">우측 하단</option>
                <option value="bottom-left">좌측 하단</option>
              </select>
            </div>
          </div>
        </section>

        <!-- Data & Privacy -->
        <section class="settings-section">
          <div class="section-header">
            <h2 class="section-title">
              <i class="i-tabler-database w-5 h-5 mr-2" />
              데이터 및 개인정보
            </h2>
          </div>
          
          <div class="settings-list">
            <div class="setting-item">
              <div class="setting-info">
                <h3 class="setting-title">캐시 자동 정리</h3>
                <p class="setting-description">오래된 캐시 데이터를 자동으로 삭제합니다</p>
              </div>
              <label class="toggle-switch">
                <input
                  v-model="settings.autoClearCache"
                  type="checkbox"
                  class="toggle-input"
                />
                <span class="toggle-slider" />
              </label>
            </div>

            <div class="setting-item action-item">
              <div class="setting-info">
                <h3 class="setting-title">캐시 지우기</h3>
                <p class="setting-description">저장된 캐시 데이터를 모두 삭제합니다</p>
              </div>
              <button
                @click="clearCache"
                :disabled="clearingCache"
                class="action-button secondary"
              >
                <i v-if="clearingCache" class="i-tabler-loader-2 w-4 h-4 animate-spin mr-2" />
                <i v-else class="i-tabler-trash w-4 h-4 mr-2" />
                {{ clearingCache ? '삭제 중...' : '지우기' }}
              </button>
            </div>

            <div class="setting-item action-item">
              <div class="setting-info">
                <h3 class="setting-title">설정 초기화</h3>
                <p class="setting-description">모든 설정을 기본 값으로 되돌립니다</p>
              </div>
              <button
                @click="resetSettings"
                :disabled="resettingSettings"
                class="action-button danger"
              >
                <i v-if="resettingSettings" class="i-tabler-loader-2 w-4 h-4 animate-spin mr-2" />
                <i v-else class="i-tabler-refresh w-4 h-4 mr-2" />
                {{ resettingSettings ? '초기화 중...' : '초기화' }}
              </button>
            </div>
          </div>
        </section>

        <!-- Save Button -->
        <div class="save-section">
          <button
            @click="saveSettings"
            :disabled="!hasChanges || savingSettings"
            class="save-button"
            :class="{ 'has-changes': hasChanges }"
          >
            <i v-if="savingSettings" class="i-tabler-loader-2 w-5 h-5 animate-spin mr-2" />
            <i v-else class="i-tabler-device-floppy w-5 h-5 mr-2" />
            {{ savingSettings ? '저장 중...' : '설정 저장' }}
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useGlobalNotifications } from '../composables/useNotifications.js'

// Composables
const { showSuccess, showWarning, showError } = useGlobalNotifications()

// State
const settings = reactive({
  // General
  autoRefresh: false,
  refreshInterval: 5 * 60 * 1000, // 5 minutes
  showDescriptions: true,
  groupByDate: false,
  infiniteScroll: true,
  
  // Display
  fontSize: 2, // 0-4 scale
  compactMode: false,
  
  // Notifications
  notifications: {
    newPosts: true,
    updates: true,
    position: 'top-right'
  },
  
  // Data
  autoClearCache: true
})

const originalSettings = ref({})
const savingSettings = ref(false)
const clearingCache = ref(false)
const resettingSettings = ref(false)

// Computed
const hasChanges = computed(() => {
  return JSON.stringify(settings) !== JSON.stringify(originalSettings.value)
})

// Methods
function getRefreshIntervalLabel(interval) {
  const minutes = interval / (60 * 1000)
  return `${minutes}분마다 새로고침`
}

function getFontSizeLabel(size) {
  const labels = {
    0: '매우 작게',
    1: '작게',
    2: '보통',
    3: '크게',
    4: '매우 크게'
  }
  return labels[size] || '보통'
}

function adjustFontSize(delta) {
  const newSize = settings.fontSize + delta
  if (newSize >= 0 && newSize <= 4) {
    settings.fontSize = newSize
  }
}

async function saveSettings() {
  if (!hasChanges.value || savingSettings.value) return
  
  savingSettings.value = true
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Save to localStorage
    localStorage.setItem('knue-board-settings', JSON.stringify(settings))
    
    // Update original settings
    originalSettings.value = JSON.parse(JSON.stringify(settings))
    
    showSuccess('설정이 저장되었습니다')
    
    // Apply theme changes
    applyThemeSettings()
    
  } catch (error) {
    showError('설정 저장에 실패했습니다')
    console.error('Failed to save settings:', error)
  } finally {
    savingSettings.value = false
  }
}

async function clearCache() {
  if (clearingCache.value) return
  
  clearingCache.value = true
  
  try {
    // Clear various caches
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
    }
    
    // Clear localStorage cache items (but keep settings)
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('knue-board-') && key !== 'knue-board-settings') {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    showSuccess('캐시가 삭제되었습니다')
    
  } catch (error) {
    showError('캐시 삭제에 실패했습니다')
    console.error('Failed to clear cache:', error)
  } finally {
    clearingCache.value = false
  }
}

async function resetSettings() {
  if (resettingSettings.value) return
  
  // Show confirmation
  if (!confirm('모든 설정을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
    return
  }
  
  resettingSettings.value = true
  
  try {
    // Reset to default values
    Object.assign(settings, {
      autoRefresh: false,
      refreshInterval: 5 * 60 * 1000,
      showDescriptions: true,
      groupByDate: false,
      infiniteScroll: true,
      fontSize: 2,
      compactMode: false,
      notifications: {
        newPosts: true,
        updates: true,
        position: 'top-right'
      },
      autoClearCache: true
    })
    
    // Remove from localStorage
    localStorage.removeItem('knue-board-settings')
    
    // Update original settings
    originalSettings.value = JSON.parse(JSON.stringify(settings))
    
    showSuccess('설정이 초기화되었습니다')
    
    // Apply theme changes
    applyThemeSettings()
    
  } catch (error) {
    showError('설정 초기화에 실패했습니다')
    console.error('Failed to reset settings:', error)
  } finally {
    resettingSettings.value = false
  }
}

function loadSettings() {
  try {
    const saved = localStorage.getItem('knue-board-settings')
    if (saved) {
      const parsedSettings = JSON.parse(saved)
      Object.assign(settings, parsedSettings)
    }
    
    // Store original settings for change detection
    originalSettings.value = JSON.parse(JSON.stringify(settings))
    
    // Apply loaded settings
    applyThemeSettings()
    
  } catch (error) {
    console.error('Failed to load settings:', error)
    showWarning('설정을 불러오는데 실패했습니다. 기본 설정을 사용합니다.')
  }
}

function applyThemeSettings() {
  // Apply font size
  const html = document.documentElement
  const fontSizeScale = [0.875, 0.9375, 1, 1.0625, 1.125] // rem multipliers
  html.style.fontSize = `${fontSizeScale[settings.fontSize]}rem`
}

// Auto-save when settings change
watch(settings, () => {
  // Debounced auto-save could be implemented here
}, { deep: true })

// Lifecycle
onMounted(() => {
  loadSettings()
})

// Meta
defineOptions({
  name: 'SettingsView'
})
</script>

<style scoped>
/* Container */
.settings-view {
  min-height: 100vh;
  background: theme('colors.gray.50');
}

/* Header */
.view-header {
  margin-bottom: 2rem;
}

.header-content {
  text-align: center;
}

.view-title {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  color: theme('colors.gray.900');
  margin: 0 0 0.5rem 0;
}

.view-description {
  font-size: 1rem;
  color: theme('colors.gray.600');
  margin: 0;
  line-height: 1.5;
}

/* Main Content */
.main-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Settings Section */
.settings-section {
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  padding: 1.5rem 1.5rem 0 1.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 1.25rem;
  font-weight: 600;
  color: theme('colors.gray.900');
  margin: 0;
}

/* Settings List */
.settings-list {
  padding: 1rem 0;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid theme('colors.gray.100');
  gap: 1rem;
}

.setting-item:last-child {
  border-bottom: none;
}

.sub-setting {
  background: theme('colors.gray.50');
  padding-left: 2rem;
}

.action-item {
  background: theme('colors.red.50');
  border-color: theme('colors.red.100');
}

.setting-info {
  flex: 1;
  min-width: 0;
}

.setting-title {
  font-size: 1rem;
  font-weight: 600;
  color: theme('colors.gray.900');
  margin: 0 0 0.25rem 0;
}

.setting-description {
  font-size: 0.875rem;
  color: theme('colors.gray.600');
  margin: 0;
  line-height: 1.4;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 3rem;
  height: 1.75rem;
  cursor: pointer;
}

.toggle-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: theme('colors.gray.300');
  border-radius: 1.75rem;
  transition: all 0.2s ease;
}

.toggle-slider:before {
  position: absolute;
  content: '';
  height: 1.375rem;
  width: 1.375rem;
  left: 0.1875rem;
  bottom: 0.1875rem;
  background: white;
  border-radius: 50%;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-input:checked + .toggle-slider {
  background: theme('colors.knue.primary');
}

.toggle-input:checked + .toggle-slider:before {
  transform: translateX(1.25rem);
}

/* Select */
.setting-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid theme('colors.gray.300');
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
  min-width: 120px;
}

.setting-select:focus {
  outline: none;
  border-color: theme('colors.knue.primary');
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

/* Font Size Controls */
.font-size-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.font-size-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid theme('colors.gray.300');
  border-radius: 0.375rem;
  background: white;
  color: theme('colors.gray.600');
  cursor: pointer;
  transition: all 0.2s ease;
}

.font-size-btn:hover:not(:disabled) {
  border-color: theme('colors.knue.primary');
  color: theme('colors.knue.primary');
}

.font-size-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.font-size-value {
  font-weight: 600;
  color: theme('colors.gray.900');
  min-width: 1rem;
  text-align: center;
}

/* Action Buttons */
.action-button {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button.secondary {
  background: theme('colors.gray.100');
  color: theme('colors.gray.700');
}

.action-button.secondary:hover:not(:disabled) {
  background: theme('colors.gray.200');
}

.action-button.danger {
  background: theme('colors.red.100');
  color: theme('colors.red.700');
}

.action-button.danger:hover:not(:disabled) {
  background: theme('colors.red.200');
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Save Section */
.save-section {
  text-align: center;
  padding: 2rem 0;
}

.save-button {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 2rem;
  background: theme('colors.gray.300');
  color: theme('colors.gray.600');
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-button.has-changes {
  background: theme('colors.knue.primary');
  color: white;
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
}

.save-button.has-changes:hover:not(:disabled) {
  background: theme('colors.knue.secondary');
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 102, 204, 0.4);
}

.save-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 768px) {
  .view-title {
    font-size: 1.5rem;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .view-description {
    font-size: 0.875rem;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .setting-info {
    width: 100%;
  }
  
  .toggle-switch,
  .setting-select,
  .font-size-controls,
  .action-button {
    align-self: flex-end;
  }
  
  .action-item {
    flex-direction: row;
    align-items: center;
  }
}

</style>