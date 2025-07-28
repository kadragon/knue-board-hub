<template>
  <div class="empty-state" :class="containerClass">
    <div class="empty-content">
      <!-- Icon -->
      <div class="empty-icon" :class="iconClass">
        <i v-if="iconName" :class="iconName" />
        <slot v-else name="icon">
          <i class="i-tabler-inbox text-6xl" />
        </slot>
      </div>
      
      <!-- Title -->
      <h3 class="empty-title" :class="titleClass">
        <slot name="title">{{ title }}</slot>
      </h3>
      
      <!-- Description -->
      <p v-if="description || $slots.description" class="empty-description" :class="descriptionClass">
        <slot name="description">{{ description }}</slot>
      </p>
      
      <!-- Action Button -->
      <div v-if="showAction || $slots.action" class="empty-action">
        <slot name="action">
          <button
            v-if="actionText"
            @click="$emit('action')"
            class="btn-primary btn-touch"
            :disabled="actionLoading"
          >
            <i v-if="actionLoading" class="i-tabler-loader-2 w-4 h-4 animate-spin mr-2" />
            <i v-else-if="actionIcon" :class="actionIcon" class="w-4 h-4 mr-2" />
            {{ actionText }}
          </button>
        </slot>
      </div>
      
      <!-- Secondary Action -->
      <div v-if="secondaryActionText || $slots.secondaryAction" class="empty-secondary">
        <slot name="secondaryAction">
          <button
            v-if="secondaryActionText"
            @click="$emit('secondary-action')"
            class="btn-secondary btn-touch"
            :disabled="secondaryActionLoading"
          >
            <i v-if="secondaryActionLoading" class="i-tabler-loader-2 w-4 h-4 animate-spin mr-2" />
            <i v-else-if="secondaryActionIcon" :class="secondaryActionIcon" class="w-4 h-4 mr-2" />
            {{ secondaryActionText }}
          </button>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  // Content
  title: {
    type: String,
    default: '표시할 내용이 없습니다'
  },
  
  description: {
    type: String,
    default: ''
  },
  
  // Icon
  iconName: {
    type: String,
    default: ''
  },
  
  iconColor: {
    type: String,
    default: 'gray',
    validator: (value) => ['gray', 'blue', 'green', 'yellow', 'red'].includes(value)
  },
  
  // Actions
  actionText: {
    type: String,
    default: ''
  },
  
  actionIcon: {
    type: String,
    default: ''
  },
  
  actionLoading: {
    type: Boolean,
    default: false
  },
  
  secondaryActionText: {
    type: String,
    default: ''
  },
  
  secondaryActionIcon: {
    type: String,
    default: ''
  },
  
  secondaryActionLoading: {
    type: Boolean,
    default: false
  },
  
  showAction: {
    type: Boolean,
    default: true
  },
  
  // Styling
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'compact', 'illustration'].includes(value)
  },
  
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  
  center: {
    type: Boolean,
    default: true
  }
})

// Emits
defineEmits(['action', 'secondary-action'])

// Computed classes
const containerClass = computed(() => {
  const classes = ['empty-base']
  
  if (props.center) classes.push('empty-center')
  if (props.variant) classes.push(`empty-${props.variant}`)
  if (props.size) classes.push(`empty-${props.size}`)
  
  return classes
})

const iconClass = computed(() => {
  const classes = ['empty-icon-base']
  
  switch (props.iconColor) {
    case 'blue':
      classes.push('text-blue-400')
      break
    case 'green':
      classes.push('text-green-400')
      break
    case 'yellow':
      classes.push('text-yellow-400')
      break
    case 'red':
      classes.push('text-red-400')
      break
    default:
      classes.push('text-gray-400')
  }
  
  return classes
})

const titleClass = computed(() => {
  const classes = ['empty-title-base']
  
  switch (props.size) {
    case 'sm':
      classes.push('text-lg')
      break
    case 'lg':
      classes.push('text-2xl')
      break
    default:
      classes.push('text-xl')
  }
  
  return classes
})

const descriptionClass = computed(() => {
  const classes = ['empty-description-base']
  
  switch (props.size) {
    case 'sm':
      classes.push('text-sm')
      break
    case 'lg':
      classes.push('text-lg')
      break
    default:
      classes.push('text-base')
  }
  
  return classes
})
</script>

<style scoped>
/* Base Styles */
.empty-state {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.empty-base {
  padding: 2rem 1rem;
}

.empty-center {
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 300px;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  max-width: 400px;
  margin: 0 auto;
}

/* Size Variants */
.empty-sm .empty-content {
  gap: 0.75rem;
  max-width: 300px;
}

.empty-lg .empty-content {
  gap: 1.5rem;
  max-width: 500px;
}

/* Icon Styles */
.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.empty-icon-base {
  font-size: 4rem;
  opacity: 0.6;
}

.empty-sm .empty-icon-base {
  font-size: 3rem;
}

.empty-lg .empty-icon-base {
  font-size: 5rem;
}

/* Text Styles */
.empty-title {
  margin: 0;
  font-weight: 600;
  color: theme('colors.gray.900');
  line-height: 1.25;
}

.empty-title-base {
  text-align: center;
}

.empty-description {
  margin: 0;
  color: theme('colors.gray.600');
  line-height: 1.5;
  text-align: center;
}

.empty-description-base {
  max-width: 320px;
}

/* Action Styles */
.empty-action {
  margin-top: 0.5rem;
}

.empty-secondary {
  margin-top: 0.25rem;
}

/* Variant Styles */
.empty-compact {
  padding: 1rem;
}

.empty-compact .empty-content {
  gap: 0.75rem;
  min-height: auto;
}

.empty-compact .empty-center {
  min-height: 200px;
}

.empty-illustration {
  position: relative;
}

.empty-illustration::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 200px;
  background: linear-gradient(45deg, theme('colors.blue.50'), theme('colors.purple.50'));
  border-radius: 50%;
  opacity: 0.3;
  z-index: -1;
}

/* Responsive Design */
@media (max-width: 640px) {
  .empty-base {
    padding: 1.5rem 1rem;
  }
  
  .empty-center {
    min-height: 250px;
  }
  
  .empty-content {
    max-width: 100%;
  }
  
  .empty-icon-base {
    font-size: 3rem;
  }
  
  .empty-lg .empty-icon-base {
    font-size: 4rem;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .empty-title {
    color: theme('colors.gray.100');
  }
  
  .empty-description {
    color: theme('colors.gray.400');
  }
  
  .empty-illustration::before {
    background: linear-gradient(45deg, theme('colors.blue.900'), theme('colors.purple.900'));
  }
}

/* Accessibility */
.empty-state[role="status"] {
  position: relative;
}

/* Animation for better UX */
.empty-content {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .empty-content {
    animation: none;
  }
}
</style>