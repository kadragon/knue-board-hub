# KNUE Board Hub Documentation

Welcome to the KNUE Board Hub documentation. This Progressive Web App aggregates RSS feeds from Korea National University of Education bulletin boards with advanced filtering capabilities.

## 📚 Documentation Structure

### Quick Start
- **[Project Overview](../CLAUDE.md)** - Architecture, setup, and development guide
- **[User Guide](./guides/keyword-filtering-guide.md)** - How to use keyword filtering features

### Technical Documentation
- **[Keyword Filtering System](./keyword-filtering.md)** - Complete system documentation
- **[API Reference](./api/useKeywordFilter.md)** - Detailed API documentation for developers

## 🚀 Features

### Core Functionality
- **RSS Feed Aggregation** - Multi-department feed consolidation
- **Department Management** - Customizable department selection
- **Mobile-First Design** - Optimized for mobile devices
- **Progressive Web App** - Offline capability and app-like experience

### Advanced Features
- **Keyword Filtering** - Block unwanted content automatically
- **Real-time Updates** - Live feed refresh and notifications
- **Responsive Design** - Adaptive layout for all screen sizes
- **Touch Optimization** - Mobile gesture support

## 🛠️ Development

### Prerequisites
- Node.js 16+
- npm or yarn
- Modern browser for testing

### Quick Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Key Components
- **Vue 3** with Composition API
- **UnoCSS** for styling
- **Vite** for build tooling
- **Pinia** for state management

## 📖 API Documentation

### Core Composables

#### useKeywordFilter
```javascript
import { useKeywordFilter } from '@/composables/useKeywordFilter.js'

const {
  blockedKeywords,
  addBlockedKeyword,
  filterItems
} = useKeywordFilter()
```

#### useRssFeed
```javascript
import { useRssFeed } from '@/composables/useRssFeed.js'

const {
  allItems,
  loading,
  fetchFeeds
} = useRssFeed()
```

#### useNotifications
```javascript
import { useNotifications } from '@/composables/useNotifications.js'

const {
  showSuccess,
  showError
} = useNotifications()
```

## 🎯 Usage Examples

### Basic Keyword Filtering
```javascript
// Add keywords to block
addBlockedKeyword('spam')
addBlockedKeyword('advertisement')

// Filter RSS items
const filteredItems = filterItems(allRssItems)

// Check filtering statistics
const stats = getFilterStats(allRssItems, filteredItems)
console.log(`Blocked ${stats.blockedCount} items`)
```

### Bulk Keyword Management
```javascript
// Import multiple keywords
const keywordList = "spam\nads\npromotion\nclickbait"
const addedCount = importKeywords(keywordList)

// Export current keywords
const currentKeywords = exportKeywords()
console.log('Current keywords:', currentKeywords)
```

## 🧪 Testing

### Running Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

### Test Structure
- **Unit Tests** - Individual component and composable testing
- **Integration Tests** - Feature workflow testing
- **E2E Tests** - Full user journey testing

## 📱 Mobile Features

### Progressive Web App
- **Installable** - Add to home screen capability
- **Offline Support** - Works without internet connection
- **Push Notifications** - RSS update notifications
- **Background Sync** - Automatic feed updates

### Touch Optimization
- **Gesture Support** - Swipe, tap, and pinch gestures
- **Safe Areas** - Proper iPhone notch and Android navigation handling
- **Touch Targets** - Minimum 44px touch targets for accessibility

## 🔧 Configuration

### Environment Variables
```bash
# Development
VITE_API_BASE_URL=http://localhost:8787
VITE_RSS_PROXY_URL=http://localhost:5173/api/rss

# Production
VITE_API_BASE_URL=https://your-worker.workers.dev
VITE_RSS_PROXY_URL=https://api.allorigins.win/get
```

### Build Configuration
- **Vite Config** - Modern build tooling with RSS-specific optimizations
- **UnoCSS** - Utility-first CSS with custom KNUE theme
- **PWA Plugin** - Service worker and manifest generation

## 🚨 Troubleshooting

### Common Issues

#### RSS Feeds Not Loading
1. Check network connectivity
2. Verify CORS proxy configuration
3. Confirm RSS endpoint accessibility
4. Review browser console for errors

#### Keyword Filtering Not Working
1. Verify localStorage permissions
2. Check keyword spelling and format
3. Test with simple keywords first
4. Clear browser cache if needed

#### Performance Issues
1. Reduce active department count
2. Limit keyword count (<50 recommended)
3. Clear browser data
4. Update to latest browser version

### Debug Tools
```javascript
// Enable debug logging
localStorage.setItem('debug-knue-board', 'true')

// View stored keywords
console.log(JSON.parse(localStorage.getItem('knue-board-hub:blocked-keywords')))

// Check RSS cache
console.log('RSS cache:', /* your cache inspection code */)
```

## 🤝 Contributing

### Development Workflow
1. Fork repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Code review and merge

### Code Standards
- **ESLint** - JavaScript/Vue linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking where applicable
- **Conventional Commits** - Commit message standards

### Documentation Standards
- **JSDoc** - Function and API documentation
- **README** - Feature and setup documentation
- **Inline Comments** - Complex logic explanation
- **Examples** - Usage examples for all features

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details.

## 📞 Support

- **Issues** - [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions** - [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email** - [support@knue-board-hub.dev](mailto:support@knue-board-hub.dev)

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainers**: KNUE Board Hub Team