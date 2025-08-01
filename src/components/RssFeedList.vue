<template>
  <div class="rss-feed-list" :class="containerClass">
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
          {{ getDateFilterLabel(dateFilter) }}
          <i class="i-tabler-x w-3 h-3 ml-1" />
        </button>
        <button
          v-for="keyword in blockedKeywords.slice(0, 3)"
          :key="`blocked-${keyword}`"
          @click="handleRemoveBlockedKeyword(keyword)"
          class="filter-tag blocked-keyword-tag"
        >
          <i class="i-tabler-ban w-3 h-3 mr-1" />
          {{ keyword }}
          <i class="i-tabler-x w-3 h-3 ml-1" />
        </button>
        <router-link
          v-if="blockedKeywords.length > 3"
          to="/departments"
          class="filter-tag more-keywords-tag"
        >
          +{{ blockedKeywords.length - 3 }}개 더
          <i class="i-tabler-settings w-3 h-3 ml-1" />
        </router-link>
      </div>
    </div>

    <!-- Main Content -->
    <main class="feed-content">
      <!-- Selected Departments Info -->
      <div v-if="selectedDepartments.length > 0 && !isInitialLoading" class="selected-departments-info">
        <div class="departments-header">
          <div class="departments-title">
            <i class="i-tabler-eye w-4 h-4 mr-2" />
            <span>현재 보고 있는 게시판</span>
            <span class="department-count">({{ selectedDepartments.length }}개)</span>
          </div>
          <router-link to="/departments" class="settings-link">
            <i class="i-tabler-settings w-4 h-4 mr-1" />
            설정
          </router-link>
        </div>
        <div class="departments-list">
          <span
            v-for="dept in selectedDepartments.slice(0, 5)"
            :key="`current-${dept.id}`"
            class="department-chip"
            :class="`chip-${dept.id}`"
          >
            {{ dept.icon }} {{ dept.name }}
          </span>
          <span 
            v-if="selectedDepartments.length > 5"
            class="more-departments"
          >
            +{{ selectedDepartments.length - 5 }}개 더
          </span>
        </div>
      </div>

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
          <div v-if="hasBlockedKeywords" class="stat-item filter-stat">
            <i class="i-tabler-filter w-4 h-4 mr-1" />
            <span>{{ blockedKeywords.length }}개 키워드 차단</span>
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
            {{
              isLoadingMore
                ? "로딩 중..."
                : `더 보기 (${remainingItems}개 남음)`
            }}
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
    <div
      v-if="showQuickSettings"
      class="quick-settings"
      :class="{ 'settings-open': settingsOpen }"
    >
      <button @click="toggleSettings" class="settings-toggle">
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
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useRssFeed } from "../composables/useRssFeed.js";
import { useGlobalNotifications } from "../composables/useNotifications.js";
import { useDepartments } from "../composables/useDepartments.js";
import { useKeywordFilter } from "../composables/useKeywordFilter.js";
import {
  groupByDateCategory,
  isToday,
} from "../utils/dateUtils.js";

// Components
import RssItem from "./RssItem.vue";
import LoadingSpinner from "./LoadingSpinner.vue";
import EmptyState from "./EmptyState.vue";

// Props
const props = defineProps({
  // Layout
  compact: {
    type: Boolean,
    default: false,
  },

  // Features
  showFilters: {
    type: Boolean,
    default: true,
  },

  showStats: {
    type: Boolean,
    default: true,
  },

  groupByDate: {
    type: Boolean,
    default: false,
  },

  infiniteScroll: {
    type: Boolean,
    default: true,
  },

  itemsPerPage: {
    type: Number,
    default: 20,
  },

  // Mobile features
  showFab: {
    type: Boolean,
    default: true,
  },

  showQuickSettings: {
    type: Boolean,
    default: true,
  },

  // Auto features
  autoRefresh: {
    type: Boolean,
    default: false,
  },
});

// Composables
const { 
  getDefaultDepartments, 
  initialized: departmentsInitialized,
  departments: allDepartments,
  getDepartment
} = useDepartments();
const {
  allItems,
  loading,
  errors,
  fetchFeeds,
  refreshFeeds,
  hasErrors,
  setActiveDepartments,
  getSelectedDepartments,
} = useRssFeed({
  autoRefresh: props.autoRefresh,
  refreshInterval: 5 * 60 * 1000, // 5 minutes
});

const { showSuccess, showError, showFeedUpdate } = useGlobalNotifications();

const { 
  filterItems, 
  hasBlockedKeywords, 
  blockedKeywords, 
  getFilterStats,
  removeBlockedKeyword
} = useKeywordFilter();

