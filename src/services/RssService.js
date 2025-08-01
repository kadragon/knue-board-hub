/**
 * RSS Service - Handles RSS feed fetching, parsing, and caching
 */

import { XMLParser } from "fast-xml-parser";
import { DepartmentService } from "./DepartmentService.js";

export class RssService {
  /**
   * Get RSS items with filtering and pagination
   */
  static async getItems(db, options = {}) {
    const {
      departments = null,
      limit = 20,
      offset = 0,
      search = null,
      dateFilter = "all",
      sortBy = "date-desc",
    } = options;

    let whereClause = "1=1";
    let params = [];

    // Department filter
    if (departments && departments.length > 0) {
      const placeholders = departments.map(() => "?").join(",");
      whereClause += ` AND rc.department_id IN (${placeholders})`;
      params.push(...departments);
    }

    // Search filter
    if (search) {
      whereClause += ` AND (rc.title LIKE ? OR rc.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      let dateThreshold;

      switch (dateFilter) {
        case "today":
          dateThreshold = new Date(now.setHours(0, 0, 0, 0)).toISOString();
          break;
        case "week":
          dateThreshold = new Date(
            now.setDate(now.getDate() - 7)
          ).toISOString();
          break;
        case "month":
          dateThreshold = new Date(
            now.setDate(now.getDate() - 30)
          ).toISOString();
          break;
      }

      if (dateThreshold) {
        whereClause += ` AND rc.pub_date >= ?`;
        params.push(dateThreshold);
      }
    }

    // Sorting
    let orderClause = "rc.pub_date DESC";
    switch (sortBy) {
      case "date-asc":
        orderClause = "rc.pub_date ASC";
        break;
      case "department":
        orderClause = "d.name ASC, rc.pub_date DESC";
        break;
      default:
        orderClause = "rc.pub_date DESC";
    }

    // Get total count
    const countStmt = db.prepare(`
      SELECT COUNT(*) as total
      FROM rss_cache rc
      JOIN departments d ON rc.department_id = d.id
      WHERE ${whereClause}
    `);

    const countResult = await countStmt.bind(...params).first();
    const total = countResult.total;

    // Get items with pagination
    const itemsStmt = db.prepare(`
      SELECT 
        rc.id,
        rc.title,
        rc.link,
        rc.description,
        rc.pub_date,
        rc.created_at,
        d.id as department_id,
        d.name as department_name,
        d.icon as department_icon,
        d.color as department_color
      FROM rss_cache rc
      JOIN departments d ON rc.department_id = d.id
      WHERE ${whereClause}
      ORDER BY ${orderClause}
      LIMIT ? OFFSET ?
    `);

    const itemsResult = await itemsStmt.bind(...params, limit, offset).all();
    const items = itemsResult.results || [];

    return {
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        link: item.link,
        description: item.description,
        pubDate: item.pub_date,
        createdAt: item.created_at,
        department: {
          id: item.department_id,
          name: item.department_name,
          icon: item.department_icon,
          color: item.department_color,
        },
      })),
      total,
    };
  }

  /**
   * Refresh RSS feeds for specified departments
   */
  static async refreshFeeds(db, departmentIds = null) {
    let departments;

    if (departmentIds) {
      departments = await DepartmentService.getByIds(db, departmentIds);
    } else {
      departments = await DepartmentService.getAll(db);
    }

    const results = [];

    for (const department of departments) {
      try {
        const result = await this.fetchAndCacheRss(db, department);
        results.push({
          departmentId: department.id,
          success: true,
          newItems: result.newItems,
          totalItems: result.totalItems,
        });
      } catch (error) {
        console.error(`Failed to refresh RSS for ${department.id}:`, error);
        results.push({
          departmentId: department.id,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Fetch and cache RSS feed for a single department
   */
  static async fetchAndCacheRss(db, department) {
    // Fetch RSS feed
    const response = await fetch(department.rss_url, {
      headers: {
        "User-Agent": "KNUE-Board-Hub/1.0 (+https://knue.ac.kr)",
      },
      cf: {
        cacheTtl: 1800, // 30 minutes
        cacheEverything: true,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch RSS: ${response.status} ${response.statusText}`
      );
    }

    const xmlText = await response.text();
    const items = this.parseRssXml(xmlText);

    let newItems = 0;
    let totalItems = 0;

