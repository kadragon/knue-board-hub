/**
 * Department Service - Manages department/board configurations
 */

export class DepartmentService {
  /**
   * Get all active departments
   */
  static async getAll(db) {
    const stmt = db.prepare(`
      SELECT id, name, description, icon, color, rss_url, bbs_no, priority, is_active
      FROM departments 
      WHERE is_active = 1 
      ORDER BY priority ASC, name ASC
    `)
    
    const result = await stmt.all()
    return result.results || []
  }

  /**
   * Get department by ID
   */
  static async getById(db, id) {
    const stmt = db.prepare(`
      SELECT id, name, description, icon, color, rss_url, bbs_no, priority, is_active
      FROM departments 
      WHERE id = ? AND is_active = 1
    `)
    
    const result = await stmt.bind(id).first()
    return result
  }

  /**
   * Get multiple departments by IDs
   */
  static async getByIds(db, ids) {
    if (!ids || ids.length === 0) {
      return []
    }

    const placeholders = ids.map(() => '?').join(',')
    const stmt = db.prepare(`
      SELECT id, name, description, icon, color, rss_url, bbs_no, priority, is_active
      FROM departments 
      WHERE id IN (${placeholders}) AND is_active = 1
      ORDER BY priority ASC
    `)
    
    const result = await stmt.bind(...ids).all()
    return result.results || []
  }

  /**
   * Update department information (admin only - future implementation)
   */
  static async update(db, id, data) {
    const allowedFields = ['name', 'description', 'icon', 'color', 'rss_url', 'bbs_no', 'priority', 'is_active']
    const updates = []
    const values = []

    Object.keys(data).forEach(key => {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`)
        values.push(data[key])
      }
    })

    if (updates.length === 0) {
      throw new Error('No valid fields to update')
    }

    values.push(new Date().toISOString(), id)

    const stmt = db.prepare(`
      UPDATE departments 
      SET ${updates.join(', ')}, updated_at = ?
      WHERE id = ?
    `)

    await stmt.bind(...values).run()
    return this.getById(db, id)
  }

  /**
   * Create new department (admin only - future implementation)
   */
  static async create(db, data) {
    const requiredFields = ['id', 'name', 'rss_url', 'bbs_no']
    
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }

    const stmt = db.prepare(`
      INSERT INTO departments (id, name, description, icon, color, rss_url, bbs_no, priority, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    await stmt.bind(
      data.id,
      data.name,
      data.description || '',
      data.icon || '📋',
      data.color || '#6B7280',
      data.rss_url,
      data.bbs_no,
      data.priority || 999,
      data.is_active !== undefined ? data.is_active : 1
    ).run()

    return this.getById(db, data.id)
  }

  /**
   * Get department statistics
   */
  static async getStats(db, departmentId = null) {
    let stmt
    
    if (departmentId) {
      stmt = db.prepare(`
        SELECT 
          d.id,
          d.name,
          COUNT(rc.id) as item_count,
          MAX(rc.pub_date) as last_item_date,
          MAX(rc.created_at) as last_cached_at
        FROM departments d
        LEFT JOIN rss_cache rc ON d.id = rc.department_id
        WHERE d.id = ? AND d.is_active = 1
        GROUP BY d.id, d.name
      `)
      
      const result = await stmt.bind(departmentId).first()
      return result
    } else {
      stmt = db.prepare(`
        SELECT 
          d.id,
          d.name,
          COUNT(rc.id) as item_count,
          MAX(rc.pub_date) as last_item_date,
          MAX(rc.created_at) as last_cached_at
        FROM departments d
        LEFT JOIN rss_cache rc ON d.id = rc.department_id
        WHERE d.is_active = 1
        GROUP BY d.id, d.name
        ORDER BY d.priority ASC
      `)
      
      const result = await stmt.all()
      return result.results || []
    }
  }
}