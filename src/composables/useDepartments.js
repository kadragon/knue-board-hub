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
const isInitialized = ref(false)

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
        isInitialized.value = true
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
   * @returns {Array} High priority departments with IDs
   */
  function getDefaultDepartments() {
    const defaults = departments.value.slice(0, 3)
    return defaults.map(dept => dept.id)
  }

  /**
   * Get default departments as objects (for backward compatibility)
   * @returns {Array} High priority department objects
   */
  function getDefaultDepartmentObjects() {
    return departments.value.slice(0, 3)
  }

  // Computed properties
  const allDepartments = computed(() => departments.value)
  
  const activeDepartments = computed(() => 
    departments.value.filter(dept => dept.isActive)
  )
  
  const departmentCount = computed(() => departments.value.length)
  
  const isLoading = computed(() => loading.value)
  
  const hasError = computed(() => !!error.value)
  
  const initialized = computed(() => isInitialized.value)

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
    initialized,

    // Methods
    fetchDepartments,
    getDepartment,
    getDepartmentsByIds,
    getDefaultDepartments,
    getDefaultDepartmentObjects
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