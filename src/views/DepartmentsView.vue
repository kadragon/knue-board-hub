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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DepartmentSelector from '../components/DepartmentSelector.vue'
import { useGlobalNotifications } from '../composables/useNotifications.js'
import { useRssFeed } from '../composables/useRssFeed.js'
import { useDepartments } from '../composables/useDepartments.js'
import { formatDateForMobile, isToday } from '../utils/dateUtils.js'

// Router
const router = useRouter()

// Composables
const { showSuccess, showInfo } = useGlobalNotifications()
const {
  allItems,
  loading,
  errors,
  lastUpdate,
  fetchFeeds
} = useRssFeed()

const { getDefaultDepartments, getDepartment } = useDepartments()

// State
const selectedDepartments = ref(['main', 'academic', 'scholarship'])
const showStats = ref(true)

// Presets
const presets = {
  default: ['main', 'academic', 'scholarship'],
  academic: ['main', 'academic', 'scholarship', 'tuition'],
  events: ['main', 'events', 'cheongram'],
  all: ['main', 'academic', 'cheongram', 'tuition', 'scholarship', 'events']
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

// Methods
function handleSelectionChange({ selected, count }) {
  console.log(`${count}개 게시판 선택됨:`, selected)
  
  if (count === 0) {
    showInfo('최소 1개 이상의 게시판을 선택해주세요')
  }
}

async function handleApply({ selected, departments }) {
  try {
    await fetchFeeds(selected)
    
    showSuccess(`${departments.length}개 게시판이 적용되었습니다`)
    
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
  
  console.log(`${department?.name} ${action}`)
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

// Lifecycle
onMounted(() => {
  // Load initial data for stats - only if not already loaded
  if (selectedDepartments.value.length > 0) {
    const needsLoading = selectedDepartments.value.some(deptId => !allItems.value.some(item => item.departmentId === deptId))
    if (needsLoading) {
      fetchFeeds(selectedDepartments.value)
    }
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

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  .departments-view {
    background: theme('colors.gray.900');
  }
  
  .view-title {
    color: theme('colors.gray.100');
  }
  
  .view-description {
    color: theme('colors.gray.400');
  }
  
  .section-title {
    color: theme('colors.gray.100');
  }
  
  .quick-actions-section,
  .stats-section {
    background: theme('colors.gray.800');
  }
  
  .quick-action-card {
    background: theme('colors.gray.700');
    border-color: theme('colors.gray.600');
  }
  
  .quick-action-card:hover,
  .quick-action-card.active {
    background: theme('colors.gray.600');
  }
  
  .action-icon {
    background: theme('colors.gray.600');
  }
  
  .action-title {
    color: theme('colors.gray.100');
  }
  
  .action-description {
    color: theme('colors.gray.400');
  }
  
  .stat-card {
    background: theme('colors.gray.700');
    border-color: theme('colors.gray.600');
  }
  
  .stat-label {
    color: theme('colors.gray.400');
  }
}
</style>