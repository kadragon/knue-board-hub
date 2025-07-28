<template>
  <div class="rss-feed-list" :class="containerClass">
    <!-- Header Section -->
    <header class="feed-header">
      <div class="header-top">
        <div class="title-section">
          <h1 class="app-title">
            <i class="i-tabler-school w-6 h-6 mr-2 text-knue-primary" />
            KNUE 게시판
          </h1>
          <p class="app-subtitle">한국교원대학교 통합 공지사항</p>
        </div>
        
        <div class="header-actions">
          <RefreshButton
            :loading="isRefreshing"
            :last-update="lastUpdateTime"
            :update-count="newItemsCount"
            :show-update-badge="newItemsCount > 0"
            :show-last-update="!compact"
            :pull-to-refresh="true"
            :auto-refresh="autoRefresh"
            :icon-only="compact"
            @refresh="handleRefresh"
            @pull-refresh="handlePullRefresh"
          />
        </div>
      </div>

      <!-- Department Selector -->
      <DepartmentSelector
        v-model="selectedDepartments"
        :compact="compact"
        :show-stats="showStats"
        :loading-departments="loadingDepartments"
        :error-departments="errorDepartments"
        :department-stats="departmentStats"
        :department-errors="departmentErrors"
        @selection-change="handleDepartmentChange"
        @apply="handleDepartmentApply"
      />

      <!-- Filter Bar -->
      <div v-if="showFilters" class="filter-bar">
        <div class="filter-group">
          <!-- Search Input -->
          <div class="search-wrapper">
            <input
              v-model="searchQuery"
              type="search"
              placeholder="게시글 검색..."
              class="search-input"
              :disabled="isLoading"
            />
            <i class="search-icon i-tabler-search" />
          </div>

          <!-- Date Filter -->
          <select v-model="dateFilter" class="date-filter">
            <option value="all">전체 기간</option>
            <option value="today">오늘</option>
            <option value="week">이번 주</option>
            <option value="month">이번 달</option>
          </select>

          <!-- Sort Options -->
          <select v-model="sortOption" class="sort-select">
            <option value="date-desc">최신순</option>
            <option value="date-asc">오래된순</option>
            <option value="department">게시판순</option>
          </select>
        </div>

        <!-- Active Filters -->
        <div v-if="hasActiveFilters" class="active-filters">
          <span class="filter-label">필터:</span>
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="filter-tag"
          >
            "{{ searchQuery }}" <i class="i-tabler-x w-3 h-3 ml-1" />
          </button>
          <button
            v-if="dateFilter !== 'all'"
            @click="dateFilter = 'all'"
            class="filter-tag"
          >
            {{ getDateFilterLabel(dateFilter) }} <i class="i-tabler-x w-3 h-3 ml-1" />
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="feed-content">
      <!-- Loading State -->
      <LoadingSpinner
        v-if="isInitialLoading"
        size="lg"
        text="게시판을 불러오는 중..."
        :show-progress="true"
        :progress="loadingProgress"
      />

      <!-- Error State -->
      <EmptyState
        v-else-if="hasError && !filteredItems.length"
        title="게시판을 불러올 수 없습니다"
        :description="errorMessage"
        icon-name="i-tabler-wifi-off"
        icon-color="red"
        action-text="다시 시도"
        :action-loading="isRefreshing"
        @action="handleRefresh"
      />

      <!-- Empty State -->
      <EmptyState
        v-else-if="!filteredItems.length && !isLoading"
        :title="getEmptyStateTitle()"
        :description="getEmptyStateDescription()"
        icon-name="i-tabler-inbox"
        action-text="새로고침"
        secondary-action-text="필터 초기화"
        @action="handleRefresh"
        @secondary-action="clearFilters"
      />

      <!-- Feed Items -->
      <div v-else class="feed-items">
        <!-- Stats Summary -->
        <div v-if="showStats && !compact" class="stats-summary">
          <div class="stat-item">
            <i class="i-tabler-article w-4 h-4 mr-1" />
            <span>총 {{ totalItems }}개</span>
          </div>
          <div class="stat-item">
            <i class="i-tabler-clock w-4 h-4 mr-1" />
            <span>{{ newItemsToday }}개 오늘</span>
          </div>
          <div class="stat-item">
            <i class="i-tabler-building-bank w-4 h-4 mr-1" />
            <span>{{ activeDepartmentCount }}개 게시판</span>
          </div>
        </div>

        <!-- Group by Date -->
        <div v-if="groupByDate" class="grouped-items">
          <div
            v-for="(group, date) in groupedItems"
            :key="date"
            class="date-group"
          >
            <h3 class="date-header">
              <i class="i-tabler-calendar w-4 h-4 mr-2" />
              {{ formatDateGroupHeader(date) }}
              <span class="item-count">({{ group.length }}개)</span>
            </h3>
            
            <div class="group-items">
              <RssItem
                v-for="item in group"
                :key="item.id"
                :item="item"
                :show-description="showDescriptions"
                :compact="compact"
                @click="handleItemClick"
                @share="handleItemShare"
                @bookmark="handleItemBookmark"
                @mark-read="handleItemRead"
              />
            </div>
          </div>
        </div>

        <!-- Simple List -->
        <div v-else class="simple-items">
          <RssItem
            v-for="item in paginatedItems"
            :key="item.id"
            :item="item"
            :show-description="showDescriptions"
            :compact="compact"
            @click="handleItemClick"
            @share="handleItemShare"
            @bookmark="handleItemBookmark"
            @mark-read="handleItemRead"
          />
        </div>

        <!-- Load More -->
        <div v-if="showLoadMore" class="load-more-section">
          <button
            @click="loadMore"
            :disabled="isLoadingMore"
            class="btn-secondary w-full btn-touch"
          >
            <i 
              v-if="isLoadingMore" 
              class="i-tabler-loader-2 w-4 h-4 animate-spin mr-2" 
            />
            <i v-else class="i-tabler-plus w-4 h-4 mr-2" />
            {{ isLoadingMore ? '로딩 중...' : `더 보기 (${remainingItems}개 남음)` }}
          </button>
        </div>

        <!-- Infinite Scroll Trigger -->
        <div
          v-if="infiniteScroll && !showLoadMore"
          ref="infiniteScrollTrigger"
          class="infinite-scroll-trigger"
        />
      </div>
    </main>

    <!-- Floating Action Button (Mobile) -->
    <div v-if="showFab" class="fab-container">
      <button
        @click="scrollToTop"
        class="fab-button"
        :class="{ 'fab-visible': showScrollToTop }"
        aria-label="맨 위로"
      >
        <i class="i-tabler-arrow-up w-5 h-5" />
      </button>
    </div>

    <!-- Quick Settings Panel -->
    <div v-if="showQuickSettings" class="quick-settings" :class="{ 'settings-open': settingsOpen }">
      <button
        @click="toggleSettings"
        class="settings-toggle"
      >
        <i class="i-tabler-settings w-5 h-5" />
      </button>
      
      <div v-if="settingsOpen" class="settings-panel">
        <div class="setting-item">
          <label class="setting-label">
            <input
              :checked="autoRefresh"
              @change="$emit('update:autoRefresh', $event.target.checked)"
              type="checkbox"
              class="setting-checkbox"
            />
            자동 새로고침
          </label>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">
            <input
              :checked="showDescriptions"
              @change="$emit('update:showDescriptions', $event.target.checked)"
              type="checkbox"
              class="setting-checkbox"
            />
            내용 미리보기
          </label>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">
            <input
              :checked="groupByDate"
              @change="$emit('update:groupByDate', $event.target.checked)"
              type="checkbox"
              class="setting-checkbox"
            />
            날짜별 그룹화
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRssFeed } from '../composables/useRssFeed.js'
import { useGlobalNotifications } from '../composables/useNotifications.js'
import { getDefaultDepartments, getAllDepartments } from '../config/departments.js'
import { groupByDateCategory, isToday, formatDateForMobile } from '../utils/dateUtils.js'

