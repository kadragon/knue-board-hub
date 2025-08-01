<template>
  <div class="department-selector" :class="{ 'selector-compact': compact }">
    <!-- Header -->
    <div v-if="showHeader" class="selector-header">
      <h2 class="text-title">
        <i class="i-tabler-building-bank w-5 h-5 mr-2" />
        게시판 선택
      </h2>
      <span class="text-caption">
        {{ selectedCount }}개 선택됨
      </span>
    </div>

    <!-- Selection Mode Toggle -->
    <div v-if="!compact" class="selection-mode">
      <div class="mode-buttons">
        <button
          v-for="mode in selectionModes"
          :key="mode.value"
          @click="selectionMode = mode.value"
          class="mode-button"
          :class="{ 'mode-active': selectionMode === mode.value }"
        >
          <i :class="mode.icon" class="w-4 h-4 mr-1" />
          {{ mode.label }}
        </button>
      </div>
    </div>

    <!-- Quick Actions -->
    <div v-if="!compact" class="quick-actions">
      <button
        @click="selectAll"
        class="action-button"
        :disabled="allSelected"
      >
        <i class="i-tabler-select-all w-4 h-4 mr-1" />
        전체 선택
      </button>
      
      <button
        @click="selectNone"
        class="action-button"
        :disabled="noneSelected"
      >
        <i class="i-tabler-square w-4 h-4 mr-1" />
        전체 해제
      </button>

      <button
        @click="selectDefaults"
        class="action-button"
      >
        <i class="i-tabler-star w-4 h-4 mr-1" />
        기본 선택
      </button>
    </div>

    <!-- Department Grid -->
    <div class="department-grid" :class="gridClass">
      <div
        v-for="department in departments"
        :key="department.id"
        class="department-card"
        :class="[
          getDepartmentCardClass(department),
          { 'card-selected': isSelected(department.id) }
        ]"
        @click="toggleDepartment(department.id)"
        role="button"
        tabindex="0"
        :aria-pressed="isSelected(department.id)"
        @keydown.enter="toggleDepartment(department.id)"
        @keydown.space.prevent="toggleDepartment(department.id)"
      >
        <!-- Selection Indicator -->
        <div class="selection-indicator">
          <div class="checkbox-wrapper">
            <input
              type="checkbox"
              :id="`dept-${department.id}`"
              :checked="isSelected(department.id)"
              @change="toggleDepartment(department.id)"
              class="department-checkbox"
              tabindex="-1"
            />
            <label :for="`dept-${department.id}`" class="checkbox-label">
              <i class="i-tabler-check w-3 h-3" />
            </label>
          </div>
        </div>

        <!-- Department Icon -->
        <div class="department-icon" :style="{ color: department.color }">
          {{ department.icon }}
        </div>

        <!-- Department Info -->
        <div class="department-info">
          <h3 class="department-name">{{ department.name }}</h3>
          <p v-if="!compact && showStats" class="department-description">{{ department.description }}</p>
          
          <!-- Stats (only show in non-compact mode) -->
          <div v-if="showStats && !compact" class="department-stats">
            <span class="stat-item">
              <i class="i-tabler-article w-3 h-3 mr-1" />
              {{ getDepartmentStats(department.id).itemCount || 0 }}개
            </span>
            <span class="stat-item">
              <i class="i-tabler-clock w-3 h-3 mr-1" />
              {{ formatLastUpdate(getDepartmentStats(department.id).lastUpdate) }}
            </span>
          </div>
        </div>

        <!-- Loading Indicator -->
        <div 
          v-if="loadingDepartments.includes(department.id)"
          class="loading-overlay"
        >
          <div class="loading-spinner" />
        </div>

        <!-- Error Indicator -->
        <div 
          v-if="errorDepartments.includes(department.id)"
          class="error-indicator"
          :title="getErrorMessage(department.id)"
        >
          <i class="i-tabler-alert-circle w-4 h-4 text-red-500" />
        </div>
      </div>
    </div>

    <!-- Compact Mode Summary -->
    <div v-if="compact" class="compact-summary">
      <button
        @click="toggleExpanded"
        class="summary-button"
      >
        <div class="selected-departments">
          <span
            v-for="dept in selectedDepartments.slice(0, 3)"
            :key="`badge-${dept.id}`"
            class="department-badge"
            :class="`badge-${dept.id}`"
          >
            {{ dept.icon }} {{ dept.name }}
          </span>
          <span 
            v-if="selectedDepartments.length > 3"
            class="more-badge"
          >
            +{{ selectedDepartments.length - 3 }}개 더
          </span>
        </div>
        <i 
          class="expand-icon"
          :class="expanded ? 'i-tabler-chevron-up' : 'i-tabler-chevron-down'"
        />
      </button>
    </div>

    <!-- Apply Button -->
    <div v-if="showApplyButton && hasChanges" class="apply-section">
      <button
        @click="applySelection"
        class="btn-primary w-full btn-touch"
        :disabled="applying"
      >
        <i v-if="applying" class="i-tabler-loader-2 w-4 h-4 animate-spin mr-2" />
        <i v-else class="i-tabler-check w-4 h-4 mr-2" />
        {{ applying ? '적용 중...' : `${selectedCount}개 게시판 적용` }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useDepartments } from '../composables/useDepartments.js'
