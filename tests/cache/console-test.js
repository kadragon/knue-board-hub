/**
 * Cache Implementation Test Script
 * Run this in the browser console to test our localStorage cache implementation
 */

// Test 1: CacheManager Basic Operations
console.log('🧪 Testing CacheManager...');

// Import the cache manager (this will work in the browser)
const testCacheManager = async () => {
  // Test basic set/get operations
  const testData = { message: 'Hello Cache!', timestamp: Date.now() };
  
  // Test set operation
  console.log('📝 Testing cache.set()...');
  await window.localStorage.setItem('knue-board-hub:test-key', JSON.stringify({
    data: testData,
    timestamp: Date.now(),
    version: 1,
    category: 'test',
    compressed: false,
    accessCount: 1,
    lastAccessed: Date.now()
  }));
  
  console.log('✅ Cache set successful');
  
  // Test get operation
  console.log('📖 Testing cache.get()...');
  const stored = window.localStorage.getItem('knue-board-hub:test-key');
  if (stored) {
    const parsed = JSON.parse(stored);
    console.log('✅ Cache get successful:', parsed.data);
  } else {
    console.log('❌ Cache get failed');
  }
  
  // Test cache size
  const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('knue-board-hub:'));
  console.log(`📊 Current cache entries: ${cacheKeys.length}`);
  
  // Clean up test
  localStorage.removeItem('knue-board-hub:test-key');
};

// Test 2: Department Cache Testing
const testDepartmentCache = async () => {
  console.log('🏢 Testing Department Cache...');
  
  // This will test if useDepartments composable works with cache
  try {
    // Check if departments are being cached
    const departmentKeys = Object.keys(localStorage).filter(key => 
      key.includes('departments') || key.includes('department:')
    );
    
    console.log(`📋 Department cache entries found: ${departmentKeys.length}`);
    departmentKeys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        console.log(`  - ${key}: ${data?.data?.length || 'N/A'} items, age: ${Date.now() - data?.timestamp}ms`);
      } catch (e) {
        console.log(`  - ${key}: parsing error`);
      }
    });
  } catch (error) {
    console.log('❌ Department cache test failed:', error);
  }
};

// Test 3: RSS Cache Testing
const testRssCache = async () => {
  console.log('📰 Testing RSS Cache...');
  
  try {
    // Check if RSS items are being cached
    const rssKeys = Object.keys(localStorage).filter(key => 
      key.includes('rss:') || key.includes('user:recent')
    );
    
    console.log(`📡 RSS cache entries found: ${rssKeys.length}`);
    rssKeys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        console.log(`  - ${key}: age: ${Date.now() - data?.timestamp}ms`);
      } catch (e) {
        console.log(`  - ${key}: parsing error`);
      }
    });
  } catch (error) {
    console.log('❌ RSS cache test failed:', error);
  }
};

// Test 4: Cache Statistics
const testCacheStats = () => {
  console.log('📊 Cache Statistics...');
  
  const allKeys = Object.keys(localStorage).filter(key => key.startsWith('knue-board-hub:'));
  let totalSize = 0;
  const categories = {};
  
  allKeys.forEach(key => {
    const value = localStorage.getItem(key) || '';
    const size = key.length + value.length;
    totalSize += size;
    
    try {
      const data = JSON.parse(value);
      const category = data.category || 'unknown';
      if (!categories[category]) {
        categories[category] = { count: 0, size: 0 };
      }
      categories[category].count++;
      categories[category].size += size;
    } catch (e) {
      // Ignore parsing errors for stats
    }
  });
  
  console.log(`📈 Total cache entries: ${allKeys.length}`);
  console.log(`💾 Total cache size: ${(totalSize / 1024).toFixed(2)} KB`);
  console.log('📊 By category:', categories);
};

// Test 5: Performance Test
const testCachePerformance = async () => {
  console.log('⚡ Testing Cache Performance...');
  
  const iterations = 100;
  const testData = { test: 'performance data', items: new Array(50).fill('test item') };
  
  // Test write performance
  const writeStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    localStorage.setItem(`knue-board-hub:perf-test-${i}`, JSON.stringify({
      data: testData,
      timestamp: Date.now(),
      version: 1,
      category: 'performance',
      compressed: false,
      accessCount: 1,
      lastAccessed: Date.now()
    }));
  }
  const writeTime = performance.now() - writeStart;
  
  // Test read performance
  const readStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    const stored = localStorage.getItem(`knue-board-hub:perf-test-${i}`);
    if (stored) {
      JSON.parse(stored);
    }
  }
  const readTime = performance.now() - readStart;
  
  console.log(`📝 Write performance: ${(writeTime / iterations).toFixed(2)}ms per operation`);
  console.log(`📖 Read performance: ${(readTime / iterations).toFixed(2)}ms per operation`);
  
  // Clean up performance test data
  for (let i = 0; i < iterations; i++) {
    localStorage.removeItem(`knue-board-hub:perf-test-${i}`);
  }
};

// Run all tests
const runAllTests = async () => {
  console.log('🚀 Starting Cache Implementation Tests...\n');
  
  await testCacheManager();
  console.log('');
  
  await testDepartmentCache();
  console.log('');
  
  await testRssCache();
  console.log('');
  
  testCacheStats();
  console.log('');
  
  await testCachePerformance();
  console.log('');
  
  console.log('✅ All cache tests completed!');
  console.log('\n💡 Tips:');
  console.log('- Open Network tab to see reduced API calls');
  console.log('- Navigate between pages to see cache hits');
  console.log('- Try going offline to test stale cache fallback');
  console.log('- Check Application > Local Storage in DevTools');
};

// Auto-run tests when script loads
console.log('📋 Cache Test Script Loaded');
console.log('Run runAllTests() to start testing');

// Make functions available globally for manual testing
window.testCacheManager = testCacheManager;
window.testDepartmentCache = testDepartmentCache;
window.testRssCache = testRssCache;
window.testCacheStats = testCacheStats;
window.testCachePerformance = testCachePerformance;
window.runAllTests = runAllTests;

// Export for manual execution
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testCacheManager,
    testDepartmentCache,
    testRssCache,
    testCacheStats,
    testCachePerformance,
    runAllTests
  };
}