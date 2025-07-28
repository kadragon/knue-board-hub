<template>
  <div class="rss-test-view container-mobile">
    <header class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">RSS 구조 분석</h1>
      <p class="text-gray-600">KNUE RSS 피드 구조를 분석하고 표시합니다</p>
    </header>

    <div class="space-y-4">
      <!-- Controls -->
      <div class="flex gap-3">
        <button
          @click="fetchRssFeed"
          :disabled="loading"
          class="btn-primary"
        >
          <i v-if="loading" class="i-tabler-loader-2 w-4 h-4 animate-spin mr-2" />
          <i v-else class="i-tabler-refresh w-4 h-4 mr-2" />
          {{ loading ? '로딩 중...' : 'RSS 불러오기' }}
        </button>
        
        <button
          v-if="rawXml"
          @click="showRaw = !showRaw"
          class="btn-secondary"
        >
          <i class="i-tabler-code w-4 h-4 mr-2" />
          {{ showRaw ? 'RSS 아이템 보기' : '원본 XML 보기' }}
        </button>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div class="flex items-center mb-2">
          <i class="i-tabler-alert-circle w-5 h-5 text-red-500 mr-2" />
          <h3 class="font-semibold text-red-800">오류 발생</h3>
        </div>
        <p class="text-red-700">{{ error }}</p>
      </div>

      <!-- Raw XML Display -->
      <div v-if="showRaw && rawXml" class="space-y-4">
        <h2 class="text-xl font-semibold">원본 XML</h2>
        <pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm"><code>{{ rawXml }}</code></pre>
      </div>

      <!-- Parsed RSS Display -->
      <div v-if="!showRaw && parsedFeed" class="space-y-6">
        <!-- Feed Info -->
        <div class="card-default">
          <h2 class="text-xl font-semibold mb-4">피드 정보</h2>
          <div class="space-y-2">
            <div><strong>제목:</strong> {{ parsedFeed.feedInfo.title }}</div>
            <div><strong>설명:</strong> {{ parsedFeed.feedInfo.description }}</div>
            <div><strong>링크:</strong> {{ parsedFeed.feedInfo.link }}</div>
            <div><strong>언어:</strong> {{ parsedFeed.feedInfo.language }}</div>
            <div><strong>마지막 업데이트:</strong> {{ formatDate(parsedFeed.feedInfo.lastBuildDate) }}</div>
            <div><strong>아이템 수:</strong> {{ parsedFeed.itemCount }}</div>
          </div>
        </div>

        <!-- RSS Items -->
        <div class="space-y-4">
          <h2 class="text-xl font-semibold">RSS 아이템 (최근 5개)</h2>
          
          <div v-if="parsedFeed.items.length === 0" class="text-gray-500 text-center py-8">
            RSS 아이템이 없습니다
          </div>
          
          <div v-else class="space-y-4">
            <div
              v-for="(item, index) in parsedFeed.items.slice(0, 5)"
              :key="item.id || index"
              class="card-default"
            >
              <div class="space-y-3">
                <!-- Item Header -->
                <div class="flex justify-between items-start">
                  <h3 class="font-semibold text-lg line-clamp-2">{{ item.title }}</h3>
                  <span class="text-sm text-gray-500 ml-4 flex-shrink-0">
                    {{ formatDate(item.pubDate) }}
                  </span>
                </div>

                <!-- Item Details -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>ID:</strong> {{ item.id }}
                  </div>
                  <div>
                    <strong>카테고리:</strong> {{ item.category || '없음' }}
                  </div>
                  <div>
                    <strong>작성자:</strong> {{ item.author || '없음' }}
                  </div>
                  <div>
                    <strong>GUID:</strong> {{ item.guid || '없음' }}
                  </div>
                </div>

                <!-- Description -->
                <div v-if="item.description">
                  <strong>설명:</strong>
                  <p class="mt-1 text-gray-700 line-clamp-3">{{ item.description }}</p>
                </div>

                <!-- Link -->
                <div v-if="item.link">
                  <strong>링크:</strong>
                  <a 
                    :href="item.link" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="text-blue-600 hover:text-blue-800 underline break-all"
                  >
                    {{ item.link }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- XML Structure Analysis -->
        <div class="card-default">
          <h2 class="text-xl font-semibold mb-4">XML 구조 분석</h2>
          <div class="space-y-2 text-sm">
            <div><strong>총 아이템 수:</strong> {{ parsedFeed.items.length }}</div>
            <div><strong>파싱 시간:</strong> {{ formatDate(parsedFeed.parsedAt) }}</div>
            <div><strong>피드 URL:</strong> <code class="bg-gray-100 px-2 py-1 rounded">{{ rssUrl }}</code></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { parseRSSFeed } from '../utils/rssParser.js'

// State
const loading = ref(false)
const error = ref(null)
const rawXml = ref('')
const parsedFeed = ref(null)
const showRaw = ref(false)

// RSS URL for testing (bbsNo=25 as requested)
const rssUrl = 'https://www.knue.ac.kr/rssBbsNtt.do?bbsNo=25'

// Methods
async function fetchRssFeed() {
  loading.value = true
  error.value = null
  rawXml.value = ''
  parsedFeed.value = null

  try {
    // Use proxy URL for CORS
    const proxyUrl = import.meta.env.DEV 
      ? `/api/rss?url=${encodeURIComponent(rssUrl)}`
      : `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`

    console.log('Fetching RSS from:', proxyUrl)

    const response = await fetch(proxyUrl, {
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml',
        'User-Agent': 'KNUE-RSS-Test/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    let xmlContent
    if (import.meta.env.DEV) {
      // Development: direct response
      xmlContent = await response.text()
    } else {
      // Production: extract from allorigins response
      const data = await response.json()
      xmlContent = data.contents
    }

    if (!xmlContent || xmlContent.trim() === '') {
      throw new Error('Empty RSS content received')
    }

    rawXml.value = xmlContent
    
    // Parse the RSS
    parsedFeed.value = parseRSSFeed(xmlContent)
    
    console.log('RSS feed parsed successfully:', parsedFeed.value)
    
  } catch (err) {
    console.error('RSS fetch error:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function formatDate(date) {
  if (!date) return '없음'
  
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  } catch {
    return String(date)
  }
}

// Auto-fetch on mount
fetchRssFeed()
</script>

<style scoped>
.container-mobile {
  max-width: 1024px;
  margin: 0 auto;
  padding: 1rem;
}

.card-default {
  background: white;
  border: 1px solid theme('colors.gray.200');
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background: theme('colors.blue.600');
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: theme('colors.blue.700');
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background: white;
  color: theme('colors.gray.700');
  border: 1px solid theme('colors.gray.300');
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: theme('colors.gray.50');
  border-color: theme('colors.gray.400');
}

pre {
  white-space: pre-wrap;
  word-break: break-word;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 768px) {
  .container-mobile {
    padding: 1rem 0.5rem;
  }
  
  .card-default {
    padding: 1rem;
  }
  
}
</style>