// Components
import RssItem from './RssItem.vue'
import DepartmentSelector from './DepartmentSelector.vue'
import LoadingSpinner from './LoadingSpinner.vue'
import EmptyState from './EmptyState.vue'
import RefreshButton from './RefreshButton.vue'

// Props
const props = defineProps({
  // Layout
  compact: {
    type: Boolean,
    default: false
  },
  
  // Features
  showFilters: {
    type: Boolean,
    default: true
  },
  
  showStats: {
    type: Boolean,
    default: true
  },
  
  showDescriptions: {
    type: Boolean,
    default: true
  },
  
  groupByDate: {
    type: Boolean,
    default: false
  },
  
  infiniteScroll: {
    type: Boolean,
    default: true
  },
  
  itemsPerPage: {
    type: Number,
    default: 20
  },
  
  // Mobile features
  showFab: {
    type: Boolean,
    default: true
  },
  
  showQuickSettings: {
    type: Boolean,
    default: true
  },
  
  // Auto features
  autoRefresh: {
    type: Boolean,
    default: false
  }
})

// Composables
const {
  allItems,
  loading,
  errors,
  lastUpdate,
  fetchFeeds,
  refreshFeeds,
  hasErrors
} = useRssFeed({
  autoRefresh: props.autoRefresh,
  refreshInterval: 5 * 60 * 1000 // 5 minutes
})

