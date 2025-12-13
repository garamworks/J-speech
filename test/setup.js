/**
 * Test setup file
 * Runs before all tests
 */

// Mock global objects if needed
global.fetch = global.fetch || (() => Promise.resolve({
  json: () => Promise.resolve({}),
  ok: true
}));

// Setup any global test utilities
console.log('Test environment initialized');
