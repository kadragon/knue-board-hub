/**
 * Notification Management Composable
 * Handles user notifications for RSS feed updates and errors
 */

import { ref, reactive, computed } from 'vue'
import { createErrorNotification } from '../utils/errorHandler.js'

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error', 
  WARNING: 'warning',
  INFO: 'info'
}

/**
 * Notification management composable
 * @param {Object} options - Configuration options
 * @returns {Object} Notification state and methods
 */
export function useNotifications(options = {}) {
  // State
  const notifications = ref([])
  const config = reactive({
    maxNotifications: options.maxNotifications || 5,
    autoRemove: options.autoRemove !== false,
    autoRemoveDelay: options.autoRemoveDelay || 5000,
    position: options.position || 'top-right'
  })

  // Auto-remove timers
  const timers = new Map()

  /**
   * Add notification
   * @param {Object} notification - Notification object
   * @returns {string} Notification ID
   */
  function addNotification(notification) {
    const id = notification.id || `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const notificationObj = {
      id,
      type: notification.type || NOTIFICATION_TYPES.INFO,
      title: notification.title,
      message: notification.message,
      timestamp: new Date(),
      duration: notification.duration || config.autoRemoveDelay,
      persistent: notification.persistent || false,
      actions: notification.actions || [],
      ...notification
    }

    // Remove oldest if at max capacity
    if (notifications.value.length >= config.maxNotifications) {
      const oldest = notifications.value[0]
      removeNotification(oldest.id)
    }

    notifications.value.push(notificationObj)

    // Auto-remove if enabled and not persistent
    if (config.autoRemove && !notificationObj.persistent) {
      const timer = setTimeout(() => {
        removeNotification(id)
      }, notificationObj.duration)
      
      timers.set(id, timer)
    }

    return id
  }

  /**
   * Remove notification by ID
   * @param {string} id - Notification ID
   */
  function removeNotification(id) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }

    // Clear timer if exists
    if (timers.has(id)) {
      clearTimeout(timers.get(id))
      timers.delete(id)
    }
  }

  /**
   * Clear all notifications
   */
  function clearAll() {
    notifications.value = []
    
    // Clear all timers
    timers.forEach(timer => clearTimeout(timer))
    timers.clear()
  }

  /**
   * Show success notification
   * @param {string} message - Success message
   * @param {Object} options - Additional options
   * @returns {string} Notification ID
   */
  function showSuccess(message, options = {}) {
    return addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      title: options.title || '성공',
      message,
      ...options
    })
  }

  /**
   * Show error notification
   * @param {string|Error} error - Error message or error object
   * @param {Object} options - Additional options
   * @returns {string} Notification ID
   */
  function showError(error, options = {}) {
    let notification

    if (error && typeof error.getUserMessage === 'function') {
      // RSS Error object
      notification = createErrorNotification(error)
    } else if (error instanceof Error) {
      notification = {
        type: NOTIFICATION_TYPES.ERROR,
        title: '오류 발생',
        message: error.message,
        persistent: true
      }
    } else {
      notification = {
        type: NOTIFICATION_TYPES.ERROR,
        title: options.title || '오류 발생',
        message: error,
        persistent: true
      }
    }

    return addNotification({
      ...notification,
      ...options
    })
  }

  /**
   * Show warning notification
   * @param {string} message - Warning message
   * @param {Object} options - Additional options
   * @returns {string} Notification ID
   */
  function showWarning(message, options = {}) {
    return addNotification({
      type: NOTIFICATION_TYPES.WARNING,
      title: options.title || '주의',
      message,
      ...options
    })
  }

  /**
   * Show info notification
   * @param {string} message - Info message
   * @param {Object} options - Additional options
   * @returns {string} Notification ID
   */
  function showInfo(message, options = {}) {
    return addNotification({
      type: NOTIFICATION_TYPES.INFO,
      title: options.title || '알림',
      message,
      ...options
    })
  }

  /**
   * Show RSS feed update notification
   * @param {string} departmentName - Department name
   * @param {number} newItemsCount - Number of new items
   * @returns {string} Notification ID
   */
  function showFeedUpdate(departmentName, newItemsCount) {
    if (newItemsCount > 0) {
      return showSuccess(
        `${departmentName}에 새로운 게시글 ${newItemsCount}개가 등록되었습니다`,
        {
          title: '새 게시글',
          duration: 3000
        }
      )
    }
  }

  /**
   * Show feed refresh notification
   * @param {number} totalFeeds - Total number of feeds refreshed
   * @param {number} successCount - Number of successful refreshes
   * @returns {string} Notification ID
   */
  function showRefreshResult(totalFeeds, successCount) {
    if (successCount === totalFeeds) {
      return showSuccess(
        `모든 게시판이 성공적으로 새로고침되었습니다`,
        { duration: 2000 }
      )
    } else if (successCount > 0) {
      return showWarning(
        `${successCount}/${totalFeeds}개 게시판이 새로고침되었습니다`,
        { duration: 3000 }
      )
    } else {
      return showError(
        '게시판 새로고침에 실패했습니다',
        { title: '새로고침 실패' }
      )
    }
  }

  // Computed properties
  const hasNotifications = computed(() => notifications.value.length > 0)
  
  const notificationsByType = computed(() => {
    return notifications.value.reduce((acc, notification) => {
      if (!acc[notification.type]) {
        acc[notification.type] = []
      }
      acc[notification.type].push(notification)
      return acc
    }, {})
  })

  const errorCount = computed(() => {
    return notificationsByType.value[NOTIFICATION_TYPES.ERROR]?.length || 0
  })

  const latestNotification = computed(() => {
    return notifications.value[notifications.value.length - 1] || null
  })

  return {
    // State
    notifications: readonly(notifications),
    config,

    // Computed
    hasNotifications,
    notificationsByType,
    errorCount,
    latestNotification,

    // Methods
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showFeedUpdate,
    showRefreshResult,

    // Constants
    NOTIFICATION_TYPES
  }
}

/**
 * Global notification instance (singleton pattern)
 */
let globalNotifications = null

/**
 * Get or create global notifications instance
 * @param {Object} options - Configuration options
 * @returns {Object} Global notifications instance
 */
export function useGlobalNotifications(options = {}) {
  if (!globalNotifications) {
    globalNotifications = useNotifications(options)
  }
  return globalNotifications
}