// State - Initialize empty, will be set once departments are loaded
const selectedDepartmentIds = ref([]);
const searchQuery = ref("");
const dateFilter = ref("all");
const currentPage = ref(1);
const isRefreshing = ref(false);
const isLoadingMore = ref(false);
const settingsOpen = ref(false);
const showScrollToTop = ref(false);
const newItemsCount = ref(0);

// Refs
const infiniteScrollTrigger = ref(null);

// Computed
const containerClass = computed(() => {
  const classes = [];
  if (props.compact) classes.push("feed-compact");
  return classes;
});

const isInitialLoading = computed(
  () => loading.value && allItems.value.length === 0
);

const isLoading = computed(() => loading.value);

const hasError = computed(() => hasErrors.value);

const errorMessage = computed(() => {
  const errorArray = Array.from(errors.value.values());
  return errorArray[0]?.message || "알 수 없는 오류가 발생했습니다";
});
const loadingProgress = computed(() => {
  // Simulate loading progress
  return loading.value ? Math.min(90, 30 + (Date.now() % 60)) : 100;
});

const hasActiveFilters = computed(
  () => searchQuery.value || dateFilter.value !== "all" || hasBlockedKeywords.value
);

// Filter and sort items
const filteredItems = computed(() => {
  let items = [...allItems.value];

  // Keyword filter (applied first to reduce processing)
  if (hasBlockedKeywords.value) {
    items = filterItems(items);
  }

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    items = items.filter((item) => item.title.toLowerCase().includes(query));
  }

  // Date filter
  if (dateFilter.value !== "all") {
    const now = new Date();
    items = items.filter((item) => {
      if (!item.pubDate) return false;
      const itemDate = new Date(item.pubDate);

      switch (dateFilter.value) {
        case "today":
          return isToday(itemDate);
        case "week":
          return now - itemDate <= 7 * 24 * 60 * 60 * 1000;
        case "month":
          return now - itemDate <= 30 * 24 * 60 * 60 * 1000;
        default:
          return true;
      }
    });
  }

  // Always sort by newest first
  items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  return items;
});

const paginatedItems = computed(() => {
  const endIndex = currentPage.value * props.itemsPerPage;
  return filteredItems.value.slice(0, endIndex);
});

const groupedItems = computed(() => {
  if (!props.groupByDate) return {};
  return groupByDateCategory(filteredItems.value);
});

const showLoadMore = computed(
  () =>
    !props.infiniteScroll &&
    paginatedItems.value.length < filteredItems.value.length
);

const remainingItems = computed(
  () => filteredItems.value.length - paginatedItems.value.length
);

// Stats
const totalItems = computed(() => filteredItems.value.length);
const newItemsToday = computed(
  () => filteredItems.value.filter((item) => isToday(item.pubDate)).length
);
// Selected departments info for display
const selectedDepartments = computed(() => {
  return selectedDepartmentIds.value
    .filter(id => id && typeof id === 'string' && id.trim() !== '') // Filter invalid IDs first
    .map(id => getDepartment(id))
    .filter(dept => dept) // Filter out any undefined departments
});

const activeDepartmentCount = computed(() => selectedDepartmentIds.value.length);

// Methods
async function handleRefresh() {
  if (isRefreshing.value) return;

  isRefreshing.value = true;
  const previousCount = allItems.value.length;

  try {
    await refreshFeeds();

    const newCount = allItems.value.length - previousCount;
    if (newCount > 0) {
      newItemsCount.value = newCount;
      showFeedUpdate("전체 게시판", newCount);
    } else {
      showSuccess("게시판이 최신 상태입니다");
    }
  } catch (error) {
    showError(error);
  } finally {
    isRefreshing.value = false;
  }
}
async function handleAppRefresh() {
  await handleRefresh();
}
function handleItemClick() {
  // Handle item click
}

function handleItemShare() {
  showSuccess("링크가 공유되었습니다");
}

function handleItemBookmark({ bookmarked }) {
  if (bookmarked) {
    showSuccess("북마크에 추가되었습니다");
  } else {
    showSuccess("북마크에서 제거되었습니다");
  }
}

function handleItemRead(item) {
  console.log("Item marked as read:", item);
}

function loadMore() {
  if (isLoadingMore.value) return;

  isLoadingMore.value = true;
  setTimeout(() => {
    currentPage.value++;
    isLoadingMore.value = false;
  }, 500);
}

