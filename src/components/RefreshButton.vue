<template>
  <div class="refresh-container" :class="containerClass">
    <!-- Pull-to-Refresh Indicator (Mobile) -->
    <div 
      v-if="pullToRefresh && showPullIndicator"
      class="pull-indicator"
      :class="pullIndicatorClass"
      :style="{ transform: `translateY(${pullDistance}px)` }"
    >
      <div class="pull-icon-wrapper">
        <i 
          class="pull-icon"
          :class="pullIconClass"
        />
      </div>
      <span class="pull-text">{{ pullText }}</span>
    </div>

    <!-- Refresh Button -->
    <button
      ref="refreshButtonRef"
      @click="handleRefresh"
      :disabled="loading || disabled"
      class="refresh-button"
      :class="buttonClass"
      :aria-label="ariaLabel"
      :title="tooltip"
    >
      <!-- Loading Spinner -->
      <i 
        v-if="loading"
        class="button-icon animate-spin"
        :class="loadingIcon"
      />
      
      <!-- Success Icon (temporary) -->
      <i 
        v-else-if="showSuccess"
        class="button-icon success-icon"
        :class="successIcon"
      />
      
      <!-- Error Icon -->
      <i 
        v-else-if="showError"
        class="button-icon error-icon"
        :class="errorIcon"
      />
      
      <!-- Default Icon -->
      <i 
        v-else
        class="button-icon"
        :class="[defaultIcon, { 'icon-pulse': shouldPulse }]"
      />

      <!-- Button Text (if not icon-only) -->
      <span v-if="!iconOnly" class="button-text">
        {{ buttonText }}
      </span>

      <!-- Last Update Time -->
      <span v-if="showLastUpdate && lastUpdate" class="last-update">
        {{ formatLastUpdate(lastUpdate) }}
      </span>

      <!-- Badge for Updates -->
      <span 
        v-if="showUpdateBadge && updateCount > 0" 
        class="update-badge"
      >
        {{ updateCount }}
      </span>
    </button>

    <!-- Pull-to-Refresh Touch Handler -->
    <div 
      v-if="pullToRefresh"
      ref="pullAreaRef"
      class="pull-area"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { formatDateForMobile } from '../utils/dateUtils.js'

// Props
const props = defineProps({
  // State
  loading: {
    type: Boolean,
    default: false
  },
  
  disabled: {
    type: Boolean,
    default: false
  },
  
  // Appearance
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'ghost', 'icon'].includes(value)
  },
  
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  
  iconOnly: {
    type: Boolean,
    default: false
  },
  
  // Icons
  defaultIcon: {
    type: String,
    default: 'i-tabler-refresh'
  },
  
  loadingIcon: {
    type: String,
    default: 'i-tabler-loader-2'
  },
  
  successIcon: {
    type: String,
    default: 'i-tabler-check'
  },
  
  errorIcon: {
    type: String,
    default: 'i-tabler-alert-circle'
  },
  
  // Text
  text: {
    type: String,
    default: ''
  },
  
  loadingText: {
    type: String,
    default: '새로고침 중...'
  },
  
  // Last Update
  lastUpdate: {
    type: Date,
    default: null
  },
  
  showLastUpdate: {
    type: Boolean,
    default: false
  },
  
  // Update Badge
  updateCount: {
    type: Number,
    default: 0
  },
  
  showUpdateBadge: {
    type: Boolean,
    default: false
  },
  
  // Pull-to-Refresh
  pullToRefresh: {
    type: Boolean,
    default: false
  },
  
  pullThreshold: {
    type: Number,
    default: 80
  },
  
  // Auto features
  autoRefresh: {
    type: Boolean,
    default: false
  },
  
  autoRefreshInterval: {
    type: Number,
    default: 300000 // 5 minutes
  },
  
  // Feedback
  showFeedback: {
    type: Boolean,
    default: true
  },
  
  feedbackDuration: {
    type: Number,
    default: 2000
  },
  
  // Accessibility
  ariaLabel: {
    type: String,
    default: '새로고침'
  },
  
  tooltip: {
    type: String,
    default: '클릭하여 새로고침'
  }
})

// Emits
const emit = defineEmits([
  'refresh',
  'pull-refresh',
  'auto-refresh'
])

// Refs
const refreshButtonRef = ref(null)
const pullAreaRef = ref(null)

