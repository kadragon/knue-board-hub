<template>
  <div class="test-view">
    <h1>KNUE 게시판 테스트</h1>
    <p>앱이 정상적으로 로드되었습니다!</p>
    <button @click="count++" class="bg-blue-500 text-white px-4 py-2 rounded">
      클릭: {{ count }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>

<style scoped>
.test-view {
  padding: 2rem;
  text-align: center;
}

h1 {
  color: #0066cc;
  margin-bottom: 1rem;
}

p {
  color: #666;
  margin-bottom: 2rem;
}
</style>