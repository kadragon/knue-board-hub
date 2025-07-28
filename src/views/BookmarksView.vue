<template>
  <div class="bookmarks">
    <div class="container-mobile section-spacing">
      <!-- Header -->
      <div class="flex-between mb-6">
        <div>
          <h1 class="text-title text-xl mb-1">북마크</h1>
          <p class="text-body">저장한 게시글을 확인하세요</p>
        </div>
        
        <button 
          v-if="bookmarks.length > 0"
          @click="clearAllBookmarks"
          class="btn-secondary btn-touch text-red-600"
        >
          <i class="i-tabler-trash w-4 h-4 mr-2" />
          전체 삭제
        </button>
      </div>

      <!-- Bookmarks List -->
      <div v-if="loading" class="space-y-4">
        <div class="skeleton h-24 rounded-xl" v-for="i in 3" :key="i" />
      </div>

      <EmptyState 
        v-else-if="bookmarks.length === 0"
        icon="i-tabler-bookmark"
        title="저장된 북마크가 없습니다"
        description="관심있는 게시글을 북마크하여 나중에 쉽게 찾아보세요"
      >
        <router-link to="/" class="btn-primary btn-touch mt-4">
          게시글 둘러보기
        </router-link>
      </EmptyState>

      <div v-else class="space-y-3">
        <div 
          v-for="bookmark in bookmarks" 
          :key="bookmark.id"
          class="bookmark-item card-rss"
        >
          <div class="flex-between">
            <div class="flex-1 min-w-0">
              <h3 class="text-subtitle mb-1 line-clamp-2">
                {{ bookmark.title }}
              </h3>
              
              <div class="flex items-center gap-4 text-caption mb-2">
                <div class="flex items-center">
                  <span class="mr-1">{{ bookmark.department?.icon }}</span>
                  {{ bookmark.department?.name }}
                </div>
                <div class="flex items-center">
                  <i class="i-tabler-calendar w-3 h-3 mr-1" />
                  {{ formatDate(bookmark.pubDate) }}
                </div>
              </div>
              
              <p class="text-body line-clamp-2">
                {{ getTextContent(bookmark.description) }}
              </p>
            </div>
            
            <div class="flex items-center gap-2 ml-4">
              <button 
                @click="removeBookmark(bookmark.id)"
                class="btn-icon text-red-500 hover:bg-red-50"
              >
                <i class="i-tabler-bookmark-off w-4 h-4" />
              </button>
              
              <router-link 
                :to="{ name: 'post-detail', params: { id: bookmark.id } }"
                class="btn-icon text-knue-primary hover:bg-blue-50"
              >
                <i class="i-tabler-arrow-right w-4 h-4" />
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useNotifications } from '../composables/useNotifications.js'
import { getDepartment } from '../config/departments.js'
import EmptyState from '../components/EmptyState.vue'

const { showSuccess, showWarning } = useNotifications()

const bookmarks = ref([])
const loading = ref(true)

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return '오늘'
  if (diffDays === 2) return '어제'
  if (diffDays <= 7) return `${diffDays}일 전`
  
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

async function loadBookmarks() {
  loading.value = true
  
  try {
    // Get bookmark IDs from localStorage
    const bookmarkIds = JSON.parse(localStorage.getItem('knue-bookmarks') || '[]')
    
    if (bookmarkIds.length === 0) {
      bookmarks.value = []
      return
    }
    
    // In a real app, fetch bookmark details from API
    // For now, use mock data
    await new Promise(resolve => setTimeout(resolve, 500))
    
    bookmarks.value = bookmarkIds.map((id, index) => ({
      id,
      title: `북마크된 게시글 ${index + 1}`,
      description: '이것은 북마크된 게시글의 내용입니다. 실제 앱에서는 API를 통해 데이터를 가져와야 합니다.',
      pubDate: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
      department: getDepartment(['main', 'academic', 'employment'][index % 3])
    }))
    
  } catch (error) {
    console.error('Failed to load bookmarks:', error)
    bookmarks.value = []
  } finally {
    loading.value = false
  }
}

function removeBookmark(bookmarkId) {
  const bookmarkIds = JSON.parse(localStorage.getItem('knue-bookmarks') || '[]')
  const filteredIds = bookmarkIds.filter(id => id !== bookmarkId)
  
  localStorage.setItem('knue-bookmarks', JSON.stringify(filteredIds))
  bookmarks.value = bookmarks.value.filter(bookmark => bookmark.id !== bookmarkId)
  
  showSuccess('북마크가 제거되었습니다')
}

function clearAllBookmarks() {
  if (window.confirm('모든 북마크를 삭제하시겠습니까?')) {
    localStorage.removeItem('knue-bookmarks')
    bookmarks.value = []
    showWarning('모든 북마크가 삭제되었습니다')
  }
}

onMounted(() => {
  loadBookmarks()
})
</script>

<style scoped>
.bookmark-item {
  transition: all 0.2s ease;
}

.bookmark-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}
</style>