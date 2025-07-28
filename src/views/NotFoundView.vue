<template>
  <div class="not-found-view">
    <div class="container-mobile">
      <div class="not-found-content">
        <!-- Illustration -->
        <div class="illustration">
          <i class="i-tabler-error-404 w-32 h-32 text-gray-400" />
        </div>
        
        <!-- Content -->
        <div class="content">
          <h1 class="title">페이지를 찾을 수 없습니다</h1>
          <p class="description">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
            <br>
            주소를 다시 확인해주세요.
          </p>
          
          <!-- Actions -->
          <div class="actions">
            <button
              @click="goHome"
              class="action-btn primary"
            >
              <i class="i-tabler-home w-5 h-5 mr-2" />
              홈으로 가기
            </button>
            
            <button
              @click="goBack"
              class="action-btn secondary"
            >
              <i class="i-tabler-arrow-left w-5 h-5 mr-2" />
              이전 페이지
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

// Router
const router = useRouter()

// Methods
function goHome() {
  router.push({ name: 'home' })
}

function goBack() {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    goHome()
  }
}

// Meta
defineOptions({
  name: 'NotFoundView'
})
</script>

<style scoped>
/* Container */
.not-found-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: theme('colors.gray.50');
}

.not-found-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 500px;
  padding: 2rem;
}

/* Illustration */
.illustration {
  margin-bottom: 2rem;
  opacity: 0.8;
}

/* Content */
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: theme('colors.gray.900');
  margin: 0;
}

.description {
  font-size: 1rem;
  color: theme('colors.gray.600');
  line-height: 1.6;
  margin: 0;
}

/* Actions */
.actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.action-btn {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.action-btn.primary {
  background: theme('colors.knue.primary');
  color: white;
}

.action-btn.primary:hover {
  background: theme('colors.knue.secondary');
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
}

.action-btn.secondary {
  background: theme('colors.gray.100');
  color: theme('colors.gray.700');
}

.action-btn.secondary:hover {
  background: theme('colors.gray.200');
  transform: translateY(-1px);
}

/* Responsive Design */
@media (max-width: 640px) {
  .not-found-content {
    padding: 1rem;
  }
  
  .title {
    font-size: 1.5rem;
  }
  
  .description {
    font-size: 0.875rem;
  }
  
  .actions {
    flex-direction: column;
    width: 100%;
  }
  
  .action-btn {
    justify-content: center;
    width: 100%;
  }
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  .not-found-view {
    background: theme('colors.gray.900');
  }
  
  .title {
    color: theme('colors.gray.100');
  }
  
  .description {
    color: theme('colors.gray.400');
  }
  
  .action-btn.secondary {
    background: theme('colors.gray.700');
    color: theme('colors.gray.200');
  }
  
  .action-btn.secondary:hover {
    background: theme('colors.gray.600');
  }
}
</style>