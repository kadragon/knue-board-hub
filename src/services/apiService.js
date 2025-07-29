/**
 * API Service - Cloudflare Workers API integration
 */

class ApiService {
  constructor() {
    // Use local proxy during development, production URL when deployed
    this.baseURL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://your-worker.your-subdomain.workers.dev/api')
    this.timeout = 10000 // 10 seconds
  }

  /**
   * Generic API request handler
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    // Add timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)
    config.signal = controller.signal

    try {
      const response = await fetch(url, config)
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'API request failed')
      }

      return data
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      
      throw error
    }
  }

  /**
   * Department Management
   */
  async getDepartments() {
    return this.request('/departments')
  }

  async getDepartment(id) {
    return this.request(`/departments/${id}`)
  }

  /**
   * RSS Feed Management
   */
  async getRssItems(options = {}) {
    const params = new URLSearchParams()
    
    if (options.departments) {
      params.append('departments', options.departments.join(','))
    }
    if (options.limit) {
      params.append('limit', options.limit.toString())
    }
    if (options.offset) {
      params.append('offset', options.offset.toString())
    }
    if (options.search) {
      params.append('search', options.search)
    }
    if (options.dateFilter) {
      params.append('dateFilter', options.dateFilter)
    }
    if (options.sortBy) {
      params.append('sortBy', options.sortBy)
    }

    const query = params.toString()
    return this.request(`/rss/items${query ? `?${query}` : ''}`)
  }

  async refreshRssFeeds(departments = null) {
    return this.request('/rss/refresh', {
      method: 'POST',
      body: JSON.stringify({ departments })
    })
  }

  /**
   * Future: Authentication
   */
  async authenticateWithGoogle(token) {
    return this.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token })
    })
  }

  /**
   * Future: User Preferences
   */
  async getUserPreferences() {
    // TODO: Add authorization header
    return this.request('/user/preferences')
  }

  async updateUserPreferences(preferences) {
    // TODO: Add authorization header
    return this.request('/user/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences)
    })
  }

  /**
   * Health check
   */
  async healthCheck() {
    return this.request('/health')
  }
}

// Create singleton instance
export const apiService = new ApiService()

/**
 * Composable for API service
 */
export function useApi() {
  return {
    apiService,
    
    // Health check
    async checkApiHealth() {
      try {
        await apiService.healthCheck()
        return { healthy: true, error: null }
      } catch (error) {
        return { healthy: false, error: error.message }
      }
    }
  }
}