function clearFilters() {
  searchQuery.value = "";
  dateFilter.value = "all";
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleSettings() {
  settingsOpen.value = !settingsOpen.value;
}

function getEmptyStateTitle() {
  if (hasActiveFilters.value) {
    return "검색 결과가 없습니다";
  }
  return "표시할 게시글이 없습니다";
}

function getEmptyStateDescription() {
  if (hasActiveFilters.value) {
    return "다른 검색어나 필터를 시도해보세요";
  }
  return "선택한 게시판에 새로운 게시글이 없습니다";
}

function getDateFilterLabel(filter) {
  const labels = {
    today: "오늘",
    week: "이번 주",
    month: "이번 달",
  };
  return labels[filter] || filter;
}

function formatDateGroupHeader(date) {
  const labels = {
    today: "오늘",
    yesterday: "어제",
    "this-week": "이번 주",
    older: "이전",
  };
  return labels[date] || date;
}

// Keyword filter methods
async function handleRemoveBlockedKeyword(keyword) {
  try {
    const wasRemoved = removeBlockedKeyword(keyword);
    if (wasRemoved) {
      showSuccess(`"${keyword}" 키워드 차단이 해제되었습니다`);
    }
  } catch (error) {
    showError('키워드 차단 해제 중 오류가 발생했습니다');
  }
}

// Infinite scroll
function setupInfiniteScroll() {
  if (!props.infiniteScroll || !infiniteScrollTrigger.value) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !isLoadingMore.value) {
        loadMore();
      }
    },
    { threshold: 0.1 }
  );

  observer.observe(infiniteScrollTrigger.value);

  return () => observer.disconnect();
}

// Scroll handling
function handleScroll() {
  showScrollToTop.value = window.scrollY > 300;
}

// Store cleanup functions
let infiniteScrollCleanup = null;

// Watch for departments initialization and load selected departments
watch(departmentsInitialized, async (isInitialized) => {
  if (isInitialized && selectedDepartmentIds.value.length === 0) {
    const selectedIds = await getSelectedDepartments();
    if (selectedIds.length > 0) {
      selectedDepartmentIds.value = selectedIds;
      setActiveDepartments(selectedIds, false); // Don't persist again, already persisted
      await fetchFeeds(selectedIds);
    }
  }
}, { immediate: true });

// Lifecycle
onMounted(async () => {
  // If departments are already initialized (cached), load selected departments immediately
  if (departmentsInitialized.value && selectedDepartmentIds.value.length === 0) {
    const selectedIds = await getSelectedDepartments();
    if (selectedIds.length > 0) {
      selectedDepartmentIds.value = selectedIds;
      setActiveDepartments(selectedIds, false); // Don't persist again, already persisted
      await fetchFeeds(selectedIds);
    }
  }

  // Setup infinite scroll
  if (props.infiniteScroll) {
    nextTick(() => {
      infiniteScrollCleanup = setupInfiniteScroll();
    });
  }

  // Setup scroll listener
  window.addEventListener("scroll", handleScroll);
  
  // Listen for app refresh events
  window.addEventListener("app-refresh", handleAppRefresh);
});

onUnmounted(() => {
  // Clean up infinite scroll
  if (infiniteScrollCleanup) {
    infiniteScrollCleanup();
  }

  // Clean up scroll listener
  window.removeEventListener("scroll", handleScroll);
  
  // Clean up app refresh listener
  window.removeEventListener("app-refresh", handleAppRefresh);
});

// Reset new items count after some time
watch(newItemsCount, (count) => {
  if (count > 0) {
    setTimeout(() => {
      newItemsCount.value = 0;
    }, 10000); // Reset after 10 seconds
  }
});
</script>

<style scoped>
/* Container */
.rss-feed-list {
  min-height: 100vh;
  background: theme("colors.gray.50");
}

.feed-compact {
  padding: 0.5rem;
}

/* Filter Bar */
.filter-bar {
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid theme("colors.gray.200");
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .filter-bar {
    padding: 0.75rem 1rem;
  }
}

.filter-bar > * {
  max-width: 1200px;
  margin: 0 auto;
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
  border: 1px solid theme("colors.gray.300");
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
  color: theme("colors.gray.900");
}

.search-input:focus {
  outline: none;
  border-color: theme("colors.knue.primary");
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: theme("colors.gray.400");
}

