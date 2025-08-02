# useKeywordFilter API Documentation

## Overview

The `useKeywordFilter` composable provides a comprehensive keyword-based content filtering system for RSS feeds. It manages blocked keywords with localStorage persistence and provides reactive filtering capabilities.

## Import

```javascript
import { useKeywordFilter } from '@/composables/useKeywordFilter.js'
```

## Basic Usage

```javascript
const {
  blockedKeywords,
  hasBlockedKeywords,
  addBlockedKeyword,
  removeBlockedKeyword,
  filterItems
} = useKeywordFilter()
```

## API Reference

### State Properties

#### `blockedKeywords`
- **Type**: `ComputedRef<string[]>`
- **Description**: Reactive array of currently blocked keywords
- **Example**: `['spam', 'promotion', 'advertisement']`

#### `hasBlockedKeywords`
- **Type**: `ComputedRef<boolean>`
- **Description**: Whether any keywords are currently blocked
- **Example**: `true` if any keywords exist, `false` otherwise

### Core Methods

#### `addBlockedKeyword(keyword)`
Adds a keyword to the blocked list with automatic deduplication and normalization.

**Parameters:**
- `keyword` (string): The keyword to block (case-insensitive)

**Returns:**
- `boolean`: `true` if keyword was added, `false` if already exists

**Example:**
```javascript
const success = addBlockedKeyword('spam')
if (success) {
  console.log('Keyword added successfully')
} else {
  console.log('Keyword already exists')
}
```

#### `removeBlockedKeyword(keyword)`
Removes a keyword from the blocked list.

**Parameters:**
- `keyword` (string): The keyword to remove (case-insensitive)

**Returns:**
- `boolean`: `true` if keyword was removed, `false` if not found

**Example:**
```javascript
const removed = removeBlockedKeyword('spam')
if (removed) {
  console.log('Keyword removed successfully')
}
```

#### `clearBlockedKeywords()`
Removes all blocked keywords.

**Returns:**
- `boolean`: `true` if keywords were cleared, `false` if list was already empty

**Example:**
```javascript
const wasCleared = clearBlockedKeywords()
if (wasCleared) {
  console.log('All keywords cleared')
}
```

### Filtering Methods

#### `filterItems(items)`
Filters an array of RSS items, removing those that contain blocked keywords.

**Parameters:**
- `items` (Array): Array of RSS item objects

**Returns:**
- `Array`: Filtered array with blocked items removed

**Filtering Logic:**
- Checks `item.title` (required)
- Checks `item.description` (if present)  
- Checks `item.content` (if present)
- Case-insensitive substring matching

**Example:**
```javascript
const rssItems = [
  { title: 'Normal Post', description: 'Regular content' },
  { title: 'Spam Alert', description: 'Promotional content' },
  { title: 'Another Post', description: 'More content' }
]

// Assuming 'spam' is blocked
const filtered = filterItems(rssItems)
// Returns: [{ title: 'Normal Post', ... }, { title: 'Another Post', ... }]
```

#### `containsBlockedKeyword(text)`
Checks if a text string contains any blocked keywords.

**Parameters:**
- `text` (string): Text to check

**Returns:**
- `boolean`: `true` if text contains blocked keywords, `false` otherwise

**Example:**
```javascript
const hasBlocked = containsBlockedKeyword('This is a spam message')
// Returns: true (if 'spam' is blocked)
```

#### `getMatchingKeywords(text)`
Returns array of blocked keywords found in the given text.

**Parameters:**
- `text` (string): Text to analyze

**Returns:**
- `string[]`: Array of matching blocked keywords

**Example:**
```javascript
const matches = getMatchingKeywords('spam and promotion content')
// Returns: ['spam', 'promotion'] (if both are blocked)
```

### Statistics Methods

#### `getFilterStats(originalItems, filteredItems)`
Calculates filtering statistics for analysis and display.

**Parameters:**
- `originalItems` (Array): Original item array before filtering
- `filteredItems` (Array): Filtered item array after filtering

**Returns:**
- `FilterStats`: Object with filtering statistics

**FilterStats Interface:**
```typescript
interface FilterStats {
  originalCount: number    // Total items before filtering
  filteredCount: number    // Items remaining after filtering  
  blockedCount: number     // Items blocked by keywords
  blockPercentage: number  // Percentage of items blocked (0-100)
}
```

**Example:**
```javascript
const original = getAllRssItems()
const filtered = filterItems(original)
const stats = getFilterStats(original, filtered)

console.log(`Blocked ${stats.blockedCount} items (${stats.blockPercentage}%)`)
```

### Import/Export Methods

#### `importKeywords(keywordString)`
Imports keywords from a formatted text string.

**Parameters:**
- `keywordString` (string): Keywords separated by commas or newlines

**Returns:**
- `number`: Count of newly added keywords (excludes duplicates)

**Supported Formats:**
- Comma-separated: `"spam, promotion, advertisement"`
- Newline-separated: `"spam\npromotion\nadvertisement"`
- Mixed: `"spam, promotion\nadvertisement"`

