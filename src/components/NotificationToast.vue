<template>
  <Teleport to="body">
    <Transition
      name="toast-container"
      appear
    >
      <div
        v-if="notifications.length > 0"
        class="toast-container"
        :class="positionClass"
      >
        <TransitionGroup
          name="toast"
          tag="div"
          class="toast-list"
        >
          <div
            v-for="notification in visibleNotifications"
            :key="notification.id"
            class="toast-item"
            :class="getToastClass(notification)"
            @click="handleToastClick(notification)"
          >
            <!-- Icon -->
            <div class="toast-icon" :class="getIconClass(notification.type)">
              <i :class="getIconName(notification.type)" />
            </div>
            
            <!-- Content -->
            <div class="toast-content">
              <h4 v-if="notification.title" class="toast-title">
                {{ notification.title }}
              </h4>
              <p class="toast-message">
                {{ notification.message }}
              </p>
              <p v-if="notification.suggestion" class="toast-suggestion">
                {{ notification.suggestion }}
              </p>
            </div>
            
            <!-- Actions -->
            <div v-if="notification.actions?.length" class="toast-actions">
              <button
                v-for="action in notification.actions"
                :key="action.id"
                @click.stop="handleActionClick(action, notification)"
                class="toast-action-btn"
                :class="action.variant || 'primary'"
              >
                <i v-if="action.icon" :class="action.icon" class="w-4 h-4 mr-1" />
                {{ action.label }}
              </button>
            </div>
            
            <!-- Close Button -->
            <button
              v-if="!notification.persistent"
              @click.stop="removeNotification(notification.id)"
              class="toast-close"
              aria-label="알림 닫기"
            >
              <i class="i-tabler-x w-4 h-4" />
            </button>
            
            <!-- Progress Bar -->
            <div
              v-if="notification.showProgress"
              class="toast-progress"
              :style="{ 
                animationDuration: `${notification.duration}ms`,
                animationPlayState: notification.paused ? 'paused' : 'running'
              }"
            />
          </div>
        </TransitionGroup>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useGlobalNotifications, NOTIFICATION_TYPES } from '../composables/useNotifications.js'

// Props
const props = defineProps({
  position: {
    type: String,
    default: 'top-right',
    validator: (value) => [
      'top-left', 'top-center', 'top-right',
      'bottom-left', 'bottom-center', 'bottom-right'
    ].includes(value)
  },
  
  maxVisible: {
    type: Number,
    default: 5
  },
  
  pauseOnHover: {
    type: Boolean,
    default: true
  }
})

// Composable
const { notifications, removeNotification } = useGlobalNotifications()

// Computed
const positionClass = computed(() => `toast-${props.position}`)

const visibleNotifications = computed(() => 
  notifications.value.slice(0, props.maxVisible)
)

// Methods
function getToastClass(notification) {
  const classes = [`toast-${notification.type}`]
  
  if (notification.persistent) classes.push('toast-persistent')
  if (notification.actions?.length) classes.push('toast-with-actions')
  
  return classes
}

function getIconClass(type) {
  const classes = ['toast-icon-base']
  
  switch (type) {
    case NOTIFICATION_TYPES.SUCCESS:
      classes.push('text-green-500', 'bg-green-100')
      break
    case NOTIFICATION_TYPES.ERROR:
      classes.push('text-red-500', 'bg-red-100')
      break
    case NOTIFICATION_TYPES.WARNING:
      classes.push('text-yellow-500', 'bg-yellow-100')
      break
    default:
      classes.push('text-blue-500', 'bg-blue-100')
  }
  
  return classes
}

function getIconName(type) {
  switch (type) {
    case NOTIFICATION_TYPES.SUCCESS:
      return 'i-tabler-check'
    case NOTIFICATION_TYPES.ERROR:
      return 'i-tabler-alert-circle'
    case NOTIFICATION_TYPES.WARNING:
      return 'i-tabler-alert-triangle'
    default:
      return 'i-tabler-info-circle'
  }
}

function handleToastClick(notification) {
  if (notification.clickable !== false) {
    removeNotification(notification.id)
  }
}

function handleActionClick(action, notification) {
  if (typeof action.handler === 'function') {
    action.handler(notification)
  }
  
  if (action.closeOnClick !== false) {
    removeNotification(notification.id)
  }
}

