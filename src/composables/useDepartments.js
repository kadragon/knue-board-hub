/**
 * Departments Management Composable
 * Fetches department data from Cloudflare Worker API connected to D1 database
 */

import { ref, computed, onMounted } from 'vue'
import { apiService } from '../services/apiService.js'

// Shared state for departments across components
const departments = ref([])
const loading = ref(false)
const error = ref(null)
const lastFetch = ref(null)

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000

/**
 * Main departments composable
 * @returns {Object} Reactive departments state and methods
 */
export function useDepartments() {
  /**
   * Fetch departments from API
   * @param {boolean} forceRefresh - Skip cache and force refresh
   */
  async function fetchDepartments(forceRefresh = false) {
    // Check cache first
    if (!forceRefresh && lastFetch.value && 
        Date.now() - lastFetch.value < CACHE_DURATION && 
        departments.value.length > 0) {
      return departments.value
    }

    loading.value = true
    error.value = null

    try {
      console.log('Fetching departments from API...')
      const response = await apiService.getDepartments()
      
      if (response.success && response.data) {
        departments.value = response.data.map(dept => ({
          id: dept.id,
          name: dept.name,
          description: dept.description || '',
          icon: dept.icon || '📋',
          color: dept.color || '#6B7280',
          bbsNo: dept.bbs_no,
          priority: dept.priority || 999,
          rssUrl: dept.rss_url,
          isActive: dept.is_active !== 0
        }))
        
        // Sort by priority
        departments.value.sort((a, b) => a.priority - b.priority)
        
        lastFetch.value = Date.now()
        console.log(`Loaded ${departments.value.length} departments from D1 database`)
        
        return departments.value
      } else {
        throw new Error(response.error || 'Failed to fetch departments')
      }
    } catch (err) {
      console.error('Error fetching departments:', err)
      error.value = {
        message: err.message,
        timestamp: new Date()
      }
      
      // Fallback to empty array to prevent app crashes
      departments.value = []
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get department by ID
   * @param {string} departmentId - Department identifier
   * @param {boolean} fetchIfMissing - Auto-fetch if department not found
   * @returns {Object|null} Department data or null
   */
  async function getDepartment(departmentId, fetchIfMissing = true) {
    let department = departments.value.find(dept => dept.id === departmentId)
    
    // If not found and fetch is allowed, try fetching all departments
    if (!department && fetchIfMissing && !loading.value) {
      console.log(`Department ${departmentId} not found in cache, fetching all departments...`)
      await fetchDepartments()
      department = departments.value.find(dept => dept.id === departmentId)
    }
    
    return department || null
  }

  /**
   * Get departments by IDs
   * @param {Array<string>} departmentIds - Array of department identifiers
   * @returns {Array} Array of department objects
   */
  function getDepartmentsByIds(departmentIds) {
    if (!Array.isArray(departmentIds)) return []
    return departments.value.filter(dept => departmentIds.includes(dept.id))
  }

  /**
   * Get default departments for initial load (first 3 by priority)
   * @returns {Array} High priority departments
   */
  function getDefaultDepartments() {
    return departments.value.slice(0, 3)
  }

  /**
   * Generate RSS URL for department
   * @param {string} departmentId - Department identifier
   * @param {Object} options - Additional URL parameters
   * @returns {string} Complete RSS URL
   */
  function generateRSSUrl(departmentId, options = {}) {
    const department = getDepartment(departmentId)
    if (!department) {
      throw new Error(`Unknown department: ${departmentId}`)
    }

    if (department.rssUrl) {
      // Use the rss_url from database if available
      const url = new URL(department.rssUrl)
      Object.entries(options).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
      return url.toString()
    } else {
      // Fallback to generating URL from bbsNo
      const baseUrl = 'https://www.knue.ac.kr/rssBbsNtt.do'
      const params = new URLSearchParams({
        bbsNo: department.bbsNo,
        ...options
      })
      return `${baseUrl}?${params.toString()}`
    }
  }

  /**
   * Generate proxy URL for CORS bypass
   * @param {string} rssUrl - Original RSS URL
   * @param {string} environment - Current environment
   * @returns {string} Proxy URL
   */
  function generateProxyUrl(rssUrl, environment = 'development') {
    if (environment === 'development') {
      return `/api/rss?url=${encodeURIComponent(rssUrl)}`
    } else {
      return `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`
    }
  }

  // Computed properties
  const allDepartments = computed(() => departments.value)
  
  const activeDepartments = computed(() => 
    departments.value.filter(dept => dept.isActive)
  )
  
  const departmentCount = computed(() => departments.value.length)
  
  const isLoading = computed(() => loading.value)
  
  const hasError = computed(() => !!error.value)

  // Auto-fetch on mount if not already loaded
  onMounted(() => {
    if (departments.value.length === 0 && !loading.value) {
      fetchDepartments()
    }
  })

  return {
    // State
    departments: allDepartments,
    activeDepartments,
    loading: isLoading,
    error,
    lastFetch,

    // Computed
    departmentCount,
    hasError,

    // Methods
    fetchDepartments,
    getDepartment,
    getDepartmentsByIds,
    getDefaultDepartments,
    generateRSSUrl,
    generateProxyUrl
  }
}

/**
 * Lightweight composable for single department
 * @param {string} departmentId - Department identifier
 * @returns {Object} Single department state and methods
 */
export function useDepartment(departmentId) {
  const { departments, getDepartment, fetchDepartments, ...rest } = useDepartments()
  
  const department = computed(() => getDepartment(departmentId))
  const exists = computed(() => !!department.value)

  return {
    department,
    exists,
    departments,
    fetchDepartments,
    ...rest
  }
}

// Export utility functions for backward compatibility
export function getAllDepartments() {
  return departments.value
}

export function getDefaultDepartments() {
  return departments.value.slice(0, 3)
}

export function getDepartment(departmentId) {
  return departments.value.find(dept => dept.id === departmentId) || null
}