import { formatDateForMobile } from '../utils/dateUtils.js'

// Props
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  
  compact: {
    type: Boolean,
    default: false
  },
  
  showHeader: {
    type: Boolean,
    default: true
  },
  
  showStats: {
    type: Boolean,
    default: false
  },
  
  showApplyButton: {
    type: Boolean,
    default: false
  },
  
  maxSelection: {
    type: Number,
    default: null
  },
  
  loadingDepartments: {
    type: Array,
    default: () => []
  },
  
  errorDepartments: {
    type: Array,
    default: () => []
  },
  
  departmentStats: {
    type: Object,
    default: () => ({})
  },
  
  departmentErrors: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits([
  'update:modelValue',
  'selection-change',
  'apply',
  'department-toggle'
])

// State
const selectedDepartmentIds = ref([...props.modelValue])
const selectionMode = ref('default')
const expanded = ref(false)
const applying = ref(false)
const initialSelection = ref([...props.modelValue])

// Use departments from API
const { departments: allDepartments, loading: departmentsLoading, fetchDepartments, getDefaultDepartments } = useDepartments()
const departments = computed(() => allDepartments.value)
const selectionModes = [
  { value: 'default', label: '일반', icon: 'i-tabler-list' },
  { value: 'priority', label: '중요도순', icon: 'i-tabler-star' },
  { value: 'recent', label: '최근순', icon: 'i-tabler-clock' }
]

// Computed
const selectedCount = computed(() => selectedDepartmentIds.value.length)

const selectedDepartments = computed(() => {
  return departments.value.filter(dept => 
    selectedDepartmentIds.value.includes(dept.id)
  )
})

const allSelected = computed(() => 
  selectedDepartmentIds.value.length === departments.value.length
)

const noneSelected = computed(() => 
  selectedDepartmentIds.value.length === 0
)

const hasChanges = computed(() => {
  const current = [...selectedDepartmentIds.value].sort()
  const initial = [...initialSelection.value].sort()
  return JSON.stringify(current) !== JSON.stringify(initial)
})

const gridClass = computed(() => {
  if (props.compact && !expanded.value) return 'grid-hidden'
  return 'grid-responsive'
})

// Methods
function isSelected(departmentId) {
  return selectedDepartmentIds.value.includes(departmentId)
}

function toggleDepartment(departmentId) {
  const index = selectedDepartmentIds.value.indexOf(departmentId)
  
  if (index > -1) {
    selectedDepartmentIds.value.splice(index, 1)
  } else {
    // Check max selection limit
    if (props.maxSelection && selectedDepartmentIds.value.length >= props.maxSelection) {
      console.warn(`최대 ${props.maxSelection}개까지만 선택할 수 있습니다`)
      return
    }
    
    selectedDepartmentIds.value.push(departmentId)
  }
  
  emit('department-toggle', {
    departmentId,
    selected: isSelected(departmentId),
    allSelected: selectedDepartmentIds.value
  })
}

function selectAll() {
  selectedDepartmentIds.value = departments.value.map(d => d.id)
}

function selectNone() {
  selectedDepartmentIds.value = []
}

function selectDefaults() {
  // Use first 3 departments by priority, or fallback to hardcoded defaults if needed
  const defaultIds = getDefaultDepartments()
  if (defaultIds && defaultIds.length > 0) {
    selectedDepartmentIds.value = defaultIds
  } else {
    // Fallback to known good IDs based on API structure
    selectedDepartmentIds.value = ['general', 'academic', 'scholarship']
  }
}

function toggleExpanded() {
  expanded.value = !expanded.value
}

async function applySelection() {
  applying.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API call
    
    initialSelection.value = [...selectedDepartmentIds.value]
    
    emit('apply', {
      selected: selectedDepartmentIds.value,
      departments: selectedDepartments.value
    })
  } finally {
    applying.value = false
  }
}

function getDepartmentCardClass(department) {
  return `department-${department.id}`
}

function getDepartmentStats(departmentId) {
  return props.departmentStats[departmentId] || {}
}

function getErrorMessage(departmentId) {
  return props.departmentErrors[departmentId]?.message || '오류 발생'
}

function formatLastUpdate(date) {
  if (!date) return '정보 없음'
  return formatDateForMobile(date)
}

// Prevent circular updates
let isUpdatingFromParent = false

// Watchers
watch(selectedDepartmentIds, (newValue) => {
  if (isUpdatingFromParent) return
  
  emit('update:modelValue', newValue)
  emit('selection-change', {
    selected: newValue,
    departments: selectedDepartments.value,
    count: newValue.length
  })
}, { deep: true })

watch(() => props.modelValue, (newValue) => {
  // Prevent circular updates by checking if values are actually different
  if (JSON.stringify(newValue) === JSON.stringify(selectedDepartmentIds.value)) {
    return
  }
  
  isUpdatingFromParent = true
  selectedDepartmentIds.value = [...newValue]
  // Update initial selection when parent updates
  initialSelection.value = [...newValue]
  
  // Reset flag on next tick
  nextTick(() => {
    isUpdatingFromParent = false
  })
}, { deep: true })