// State
const showSuccess = ref(false)
const showError = ref(false)
const shouldPulse = ref(false)
const autoRefreshTimer = ref(null)

// Pull-to-refresh state
const isPulling = ref(false)
const pullDistance = ref(0)
const pullStartY = ref(0)
const showPullIndicator = ref(false)
const canTriggerRefresh = ref(false)

// Computed
const containerClass = computed(() => {
  const classes = []
  
  if (props.pullToRefresh) classes.push('pull-enabled')
  
  return classes
})

const buttonClass = computed(() => {
  const classes = ['refresh-base']
  
  // Variant classes
  switch (props.variant) {
    case 'primary':
      classes.push('refresh-primary')
      break
    case 'secondary':
      classes.push('refresh-secondary')
      break
    case 'ghost':
      classes.push('refresh-ghost')
      break
    case 'icon':
      classes.push('refresh-icon')
      break
  }
  
  // Size classes
  switch (props.size) {
    case 'sm':
      classes.push('refresh-sm')
      break
    case 'lg':
      classes.push('refresh-lg')
      break
    default:
      classes.push('refresh-md')
  }
  
  // State classes
  if (props.loading) classes.push('refresh-loading')
  if (props.disabled) classes.push('refresh-disabled')
  if (showSuccess.value) classes.push('refresh-success')
  if (showError.value) classes.push('refresh-error')
  
  return classes
})

const buttonText = computed(() => {
  if (props.loading) return props.loadingText
  if (props.text) return props.text
  return '새로고침'
})

const pullIndicatorClass = computed(() => {
  const classes = ['pull-base']
  
  if (canTriggerRefresh.value) {
    classes.push('pull-ready')
  } else {
    classes.push('pull-pending')
  }
  
  return classes
})

const pullIconClass = computed(() => {
  if (canTriggerRefresh.value) {
    return 'i-tabler-arrow-down rotate-180'
  }
  return 'i-tabler-arrow-down'
})

const pullText = computed(() => {
  if (canTriggerRefresh.value) {
    return '놓으면 새로고침'
  }
  return '아래로 당겨서 새로고침'
})

// Methods
async function handleRefresh() {
  if (props.loading || props.disabled) return
  
  try {
    emit('refresh')
    
    if (props.showFeedback) {
      // Wait for loading to complete (simulated)
      await nextTick()
      showSuccess.value = true
      setTimeout(() => {
        showSuccess.value = false
      }, props.feedbackDuration)
    }
  } catch (error) {
    if (props.showFeedback) {
      showError.value = true
      setTimeout(() => {
        showError.value = false
      }, props.feedbackDuration)
    }
  }
}

// Pull-to-refresh handlers
function handleTouchStart(event) {
  if (!props.pullToRefresh || props.loading) return
  
  // Only trigger if scrolled to top
  if (window.scrollY > 10) return
  
  pullStartY.value = event.touches[0].clientY
  isPulling.value = true
  showPullIndicator.value = true
}

function handleTouchMove(event) {
  if (!isPulling.value) return
  
  event.preventDefault()
  
  const currentY = event.touches[0].clientY
  const deltaY = currentY - pullStartY.value
  
  if (deltaY > 0) {
    // Apply resistance curve
    pullDistance.value = Math.min(deltaY * 0.5, props.pullThreshold * 1.5)
    canTriggerRefresh.value = pullDistance.value >= props.pullThreshold
  }
}

async function handleTouchEnd() {
  if (!isPulling.value) return
  
  isPulling.value = false
  
  if (canTriggerRefresh.value) {
    emit('pull-refresh')
    await handleRefresh()
  }
  
  // Reset state
  setTimeout(() => {
    pullDistance.value = 0
    showPullIndicator.value = false
    canTriggerRefresh.value = false
  }, 300)
}

// Auto-refresh
function startAutoRefresh() {
  if (!props.autoRefresh || autoRefreshTimer.value) return
  
  autoRefreshTimer.value = setInterval(() => {
    if (!props.loading) {
      emit('auto-refresh')
      handleRefresh()
    }
  }, props.autoRefreshInterval)
}

function stopAutoRefresh() {
  if (autoRefreshTimer.value) {
    clearInterval(autoRefreshTimer.value)
    autoRefreshTimer.value = null
  }
}

function formatLastUpdate(date) {
  return `마지막 업데이트: ${formatDateForMobile(date)}`
}

