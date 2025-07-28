/**
 * Date Utilities for RSS Feed Display
 * Korean-localized date formatting for mobile interfaces
 */

/**
 * Format date for mobile display (Korean)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDateForMobile(date) {
  if (!date) return '날짜 없음'
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return '잘못된 날짜'
  
  const now = new Date()
  const diffMs = now - dateObj
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  // Same day
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    if (diffHours === 0) {
      if (diffMinutes <= 1) return '방금 전'
      return `${diffMinutes}분 전`
    }
    return `${diffHours}시간 전`
  }
  
  // Yesterday
  if (diffDays === 1) {
    return '어제'
  }
  
  // This week (2-6 days ago)
  if (diffDays <= 6) {
    return `${diffDays}일 전`
  }
  
  // This year
  if (dateObj.getFullYear() === now.getFullYear()) {
    return dateObj.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric'
    })
  }
  
  // Different year
  return dateObj.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Format date for detailed view
 * @param {Date|string} date - Date to format
 * @returns {string} Detailed date string
 */
export function formatDateDetailed(date) {
  if (!date) return '날짜 정보 없음'
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return '잘못된 날짜'
  
  return dateObj.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
}

/**
 * Format time only
 * @param {Date|string} date - Date to format
 * @returns {string} Time string
 */
export function formatTime(date) {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return ''
  
  return dateObj.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

/**
 * Check if date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if today
 */
export function isToday(date) {
  if (!date) return false
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  
  return dateObj.toDateString() === today.toDateString()
}

/**
 * Check if date is this week
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if this week
 */
export function isThisWeek(date) {
  if (!date) return false
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now - dateObj
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  
  return diffDays >= 0 && diffDays <= 7
}

/**
 * Get relative date category
 * @param {Date|string} date - Date to categorize
 * @returns {string} Category (today, yesterday, this-week, older)
 */
export function getDateCategory(date) {
  if (!date) return 'unknown'
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now - dateObj
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays <= 6) return 'this-week'
  return 'older'
}

/**
 * Sort dates (newest first)
 * @param {Array} items - Items with date property
 * @param {string} dateField - Field name containing date
 * @returns {Array} Sorted items
 */
export function sortByDate(items, dateField = 'pubDate') {
  return [...items].sort((a, b) => {
    const dateA = new Date(a[dateField])
    const dateB = new Date(b[dateField])
    
    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0
    if (isNaN(dateA.getTime())) return 1
    if (isNaN(dateB.getTime())) return -1
    
    return dateB - dateA
  })
}

/**
 * Group items by date category
 * @param {Array} items - Items with date property
 * @param {string} dateField - Field name containing date
 * @returns {Object} Grouped items
 */
export function groupByDateCategory(items, dateField = 'pubDate') {
  const groups = {
    today: [],
    yesterday: [],
    'this-week': [],
    older: []
  }
  
  items.forEach(item => {
    const category = getDateCategory(item[dateField])
    if (groups[category]) {
      groups[category].push(item)
    }
  })
  
  return groups
}

/**
 * Get Korean day of week
 * @param {Date|string} date - Date object
 * @returns {string} Korean day name
 */
export function getKoreanDayOfWeek(date) {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return ''
  
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return days[dateObj.getDay()]
}

/**
 * Create date range filter
 * @param {number} daysBack - Number of days to go back
 * @returns {Date} Cutoff date
 */
export function createDateFilter(daysBack) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - daysBack)
  cutoff.setHours(0, 0, 0, 0)
  return cutoff
}

/**
 * Check if date is within range
 * @param {Date|string} date - Date to check
 * @param {number} daysBack - Days back from today
 * @returns {boolean} True if within range
 */
export function isWithinDateRange(date, daysBack) {
  if (!date) return false
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const cutoff = createDateFilter(daysBack)
  
  return dateObj >= cutoff
}