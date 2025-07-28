import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'

// Import UnoCSS
import 'virtual:uno.css'

// Create Vue app
const app = createApp(App)

// Install plugins
app.use(createPinia())
app.use(router)

// Global error handler
app.config.errorHandler = (error, instance, info) => {
  console.error('Global error:', error, info)
  
  // Send to error reporting service in production
  if (import.meta.env.PROD) {
    // Example: Sentry.captureException(error)
  }
}

// Mount app
app.mount('#app')

// Development helpers
if (import.meta.env.DEV) {
  // Add debug helpers to window
  window.__app = app
  window.__router = router
}