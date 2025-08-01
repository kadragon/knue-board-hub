<template>
  <div class="departments-view">
    <div class="container-mobile section-spacing">
      <!-- Header -->
      <header class="view-header">
        <div class="header-content">
          <h1 class="view-title">
            <i class="i-tabler-building-bank w-6 h-6 mr-3 text-knue-primary" />
            게시판 관리
          </h1>
          <p class="view-description">
            관심 있는 게시판을 선택하여 맞춤형 공지사항을 받아보세요
          </p>
        </div>
      </header>

      <!-- Department Selector -->
      <main class="main-content">
        <DepartmentSelector
          v-model="selectedDepartments"
          :compact="false"
          :show-header="false"
          :show-stats="true"
          :show-apply-button="true"
          :loading-departments="loadingDepartments"
          :error-departments="errorDepartments"
          :department-stats="departmentStats"
          :department-errors="departmentErrors"
          @selection-change="handleSelectionChange"
          @apply="handleApply"
          @department-toggle="handleDepartmentToggle"
        />

        <!-- Quick Actions -->
        <div class="quick-actions-section">
          <div class="section-header">
            <h2 class="section-title">
              <i class="i-tabler-zap w-5 h-5 mr-2" />
              빠른 설정
            </h2>
          </div>
          
          <div class="quick-actions-grid">
            <button
              @click="selectPreset('default')"
              class="quick-action-card"
              :class="{ 'active': isPresetActive('default') }"
            >
              <div class="action-icon">
                <i class="i-tabler-star w-6 h-6" />
              </div>
              <div class="action-content">
                <h3 class="action-title">기본 선택</h3>
                <p class="action-description">필수 게시판만 선택</p>
              </div>
            </button>

            <button
              @click="selectPreset('academic')"
              class="quick-action-card"
              :class="{ 'active': isPresetActive('academic') }"
            >
              <div class="action-icon">
                <i class="i-tabler-school w-6 h-6" />
              </div>
              <div class="action-content">
                <h3 class="action-title">학사 중심</h3>
                <p class="action-description">학사 관련 게시판</p>
              </div>
            </button>

            <button
              @click="selectPreset('employment')"
              class="quick-action-card"
              :class="{ 'active': isPresetActive('employment') }"
            >
              <div class="action-icon">
                <i class="i-tabler-briefcase w-6 h-6" />
              </div>
              <div class="action-content">
                <h3 class="action-title">취업 중심</h3>
                <p class="action-description">취업·진로 게시판</p>
              </div>
            </button>

            <button
              @click="selectPreset('all')"
              class="quick-action-card"
              :class="{ 'active': isPresetActive('all') }"
            >
              <div class="action-icon">
                <i class="i-tabler-select-all w-6 h-6" />
              </div>
              <div class="action-content">
                <h3 class="action-title">전체 선택</h3>
                <p class="action-description">모든 게시판 선택</p>
              </div>
            </button>
          </div>
        </div>

        <!-- Keyword Filter Section -->
        <div class="keyword-filter-section">
          <div class="section-header">
            <h2 class="section-title">
              <i class="i-tabler-filter w-5 h-5 mr-2" />
              키워드 필터링
            </h2>
            <p class="section-description">
              특정 키워드가 포함된 게시글을 숨길 수 있습니다
            </p>
          </div>
          
          <div class="keyword-filter-content">
            <!-- Add Keyword Input -->
            <div class="add-keyword-section">
              <div class="keyword-input-wrapper">
                <input
                  v-model="newKeyword"
                  @keyup.enter="addKeyword"
                  type="text"
                  placeholder="차단할 키워드 입력..."
                  class="keyword-input"
                  :disabled="isAddingKeyword"
                />
                <button
                  @click="addKeyword"
                  :disabled="!newKeyword.trim() || isAddingKeyword"
                  class="add-keyword-btn"
                >
                  <i class="i-tabler-plus w-4 h-4" />
                  추가
                </button>
              </div>
            </div>

            <!-- Blocked Keywords List -->
            <div v-if="blockedKeywords.length > 0" class="blocked-keywords-section">
              <div class="keywords-header">
                <span class="keywords-count">
                  {{ blockedKeywords.length }}개 키워드 차단 중
                </span>
                <button
                  @click="clearAllKeywords"
                  class="clear-all-btn"
                  :disabled="isClearingAll"
                >
                  <i class="i-tabler-trash w-4 h-4 mr-1" />
                  전체 삭제
                </button>
              </div>
              
              <div class="keywords-list">
                <div
                  v-for="keyword in blockedKeywords"
                  :key="keyword"
                  class="keyword-tag"
                >
                  <span class="keyword-text">{{ keyword }}</span>
                  <button
                    @click="removeKeyword(keyword)"
                    class="remove-keyword-btn"
                    :disabled="removingKeywords.has(keyword)"
                  >
                    <i class="i-tabler-x w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="no-keywords-state">
              <i class="i-tabler-filter-off w-12 h-12 text-gray-400 mb-2" />
              <p class="no-keywords-text">
                차단된 키워드가 없습니다
              </p>
              <p class="no-keywords-description">
                원하지 않는 게시글을 숨기려면 키워드를 추가하세요
              </p>
            </div>

            <!-- Import/Export -->
            <div class="keyword-actions">
              <button
                @click="showImportModal = true"
                class="action-btn secondary"
              >
                <i class="i-tabler-upload w-4 h-4 mr-1" />
                가져오기
              </button>
              <button
                @click="exportKeywords"
                :disabled="blockedKeywords.length === 0"
                class="action-btn secondary"
              >
                <i class="i-tabler-download w-4 h-4 mr-1" />
                내보내기
              </button>
            </div>

            <!-- Filter Statistics -->
            <div v-if="hasBlockedKeywords && filterStats" class="filter-stats">
              <div class="stats-row">
                <div class="stat-item">
                  <span class="stat-value">{{ filterStats.blockedCount }}</span>
                  <span class="stat-label">차단된 게시글</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ filterStats.blockPercentage }}%</span>
                  <span class="stat-label">차단 비율</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistics Section -->
        <div v-if="showStats" class="stats-section">
          <div class="section-header">
            <h2 class="section-title">
              <i class="i-tabler-chart-bar w-5 h-5 mr-2" />
              통계
            </h2>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ selectedDepartments.length }}</div>
              <div class="stat-label">선택된 게시판</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-value">{{ totalPosts }}</div>
              <div class="stat-label">전체 게시글</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-value">{{ todayPosts }}</div>
              <div class="stat-label">오늘 게시글</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-value">{{ formatLastUpdate(lastUpdateTime) }}</div>
              <div class="stat-label">마지막 업데이트</div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Import Keywords Modal -->
    <div v-if="showImportModal" class="modal-overlay" @click.self="showImportModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">키워드 가져오기</h3>
          <button @click="showImportModal = false" class="modal-close">
            <i class="i-tabler-x w-5 h-5" />
          </button>
        </div>
        
        <div class="modal-body">
          <p class="import-description">
            키워드를 한 줄에 하나씩 입력하거나 쉼표로 구분해서 입력하세요.
          </p>
          <textarea
            v-model="importText"
            placeholder="키워드1&#10;키워드2&#10;키워드3"
            class="import-textarea"
            rows="6"
          ></textarea>
        </div>
        
        <div class="modal-footer">
          <button @click="showImportModal = false" class="btn-secondary">
            취소
          </button>
          <button 
            @click="importKeywords" 
            :disabled="!importText.trim() || isImporting"
            class="btn-primary"
          >
            <i v-if="isImporting" class="i-tabler-loader-2 w-4 h-4 animate-spin mr-1" />
            {{ isImporting ? '가져오는 중...' : '가져오기' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DepartmentSelector from '../components/DepartmentSelector.vue'
import { useGlobalNotifications } from '../composables/useNotifications.js'
import { useRssFeed } from '../composables/useRssFeed.js'
import { useDepartments } from '../composables/useDepartments.js'
import { useKeywordFilter } from '../composables/useKeywordFilter.js'
import { formatDateForMobile, isToday } from '../utils/dateUtils.js'

// Router
const router = useRouter()

// Composables
const { showSuccess, showInfo, showError } = useGlobalNotifications()
const {
  allItems,
  loading,
  errors,
  lastUpdate,
  fetchFeeds,
  getSelectedDepartments,
  setActiveDepartments
} = useRssFeed()

const { getDefaultDepartments, getDepartment } = useDepartments()
const {
  blockedKeywords,
  hasBlockedKeywords,
  addBlockedKeyword,
  removeBlockedKeyword,
  clearBlockedKeywords,
  getFilterStats,
  importKeywords: importKeywordsFromText,
  exportKeywords: exportKeywordsToText
} = useKeywordFilter()

// State
const selectedDepartments = ref([])
const showStats = ref(true)

// Keyword filter state
const newKeyword = ref('')
const isAddingKeyword = ref(false)
const isClearingAll = ref(false)
const removingKeywords = ref(new Set())
const showImportModal = ref(false)
const importText = ref('')
const isImporting = ref(false)

// Presets - Updated to match actual database department IDs
const presets = {
  default: ['general', 'academic', 'scholarship'],
  academic: ['general', 'academic', 'scholarship', 'tuition'],
  events: ['general', 'events', 'cheongram'],
  all: ['general', 'academic', 'cheongram', 'tuition', 'scholarship', 'events']
}

// Computed
const loadingDepartments = computed(() => 
  selectedDepartments.value.filter(() => loading.value)
)

const errorDepartments = computed(() => 
  Array.from(errors.value.keys())
)

const departmentStats = computed(() => {
  const stats = {}
  selectedDepartments.value.forEach(id => {
    const items = allItems.value.filter(item => item.departmentId === id)
    stats[id] = {
      itemCount: items.length,
      lastUpdate: lastUpdate.value
    }
  })
  return stats
})

const departmentErrors = computed(() => {
  const errorObj = {}
  errors.value.forEach((error, departmentId) => {
    errorObj[departmentId] = error
  })
  return errorObj
})

const totalPosts = computed(() => allItems.value.length)

const todayPosts = computed(() => 
  allItems.value.filter(item => isToday(item.pubDate)).length
)

const lastUpdateTime = computed(() => lastUpdate.value)

// Keyword filter computed
const filterStats = computed(() => {
  if (!hasBlockedKeywords.value || allItems.value.length === 0) return null
  return getFilterStats(allItems.value, allItems.value) // We'll filter in RssFeedList
})

// Methods
function handleSelectionChange({ selected, count }) {
  console.log(`${count}개 게시판 선택됨:`, selected)
  
  if (count === 0) {
    showInfo('최소 1개 이상의 게시판을 선택해주세요')
  }
}

async function handleApply({ selected, departments }) {
  try {
    // Update the local state first
    selectedDepartments.value = [...selected]
    
    // Save to localStorage and set as active departments
    setActiveDepartments(selected, true) // true = persist to localStorage
    
    // Fetch feeds for the selected departments
    await fetchFeeds(selected)
    
    showSuccess(`${departments.length}개 게시판이 적용되었습니다`)
    
    console.log('게시판 관리: 설정 저장됨:', selected)
    
    // Navigate back to home after successful application
    setTimeout(() => {
      router.push({ name: 'home' })
    }, 1000)
    
  } catch (error) {
    console.error('Failed to apply department selection:', error)
  }
}

function handleDepartmentToggle({ departmentId, selected, allSelected }) {
  const department = getDepartment(departmentId)
  const action = selected ? '선택됨' : '선택 해제됨'
  
  console.log(`${department?.name || departmentId} ${action}`)
}

function selectPreset(presetName) {
  if (presets[presetName]) {
    selectedDepartments.value = [...presets[presetName]]
    
    const presetLabels = {
      default: '기본 게시판',
      academic: '학사 중심 게시판',
      employment: '취업 중심 게시판',
      all: '전체 게시판'
    }
    
    showInfo(`${presetLabels[presetName]}이 선택되었습니다`)
  }
}

function isPresetActive(presetName) {
  if (!presets[presetName]) return false
  
  const preset = presets[presetName]
  const current = selectedDepartments.value
  
  return preset.length === current.length && 
         preset.every(id => current.includes(id))
}

function formatLastUpdate(date) {
  return date ? formatDateForMobile(date) : '정보 없음'
}

// Keyword filter methods
async function addKeyword() {
  if (!newKeyword.value.trim() || isAddingKeyword.value) return
  
  isAddingKeyword.value = true
  
  try {
    const keyword = newKeyword.value.trim()
    const wasAdded = addBlockedKeyword(keyword)
    
    if (wasAdded) {
      showSuccess(`"${keyword}" 키워드가 차단 목록에 추가되었습니다`)
      newKeyword.value = ''
    } else {
      showInfo('이미 차단 목록에 있는 키워드입니다')
    }
  } catch (error) {
    showError('키워드 추가 중 오류가 발생했습니다')
  } finally {
    isAddingKeyword.value = false
  }
}

async function removeKeyword(keyword) {
  if (removingKeywords.value.has(keyword)) return
  
  removingKeywords.value.add(keyword)
  
  try {
    const wasRemoved = removeBlockedKeyword(keyword)
    
    if (wasRemoved) {
      showSuccess(`"${keyword}" 키워드가 차단 목록에서 제거되었습니다`)
    }
  } catch (error) {
    showError('키워드 제거 중 오류가 발생했습니다')
  } finally {
    removingKeywords.value.delete(keyword)
  }
}

async function clearAllKeywords() {
  if (isClearingAll.value) return
  
  isClearingAll.value = true
  
  try {
    const wasCleared = clearBlockedKeywords()
    
    if (wasCleared) {
      showSuccess('모든 차단 키워드가 삭제되었습니다')
    }
  } catch (error) {
    showError('키워드 삭제 중 오류가 발생했습니다')
  } finally {
    isClearingAll.value = false
  }
}

async function importKeywords() {
  if (!importText.value.trim() || isImporting.value) return
  
  isImporting.value = true
  
  try {
    const addedCount = importKeywordsFromText(importText.value)
    
    if (addedCount > 0) {
      showSuccess(`${addedCount}개의 키워드를 가져왔습니다`)
      importText.value = ''
      showImportModal.value = false
    } else {
      showInfo('가져올 새로운 키워드가 없습니다')
    }
  } catch (error) {
    showError('키워드 가져오기 중 오류가 발생했습니다')
  } finally {
    isImporting.value = false
  }
}

function exportKeywords() {
  try {
    const keywordText = exportKeywordsToText()
    
    if (keywordText) {
      // Copy to clipboard
      navigator.clipboard.writeText(keywordText).then(() => {
        showSuccess('키워드 목록이 클립보드에 복사되었습니다')
      }).catch(() => {
        // Fallback: Create download link
        const blob = new Blob([keywordText], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'blocked-keywords.txt'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        showSuccess('키워드 목록이 다운로드되었습니다')
      })
    } else {
      showInfo('내보낼 키워드가 없습니다')
    }
  } catch (error) {
    showError('키워드 내보내기 중 오류가 발생했습니다')  
  }
}

// Lifecycle
onMounted(async () => {
  // Load user's saved department selection from localStorage
  try {
    const savedDepartments = await getSelectedDepartments()
    
    if (savedDepartments && savedDepartments.length > 0) {
      selectedDepartments.value = [...savedDepartments]
      console.log('게시판 관리: 저장된 설정 로드됨:', savedDepartments)
    } else {
      // Fallback to preset defaults only if no saved departments
      selectedDepartments.value = [...presets.default]
      console.log('게시판 관리: 기본 설정 사용됨')
    }
    
    // Load initial data for stats - only if not already loaded
    if (selectedDepartments.value.length > 0) {
      const needsLoading = selectedDepartments.value.some(deptId => !allItems.value.some(item => item.departmentId === deptId))
      if (needsLoading) {
        await fetchFeeds(selectedDepartments.value)
      }
    }
  } catch (error) {
    console.error('게시판 관리: 설정 로드 실패:', error)
    // Fallback to defaults on error
    selectedDepartments.value = [...presets.default]
  }
})

// Meta
defineOptions({
  name: 'DepartmentsView'
})
</script>

<style scoped>
/* Container */
.departments-view {
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

/* Section Header */
.section-header {
  margin-bottom: 1rem;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 1.25rem;
  font-weight: 600;
  color: theme('colors.gray.900');
  margin: 0;
}

.section-description {
  font-size: 0.875rem;
  color: theme('colors.gray.600');
  margin: 0.5rem 0 0 0;
  line-height: 1.4;
}

/* Quick Actions */
.quick-actions-section {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.quick-action-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: theme('colors.gray.50');
  border: 2px solid theme('colors.gray.200');
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
}

.quick-action-card:hover {
  border-color: theme('colors.knue.accent');
  background: theme('colors.blue.50');
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.15);
}

.quick-action-card.active {
  border-color: theme('colors.knue.primary');
  background: theme('colors.blue.50');
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  background: white;
  border-radius: 0.75rem;
  color: theme('colors.knue.primary');
  flex-shrink: 0;
}

.action-content {
  flex: 1;
}

.action-title {
  font-size: 1rem;
  font-weight: 600;
  color: theme('colors.gray.900');
  margin: 0 0 0.25rem 0;
}

.action-description {
  font-size: 0.875rem;
  color: theme('colors.gray.600');
  margin: 0;
  line-height: 1.4;
}

/* Statistics */
.stats-section {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-card {
  text-align: center;
  padding: 1rem;
  background: theme('colors.gray.50');
  border-radius: 0.75rem;
  border: 1px solid theme('colors.gray.200');
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: theme('colors.knue.primary');
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: theme('colors.gray.600');
  font-weight: 500;
}

/* Keyword Filter Section */
.keyword-filter-section {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.keyword-filter-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Add Keyword */
.keyword-input-wrapper {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.keyword-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid theme('colors.gray.300');
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
  color: theme('colors.gray.900');
  transition: all 0.2s ease;
}

.keyword-input:focus {
  outline: none;
  border-color: theme('colors.knue.primary');
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.keyword-input:disabled {
  background: theme('colors.gray.100');
  color: theme('colors.gray.500');
  cursor: not-allowed;
}

.add-keyword-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  background: theme('colors.knue.primary');
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.add-keyword-btn:hover:not(:disabled) {
  background: theme('colors.blue.700');
  transform: translateY(-1px);
}

.add-keyword-btn:disabled {
  background: theme('colors.gray.400');
  cursor: not-allowed;
  transform: none;
}

/* Blocked Keywords */
.blocked-keywords-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.keywords-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid theme('colors.gray.200');
}

.keywords-count {
  font-size: 0.875rem;
  font-weight: 500;
  color: theme('colors.gray.700');
}

.clear-all-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  background: theme('colors.red.50');
  color: theme('colors.red.600');
  border: 1px solid theme('colors.red.200');
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-all-btn:hover:not(:disabled) {
  background: theme('colors.red.100');
  border-color: theme('colors.red.300');
}

.clear-all-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.keywords-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.keyword-tag {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: theme('colors.red.50');
  border: 1px solid theme('colors.red.200');
  border-radius: 1rem;
  font-size: 0.75rem;
  color: theme('colors.red.700');
}

.keyword-text {
  font-weight: 500;
}

.remove-keyword-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  background: theme('colors.red.100');
  color: theme('colors.red.600');
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.remove-keyword-btn:hover:not(:disabled) {
  background: theme('colors.red.200');
  color: theme('colors.red.700');
}

.remove-keyword-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Empty State */
.no-keywords-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem 1rem;
  color: theme('colors.gray.500');
}

.no-keywords-text {
  font-size: 1rem;
  font-weight: 500;
  color: theme('colors.gray.600');
  margin: 0 0 0.5rem 0;
}

.no-keywords-description {
  font-size: 0.875rem;
  color: theme('colors.gray.500');
  margin: 0;
  line-height: 1.4;
}

/* Keyword Actions */
.keyword-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid theme('colors.gray.200');
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  border: 1px solid theme('colors.gray.300');
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.action-btn.secondary {
  background: white;
  color: theme('colors.gray.700');
}

.action-btn.secondary:hover:not(:disabled) {
  background: theme('colors.gray.50');
  border-color: theme('colors.gray.400');
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Filter Statistics */
.filter-stats {
  padding: 1rem;
  background: theme('colors.blue.50');
  border: 1px solid theme('colors.blue.200');
  border-radius: 0.5rem;
}

.stats-row {
  display: flex;
  gap: 2rem;
  justify-content: center;
}

.filter-stats .stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.filter-stats .stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: theme('colors.blue.700');
  margin-bottom: 0.125rem;
}

.filter-stats .stat-label {
  font-size: 0.75rem;
  color: theme('colors.blue.600');
  font-weight: 500;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid theme('colors.gray.200');
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: theme('colors.gray.900');
  margin: 0;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: none;
  border: none;
  color: theme('colors.gray.500');
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: theme('colors.gray.100');
  color: theme('colors.gray.700');
}

.modal-body {
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
}

.import-description {
  font-size: 0.875rem;
  color: theme('colors.gray.600');
  margin: 0 0 1rem 0;
  line-height: 1.4;
}

.import-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid theme('colors.gray.300');
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
}

.import-textarea:focus {
  outline: none;
  border-color: theme('colors.knue.primary');
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid theme('colors.gray.200');
}

.btn-secondary {
  padding: 0.625rem 1.25rem;
  background: white;
  color: theme('colors.gray.700');
  border: 1px solid theme('colors.gray.300');
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: theme('colors.gray.50');
  border-color: theme('colors.gray.400');
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.625rem 1.25rem;
  background: theme('colors.knue.primary');
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  background: theme('colors.blue.700');
}

.btn-primary:disabled {
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
  
  .quick-actions-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-action-card {
    padding: 0.875rem;
  }
  
  .action-icon {
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
}

/* Touch Devices */
@media (hover: none) and (pointer: coarse) {
  .quick-action-card:hover {
    transform: none;
  }
  
  .quick-action-card:active {
    transform: scale(0.98);
  }
}

</style>