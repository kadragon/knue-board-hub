<template>
  <div class="home-view">
    <RssFeedList
      :compact="true"
      :show-filters="true"
      :show-stats="false"
      :group-by-date="false"
      :infinite-scroll="true"
      :items-per-page="20"
      :show-fab="true"
      :show-quick-settings="true"
      :auto-refresh="false"
    />
  </div>
</template>

<script setup>
import RssFeedList from '../components/RssFeedList.vue'

// Meta information
defineOptions({
  name: 'HomeView'
})
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  background: var(--gray-50);
}
</style>