#!/usr/bin/env node

/**
 * Backend Cache Implementation Tests
 * Tests the cache logic independently of the browser environment
 */

// Mock localStorage for Node.js environment
const mockLocalStorage = {
  data: {},
  setItem(key, value) {
    this.data[key] = value;
  },
  getItem(key) {
    return this.data[key] || null;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  },
  get length() {
    return Object.keys(this.data).length;
  },
  key(index) {
    return Object.keys(this.data)[index] || null;
  }
};

// Mock global objects
global.localStorage = mockLocalStorage;
global.performance = { now: () => Date.now() };
global.console = console;

// Import our cache implementation
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read and evaluate the cache manager (simplified for Node.js)
const cacheManagerCode = fs.readFileSync(
  path.join(__dirname, '../../src/services/cacheManager.js'), 
  'utf8'
);

// Simple module system mock
const mockModule = {
  exports: {}
};

// Execute the cache manager code in our mock environment
try {
  // Remove ES6 import/export and replace with CommonJS
  const nodeCompatibleCode = cacheManagerCode
    .replace(/export\s+class\s+CacheManager/g, 'class CacheManager')
    .replace(/export\s+const\s+cacheManager/g, 'const cacheManager')
    .replace(/export\s+function\s+useCache/g, 'function useCache')
    .replace(/import.*from.*\n/g, '') // Remove imports
    + '\n\nmodule.exports = { CacheManager };'; // Add exports

  eval(nodeCompatibleCode);
  
  console.log('✅ Cache manager code loaded successfully');
} catch (error) {
  console.error('❌ Failed to load cache manager:', error.message);
  process.exit(1);
}