**Example:**
```javascript
const keywordText = `
spam
promotion
advertisement
clickbait, scam
`

const addedCount = importKeywords(keywordText)
console.log(`Imported ${addedCount} new keywords`)
```

#### `exportKeywords()`
Exports all blocked keywords as a newline-separated string.

**Returns:**
- `string`: Newline-separated list of blocked keywords

**Example:**
```javascript
const keywordText = exportKeywords()
console.log('Current keywords:')
console.log(keywordText)

// Copy to clipboard
navigator.clipboard.writeText(keywordText)
```

### Utility Methods

#### `loadBlockedKeywords()`
Manually loads keywords from localStorage. Usually called automatically.

**Use Case:**
- Refreshing from localStorage after external changes
- Recovery from initialization errors

**Example:**
```javascript
// Reload keywords from storage
loadBlockedKeywords()
```

#### `saveBlockedKeywords()`
Manually saves current keywords to localStorage. Usually called automatically.

**Use Case:**
- Force persistence during error conditions
- Debugging storage issues

**Example:**
```javascript
// Force save to localStorage
saveBlockedKeywords()
```

## Integration Patterns

### Vue Component Integration

```javascript
// Basic component setup
export default {
  setup() {
    const {
      blockedKeywords,
      addBlockedKeyword,
      removeBlockedKeyword,
      filterItems
    } = useKeywordFilter()
    
    const rssItems = ref([])
    
    // Computed filtered items
    const filteredItems = computed(() => {
      return filterItems(rssItems.value)
    })
    
    // Add keyword handler
    const handleAddKeyword = async (keyword) => {
      const success = addBlockedKeyword(keyword)
      if (success) {
        // Show success notification
      }
    }
    
    return {
      blockedKeywords,
      filteredItems,
      handleAddKeyword
    }
  }
}
```

### With Notification System

```javascript
const { showSuccess, showError } = useNotifications()
const { addBlockedKeyword, removeBlockedKeyword } = useKeywordFilter()

const handleAddKeyword = (keyword) => {
  try {
    const success = addBlockedKeyword(keyword)
    if (success) {
      showSuccess(`"${keyword}" keyword blocked`)
    } else {
      showError('Keyword already exists')
    }
  } catch (error) {
    showError('Failed to add keyword')
  }
}
```

### Performance Optimization

```javascript
// Apply keyword filtering early in pipeline
const processedItems = computed(() => {
  let items = [...rawItems.value]
  
  // 1. Apply keyword filter first (most selective)
  if (hasBlockedKeywords.value) {
    items = filterItems(items)
  }
  
  // 2. Apply other filters
  if (searchQuery.value) {
    items = items.filter(item => 
      item.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  
  // 3. Sort last (most expensive)
  return items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
})
```

## Error Handling

### localStorage Errors

```javascript
const { addBlockedKeyword } = useKeywordFilter()

try {
  const success = addBlockedKeyword('test')
  if (!success) {
    // Handle duplicate keyword
  }
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    // Handle storage quota exceeded
    console.error('localStorage quota exceeded')
  } else {
    // Handle other storage errors
    console.error('Storage error:', error)
  }
}
```

### Input Validation

```javascript
const validateAndAddKeyword = (input) => {
  // Basic validation
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid keyword input')
  }
  
  const trimmed = input.trim()
  if (trimmed.length === 0) {
    throw new Error('Keyword cannot be empty')
  }
  
  if (trimmed.length > 100) {
    throw new Error('Keyword too long (max 100 characters)')
  }
  
  return addBlockedKeyword(trimmed)
}
```

## TypeScript Support

```typescript
interface RSSItem {
  title: string
  description?: string
  content?: string
  pubDate: string | Date
  [key: string]: unknown
}

interface FilterStats {
  originalCount: number
  filteredCount: number
  blockedCount: number
  blockPercentage: number
}

interface KeywordFilterComposable {
  // State
  blockedKeywords: ComputedRef<string[]>
  hasBlockedKeywords: ComputedRef<boolean>
  
  // Core methods
  addBlockedKeyword: (keyword: string) => boolean
  removeBlockedKeyword: (keyword: string) => boolean
  clearBlockedKeywords: () => boolean
  
  // Filtering
  filterItems: (items: RSSItem[]) => RSSItem[]
  containsBlockedKeyword: (text: string) => boolean
  getMatchingKeywords: (text: string) => string[]
  getFilterStats: (original: RSSItem[], filtered: RSSItem[]) => FilterStats
  
  // Import/Export
  importKeywords: (text: string) => number
  exportKeywords: () => string
  
  // Utilities
  loadBlockedKeywords: () => void
  saveBlockedKeywords: () => void
}
```

## Browser Compatibility

- **localStorage**: IE8+, All modern browsers
- **Set**: IE11+, All modern browsers (polyfill available)
- **Vue 3 Reactivity**: Modern browsers only

## Performance Characteristics

- **Add/Remove**: O(1) average case
- **Filtering**: O(n×m) where n=items, m=keywords
- **Memory**: ~50 bytes per keyword + Set overhead
- **Storage**: ~1 byte per character in localStorage

---

**Version**: 1.0.0
**Last Updated**: December 2024