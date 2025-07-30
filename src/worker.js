/**
 * KNUE Board Hub - Cloudflare Workers API
 * Handles department management, RSS fetching, and future user authentication
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { DepartmentService } from './services/DepartmentService.js'
import { RssService } from './services/RssService.js'
import { AuthService } from './services/AuthService.js'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', cors({
  origin: (origin) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:4173',
      'https://your-domain.pages.dev'
    ]
    return allowedOrigins.includes(origin) ? origin : null
  },
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))

// Health check
app.get('/api/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// Department Management Routes
app.get('/api/departments', async (c) => {
  try {
    const departments = await DepartmentService.getAll(c.env.DB)
    return c.json({
      success: true,
      data: departments,
      count: departments.length
    })
  } catch (error) {
    console.error('Error fetching departments:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

app.get('/api/departments/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const department = await DepartmentService.getById(c.env.DB, id)
    
    if (!department) {
      return c.json({ success: false, error: 'Department not found' }, 404)
    }
    
    return c.json({ success: true, data: department })
  } catch (error) {
    console.error('Error fetching department:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// RSS Feed Routes
app.get('/api/rss/items', async (c) => {
  try {
    const query = c.req.query()
    const options = {
      departments: query.departments?.split(',') || null,
      limit: parseInt(query.limit) || 20,
      offset: parseInt(query.offset) || 0,
      search: query.search || null,
      dateFilter: query.dateFilter || 'all',
      sortBy: query.sortBy || 'date-desc'
    }
    
    const result = await RssService.getItems(c.env.DB, options)
    return c.json({
      success: true,
      data: result.items,
      total: result.total,
      pagination: {
        limit: options.limit,
        offset: options.offset,
        hasMore: result.total > (options.offset + options.limit)
      }
    })
  } catch (error) {
    console.error('Error fetching RSS items:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

app.post('/api/rss/refresh', async (c) => {
  try {
    let departmentIds = null
    
    // Handle both empty body and JSON body cases
    try {
      const body = await c.req.json()
      departmentIds = body.departments || null
    } catch (jsonError) {
      // If JSON parsing fails (e.g., empty body), use null (refresh all departments)
      departmentIds = null
    }
    
    const result = await RssService.refreshFeeds(c.env.DB, departmentIds)
    return c.json({
      success: true,
      message: 'RSS feeds refreshed successfully',
      data: result
    })
  } catch (error) {
    console.error('Error refreshing RSS feeds:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Future: User Authentication Routes
app.post('/api/auth/google', async (c) => {
  try {
    const { token } = await c.req.json()
    const result = await AuthService.verifyGoogleToken(c.env.DB, token)
    
    return c.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error authenticating user:', error)
    return c.json({ success: false, error: error.message }, 401)
  }
})

// Future: User Preferences Routes
app.get('/api/user/preferences', async (c) => {
  // Implementation for authenticated user preferences
  return c.json({ success: false, error: 'Not implemented yet' }, 501)
})

app.put('/api/user/preferences', async (c) => {
  // Implementation for updating user preferences
  return c.json({ success: false, error: 'Not implemented yet' }, 501)
})

// Error handling
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({
    success: false,
    error: 'Internal server error',
    message: err.message
  }, 500)
})

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  }, 404)
})

export default app