// Pulse animation for updates
function triggerPulse() {
  shouldPulse.value = true
  setTimeout(() => {
    shouldPulse.value = false
  }, 1000)
}

// Watchers
watch(() => props.autoRefresh, (newVal) => {
  if (newVal) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
})

watch(() => props.updateCount, (newVal, oldVal) => {
  if (newVal > oldVal && newVal > 0) {
    triggerPulse()
  }
})

// Lifecycle
onMounted(() => {
  if (props.autoRefresh) {
    startAutoRefresh()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})

// Expose methods
defineExpose({
  refresh: handleRefresh,
  showSuccess: () => { showSuccess.value = true },
  showError: () => { showError.value = true },
  pulse: triggerPulse
})
</script>

<style scoped>
/* Container */
.refresh-container {
  position: relative;
  display: inline-block;
}

.pull-enabled {
  width: 100%;
}

/* Pull Indicator */
.pull-indicator {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 0 0 1rem 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.pull-base {
  opacity: 0.8;
}

.pull-ready {
  opacity: 1;
  background: theme('colors.knue.primary');
  color: white;
}

.pull-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: theme('colors.gray.100');
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
}

.pull-ready .pull-icon-wrapper {
  background: white;
  color: theme('colors.knue.primary');
}

.pull-icon {
  width: 1rem;
  height: 1rem;
  transition: transform 0.3s ease;
}

.pull-text {
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
}

.pull-area {
  position: absolute;
  top: -100px;
  left: 0;
  right: 0;
  height: 100px;
  z-index: 10;
}

/* Refresh Button Base */
.refresh-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 0.75rem;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  text-decoration: none;
  touch-action: manipulation;
  user-select: none;
}

.refresh-base:focus-visible {
  outline: 2px solid theme('colors.knue.primary');
  outline-offset: 2px;
}

/* Size Variants */
.refresh-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  min-height: 36px;
}

.refresh-md {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  min-height: 44px;
}

.refresh-lg {
  padding: 1rem 1.5rem;
  font-size: 1rem;
  min-height: 52px;
}

/* Style Variants */
.refresh-primary {
  background: theme('colors.knue.primary');
  color: white;
}

.refresh-primary:hover:not(:disabled) {
  background: theme('colors.knue.secondary');
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
}

.refresh-secondary {
  background: theme('colors.gray.100');
  color: theme('colors.gray.700');
}

.refresh-secondary:hover:not(:disabled) {
  background: theme('colors.gray.200');
}

.refresh-ghost {
  background: transparent;
  color: theme('colors.knue.primary');
  border: 2px solid theme('colors.knue.primary');
}

.refresh-ghost:hover:not(:disabled) {
  background: theme('colors.knue.primary');
  color: white;
}

.refresh-icon {
  padding: 0.75rem;
  background: theme('colors.gray.100');
  color: theme('colors.gray.600');
  border-radius: 50%;
  min-width: 44px;
  min-height: 44px;
}

.refresh-icon:hover:not(:disabled) {
  background: theme('colors.knue.primary');
  color: white;
}

/* State Variants */
.refresh-loading {
  pointer-events: none;
}

.refresh-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.refresh-success {
  background: theme('colors.green.500');
  color: white;
}

.refresh-error {
  background: theme('colors.red.500');
  color: white;
}

/* Button Content */
.button-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.button-text {
  margin-left: 0.5rem;
}

.refresh-sm .button-icon {
  width: 0.875rem;
  height: 0.875rem;
}

.refresh-lg .button-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.success-icon {
  color: theme('colors.green.500');
}

.error-icon {
  color: theme('colors.red.500');
}

.icon-pulse {
  animation: pulse 2s infinite;
}

/* Last Update */
.last-update {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: theme('colors.gray.500');
  white-space: nowrap;
}

/* Update Badge */
.update-badge {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.25rem;
  background: theme('colors.red.500');
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.625rem;
  border: 2px solid white;
  animation: badge-bounce 0.5s ease-out;
}

/* Animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes badge-bounce {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

/* Touch Devices */
@media (hover: none) and (pointer: coarse) {
  .refresh-button:hover {
    transform: none;
    box-shadow: none;
  }
  
  .refresh-button:active {
    transform: scale(0.95);
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .refresh-button,
  .pull-indicator,
  .pull-icon,
  .update-badge {
    transition: none;
    animation: none;
  }
}
</style>