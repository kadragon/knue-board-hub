<template>
  <div class="search">
    <div class="container-mobile section-spacing">
      <!-- Search Header -->
      <div class="mb-6">
        <h1 class="text-title text-xl mb-4">게시글 검색</h1>
        
        <!-- Search Input -->
        <div class="relative">
          <input
            v-model="searchQuery"
            @keyup.enter="performSearch"
            type="text"
            placeholder="검색어를 입력하세요..."
            class="search-input"
          />
          <button 
            @click="performSearch"
            :disabled="!searchQuery.trim() || searching"
            class="search-button"
          >
            <i 
              :class="searching ? 'i-tabler-loader-2 animate-spin' : 'i-tabler-search'" 
              class="w-4 h-4"
            />
          </button>
        </div>
      </div>

      <!-- Search Filters -->
      <div class="mb-6">
        <div class="flex flex-wrap gap-2 mb-4">
          <button
            v-for="dept in availableDepartments"
            :key="dept.id"
            @click="toggleDepartment(dept.id)"
            class="filter-tag"
            :class="{ 'active': selectedDepartments.includes(dept.id) }"
          >
            <span class="mr-1">{{ dept.icon }}</span>
            {{ dept.name }}
          </button>
        </div>
        
        <div class="flex items-center gap-4 text-caption">
          <label class="flex items-center">
            <input 
              v-model="searchInTitle" 
              type="checkbox" 
              class="mr-2"
            />
            제목에서 검색
          </label>
          <label class="flex items-center">
            <input 
              v-model="searchInContent" 
              type="checkbox" 
              class="mr-2"
            />
            내용에서 검색
          </label>
        </div>
      </div>

      <!-- Search Results -->
      <div v-if="searching" class="space-y-4">
        <div class="skeleton h-24 rounded-xl" v-for="i in 3" :key="i" />
      </div>

      <div v-else-if="hasSearched && searchResults.length === 0" class="text-center py-8">
        <EmptyState 
          icon="i-tabler-search-off"
          title="검색 결과가 없습니다"
          :description="`'${lastSearchQuery}'에 대한 결과를 찾을 수 없습니다`"
        >
          <div class="space-y-2 mt-4">
            <p class="text-caption">검색 팁:</p>
            <ul class="text-caption text-left space-y-1">
              <li>• 다른 키워드를 시도해보세요</li>
              <li>• 더 간단한 검색어를 사용해보세요</li>
              <li>• 게시판을 더 선택해보세요</li>
            </ul>
          </div>
        </EmptyState>
      </div>

      <div v-else-if="searchResults.length > 0">
        <!-- Results Summary -->
        <div class="flex-between mb-4">
          <p class="text-body">
            <span class="font-semibold">{{ searchResults.length }}개</span> 결과 찾음
          </p>
          
          <select v-model="sortBy" class="sort-select">
            <option value="relevance">관련도순</option>
            <option value="date">최신순</option>
            <option value="title">제목순</option>
          </select>
        </div>

        <!-- Results List -->
        <div class="space-y-3">
          <div 
            v-for="result in sortedResults" 
            :key="result.id"
            class="search-result card-rss"
          >
            <div class="flex-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-2">
                  <span 
                    class="badge-department text-xs"
                    :class="`badge-${result.department.id}`"
                  >
                    {{ result.department.icon }} {{ result.department.name }}
                  </span>
                  <span class="text-caption">
                    {{ formatDate(result.pubDate) }}
                  </span>
                </div>
                
                <h3 
                  class="text-subtitle mb-2 line-clamp-2"
                  v-html="highlightSearchTerm(result.title)"
                />
                
                <p 
                  class="text-body line-clamp-3"
                  v-html="highlightSearchTerm(getTextContent(result.description))"
                />
                
                <div class="flex items-center gap-4 mt-3 text-caption">
                  <span class="flex items-center">
                    <i class="i-tabler-eye w-3 h-3 mr-1" />
                    조회 {{ result.views || 0 }}
                  </span>
                  <span v-if="result.commentsCount" class="flex items-center">
                    <i class="i-tabler-message-circle w-3 h-3 mr-1" />
                    댓글 {{ result.commentsCount }}
                  </span>
                </div>
              </div>
              
              <router-link 
                :to="{ name: 'post-detail', params: { id: result.id } }"
                class="btn-icon text-knue-primary hover:bg-blue-50 ml-4"
              >
                <i class="i-tabler-arrow-right w-4 h-4" />
              </router-link>
            </div>
          </div>
        </div>

        <!-- Load More -->
        <div v-if="hasMoreResults" class="text-center mt-6">
          <button 
            @click="loadMoreResults"
            :disabled="loadingMore"
            class="btn-secondary btn-touch"
          >
            <i 
              v-if="loadingMore" 
              class="i-tabler-loader-2 animate-spin w-4 h-4 mr-2" 
            />
            더 보기
          </button>
        </div>
      </div>

      <!-- Recent Searches -->
      <div v-if="!hasSearched && recentSearches.length > 0" class="mt-8">
        <h2 class="text-subtitle mb-3">최근 검색</h2>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="term in recentSearches"
            :key="term"
            @click="searchQuery = term; performSearch()"
            class="recent-search-tag"
          >
            <i class="i-tabler-history w-3 h-3 mr-1" />
            {{ term }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAllDepartments } from '../config/departments.js'