// Keyboard handling
function handleKeydown(event) {
  if (event.key === 'Escape' && notifications.value.length > 0) {
    // Close the most recent non-persistent notification
    const closableNotification = notifications.value
      .slice()
      .reverse()
      .find(n => !n.persistent)
    
    if (closableNotification) {
      removeNotification(closableNotification.id)
    }
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* Container Positioning */
.toast-container {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
}

.toast-top-left {
  top: 1rem;
  left: 1rem;
}

.toast-top-center {
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
}

.toast-top-right {
  top: 1rem;
  right: 1rem;
}

.toast-bottom-left {
  bottom: 1rem;
  left: 1rem;
}

.toast-bottom-center {
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
}

.toast-bottom-right {
  bottom: 1rem;
  right: 1rem;
}

/* Toast List */
.toast-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 400px;
  width: 100vw;
  max-width: min(400px, calc(100vw - 2rem));
}

/* Toast Item */
.toast-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid theme('colors.gray.200');
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
}

.toast-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

/* Toast Variants */
.toast-success {
  border-left: 4px solid theme('colors.green.500');
}

.toast-error {
  border-left: 4px solid theme('colors.red.500');
}

.toast-warning {
  border-left: 4px solid theme('colors.yellow.500');
}

.toast-info {
  border-left: 4px solid theme('colors.blue.500');
}

.toast-persistent {
  cursor: default;
}

.toast-with-actions {
  padding-bottom: 0.75rem;
}

/* Toast Icon */
.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.toast-icon-base {
  font-size: 1rem;
}

/* Toast Content */
.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: theme('colors.gray.900');
  margin: 0 0 0.25rem 0;
  line-height: 1.4;
}

.toast-message {
  font-size: 0.875rem;
  color: theme('colors.gray.700');
  margin: 0;
  line-height: 1.4;
  word-wrap: break-word;
}

.toast-suggestion {
  font-size: 0.75rem;
  color: theme('colors.gray.500');
  margin: 0.5rem 0 0 0;
  line-height: 1.3;
  font-style: italic;
}

/* Toast Actions */
.toast-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid theme('colors.gray.100');
  width: 100%;
}

.toast-action-btn {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
}

.toast-action-btn.primary {
  background: theme('colors.knue.primary');
  color: white;
  border-radius: 0.5rem;
}

.toast-action-btn.primary:hover {
  background: theme('colors.knue.secondary');
  transform: translateY(-1px);
}

.toast-action-btn.secondary {
  background: theme('colors.gray.100');
  color: theme('colors.gray.700');
}

.toast-action-btn.secondary:hover {
  background: theme('colors.gray.200');
}

/* Close Button */
.toast-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: theme('colors.gray.400');
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.toast-close:hover {
  background: theme('colors.gray.100');
  color: theme('colors.gray.600');
}

/* Progress Bar */
.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: currentColor;
  border-radius: 0 0 0.75rem 0.75rem;
  animation: toast-progress-shrink linear forwards;
  opacity: 0.3;
}

@keyframes toast-progress-shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

/* Transitions */
.toast-container-enter-active,
.toast-container-leave-active {
  transition: all 0.3s ease;
}

.toast-container-enter-from,
.toast-container-leave-to {
  opacity: 0;
  transform: translateX(-50%) scale(0.9);
}

.toast-enter-active {
  transition: all 0.3s ease;
}

.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-move {
  transition: transform 0.3s ease;
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .toast-container {
    left: 1rem !important;
    right: 1rem !important;
    transform: none !important;
  }
  
  .toast-list {
    max-width: none;
    width: 100%;
  }
  
  .toast-item {
    padding: 0.875rem;
  }
  
  .toast-title {
    font-size: 0.8125rem;
  }
  
  .toast-message {
    font-size: 0.8125rem;
  }
  
  .toast-actions {
    flex-direction: column;
  }
  
  .toast-action-btn {
    justify-content: center;
    padding: 0.5rem;
  }
}

/* Pause on hover */
.toast-item:hover .toast-progress {
  animation-play-state: paused;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .toast-item {
    border: 2px solid currentColor;
  }
  
  .toast-success {
    border-color: theme('colors.green.600');
  }
  
  .toast-error {
    border-color: theme('colors.red.600');
  }
  
  .toast-warning {
    border-color: theme('colors.yellow.600');
  }
  
  .toast-info {
    border-color: theme('colors.blue.600');
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .toast-item,
  .toast-container-enter-active,
  .toast-container-leave-active,
  .toast-enter-active,
  .toast-leave-active,
  .toast-move {
    transition: none;
  }
  
  .toast-progress {
    animation: none;
    display: none;
  }
}

</style>