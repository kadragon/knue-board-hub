import { ref, computed, watch } from 'vue';

// Constants
const STORAGE_KEY = 'knue-board-hub:blocked-keywords';

// Global state
const blockedKeywords = ref(new Set());
const isInitialized = ref(false);

/**
 * Vue 3 composable for keyword-based content filtering
 * 
 * Provides reactive keyword management with localStorage persistence.
 * Filters RSS feed items based on user-defined blocked keywords.
 * 
 * @example
 * ```javascript
 * const {
 *   blockedKeywords,
 *   addBlockedKeyword,
 *   filterItems
 * } = useKeywordFilter()
 * 
 * // Add a keyword
 * addBlockedKeyword('spam')
 * 
 * // Filter RSS items
 * const filtered = filterItems(rssItems)
 * ```
 * 
 * @returns {Object} Keyword filter API object
 * @see {@link https://docs.knue-board-hub.dev/api/useKeywordFilter} Full API documentation
 */
export function useKeywordFilter() {
  // Initialize from localStorage if not already done
  if (!isInitialized.value) {
    loadBlockedKeywords();
    isInitialized.value = true;
  }

  // Computed properties
  const blockedKeywordsList = computed(() => Array.from(blockedKeywords.value));
  const hasBlockedKeywords = computed(() => blockedKeywords.value.size > 0);

  /**
   * Load blocked keywords from localStorage
   * @private
   */
  function loadBlockedKeywords() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const keywordArray = JSON.parse(stored);
        blockedKeywords.value = new Set(keywordArray);
      }
    } catch (error) {
      console.warn('Failed to load blocked keywords from localStorage:', error);
      blockedKeywords.value = new Set();
    }
  }

  /**
   * Save blocked keywords to localStorage
   * @private
   */
  function saveBlockedKeywords() {
    try {
      const keywordArray = Array.from(blockedKeywords.value);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(keywordArray));
    } catch (error) {
      console.warn('Failed to save blocked keywords to localStorage:', error);
    }
  }

  /**
   * Add a keyword to the blocked list
   * @param {string} keyword - The keyword to block (case-insensitive)
   * @returns {boolean} True if keyword was added, false if already exists
   */
  function addBlockedKeyword(keyword) {
    if (!keyword || typeof keyword !== 'string') return false;
    
    const trimmedKeyword = keyword.trim().toLowerCase();
    if (trimmedKeyword.length === 0) return false;
    
    const wasAdded = !blockedKeywords.value.has(trimmedKeyword);
    if (wasAdded) {
      blockedKeywords.value.add(trimmedKeyword);
      saveBlockedKeywords();
    }
    
    return wasAdded;
  }

  /**
   * Remove a keyword from the blocked list
   * @param {string} keyword - The keyword to remove (case-insensitive)
   * @returns {boolean} True if keyword was removed, false if not found
   */
  function removeBlockedKeyword(keyword) {
    if (!keyword || typeof keyword !== 'string') return false;
    
    const trimmedKeyword = keyword.trim().toLowerCase();
    const wasRemoved = blockedKeywords.value.has(trimmedKeyword);
    
    if (wasRemoved) {
      blockedKeywords.value.delete(trimmedKeyword);
      saveBlockedKeywords();
    }
    
    return wasRemoved;
  }

  /**
   * Clear all blocked keywords
   * @returns {boolean} True if keywords were cleared, false if list was empty
   */
  function clearBlockedKeywords() {
    const wasCleared = blockedKeywords.value.size > 0;
    blockedKeywords.value.clear();
    saveBlockedKeywords();
    return wasCleared;
  }

  /**
   * Check if a text contains any blocked keywords
   * @param {string} text - Text to check for blocked keywords
   * @returns {boolean} True if text contains blocked keywords
   */
  function containsBlockedKeyword(text) {
    if (!text || typeof text !== 'string' || blockedKeywords.value.size === 0) {
      return false;
    }
    
    const lowerText = text.toLowerCase();
    
    for (const keyword of blockedKeywords.value) {
      if (lowerText.includes(keyword)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get the blocked keywords that match the given text
   * @param {string} text - Text to analyze
   * @returns {string[]} Array of matching blocked keywords
   */
  function getMatchingKeywords(text) {
    if (!text || typeof text !== 'string' || blockedKeywords.value.size === 0) {
      return [];
    }
    
    const lowerText = text.toLowerCase();
    const matches = [];
    
    for (const keyword of blockedKeywords.value) {
      if (lowerText.includes(keyword)) {
        matches.push(keyword);
      }
    }
    
    return matches;
  }

  /**
   * Filter out RSS items that contain blocked keywords
   * @param {Array} items - Array of RSS item objects
   * @returns {Array} Filtered array with blocked items removed
   */
  function filterItems(items) {
    if (!Array.isArray(items) || blockedKeywords.value.size === 0) {
      return items;
    }
    
    return items.filter(item => {
      // Check title
      if (containsBlockedKeyword(item.title)) return false;
      
      // Check description/content if available
      if (item.description && containsBlockedKeyword(item.description)) return false;
      if (item.content && containsBlockedKeyword(item.content)) return false;
      
      return true;
    });
  }

  /**
   * Get statistics about filtering performance
   * @param {Array} originalItems - Original items before filtering
   * @param {Array} filteredItems - Items after filtering
   * @returns {Object} Statistics object with counts and percentages
   */
  function getFilterStats(originalItems, filteredItems) {
    const originalCount = originalItems?.length || 0;
    const filteredCount = filteredItems?.length || 0;
    const blockedCount = originalCount - filteredCount;
    
    return {
      originalCount,
      filteredCount,
      blockedCount,
      blockPercentage: originalCount > 0 ? Math.round((blockedCount / originalCount) * 100) : 0
    };
  }

  /**
   * Import keywords from a formatted string
   * @param {string} keywordString - Keywords separated by commas or newlines
   * @returns {number} Count of newly added keywords
   */
  function importKeywords(keywordString) {
    if (!keywordString || typeof keywordString !== 'string') return 0;
    
    const keywords = keywordString
      .split(/[,\n]/)
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 0);
    
    let addedCount = 0;
    keywords.forEach(keyword => {
      if (addBlockedKeyword(keyword)) {
        addedCount++;
      }
    });
    
    return addedCount;
  }

  /**
   * Export all blocked keywords as a newline-separated string
   * @returns {string} Newline-separated list of keywords
   */
  function exportKeywords() {
    return Array.from(blockedKeywords.value).join('\n');
  }

  // Watch for changes and save automatically
  watch(blockedKeywords, saveBlockedKeywords, { deep: true });

  return {
    // State
    blockedKeywords: blockedKeywordsList,
    hasBlockedKeywords,
    
    // Actions
    addBlockedKeyword,
    removeBlockedKeyword,
    clearBlockedKeywords,
    
    // Filtering
    containsBlockedKeyword,
    getMatchingKeywords,
    filterItems,
    getFilterStats,
    
    // Import/Export
    importKeywords,
    exportKeywords,
    
    // Utilities
    loadBlockedKeywords,
    saveBlockedKeywords
  };
}