    // Cache items in database
    for (const item of items) {
      const hash = await this.generateHash(item.link + item.title);

      // Check if item already exists
      const existingStmt = db.prepare(
        "SELECT id FROM rss_cache WHERE hash = ?"
      );
      const existing = await existingStmt.bind(hash).first();

      if (!existing) {
        // Insert new item
        const insertStmt = db.prepare(`
          INSERT INTO rss_cache (department_id, title, link, description, pub_date, content, hash)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        await insertStmt
          .bind(
            department.id,
            item.title,
            item.link,
            item.description || "",
            item.pubDate,
            item.content || "",
            hash
          )
          .run();

        newItems++;
      }
      totalItems++;
    }

    // Clean up old items (keep only last 100 per department)
    const cleanupStmt = db.prepare(`
      DELETE FROM rss_cache 
      WHERE department_id = ? 
      AND id NOT IN (
        SELECT id FROM rss_cache 
        WHERE department_id = ? 
        ORDER BY pub_date DESC 
        LIMIT 100
      )
    `);

    await cleanupStmt.bind(department.id, department.id).run();

    return { newItems, totalItems };
  }

  /**
   * Parse RSS XML content using fast-xml-parser
   */
  static parseRssXml(xmlText) {
    const items = [];

    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        textNodeName: "#text",
        cdataPropName: "#cdata",
        trimValues: true,
        parseAttributeValue: false,
        parseTrueNumberOnly: false,
      });

      const parsedXml = parser.parse(xmlText);

      // Handle both RSS 2.0 and Atom formats
      let rssItems = [];

      if (
        parsedXml.rss &&
        parsedXml.rss.channel &&
        parsedXml.rss.channel.item
      ) {
        // RSS 2.0 format
        rssItems = Array.isArray(parsedXml.rss.channel.item)
          ? parsedXml.rss.channel.item
          : [parsedXml.rss.channel.item];
      } else if (parsedXml.feed && parsedXml.feed.entry) {
        // Atom format
        rssItems = Array.isArray(parsedXml.feed.entry)
          ? parsedXml.feed.entry
          : [parsedXml.feed.entry];
      }

      for (const item of rssItems) {
        // Extract title (handle CDATA and regular text)
        let title = "";
        if (item.title) {
          title =
            item.title["#cdata"] || item.title["#text"] || item.title || "";
        }

        // Extract link (handle different formats)
        let link = "";
        if (item.link) {
          if (typeof item.link === "string") {
            link = item.link;
          } else if (item.link["#cdata"] || item.link["#text"]) {
            link = item.link["#cdata"] || item.link["#text"];
          } else if (item.link["@_href"]) {
            // Atom format
            link = item.link["@_href"];
          }
        }

        // Extract description (handle CDATA and regular text)
        let description = "";
        if (item.description) {
          description =
            item.description["#cdata"] ||
            item.description["#text"] ||
            item.description ||
            "";
        } else if (item.summary) {
          // Atom format
          description =
            item.summary["#cdata"] ||
            item.summary["#text"] ||
            item.summary ||
            "";
        }

        // Extract publication date
        let pubDate = null;
        if (item.pubDate) {
          // Handle CDATA or nested text content for pubDate
          let pubDateString = '';
          if (typeof item.pubDate === 'string') {
            pubDateString = item.pubDate;
          } else if (item.pubDate['#cdata']) {
            pubDateString = item.pubDate['#cdata'];
          } else if (item.pubDate['#text']) {
            pubDateString = item.pubDate['#text'];
          } else if (typeof item.pubDate === 'object' && item.pubDate.toString) {
            pubDateString = item.pubDate.toString();
          }
          
          pubDate = this.parseKnuePubDate(pubDateString);
          
        } else if (item.published || item.updated) {
          // Atom format
          try {
            pubDate = new Date(item.published || item.updated).toISOString();
          } catch (e) {
            console.warn('Failed to parse Atom date:', item.published || item.updated);
          }
        }
        
        // If we still don't have a valid date, skip this item or use a very old date
        if (!pubDate) {
          console.warn('No valid publication date found for item:', { title: title.trim(), link: link.trim() });
          // Use a very old date instead of current time to indicate missing data
          pubDate = new Date('2000-01-01').toISOString();
        }

        // Only add items with both title and link
        if (title.trim() && link.trim()) {
          items.push({
            title: title.trim(),
            link: link.trim(),
            description: description.trim(),
            pubDate,
          });
        }
      }
    } catch (error) {
      console.error("Failed to parse RSS XML:", error);
      // Return empty array if parsing fails completely
      return [];
    }

    return items;
  }

  /**
   * Parse KNUE RSS pubDate format (YYYY-MM-DD) to ISO string
   */
  static parseKnuePubDate(dateString) {
    if (!dateString || typeof dateString !== 'string') {
      return null;
    }

    // Handle CDATA or nested text content
    const cleanDateString = dateString.trim();
    
    // Check if it matches YYYY-MM-DD format
    const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = cleanDateString.match(dateRegex);
    
    if (match) {
      const [, year, month, day] = match;
      // Create date at midnight KST (UTC+9)
      const date = new Date(`${year}-${month}-${day}T00:00:00+09:00`);
      
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    
    // Fallback: try standard Date parsing
    try {
      const date = new Date(cleanDateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch (e) {
      console.warn('Failed to parse date:', cleanDateString);
    }
    
    return null;
  }

  /**
   * Generate SHA-256 hash for deduplication
   */
  static async generateHash(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Get RSS cache statistics
   */
  static async getCacheStats(db) {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total_items,
        COUNT(DISTINCT department_id) as departments_count,
        MAX(created_at) as last_cache_update,
        MIN(pub_date) as oldest_item,
        MAX(pub_date) as newest_item
      FROM rss_cache
    `);

    const result = await stmt.first();
    return result;
  }
}
