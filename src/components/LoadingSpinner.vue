<template>
  <div class="loading-container" :class="containerClass">
    <div class="loading-content">
      <!-- Spinner -->
      <div 
        class="spinner"
        :class="spinnerClass"
        :style="{ width: size, height: size }"
      >
        <div class="spinner-inner" />
      </div>
      
      <!-- Loading Text -->
      <p 
        v-if="showText && text"
        class="loading-text"
        :class="textClass"
      >
        {{ text }}
      </p>
      
      <!-- Progress Indicator -->
      <div 
        v-if="showProgress && progress !== null"
        class="progress-container"
      >
        <div class="progress-bar">
          <div 
            class="progress-fill"
            :style="{ width: `${Math.min(100, Math.max(0, progress))}%` }"
          />
        </div>
        <span class="progress-text">{{ Math.round(progress) }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  // Loading state
  loading: {
    type: Boolean,
    default: true
  },
  
  // Size variants
  size: {
    type: String,
    default: '2rem',
    validator: (value) => {
      return ['xs', 'sm', 'md', 'lg', 'xl'].includes(value) || value.includes('px') || value.includes('rem')
    }
  },
  
  // Text content
  text: {
    type: String,
    default: '로딩 중...'
  },
  
  showText: {
    type: Boolean,
    default: true
  },
  
  // Progress
  progress: {
    type: Number,
    default: null,
    validator: (value) => value === null || (value >= 0 && value <= 100)
  },
  
  showProgress: {
    type: Boolean,
    default: false
  },
  
  // Styling
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'white'].includes(value)
  },
  
  overlay: {
    type: Boolean,
    default: false
  },
  
  fullscreen: {
    type: Boolean,
    default: false
  },
  
  center: {
    type: Boolean,
    default: true
  },
  
  // Accessibility
  ariaLabel: {
    type: String,
    default: '콘텐츠 로딩 중'
  }
})

// Computed classes
const containerClass = computed(() => {
  const classes = []
  
  if (props.overlay) classes.push('loading-overlay')
  if (props.fullscreen) classes.push('loading-fullscreen')
  if (props.center) classes.push('loading-center')
  
  return classes
})

const spinnerClass = computed(() => {
  const classes = ['spinner-base']
  
  // Size classes
  if (typeof props.size === 'string') {
    switch (props.size) {
      case 'xs':
        classes.push('spinner-xs')
        break
      case 'sm':
        classes.push('spinner-sm')
        break
      case 'md':
        classes.push('spinner-md')
        break
      case 'lg':
        classes.push('spinner-lg')
        break
      case 'xl':
        classes.push('spinner-xl')
        break
    }
  }
  
  // Variant classes
  switch (props.variant) {
    case 'primary':
      classes.push('spinner-primary')
      break
    case 'secondary':
      classes.push('spinner-secondary')
      break
    case 'white':
      classes.push('spinner-white')
      break
  }
  
  return classes
})

const textClass = computed(() => {
  const classes = ['text-base']
  
  switch (props.variant) {
    case 'primary':
      classes.push('text-knue-primary')
      break
    case 'secondary':
      classes.push('text-gray-600')
      break
    case 'white':
      classes.push('text-white')
      break
  }
  
  return classes
})

// Size mapping for predefined sizes
const sizeValue = computed(() => {
  const sizeMap = {
    xs: '1rem',
    sm: '1.5rem',
    md: '2rem',
    lg: '3rem',
    xl: '4rem'
  }
  
  return sizeMap[props.size] || props.size
})
</script>

<style scoped>
/* Container Styles */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(2px);
  z-index: 10;
}

.loading-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
}

.loading-center {
  min-height: 200px;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 1rem;
}

/* Spinner Styles */
.spinner {
  position: relative;
  display: inline-block;
  border-radius: 50%;
}

.spinner-base {
  animation: spin 1s linear infinite;
}

.spinner-inner {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-right: 2px solid currentColor;
}

/* Size variants */
.spinner-xs { width: 1rem; height: 1rem; }
.spinner-sm { width: 1.5rem; height: 1.5rem; }
.spinner-md { width: 2rem; height: 2rem; }
.spinner-lg { width: 3rem; height: 3rem; }
.spinner-xl { width: 4rem; height: 4rem; }

/* Color variants */
.spinner-primary { color: theme('colors.knue.primary'); }
.spinner-secondary { color: theme('colors.gray.500'); }
.spinner-white { color: white; }

/* Loading Text */
.loading-text {
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0;
  white-space: nowrap;
}

/* Progress Indicator */
.progress-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 120px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background-color: theme('colors.gray.200');
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: theme('colors.knue.primary');
  border-radius: 2px;
  transition: width 0.3s ease-out;
}

.progress-text {
  font-size: 0.75rem;
  color: theme('colors.gray.600');
  font-weight: 500;
}

/* Animations */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .spinner-base {
    animation-duration: 2s;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .loading-overlay {
    background-color: rgba(0, 0, 0, 0.8);
  }
  
  .progress-bar {
    background-color: theme('colors.gray.700');
  }
  
  .progress-text {
    color: theme('colors.gray.400');
  }
}
</style>