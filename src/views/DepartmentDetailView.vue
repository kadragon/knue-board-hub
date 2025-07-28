<template>
  <div class="department-detail">
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
        
        <div v-if="department" class="flex items-center gap-3 mb-2">
          <span class="text-2xl">{{ department.icon }}</span>
          <div>
            <h1 class="text-title text-xl">{{ department.name }}</h1>
            <p class="text-body">{{ department.description }}</p>
          </div>
        </div>
      </div>

      <!-- RSS Feed Content -->
      <div v-if="loading" class="space-y-4">
        <div class="skeleton h-32 rounded-xl" v-for="i in 5" :key="i" />
      </div>

      <div v-else-if="error" class="text-center py-8">
        <div class="text-red-500 mb-4">
          <i class="i-tabler-exclamation-triangle w-8 h-8 mx-auto mb-2" />
          <p class="text-body">게시글을 불러올 수 없습니다</p>
        </div>
        <button @click="loadFeed" class="btn-primary btn-touch">
          다시 시도
        </button>
      </div>

      <RssFeedList 
        v-else
        :items="feedItems" 
        :loading="loading"
        :show-department="false"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getDepartment } from '../config/departments.js'
import { useRssFeed } from '../composables/useRssFeed.js'
import RssFeedList from '../components/RssFeedList.vue'

const route = useRoute()
const departmentId = computed(() => route.params.id)
const department = computed(() => getDepartment(departmentId.value))

const { items: feedItems, loading, error, fetchFeed } = useRssFeed()

async function loadFeed() {
  if (department.value) {
    await fetchFeed([departmentId.value])
  }
}

onMounted(() => {
  loadFeed()
})
</script>