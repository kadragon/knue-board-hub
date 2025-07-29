<template>
  <div class="post-detail">
    <div class="container-mobile section-spacing">
      <!-- Header -->
      <div class="mb-6">
        <button 
          @click="$router.back()" 
          class="btn-secondary btn-touch mb-4"
        >
          <i class="i-tabler-arrow-left w-4 h-4 mr-2" />
          뒤로가기
        </button>
      </div>

      <!-- Post Content -->
      <div v-if="loading" class="space-y-4">
        <div class="skeleton-title mb-2" />
        <div class="skeleton-text mb-4" />
        <div class="skeleton h-64 rounded-xl" />
      </div>

      <div v-else-if="error" class="text-center py-8">
        <div class="text-red-500 mb-4">
          <i class="i-tabler-exclamation-triangle w-8 h-8 mx-auto mb-2" />
          <p class="text-body">게시글을 불러올 수 없습니다</p>
        </div>
        <button @click="loadPost" class="btn-primary btn-touch">
          다시 시도
        </button>
      </div>

      <article v-else-if="post" class="post-content">
        <!-- Post Header -->
        <header class="mb-6 pb-4 border-b border-gray-200">
          <h1 class="text-title text-xl mb-3">{{ post.title }}</h1>
          
          <div class="flex flex-wrap items-center gap-4 text-caption">
            <div class="flex items-center">
              <i class="i-tabler-calendar w-4 h-4 mr-1" />
              {{ formatDate(post.pubDate) }}
            </div>
            <div v-if="post.department" class="flex items-center">
              <i class="i-tabler-building w-4 h-4 mr-1" />
              {{ post.department.name }}
            </div>
          </div>
        </header>

        <!-- Post Body -->
        <div class="post-body prose prose-sm max-w-none" v-html="sanitizedDescription" />

        <!-- Actions -->
        <footer class="mt-8 pt-6 border-t border-gray-200">
          <div class="flex gap-2">
            <button 
              @click="toggleBookmark" 
              class="btn-secondary btn-touch"
              :class="{ 'bg-yellow-100 text-yellow-800': isBookmarked }"
            >
              <i :class="isBookmarked ? 'i-tabler-bookmark-filled' : 'i-tabler-bookmark'" class="w-4 h-4 mr-2" />
              {{ isBookmarked ? '북마크됨' : '북마크' }}
            </button>
            
            <button 
              @click="sharePost" 
              class="btn-secondary btn-touch"
            >
              <i class="i-tabler-share w-4 h-4 mr-2" />
              공유
            </button>
            
            <a 
              v-if="post.link" 
              :href="post.link" 
              target="_blank" 
              rel="noopener noreferrer"
              class="btn-primary btn-touch"
            >
              <i class="i-tabler-external-link w-4 h-4 mr-2" />
              원문 보기
            </a>
          </div>
        </footer>
      </article>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useNotifications } from '../composables/useNotifications.js'
import DOMPurify from 'dompurify'

const route = useRoute()
const { showSuccess, showError } = useNotifications()

const postId = computed(() => route.params.id)
const post = ref(null)
const loading = ref(false)
const error = ref(null)
const isBookmarked = ref(false)

// Sanitized description for secure HTML rendering
const sanitizedDescription = computed(() => {
  if (!post.value?.description) return ''
  return DOMPurify.sanitize(post.value.description, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false
  })
})

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function loadPost() {
  if (!postId.value) {
    error.value = '유효하지 않은 게시글 ID입니다'
    showError('유효하지 않은 게시글입니다')
    return
  }
  
  loading.value = true
  error.value = null
  
  try {
    // Simulate loading post data
    // In a real app, this would fetch from an API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const loadedPost = {
      id: postId.value,
      title: '샘플 게시글 제목',
      description: '<p>게시글 내용입니다. 실제 구현에서는 API에서 데이터를 가져와야 합니다.</p>',
      pubDate: new Date().toISOString(),
      link: 'https://www.knue.ac.kr',
      department: {
        name: '메인 공지사항'
      }
    }
    
    // Validate required fields
    if (!loadedPost.title || !loadedPost.description) {
      throw new Error('게시글 데이터가 완전하지 않습니다')
    }
    
    post.value = loadedPost
    
    // Check if bookmarked
    const bookmarks = JSON.parse(localStorage.getItem('knue-bookmarks') || '[]')
    isBookmarked.value = bookmarks.includes(postId.value)
    
  } catch (err) {
    error.value = err.message || '알 수 없는 오류가 발생했습니다'
    showError('게시글을 불러오는데 실패했습니다')
  } finally {
    loading.value = false
  }
}

function toggleBookmark() {
  const bookmarks = JSON.parse(localStorage.getItem('knue-bookmarks') || '[]')
  
  if (isBookmarked.value) {
    const index = bookmarks.indexOf(postId.value)
    if (index > -1) bookmarks.splice(index, 1)
    showSuccess('북마크에서 제거되었습니다')
  } else {
    bookmarks.push(postId.value)
    showSuccess('북마크에 추가되었습니다')
  }
  
  localStorage.setItem('knue-bookmarks', JSON.stringify(bookmarks))
  isBookmarked.value = !isBookmarked.value
}

async function sharePost() {
  if (navigator.share && post.value) {
    try {
      await navigator.share({
        title: post.value.title,
        text: DOMPurify.sanitize(post.value.description, { ALLOWED_TAGS: [] }).substring(0, 200),
        url: window.location.href
      })
    } catch (err) {
      if (err.name !== 'AbortError') {
        fallbackShare()
      }
    }
  } else {
    fallbackShare()
  }
}

function fallbackShare() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href)
    showSuccess('링크가 클립보드에 복사되었습니다')
  } else {
    showError('공유 기능을 사용할 수 없습니다')
  }
}

onMounted(() => {
  loadPost()
})
</script>

<style scoped>
.post-body {
  line-height: 1.7;
}

.post-body :deep(p) {
  margin-bottom: 1rem;
}

.post-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

.post-body :deep(a) {
  color: theme('colors.knue.primary');
  text-decoration: underline;
}

.post-body :deep(ul),
.post-body :deep(ol) {
  margin: 1rem 0;
  padding-left: 1.5rem;
}
</style>