const { showSuccess, showError, showFeedUpdate } = useGlobalNotifications()

// State
const selectedDepartments = ref(getDefaultDepartments().map(d => d.id))
const searchQuery = ref('')
const dateFilter = ref('all')
const sortOption = ref('date-desc')
const currentPage = ref(1)
const isRefreshing = ref(false)
const isLoadingMore = ref(false)
const settingsOpen = ref(false)
const showScrollToTop = ref(false)
const newItemsCount = ref(0)

// Refs
const infiniteScrollTrigger = ref(null)

// Computed
const containerClass = computed(() => {
  const classes = []
  if (props.compact) classes.push('feed-compact')
  return classes
})

const isInitialLoading = computed(() => 
  loading.value && allItems.value.length === 0
)

const isLoading = computed(() => loading.value)

const hasError = computed(() => hasErrors.value)

const errorMessage = computed(() => {
  const errorArray = Array.from(errors.value.values())
  return errorArray[0]?.message || '알 수 없는 오류가 발생했습니다'
})

const lastUpdateTime = computed(() => lastUpdate.value)

const loadingProgress = computed(() => {
  // Simulate loading progress
  return loading.value ? Math.min(90, 30 + (Date.now() % 60)) : 100
})

const hasActiveFilters = computed(() => 
  searchQuery.value || dateFilter.value !== 'all'
)

// Filter and sort items
const filteredItems = computed(() => {
  let items = [...allItems.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item =>
      item.title.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    )
  }

  // Date filter
  if (dateFilter.value !== 'all') {
    const now = new Date()
    items = items.filter(item => {
      if (!item.pubDate) return false
      const itemDate = new Date(item.pubDate)
      
      switch (dateFilter.value) {
        case 'today':
          return isToday(itemDate)
        case 'week':
          return (now - itemDate) <= 7 * 24 * 60 * 60 * 1000
        case 'month':
          return (now - itemDate) <= 30 * 24 * 60 * 60 * 1000
        default:
          return true
      }
    })
  }

  // Sort
  switch (sortOption.value) {
    case 'date-asc':
      items.sort((a, b) => new Date(a.pubDate) - new Date(b.pubDate))
      break
    case 'department':
      items.sort((a, b) => a.department?.name.localeCompare(b.department?.name))
      break
    default: // date-desc
      items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
  }

  return items
})

const paginatedItems = computed(() => {
  const endIndex = currentPage.value * props.itemsPerPage
  return filteredItems.value.slice(0, endIndex)
})

const groupedItems = computed(() => {
  if (!props.groupByDate) return {}
  return groupByDateCategory(filteredItems.value)
})

const showLoadMore = computed(() => 
  !props.infiniteScroll && 
  paginatedItems.value.length < filteredItems.value.length
)

const remainingItems = computed(() => 
  filteredItems.value.length - paginatedItems.value.length
)

