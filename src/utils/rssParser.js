/**
 * RSS Parser for KNUE Bulletin Board Feeds
 * Handles parsing XML RSS feeds from Korea National University of Education
 */

/**
 * Parse RSS XML content into structured JavaScript objects
 * @param {string} xmlText - Raw XML content from RSS feed
 * @returns {Object} Parsed RSS data with feed info and items
 */
export function parseRSSFeed(xmlText) {
  try {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror')
    if (parserError) {
      throw new Error('Invalid XML format')
    }

    // Extract channel information
    const channel = xmlDoc.querySelector('channel')
    if (!channel) {
      throw new Error('Invalid RSS format: missing channel')
    }

    const feedInfo = {
      title: getTextContent(channel, 'title'),
      description: getTextContent(channel, 'description'),
      link: getTextContent(channel, 'link'),
      lastBuildDate: parseDate(getTextContent(channel, 'lastBuildDate')),
      language: getTextContent(channel, 'language') || 'ko'
    }

    // Extract items
    const items = Array.from(xmlDoc.querySelectorAll('item')).map(item => ({
      id: generateItemId(item),
      title: cleanTitle(getTextContent(item, 'title')),
      link: getTextContent(item, 'link'),
      description: cleanDescription(getTextContent(item, 'description')),
      pubDate: parseDate(getTextContent(item, 'pubDate')),
      category: getTextContent(item, 'category'),
      author: getTextContent(item, 'author'),
      guid: getTextContent(item, 'guid')
    })).filter(item => item.title && item.link) // Filter out invalid items

    return {
      feedInfo,
      items,
      itemCount: items.length,
      parsedAt: new Date()
    }
  } catch (error) {
    console.error('RSS parsing error:', error)
    throw new Error(`Failed to parse RSS feed: ${error.message}`)
  }
}

/**
 * Safely extract text content from XML element
 * @param {Element} parent - Parent XML element
 * @param {string} tagName - Tag name to search for
 * @returns {string} Text content or empty string
 */
function getTextContent(parent, tagName) {
  const element = parent.querySelector(tagName)
  return element?.textContent?.trim() || ''
}

/**
 * Parse date string to Date object
 * @param {string} dateString - Date string from RSS
 * @returns {Date|null} Parsed date or null if invalid
 */
function parseDate(dateString) {
  if (!dateString) return null
  
  try {
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

/**
 * Clean and format post title
 * @param {string} title - Raw title from RSS
 * @returns {string} Cleaned title
 */
function cleanTitle(title) {
  if (!title) return ''
  
  return title
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/^\[.*?\]\s*/, '') // Remove category prefixes like [공지]
    .trim()
}

/**
 * Clean and format post description
 * @param {string} description - Raw description from RSS
 * @returns {string} Cleaned description
 */
function cleanDescription(description) {
  if (!description) return ''
  
  return description
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[^;]+;/g, ' ') // Remove HTML entities
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 200) // Limit length for mobile display
}

/**
 * Generate unique ID for RSS item
 * @param {Element} item - RSS item element
 * @returns {string} Unique identifier
 */
function generateItemId(item) {
  const guid = getTextContent(item, 'guid')
  const link = getTextContent(item, 'link')
  const title = getTextContent(item, 'title')
  
  if (guid) return guid
  if (link) return link
  
  // Fallback: generate hash from title and pubDate
  const pubDate = getTextContent(item, 'pubDate')
  const content = `${title}-${pubDate}`
  return btoa(content).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)
}

/**
 * Validate RSS feed structure
 * @param {Object} feedData - Parsed feed data
 * @returns {boolean} True if valid
 */
export function validateRSSFeed(feedData) {
  if (!feedData || typeof feedData !== 'object') return false
  if (!feedData.feedInfo || !feedData.items) return false
  if (!Array.isArray(feedData.items)) return false
  
  return feedData.items.every(item => 
    item.title && item.link && item.id
  )
}

/**
 * Sort RSS items by publication date (newest first)
 * @param {Array} items - RSS items array
 * @returns {Array} Sorted items
 */
export function sortItemsByDate(items) {
  return [...items].sort((a, b) => {
    if (!a.pubDate && !b.pubDate) return 0
    if (!a.pubDate) return 1
    if (!b.pubDate) return -1
    return new Date(b.pubDate) - new Date(a.pubDate)
  })
}

/**
 * Filter items by date range
 * @param {Array} items - RSS items array
 * @param {number} daysBack - Number of days to look back
 * @returns {Array} Filtered items
 */
export function filterItemsByDate(items, daysBack = 30) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysBack)
  
  return items.filter(item => 
    item.pubDate && new Date(item.pubDate) >= cutoffDate
  )
}