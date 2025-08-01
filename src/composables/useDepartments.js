/**
 * Departments Management Composable
 * Enhanced with localStorage cache-first pattern and D1 rehydration
 */

import { ref, computed, onMounted } from 'vue'
import { apiService } from '../services/apiService.js'
import { RehydrationManager } from '../services/rehydrationManager.js'
import { SyncCoordinator } from '../services/syncCoordinator.js'
import { cacheManager } from '../services/cacheManager.js'

// Shared state for departments across components
const departments = ref([])
const loading = ref(false)
const error = ref(null)
const lastFetch = ref(null)
const isInitialized = ref(false)

// Initialize managers
const rehydrationManager = new RehydrationManager(apiService)
const syncCoordinator = new SyncCoordinator(apiService, rehydrationManager)

/**
 * Main departments composable
 * @returns {Object} Reactive departments state and methods
 */
export function useDepartments() {
  /**
   * Fetch departments with cache-first pattern
   * @param {boolean} forceRefresh - Skip cache and force refresh
   */
  async function fetchDepartments(forceRefresh = false) {
    loading.value = true
    error.value = null

    try {
      console.log(`📋 Fetching departments${forceRefresh ? ' (force refresh)' : ' (cache-first)'}...`)
      
      // Use rehydration manager for cache-first approach
      const result = await rehydrationManager.getData(
        'departments',
        async () => {
          const response = await apiService.getDepartments()
          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to fetch departments')
          }
          return response
        },
        { 
          category: 'departments', 
          forceRefresh,
          allowStale: true 
        }
      )

      if (result.success && result.data) {
        const processedDepartments = result.data.map(dept => ({
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
        processedDepartments.sort((a, b) => a.priority - b.priority)
        
        departments.value = processedDepartments
        lastFetch.value = Date.now()
        isInitialized.value = true
        
        // Log cache status
        const cacheStatus = result._metadata?.cached ? 
          `from cache (age: ${Math.round((result._metadata.age || 0)/1000)}s${result._metadata.stale ? ', stale' : ''})` :
          'from server (fresh)'
        
        console.log(`📋 Loaded ${departments.value.length} departments ${cacheStatus}`)
        
        return departments.value
      } else {
        throw new Error(result.error || 'Failed to fetch departments')
      }
    } catch (err) {
      console.error('📋 Error fetching departments:', err)
      error.value = {
        message: err.message,
        timestamp: new Date(),
        fromCache: err.message.includes('stale cache')
      }
      
      // Try to use any existing cached data as last resort
      if (departments.value.length === 0) {
        try {
          const staleCache = await cacheManager.get('departments', 'departments', true) // ignore TTL
          if (staleCache?.data?.success && staleCache.data.data) {
            console.warn('📋 Using emergency stale cache for departments')
            const staleDepartments = staleCache.data.data.map(dept => ({
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
            staleDepartments.sort((a, b) => a.priority - b.priority)
            departments.value = staleDepartments
            isInitialized.value = true
            return departments.value
          }
        } catch (cacheErr) {
          console.warn('📋 Emergency cache lookup failed:', cacheErr)
        }
      }
      
      // Fallback to empty array to prevent app crashes
      if (departments.value.length === 0) {
        departments.value = []
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get department by ID with individual caching
   * @param {string} departmentId - Department identifier
   * @param {boolean} fetchIfMissing - Auto-fetch if department not found
   * @returns {Object|null} Department data or null
   */
  async function getDepartment(departmentId, fetchIfMissing = true) {
    // Validate input - prevent undefined/null/empty from causing recursion
    if (!departmentId || typeof departmentId !== 'string' || departmentId.trim() === '') {
      console.warn(`📋 Invalid department ID provided:`, departmentId)
      return null
    }

    // First check in-memory departments
    let department = departments.value.find(dept => dept.id === departmentId)
    if (department) {
      return department
    }

    // Try individual department cache
    try {
      const cachedDept = await cacheManager.get(`department:${departmentId}`, 'departments')
      if (cachedDept) {
        console.log(`📋 Found individual department cache for: ${departmentId}`)
        return cachedDept.data
      }
    } catch (error) {
      console.warn(`📋 Individual department cache lookup failed for ${departmentId}:`, error)
    }
    
    // If not found and fetch is allowed, try fetching all departments (but only once)
    if (!department && fetchIfMissing && !loading.value && isInitialized.value === false) {
      console.log(`📋 Department ${departmentId} not found, fetching all departments...`)
      await fetchDepartments()
      department = departments.value.find(dept => dept.id === departmentId)
      
      // Cache individual department for faster future access
      if (department) {
        await cacheManager.set(`department:${departmentId}`, department, 'departments')
      }
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

  /**
   * Preload critical departments for faster access using SyncCoordinator
   * @returns {Promise<void>}
   */
  async function preloadCriticalDepartments() {
    const criticalDepartmentIds = ['general', 'academic'] // High-priority departments
    console.log('📋 Preloading critical departments:', criticalDepartmentIds.join(', '))
    
    // Queue critical departments with high priority
    for (const departmentId of criticalDepartmentIds) {
      syncCoordinator.queueSync({
        key: `department:${departmentId}`,
        category: 'departments',
        fetchFn: () => apiService.getDepartment(departmentId),
        metadata: { departmentId, preload: true }
      }, 'high')
    }
    
    console.log('📋 Critical departments queued for preloading')
  }

  /**
   * Sync departments using SyncCoordinator
   * @param {Array<string>} departmentIds - Specific departments to sync, or all if empty
   * @param {string} priority - Sync priority level
   */
  async function syncDepartments(departmentIds = [], priority = 'medium') {
    if (departmentIds.length > 0) {
      // Sync specific departments
      await syncCoordinator.syncActiveDepartments(departmentIds)
    } else {
      // Sync all departments
      syncCoordinator.queueSync({
        key: 'departments:all',
        category: 'departments', 
        fetchFn: () => apiService.getDepartments(),
        metadata: { syncAll: true }
      }, priority)
    }
  }

  /**
   * Get cache statistics for departments including sync coordinator
   * @returns {Object} Cache statistics
   */
  function getDepartmentCacheStats() {
    return {
      cacheManager: cacheManager.getStats(),
      rehydrationManager: rehydrationManager.getStats(),
      syncCoordinator: syncCoordinator.getStats(),
      departmentsLoaded: departments.value.length,
      isInitialized: isInitialized.value,
      lastFetch: lastFetch.value
    }
  }

  /**
   * Get sync coordinator instance for debugging
   * @returns {SyncCoordinator} Sync coordinator instance
   */
  function getSyncCoordinator() {
    return syncCoordinator
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

  // Auto-fetch on mount with preloading
  onMounted(async () => {
    if (departments.value.length === 0 && !loading.value) {
      try {
        await fetchDepartments()
        // Preload critical departments after initial load
        await preloadCriticalDepartments()
      } catch (error) {
        console.warn('📋 Initial department loading failed:', error)
      }
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
    getDefaultDepartmentObjects,
    preloadCriticalDepartments,
    syncDepartments,
    getDepartmentCacheStats,
    getSyncCoordinator
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