// Stats
const totalItems = computed(() => filteredItems.value.length)
const newItemsToday = computed(() => 
  filteredItems.value.filter(item => isToday(item.pubDate)).length
)
const activeDepartmentCount = computed(() => selectedDepartments.value.length)

// Department data
const loadingDepartments = computed(() => 
  selectedDepartments.value.filter(id => loading.value)
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

// Methods
async function handleRefresh() {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  const previousCount = allItems.value.length
  
  try {
    await refreshFeeds()
    
    const newCount = allItems.value.length - previousCount
    if (newCount > 0) {
      newItemsCount.value = newCount
      showFeedUpdate('전체 게시판', newCount)
    } else {
      showSuccess('게시판이 최신 상태입니다')
    }
  } catch (error) {
    showError(error)
  } finally {
    isRefreshing.value = false
  }
}

async function handlePullRefresh() {
  await handleRefresh()
}

async function handleDepartmentChange({ selected }) {
  selectedDepartments.value = selected
  await fetchFeeds(selected)
}

async function handleDepartmentApply({ selected }) {
  await fetchFeeds(selected)
  showSuccess(`${selected.length}개 게시판이 적용되었습니다`)
}

function handleItemClick(item) {
  console.log('Item clicked:', item)
}

function handleItemShare(item) {
  showSuccess('링크가 공유되었습니다')
}

function handleItemBookmark({ item, bookmarked }) {
  if (bookmarked) {
    showSuccess('북마크에 추가되었습니다')
  } else {
    showSuccess('북마크에서 제거되었습니다')
  }
}

function handleItemRead(item) {
  console.log('Item marked as read:', item)
}

function loadMore() {
  if (isLoadingMore.value) return
  
  isLoadingMore.value = true
  setTimeout(() => {
    currentPage.value++
    isLoadingMore.value = false
  }, 500)
}

function clearFilters() {
  searchQuery.value = ''
  dateFilter.value = 'all'
  sortOption.value = 'date-desc'
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function toggleSettings() {
  settingsOpen.value = !settingsOpen.value
}

function getEmptyStateTitle() {
  if (hasActiveFilters.value) {
    return '검색 결과가 없습니다'
  }
  return '표시할 게시글이 없습니다'
}

function getEmptyStateDescription() {
  if (hasActiveFilters.value) {
    return '다른 검색어나 필터를 시도해보세요'
  }
  return '선택한 게시판에 새로운 게시글이 없습니다'
}

function getDateFilterLabel(filter) {
  const labels = {
    today: '오늘',
    week: '이번 주',
    month: '이번 달'
  }
  return labels[filter] || filter
}

function formatDateGroupHeader(date) {
  const labels = {
    today: '오늘',
    yesterday: '어제',
    'this-week': '이번 주',
    older: '이전'
  }
  return labels[date] || date
}

// Infinite scroll
function setupInfiniteScroll() {
  if (!props.infiniteScroll || !infiniteScrollTrigger.value) return

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !isLoadingMore.value) {
        loadMore()
      }
    },
    { threshold: 0.1 }
  )

  observer.observe(infiniteScrollTrigger.value)
  
  return () => observer.disconnect()
}

// Scroll handling
function handleScroll() {
  showScrollToTop.value = window.scrollY > 300
}

