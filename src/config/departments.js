/**
 * KNUE Department Configuration
 * Maps department information to RSS feed parameters
 */

export const DEPARTMENTS = {
  main: {
    id: 'main',
    bbsNo: 207,
    name: '메인 공지사항',
    nameEn: 'Main Announcements',
    icon: '📢',
    color: '#0066cc',
    priority: 1,
    description: '대학 주요 공지사항'
  },
  academic: {
    id: 'academic', 
    bbsNo: 208,
    name: '학사공지',
    nameEn: 'Academic Affairs',
    icon: '📚',
    color: '#28a745',
    priority: 2,
    description: '학사 관련 공지사항'
  },
  employment: {
    id: 'employment',
    bbsNo: 209, 
    name: '취업공지',
    nameEn: 'Employment',
    icon: '💼',
    color: '#17a2b8',
    priority: 3,
    description: '취업 및 진로 관련 공지'
  },
  scholarship: {
    id: 'scholarship',
    bbsNo: 210,
    name: '장학공지', 
    nameEn: 'Scholarship',
    icon: '🎓',
    color: '#ffc107',
    priority: 4,
    description: '장학금 관련 공지사항'
  },
  event: {
    id: 'event',
    bbsNo: 211,
    name: '행사공지',
    nameEn: 'Events',
    icon: '🎉',
    color: '#e83e8c',
    priority: 5,
    description: '대학 행사 및 이벤트'
  },
  research: {
    id: 'research',
    bbsNo: 212,
    name: '연구공지',
    nameEn: 'Research',
    icon: '🔬',
    color: '#6f42c1',
    priority: 6,
    description: '연구 관련 공지사항'
  },
  library: {
    id: 'library',
    bbsNo: 213,
    name: '도서관공지',
    nameEn: 'Library',
    icon: '📖',
    color: '#fd7e14',
    priority: 7,
    description: '도서관 이용 안내'
  }
}

/**
 * RSS feed base configuration
 */
export const RSS_CONFIG = {
  baseUrl: 'https://www.knue.ac.kr/rssBbsNtt.do',
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
  cacheDuration: 5 * 60 * 1000, // 5 minutes
  maxItemsPerFeed: 50
}

/**
 * CORS proxy configuration for development
 */
export const PROXY_CONFIG = {
  development: {
    enabled: true,
    baseUrl: '/api/proxy/rss'
  },
  production: {
    enabled: true,
    baseUrl: 'https://api.allorigins.win/get'
  }
}

/**
 * Get department by ID
 * @param {string} departmentId - Department identifier
 * @returns {Object|null} Department configuration
 */
export function getDepartment(departmentId) {
  return DEPARTMENTS[departmentId] || null
}

/**
 * Get all departments sorted by priority
 * @returns {Array} Sorted department list
 */
export function getAllDepartments() {
  return Object.values(DEPARTMENTS).sort((a, b) => a.priority - b.priority)
}

/**
 * Get default departments for initial load
 * @returns {Array} High priority departments
 */
export function getDefaultDepartments() {
  return getAllDepartments().filter(dept => dept.priority <= 3)
}

/**
 * Generate RSS URL for department
 * @param {string} departmentId - Department identifier
 * @param {Object} options - Additional options
 * @returns {string} Complete RSS URL
 */
export function generateRSSUrl(departmentId, options = {}) {
  const department = getDepartment(departmentId)
  if (!department) {
    throw new Error(`Unknown department: ${departmentId}`)
  }

  const params = new URLSearchParams({
    bbsNo: department.bbsNo,
    ...options
  })

  return `${RSS_CONFIG.baseUrl}?${params.toString()}`
}

/**
 * Generate proxy URL for CORS bypass
 * @param {string} rssUrl - Original RSS URL
 * @param {string} environment - Current environment
 * @returns {string} Proxy URL
 */
export function generateProxyUrl(rssUrl, environment = 'development') {
  const config = PROXY_CONFIG[environment]
  
  if (!config?.enabled) {
    return rssUrl
  }

  if (environment === 'development') {
    return `${config.baseUrl}?url=${encodeURIComponent(rssUrl)}`
  } else {
    return `${config.baseUrl}?url=${encodeURIComponent(rssUrl)}`
  }
}

/**
 * Validate department configuration
 * @param {Object} department - Department object
 * @returns {boolean} True if valid
 */
export function validateDepartment(department) {
  const required = ['id', 'bbsNo', 'name', 'priority']
  return required.every(field => department && department[field] !== undefined)
}