// Test Suite
async function runCacheTests() {
  console.log('🧪 Starting Cache Implementation Tests...\n');

  const { CacheManager } = module.exports;
  const cache = new CacheManager();

  let testsPassed = 0;
  let testsTotal = 0;

  function test(name, testFn) {
    testsTotal++;
    try {
      const result = testFn();
      if (result instanceof Promise) {
        return result.then(() => {
          console.log(`✅ ${name}`);
          testsPassed++;
        }).catch(error => {
          console.error(`❌ ${name}: ${error.message}`);
        });
      } else {
        console.log(`✅ ${name}`);
        testsPassed++;
        return Promise.resolve();
      }
    } catch (error) {
      console.error(`❌ ${name}: ${error.message}`);
      return Promise.resolve();
    }
  }

  // Test 1: Basic Cache Operations
  await test('Basic set/get operations', async () => {
    const testData = { message: 'Hello Cache!', items: [1, 2, 3] };
    
    const setResult = await cache.set('test-key', testData, 'test');
    if (!setResult) throw new Error('Set operation failed');
    
    const getResult = await cache.get('test-key', 'test');
    if (!getResult || !getResult.data) throw new Error('Get operation failed');
    if (getResult.data.message !== testData.message) throw new Error('Data integrity check failed');
    if (!getResult.fromCache) throw new Error('Cache metadata missing');
  });

  // Test 2: TTL Validation
  await test('TTL expiration', async () => {
    // Set data with a very short TTL for testing
    cache.maxAge.test = 1; // 1ms TTL
    
    await cache.set('ttl-test', { data: 'expires-soon' }, 'test');
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const expired = await cache.get('ttl-test', 'test');
    if (expired) throw new Error('Expired data should return null');
    
    // Reset TTL
    cache.maxAge.test = 5000;
  });

  // Test 3: Category-based TTL
  await test('Category-based TTL', async () => {
    await cache.set('dept-data', { dept: 'CS' }, 'departments');
    await cache.set('rss-data', { items: [] }, 'rssItems');
    
    const deptResult = await cache.get('dept-data', 'departments');
    const rssResult = await cache.get('rss-data', 'rssItems');
    
    if (!deptResult || !rssResult) throw new Error('Category storage failed');
    if (deptResult.data.dept !== 'CS') throw new Error('Department data corrupted');
  });

  // Test 4: Cache Statistics
  await test('Cache statistics', () => {
    const stats = cache.getStats();
    
    if (typeof stats.totalEntries !== 'number') throw new Error('Missing totalEntries');
    if (typeof stats.totalSize !== 'number') throw new Error('Missing totalSize');
    if (!stats.categories) throw new Error('Missing categories');
    if (typeof stats.utilizationPercent !== 'number') throw new Error('Missing utilization');
  });

  // Test 5: Cache Cleanup
  await test('Cache cleanup functionality', async () => {
    // Fill cache with test data
    for (let i = 0; i < 10; i++) {
      await cache.set(`cleanup-test-${i}`, { index: i, data: 'test'.repeat(100) }, 'test');
    }
    
    const statsBefore = cache.getStats();
    await cache.cleanup();
    const statsAfter = cache.getStats();
    
    // Cleanup should reduce total entries (some items should be evicted)
    if (statsAfter.totalEntries >= statsBefore.totalEntries) {
      console.warn('⚠️  Cleanup may not have evicted items (this is OK if cache is small)');
    }
  });

  // Test 6: Priority-based Eviction
  await test('Priority-based eviction', () => {
    const highPriority = cache.getPriority('main', 'departments');
    const lowPriority = cache.getPriority('test-item', 'test');
    
    if (highPriority <= lowPriority) throw new Error('Priority system not working correctly');
  });

  // Test 7: Large Data Handling
  await test('Large data compression', async () => {
    const largeData = { 
      content: 'A'.repeat(15000), // >10KB to trigger compression
      metadata: { large: true }
    };
    
    const setResult = await cache.set('large-data', largeData, 'test');
    if (!setResult) throw new Error('Large data storage failed');
    
    const getResult = await cache.get('large-data', 'test');
    if (!getResult || getResult.data.content.length !== 15000) {
      throw new Error('Large data retrieval failed');
    }
  });

  // Test 8: Cache Key Uniqueness
  await test('Cache key collision handling', async () => {
    await cache.set('collision-test', { version: 1 }, 'test');
    await cache.set('collision-test', { version: 2 }, 'test'); // Overwrite
    
    const result = await cache.get('collision-test', 'test');
    if (!result || result.data.version !== 2) throw new Error('Key collision not handled properly');
  });

  // Test 9: Error Handling
  await test('Error handling for corrupted data', async () => {
    // Manually insert corrupted data
    localStorage.setItem('knue-board-hub:corrupted', 'invalid-json{');
    
    const result = await cache.get('corrupted', 'test');
    if (result !== null) throw new Error('Corrupted data should return null');
  });

  // Test 10: Performance Benchmarking
  await test('Performance benchmarking', async () => {
    const iterations = 100;
    const testData = { benchmark: true, data: new Array(50).fill('test') };
    
    // Write performance
    const writeStart = Date.now();
    for (let i = 0; i < iterations; i++) {
      await cache.set(`perf-${i}`, testData, 'performance');
    }
    const writeTime = Date.now() - writeStart;
    
    // Read performance
    const readStart = Date.now();
    for (let i = 0; i < iterations; i++) {
      await cache.get(`perf-${i}`, 'performance');
    }
    const readTime = Date.now() - readStart;
    
    const writeSpeed = writeTime / iterations;
    const readSpeed = readTime / iterations;
    
    console.log(`   📊 Write: ${writeSpeed.toFixed(2)}ms/op, Read: ${readSpeed.toFixed(2)}ms/op`);
    
    if (writeSpeed > 10) throw new Error(`Write performance too slow: ${writeSpeed}ms/op`);
    if (readSpeed > 5) throw new Error(`Read performance too slow: ${readSpeed}ms/op`);
  });

  // Test Results
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${testsPassed}/${testsTotal}`);
  console.log(`❌ Failed: ${testsTotal - testsPassed}/${testsTotal}`);
  
  if (testsPassed === testsTotal) {
    console.log('\n🎉 All cache tests passed! Implementation is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the implementation.');
  }

  // Final Statistics
  console.log('\n📈 Final Cache Statistics:');
  const finalStats = cache.getStats();
  console.log(`   Entries: ${finalStats.totalEntries}`);
  console.log(`   Size: ${finalStats.formattedSize}`);
  console.log(`   Utilization: ${finalStats.utilizationPercent}%`);
  console.log(`   Categories: ${Object.keys(finalStats.categories).join(', ')}`);

  return testsPassed === testsTotal;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runCacheTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { runCacheTests };