// Lifecycle
onMounted(async () => {
  // Initial load
  await fetchFeeds(selectedDepartments.value)
  
  // Setup infinite scroll
  if (props.infiniteScroll) {
    nextTick(() => {
      const cleanup = setupInfiniteScroll()
      onUnmounted(cleanup)
    })
  }
  
  // Setup scroll listener
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

// Reset new items count after some time
watch(newItemsCount, (count) => {
  if (count > 0) {
    setTimeout(() => {
      newItemsCount.value = 0
    }, 10000) // Reset after 10 seconds
  }
})
</script>

<style scoped>
/* Container */
.rss-feed-list {
  min-height: 100vh;
  background: theme('colors.gray.50');
}

.feed-compact {
  padding: 0.5rem;
}

/* Header */
.feed-header {
  background: white;
  border-bottom: 1px solid theme('colors.gray.200');
  position: sticky;
  top: 0;
  z-index: 20;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
}

.title-section {
  flex: 1;
}

.app-title {
  display: flex;
  align-items: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: theme('colors.gray.900');
  margin: 0 0 0.25rem 0;
}

.app-subtitle {
  font-size: 0.875rem;
  color: theme('colors.gray.600');
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Filter Bar */
.filter-bar {
  padding: 1rem 1.5rem;
  border-top: 1px solid theme('colors.gray.100');
  background: theme('colors.gray.50');
}

.filter-group {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid theme('colors.gray.300');
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: theme('colors.knue.primary');
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: theme('colors.gray.400');
}

.date-filter,
.sort-select {
  padding: 0.75rem;
  border: 1px solid theme('colors.gray.300');
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
  min-width: 120px;
}

.active-filters {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 0.875rem;
  color: theme('colors.gray.600');
  font-weight: 500;
}

.filter-tag {
  display: flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  background: theme('colors.knue.primary');
  color: white;
  border-radius: 1rem;
  font-size: 0.75rem;
  border: none;
  cursor: pointer;
}

/* Main Content */
.feed-content {
  max-width: 1024px;
  margin: 0 auto;
  padding: 0 1rem;
  padding-top: 1rem;
  padding-bottom: 1.5rem;
}

@media (min-width: 640px) {
  .feed-content {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
    padding-top: 1.5rem;
    padding-bottom: 2.25rem;
  }
}

/* Stats Summary */
.stats-summary {
  display: flex;
  gap: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-item {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: theme('colors.gray.600');
}

/* Feed Items */
.feed-items {
  space-y: 1rem;
}

.date-group {
  margin-bottom: 2rem;
}

.date-header {
  display: flex;
  align-items: center;
  font-size: 1.125rem;
  font-weight: 600;
  color: theme('colors.gray.900');
  margin: 0 0 1rem 0;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 0.5rem;
  border-left: 4px solid theme('colors.knue.primary');
}

.item-count {
  margin-left: auto;
  font-size: 0.875rem;
  color: theme('colors.gray.500');
  font-weight: 400;
}

.group-items,
.simple-items {
  space-y: 1rem;
}

/* Load More */
.load-more-section {
  margin-top: 2rem;
  text-align: center;
}

.infinite-scroll-trigger {
  height: 1px;
  margin-top: 2rem;
}

/* FAB */
.fab-container {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 30;
}

.fab-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  background: theme('colors.knue.primary');
  color: white;
  border: none;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: 0;
  transform: scale(0.8);
  pointer-events: none;
}

.fab-visible {
  opacity: 1;
  transform: scale(1);
  pointer-events: all;
}

.fab-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 102, 204, 0.4);
}

/* Quick Settings */
.quick-settings {
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  z-index: 30;
}

.settings-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  background: white;
  border: 1px solid theme('colors.gray.300');
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
}

.settings-toggle:hover {
  background: theme('colors.gray.50');
}

.settings-panel {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 0.5rem;
  background: white;
  border: 1px solid theme('colors.gray.200');
  border-radius: 0.75rem;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 200px;
}

.setting-item {
  margin-bottom: 0.75rem;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-label {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: theme('colors.gray.700');
  cursor: pointer;
}

.setting-checkbox {
  margin-right: 0.5rem;
  accent-color: theme('colors.knue.primary');
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-top {
    padding: 1rem;
  }
  
  .app-title {
    font-size: 1.25rem;
  }
  
  .filter-bar {
    padding: 1rem;
  }
  
  .filter-group {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-wrapper {
    order: -1;
  }
  
  .stats-summary {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .date-header {
    font-size: 1rem;
    padding: 0.5rem 0.75rem;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .rss-feed-list {
    background: theme('colors.gray.900');
  }
  
  .feed-header {
    background: theme('colors.gray.800');
    border-color: theme('colors.gray.700');
  }
  
  .app-title {
    color: theme('colors.gray.100');
  }
  
  .app-subtitle {
    color: theme('colors.gray.400');
  }
  
  .stats-summary {
    background: theme('colors.gray.800');
  }
  
  .date-header {
    background: theme('colors.gray.800');
    color: theme('colors.gray.100');
  }
}
</style>