import { useNotifications } from '../composables/useNotifications.js'
import EmptyState from '../components/EmptyState.vue'

const { showError } = useNotifications()

// Search state
const searchQuery = ref('')
const lastSearchQuery = ref('')
const searchResults = ref([])
const searching = ref(false)
const hasSearched = ref(false)
const loadingMore = ref(false)
const hasMoreResults = ref(false)

// Filters
const selectedDepartments = ref(['main', 'academic', 'employment'])
const searchInTitle = ref(true)
const searchInContent = ref(true)
const sortBy = ref('relevance')

// Data
const availableDepartments = ref([])
const recentSearches = ref([])

const sortedResults = computed(() => {
  const results = [...searchResults.value]
  
  switch (sortBy.value) {
    case 'date':
      return results.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    case 'title':
      return results.sort((a, b) => a.title.localeCompare(b.title))
    case 'relevance':
    default:
      return results // Already sorted by relevance from API
  }
})

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric'
  })
}

function getTextContent(html) {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

function highlightSearchTerm(text) {
  if (!lastSearchQuery.value || !text) return text
  
  const regex = new RegExp(`(${lastSearchQuery.value})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>')
}

function toggleDepartment(deptId) {
  const index = selectedDepartments.value.indexOf(deptId)
  if (index > -1) {
    selectedDepartments.value.splice(index, 1)
  } else {
    selectedDepartments.value.push(deptId)
  }
}

async function performSearch() {
  const query = searchQuery.value.trim()
  if (!query) return
  
  searching.value = true
  hasSearched.value = true
  lastSearchQuery.value = query
  
  try {
    // Add to recent searches
    saveRecentSearch(query)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock search results
    searchResults.value = generateMockResults(query)
    hasMoreResults.value = searchResults.value.length >= 10
    
  } catch (error) {
    console.error('Search failed:', error)
    showError('검색 중 오류가 발생했습니다')
    searchResults.value = []
  } finally {
    searching.value = false
  }
}

async function loadMoreResults() {
  if (loadingMore.value) return
  
  loadingMore.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Mock additional results
    const moreResults = generateMockResults(lastSearchQuery.value, searchResults.value.length)
    searchResults.value.push(...moreResults)
    
    hasMoreResults.value = searchResults.value.length < 50
    
  } catch (error) {
    showError('추가 결과를 불러오는데 실패했습니다')
  } finally {
    loadingMore.value = false
  }
}

function generateMockResults(query, offset = 0) {
  const departments = getAllDepartments()
  const results = []
  
  for (let i = 0; i < 10; i++) {
    const index = offset + i
    const dept = departments[index % departments.length]
    
    results.push({
      id: `search-${index}`,
      title: `${query} 관련 게시글 ${index + 1}`,
      description: `이 게시글은 ${query}에 대한 내용을 포함하고 있습니다. 상세한 정보는 원문을 확인해주세요.`,
      pubDate: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
      department: dept,
      views: Math.floor(Math.random() * 1000),
      commentsCount: Math.floor(Math.random() * 20)
    })
  }
  
  return results
}

function saveRecentSearch(query) {
  let recent = [...recentSearches.value]
  
  // Remove if already exists
  recent = recent.filter(term => term !== query)
  
  // Add to beginning
  recent.unshift(query)
  
  // Keep only last 5
  recent = recent.slice(0, 5)
  
  recentSearches.value = recent
  localStorage.setItem('knue-recent-searches', JSON.stringify(recent))
}

function loadRecentSearches() {
  const stored = localStorage.getItem('knue-recent-searches')
  if (stored) {
    recentSearches.value = JSON.parse(stored)
  }
}

onMounted(() => {
  availableDepartments.value = getAllDepartments()
  loadRecentSearches()
})
</script>

<style scoped>
.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  padding-right: 3rem;
  border: 2px solid theme('colors.gray.200');
  border-radius: 0.75rem;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: theme('colors.knue.primary');
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.search-button {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: theme('colors.knue.primary');
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-button:hover:not(:disabled) {
  background: theme('colors.knue.secondary');
}

.search-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.filter-tag {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border: 1px solid theme('colors.gray.300');
  border-radius: 1rem;
  background: white;
  color: theme('colors.gray.600');
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-tag:hover {
  border-color: theme('colors.knue.primary');
  color: theme('colors.knue.primary');
}

.filter-tag.active {
  background: theme('colors.knue.primary');
  border-color: theme('colors.knue.primary');
  color: white;
}

.sort-select {
  padding: 0.375rem 0.75rem;
  border: 1px solid theme('colors.gray.300');
  border-radius: 0.375rem;
  background: white;
  font-size: 0.875rem;
}

.search-result {
  transition: all 0.2s ease;
}

.search-result:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.recent-search-tag {
  display: flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  background: theme('colors.gray.100');
  color: theme('colors.gray.600');
  border: none;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.recent-search-tag:hover {
  background: theme('colors.gray.200');
  color: theme('colors.gray.800');
}

:deep(mark) {
  background: theme('colors.yellow.200');
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}
</style>