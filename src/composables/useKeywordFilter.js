import { ref, computed, watch } from 'vue';

// Constants
const STORAGE_KEY = 'knue-board-hub:blocked-keywords';

// Global state
const blockedKeywords = ref(new Set());
const isInitialized = ref(false);

/**
 * Composable for managing keyword filtering functionality
 * Allows users to block posts containing specific keywords
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

  // Load blocked keywords from localStorage
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

  // Save blocked keywords to localStorage
  function saveBlockedKeywords() {
    try {
      const keywordArray = Array.from(blockedKeywords.value);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(keywordArray));
    } catch (error) {
      console.warn('Failed to save blocked keywords to localStorage:', error);
    }
  }

  // Add a keyword to the blocked list
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

  // Remove a keyword from the blocked list
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

  // Clear all blocked keywords
  function clearBlockedKeywords() {
    const wasCleared = blockedKeywords.value.size > 0;
    blockedKeywords.value.clear();
    saveBlockedKeywords();
    return wasCleared;
  }

  // Check if a text contains any blocked keywords
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

  // Get the blocked keywords that match the given text
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

  // Filter out items that contain blocked keywords
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

  // Get statistics about filtering
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

  // Import keywords from a string (comma or newline separated)
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

  // Export keywords as a string
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