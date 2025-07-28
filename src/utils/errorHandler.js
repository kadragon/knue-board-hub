/**
 * Error Handling Utilities for RSS Feed Operations
 */

/**
 * Error types for RSS operations
 */
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  PARSING: 'PARSING_ERROR', 
  TIMEOUT: 'TIMEOUT_ERROR',
  CORS: 'CORS_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  INVALID_DATA: 'INVALID_DATA_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
}

/**
 * User-friendly error messages in Korean
 */
export const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: '네트워크 연결을 확인해주세요',
  [ERROR_TYPES.PARSING]: 'RSS 피드 형식에 오류가 있습니다',
  [ERROR_TYPES.TIMEOUT]: '요청 시간이 초과되었습니다',
  [ERROR_TYPES.CORS]: '접근 권한 오류가 발생했습니다',
  [ERROR_TYPES.NOT_FOUND]: '요청한 게시판을 찾을 수 없습니다',
  [ERROR_TYPES.INVALID_DATA]: '유효하지 않은 데이터입니다',
  [ERROR_TYPES.RATE_LIMIT]: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요',
  [ERROR_TYPES.UNKNOWN]: '알 수 없는 오류가 발생했습니다'
}

/**
 * Enhanced error class for RSS operations
 */
export class RSSError extends Error {
  constructor(type, message, originalError = null, context = {}) {
    super(message)
    this.name = 'RSSError'
    this.type = type
    this.originalError = originalError
    this.context = context
    this.timestamp = new Date()
    this.userMessage = ERROR_MESSAGES[type] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN]
  }

  /**
   * Get user-friendly error message
   * @returns {string} Localized error message
   */
  getUserMessage() {
    return this.userMessage
  }

  /**
   * Get error details for logging
   * @returns {Object} Error details
   */
  getDetails() {
    return {
      type: this.type,
      message: this.message,
      userMessage: this.userMessage,
      context: this.context,
      timestamp: this.timestamp,
      originalError: this.originalError?.message,
      stack: this.stack
    }
  }
}

/**
 * Classify error type based on error object
 * @param {Error} error - Original error
 * @returns {string} Error type
 */
export function classifyError(error) {
  if (!error) return ERROR_TYPES.UNKNOWN

  const message = error.message?.toLowerCase() || ''
  
  // Network errors
  if (error.name === 'AbortError' || message.includes('aborted')) {
    return ERROR_TYPES.TIMEOUT
  }
  
  if (message.includes('network') || message.includes('fetch')) {
    return ERROR_TYPES.NETWORK
  }
  
  // CORS errors
  if (message.includes('cors') || message.includes('cross-origin')) {
    return ERROR_TYPES.CORS
  }
  
  // HTTP status errors
  if (message.includes('404') || message.includes('not found')) {
    return ERROR_TYPES.NOT_FOUND
  }
  
  if (message.includes('429') || message.includes('rate limit')) {
    return ERROR_TYPES.RATE_LIMIT
  }
  
  // Parsing errors
  if (message.includes('xml') || message.includes('parse') || message.includes('invalid')) {
    return ERROR_TYPES.PARSING
  }
  
  return ERROR_TYPES.UNKNOWN
}

/**
 * Create standardized RSS error
 * @param {Error} originalError - Original error object
 * @param {Object} context - Additional context
 * @returns {RSSError} Standardized error
 */
export function createRSSError(originalError, context = {}) {
  const errorType = classifyError(originalError)
  const message = originalError?.message || 'Unknown error occurred'
  
  return new RSSError(errorType, message, originalError, context)
}

/**
 * Error recovery strategies
 */
export const RECOVERY_STRATEGIES = {
  [ERROR_TYPES.NETWORK]: {
    retry: true,
    maxRetries: 3,
    backoff: 'exponential',
    suggestion: '네트워크 연결을 확인하고 다시 시도해주세요'
  },
  [ERROR_TYPES.TIMEOUT]: {
    retry: true,
    maxRetries: 2,
    backoff: 'linear',
    suggestion: '잠시 후 다시 시도해주세요'
  },
  [ERROR_TYPES.CORS]: {
    retry: false,
    suggestion: '브라우저를 새로고침하거나 다른 브라우저를 사용해보세요'
  },
  [ERROR_TYPES.NOT_FOUND]: {
    retry: false,
    suggestion: '다른 게시판을 선택해주세요'
  },
  [ERROR_TYPES.RATE_LIMIT]: {
    retry: true,
    maxRetries: 1,
    backoff: 'fixed',
    delay: 30000, // 30 seconds
    suggestion: '30초 후 다시 시도해주세요'
  },
  [ERROR_TYPES.PARSING]: {
    retry: true,
    maxRetries: 1,
    suggestion: '게시판 관리자에게 문의해주세요'
  },
  [ERROR_TYPES.UNKNOWN]: {
    retry: true,
    maxRetries: 1,
    suggestion: '문제가 지속되면 관리자에게 문의해주세요'
  }
}

/**
 * Get recovery strategy for error type
 * @param {string} errorType - Error type
 * @returns {Object} Recovery strategy
 */
export function getRecoveryStrategy(errorType) {
  return RECOVERY_STRATEGIES[errorType] || RECOVERY_STRATEGIES[ERROR_TYPES.UNKNOWN]
}

/**
 * Calculate backoff delay
 * @param {string} strategy - Backoff strategy
 * @param {number} attempt - Current attempt number
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {number} Delay in milliseconds
 */
export function calculateBackoffDelay(strategy, attempt, baseDelay = 1000) {
  switch (strategy) {
    case 'exponential':
      return Math.min(baseDelay * Math.pow(2, attempt - 1), 30000) // Max 30 seconds
    case 'linear':
      return baseDelay * attempt
    case 'fixed':
      return baseDelay
    default:
      return baseDelay
  }
}

/**
 * Log error with context
 * @param {RSSError} error - RSS error object
 * @param {string} level - Log level (error, warn, info)
 */
export function logError(error, level = 'error') {
  const details = error.getDetails ? error.getDetails() : {
    message: error.message,
    stack: error.stack
  }
  
  console[level](`[RSS Error] ${error.type || 'UNKNOWN'}:`, details)
  
  // In production, you might want to send to an error tracking service
  if (import.meta.env.PROD) {
    // Example: Sentry, LogRocket, etc.
    // errorTracker.captureException(error, { extra: details })
  }
}

/**
 * Create error notification object for UI
 * @param {RSSError} error - RSS error object
 * @returns {Object} Notification object
 */
export function createErrorNotification(error) {
  const strategy = getRecoveryStrategy(error.type)
  
  return {
    id: `error-${Date.now()}`,
    type: 'error',
    title: '오류 발생',
    message: error.getUserMessage(),
    suggestion: strategy.suggestion,
    timestamp: error.timestamp,
    canRetry: strategy.retry,
    context: error.context
  }
}