// Lifecycle
onMounted(() => {
  // Set initial selection for change tracking
  initialSelection.value = [...selectedDepartmentIds.value]
  
  // Set initial selection if empty (after setting initialSelection)
  if (selectedDepartmentIds.value.length === 0) {
    selectDefaults()
    // Update initialSelection after default selection
    initialSelection.value = [...selectedDepartmentIds.value]
  }
})
</script>

<style scoped>
/* Container */
.department-selector {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.selector-compact {
  padding: 1rem;
  box-shadow: none;
  border: 1px solid theme('colors.gray.200');
}

/* Header */
.selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid theme('colors.gray.100');
}

/* Selection Mode */
.selection-mode {
  margin-bottom: 1rem;
}

.mode-buttons {
  display: flex;
  background: theme('colors.gray.100');
  border-radius: 0.5rem;
  padding: 0.25rem;
  gap: 0.25rem;
}

.mode-button {
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: theme('colors.gray.600');
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
}

.mode-active {
  background: white;
  color: theme('colors.knue.primary');
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* Quick Actions */
.quick-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.action-button {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: theme('colors.gray.50');
  border: 1px solid theme('colors.gray.200');
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: theme('colors.gray.700');
  white-space: nowrap;
  transition: all 0.2s ease;
  min-height: 44px;
}

.action-button:hover:not(:disabled) {
  background: theme('colors.gray.100');
  border-color: theme('colors.gray.300');
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Department Grid */
.department-grid {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.grid-responsive {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.selector-compact .grid-responsive {
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.grid-hidden {
  display: none;
}

@media (max-width: 768px) {
  .grid-responsive {
    grid-template-columns: 1fr;
  }
  
  .selector-compact .grid-responsive {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Department Card */
.department-card {
  position: relative;
  background: white;
  border: 2px solid theme('colors.gray.200');
  border-radius: 0.75rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
}

/* Compact mode styling */
.selector-compact .department-card {
  padding: 0.5rem;
  border-radius: 0.5rem;
  border-width: 1px;
  min-height: auto;
}

.department-card:hover {
  border-color: theme('colors.knue.accent');
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.15);
}

.card-selected {
  border-color: theme('colors.knue.primary');
  background: theme('colors.blue.50');
}

/* Selection Indicator */
.selection-indicator {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
}

.selector-compact .selection-indicator {
  top: 0.25rem;
  right: 0.25rem;
}

.checkbox-wrapper {
  position: relative;
}

.department-checkbox {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid theme('colors.gray.300');
  border-radius: 0.25rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.selector-compact .checkbox-label {
  width: 1rem;
  height: 1rem;
  border-width: 1px;
}

.department-checkbox:checked + .checkbox-label {
  background: theme('colors.knue.primary');
  border-color: theme('colors.knue.primary');
  color: white;
}

/* Department Content */
.department-icon {
  font-size: 2rem;
  margin-bottom: 0.75rem;
  text-align: center;
}

.selector-compact .department-icon {
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
}

.department-info {
  text-align: center;
}

.department-name {
  font-size: 1rem;
  font-weight: 600;
  color: theme('colors.gray.900');
  margin: 0 0 0.25rem 0;
}

.selector-compact .department-name {
  font-size: 0.75rem;
  margin: 0;
}

.department-description {
  font-size: 0.875rem;
  color: theme('colors.gray.600');
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
}

/* Department Stats */
.department-stats {
  display: flex;
  justify-content: center;
  gap: 1rem;
  font-size: 0.75rem;
  color: theme('colors.gray.500');
}

.stat-item {
  display: flex;
  align-items: center;
}

/* Loading and Error States */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
}

.loading-spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid theme('colors.gray.200');
  border-top: 2px solid theme('colors.knue.primary');
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-indicator {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
}

/* Compact Mode */
.compact-summary {
  margin-bottom: 1rem;
}

.summary-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: theme('colors.gray.50');
  border: 1px solid theme('colors.gray.200');
  border-radius: 0.5rem;
  padding: 0.75rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  min-height: 44px;
}

.summary-button:hover {
  background: theme('colors.gray.100');
}

.selected-departments {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.department-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.more-badge {
  padding: 0.25rem 0.5rem;
  background: theme('colors.gray.200');
  color: theme('colors.gray.700');
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.expand-icon {
  width: 1rem;
  height: 1rem;
  color: theme('colors.gray.500');
  transition: transform 0.2s ease;
}

/* Apply Section */
.apply-section {
  border-top: 1px solid theme('colors.gray.200');
  padding-top: 1rem;
}

/* Accessibility */
.department-card:focus-visible {
  outline: 2px solid theme('colors.knue.primary');
  outline-offset: 2px;
}

/* Animations */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Touch Devices */
@media (hover: none) and (pointer: coarse) {
  .department-card:hover {
    transform: none;
  }
  
  .department-card:active {
    transform: scale(0.98);
  }
}
</style>