/**
 * Authentication Service - Future Google OAuth integration
 */

export class AuthService {
  /**
   * Verify Google OAuth token and create/update user
   */
  static async verifyGoogleToken(db, token) {
    try {
      // Verify token with Google
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`)
      
      if (!response.ok) {
        throw new Error('Invalid token')
      }

      const payload = await response.json()
      
      // Validate token payload
      if (!payload.sub || !payload.email) {
        throw new Error('Invalid token payload')
      }

      // Check if user exists
      let user = await this.getUserById(db, payload.sub)
      
      if (user) {
        // Update existing user
        await this.updateUser(db, payload.sub, {
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
          locale: payload.locale,
          last_login: new Date().toISOString()
        })
      } else {
        // Create new user
        await this.createUser(db, {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
          locale: payload.locale || 'ko'
        })
        
        // Create default preferences
        await this.createDefaultPreferences(db, payload.sub)
      }

      // Get updated user data
      user = await this.getUserById(db, payload.sub)
      const preferences = await this.getUserPreferences(db, payload.sub)

      return {
        user,
        preferences,
        token: await this.generateJWT(payload.sub)
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      throw new Error('Authentication failed')
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(db, userId) {
    const stmt = db.prepare(`
      SELECT id, email, name, picture, locale, created_at, last_login
      FROM users 
      WHERE id = ?
    `)
    
    return await stmt.bind(userId).first()
  }

  /**
   * Create new user
   */
  static async createUser(db, userData) {
    const stmt = db.prepare(`
      INSERT INTO users (id, email, name, picture, locale, created_at, last_login)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const now = new Date().toISOString()
    
    await stmt.bind(
      userData.id,
      userData.email,
      userData.name,
      userData.picture,
      userData.locale,
      now,
      now
    ).run()
  }

  /**
   * Update existing user
   */
  static async updateUser(db, userId, userData) {
    const stmt = db.prepare(`
      UPDATE users 
      SET email = ?, name = ?, picture = ?, locale = ?, last_login = ?
      WHERE id = ?
    `)

    await stmt.bind(
      userData.email,
      userData.name,
      userData.picture,
      userData.locale,
      userData.last_login,
      userId
    ).run()
  }

  /**
   * Create default user preferences
   */
  static async createDefaultPreferences(db, userId) {
    const stmt = db.prepare(`
      INSERT INTO user_preferences (
        user_id, selected_departments, notifications_enabled, 
        theme, language, items_per_page, auto_refresh, group_by_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    // Default to first 4 departments
    const defaultDepartments = JSON.stringify(['general', 'academic', 'employment', 'scholarship'])

    await stmt.bind(
      userId,
      defaultDepartments,
      0, // notifications_enabled
      'light', // theme
      'ko', // language
      20, // items_per_page
      0, // auto_refresh
      0 // group_by_date
    ).run()
  }

  /**
   * Get user preferences
   */
  static async getUserPreferences(db, userId) {
    const stmt = db.prepare(`
      SELECT 
        selected_departments, notifications_enabled, theme, language,
        items_per_page, auto_refresh, group_by_date, updated_at
      FROM user_preferences 
      WHERE user_id = ?
    `)

    const result = await stmt.bind(userId).first()
    
    if (result) {
      return {
        ...result,
        selected_departments: JSON.parse(result.selected_departments || '[]')
      }
    }
    
    return null
  }

  /**
   * Update user preferences
   */
  static async updateUserPreferences(db, userId, preferences) {
    const allowedFields = [
      'selected_departments', 'notifications_enabled', 'theme', 
      'language', 'items_per_page', 'auto_refresh', 'group_by_date'
    ]
    
    const updates = []
    const values = []

    Object.keys(preferences).forEach(key => {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`)
        if (key === 'selected_departments') {
          values.push(JSON.stringify(preferences[key]))
        } else {
          values.push(preferences[key])
        }
      }
    })

    if (updates.length === 0) {
      throw new Error('No valid fields to update')
    }

    values.push(new Date().toISOString(), userId)

    const stmt = db.prepare(`
      UPDATE user_preferences 
      SET ${updates.join(', ')}, updated_at = ?
      WHERE user_id = ?
    `)

    await stmt.bind(...values).run()
    return this.getUserPreferences(db, userId)
  }

  /**
   * Generate JWT token (simplified - use proper JWT library in production)
   */
  static async generateJWT(userId) {
    // This is a simplified implementation
    // In production, use a proper JWT library and secret key
    const header = { alg: 'HS256', typ: 'JWT' }
    const payload = {
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }

    const headerBase64 = btoa(JSON.stringify(header))
    const payloadBase64 = btoa(JSON.stringify(payload))
    
    return `${headerBase64}.${payloadBase64}.signature`
  }

  /**
   * Verify JWT token (simplified)
   */
  static async verifyJWT(token) {
    try {
      const [header, payload, signature] = token.split('.')
      const decodedPayload = JSON.parse(atob(payload))
      
      // Check expiration
      if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired')
      }

      return decodedPayload
    } catch (error) {
      throw new Error('Invalid token')
    }
  }

  /**
   * Get user bookmarks
   */
  static async getUserBookmarks(db, userId, options = {}) {
    const { limit = 20, offset = 0 } = options

    const stmt = db.prepare(`
      SELECT 
        ub.id, ub.notes, ub.created_at,
        rc.title, rc.link, rc.description, rc.pub_date,
        d.name as department_name, d.icon as department_icon, d.color as department_color
      FROM user_bookmarks ub
      JOIN rss_cache rc ON ub.rss_item_id = rc.id
      JOIN departments d ON rc.department_id = d.id
      WHERE ub.user_id = ?
      ORDER BY ub.created_at DESC
      LIMIT ? OFFSET ?
    `)

    const result = await stmt.bind(userId, limit, offset).all()
    return result.results || []
  }

  /**
   * Add bookmark
   */
  static async addBookmark(db, userId, rssItemId, notes = '') {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO user_bookmarks (user_id, rss_item_id, notes)
      VALUES (?, ?, ?)
    `)

    await stmt.bind(userId, rssItemId, notes).run()
  }

  /**
   * Remove bookmark
   */
  static async removeBookmark(db, userId, rssItemId) {
    const stmt = db.prepare(`
      DELETE FROM user_bookmarks 
      WHERE user_id = ? AND rss_item_id = ?
    `)

    await stmt.bind(userId, rssItemId).run()
  }
}