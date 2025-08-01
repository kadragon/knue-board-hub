# Cache Tests

This directory contains test files for the KNUE Board Hub cache implementation.

## Test Files

### `backend-test.js`

Node.js-based backend test that validates the cache implementation logic without browser dependencies.

**Usage:**

```bash
node tests/cache/backend-test.js
```

**Features:**

- Tests basic cache operations (set/get/delete)
- TTL expiration validation
- Category-based TTL testing
- Cache statistics
- Cache cleanup functionality
- Priority-based eviction
- Large data compression
- Performance benchmarking
- Error handling for corrupted data

**Requirements:**

- Node.js with ES modules support
- Access to `src/services/cacheManager.js`

### `browser-test.html`

Interactive browser-based test page with a visual interface for testing cache functionality.

**Usage:**

1. Start the development server (`npm run dev`)
2. Open `tests/cache/browser-test.html` in a browser
3. Click "🚀 Run All Tests" to execute the test suite

**Features:**

- Real browser localStorage testing
- Visual test progress and results
- Cache statistics display
- Performance testing
- App integration testing
- Offline simulation
- Interactive controls for cache management

### `console-test.js`

Browser console script for manual testing of cache operations during development.

**Usage:**

1. Start the development server (`npm run dev`)
2. Open the browser developer console
3. Copy and paste the contents of `console-test.js`
4. Run `runAllTests()` in the console

**Features:**

- Manual cache operation testing
- Department cache validation
- RSS cache validation
- Performance benchmarking
- Real-time cache statistics

## Test Categories

### Basic Operations

- Set/get/delete operations
- Data integrity validation
- Cache key management

### TTL & Expiration

- Time-to-live validation
- Category-based TTL testing
- Expired data handling

### Performance

- Write/read operation speed
- Large data handling
- Memory usage optimization

### Error Handling

- Corrupted data recovery
- Storage quota handling
- Network failure simulation

### Integration

- App workflow testing
- Offline behavior validation
- Cross-component cache usage

## Running Tests

### Complete Test Suite

```bash
# Backend tests
node tests/cache/backend-test.js

# Browser tests (requires dev server)
npm run dev
# Then open browser-test.html in browser
```

### Individual Test Components

```bash
# Performance testing only
node -e "require('./tests/cache/backend-test.js').runCacheTests()"

# Browser console testing
# Copy console-test.js contents to browser console
```

## Test Data

Tests use the `knue-board-hub:` prefix for localStorage keys to match the production cache implementation. Test data is automatically cleaned up after test completion.

## Expected Results

- **Backend Tests**: Should pass all 10 test cases with performance metrics
- **Browser Tests**: Should show 100% pass rate with cache statistics
- **Console Tests**: Should display cache entries and performance data

## Troubleshooting

### Backend Test Issues

- Ensure Node.js supports ES modules
- Verify `src/services/cacheManager.js` exists
- Check file permissions

### Browser Test Issues

- Start development server first (`npm run dev`)
- Check browser console for errors
- Ensure localStorage is enabled

### Performance Issues

- Clear browser cache before testing
- Close other tabs to reduce memory pressure
- Test on different browsers for comparison