.date-filter {
  padding: 0.75rem;
  border: 1px solid theme("colors.gray.300");
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
  min-width: 120px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.date-filter:focus {
  outline: none;
  border-color: theme("colors.knue.primary");
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.date-filter:hover {
  border-color: theme("colors.gray.400");
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
  color: theme("colors.gray.600");
  font-weight: 500;
}

.filter-tag {
  display: flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  background: theme("colors.knue.primary");
  color: white;
  border-radius: 1rem;
  font-size: 0.75rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.filter-tag:hover {
  background: theme("colors.blue.700");
  transform: translateY(-1px);
}

.blocked-keyword-tag {
  background: theme("colors.red.500");
  color: white;
}

.blocked-keyword-tag:hover {
  background: theme("colors.red.600");
}

.more-keywords-tag {
  background: theme("colors.gray.500");
  color: white;
}

.more-keywords-tag:hover {
  background: theme("colors.gray.600");
}

/* Main Content */
.feed-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  padding-top: 1rem;
  padding-bottom: 1.5rem;
}

/* Selected Departments Info */
.selected-departments-info {
  background: white;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid theme('colors.gray.200');
}

.departments-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.departments-title {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: theme('colors.gray.700');
}

.department-count {
  color: theme('colors.gray.500');
  font-weight: 400;
  margin-left: 0.25rem;
}

.settings-link {
  display: flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  background: theme('colors.gray.50');
  border: 1px solid theme('colors.gray.200');
  border-radius: 0.5rem;
  font-size: 0.75rem;
  color: theme('colors.gray.600');
  text-decoration: none;
  transition: all 0.2s ease;
}

.settings-link:hover {
  background: theme('colors.gray.100');
  border-color: theme('colors.gray.300');
  color: theme('colors.knue.primary');
}

.departments-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.department-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  background: theme('colors.blue.50');
  border: 1px solid theme('colors.blue.200');
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: theme('colors.blue.700');
}

.more-departments {
  padding: 0.25rem 0.75rem;
  background: theme('colors.gray.100');
  color: theme('colors.gray.600');
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .feed-content {
    padding-top: 0.75rem;
    padding-bottom: 1rem;
  }
}

@media (min-width: 640px) {
  .feed-content {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
    padding-top: 1.5rem;
    padding-bottom: 2.25rem;
  }
}

@media (min-width: 1024px) {
  .feed-content {
    padding-left: 2rem;
    padding-right: 2rem;
    padding-top: 2rem;
    padding-bottom: 3rem;
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

@media (min-width: 1024px) {
  .stats-summary {
    padding: 1.5rem;
    margin-bottom: 2rem;
    border-radius: 1rem;
  }
}

.stat-item {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: theme("colors.gray.600");
}

.stat-item.filter-stat {
  color: theme("colors.red.600");
  font-weight: 500;
}

/* Feed Items */
.feed-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.date-group {
  margin-bottom: 2rem;
}

.date-header {
  display: flex;
  align-items: center;
  font-size: 1.125rem;
  font-weight: 600;
  color: theme("colors.gray.900");
  margin: 0 0 1rem 0;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 0.5rem;
  border-left: 4px solid theme("colors.knue.primary");
}

.item-count {
  margin-left: auto;
  font-size: 0.875rem;
  color: theme("colors.gray.500");
  font-weight: 400;
}

.group-items,
.simple-items {
  gap: 1rem;
}

/* Mobile: Single column layout */
.simple-items {
  display: flex;
  flex-direction: column;
}

/* Desktop: Two column grid layout */
@media (min-width: 1024px) {
  .simple-items {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    align-items: start; /* Prevent items from stretching to match row height */
  }

  .group-items {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    align-items: start; /* Prevent items from stretching to match row height */
  }
}

/* Large desktop: Three column grid layout */
@media (min-width: 1400px) {
  .simple-items {
    grid-template-columns: repeat(3, 1fr);
    align-items: start; /* Prevent items from stretching to match row height */
  }

  .group-items {
    grid-template-columns: repeat(3, 1fr);
    align-items: start; /* Prevent items from stretching to match row height */
  }
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
  background: theme("colors.knue.primary");
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
  border: 1px solid theme("colors.gray.300");
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
}

.settings-toggle:hover {
  background: theme("colors.gray.50");
}

.settings-panel {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 0.5rem;
  background: white;
  border: 1px solid theme("colors.gray.200");
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
  color: theme("colors.gray.700");
  cursor: pointer;
}

.setting-checkbox {
  margin-right: 0.5rem;
  accent-color: theme("colors.knue.primary");
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
    gap: 0.75rem;
  }

  .search-wrapper {
    order: -1;
    min-width: unset;
  }

  .date-filter {
    width: 100%;
    min-width: unset;
  }

  .stats-summary {
    flex-direction: column;
    gap: 0.75rem;
  }

  .date-header {
    font-size: 1rem;
    padding: 0.5rem 0.75rem;
  }

  .selected-departments-info {
    padding: 0.75rem;
    margin-bottom: 1rem;
  }

  .departments-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .settings-link {
    align-self: flex-end;
  }
}

</style>
