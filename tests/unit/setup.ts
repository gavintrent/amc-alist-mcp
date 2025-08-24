// Test setup file for AMC MCP Server tests
process.env.NODE_ENV = 'test';
// Use actual API key from .env file for integration tests
// process.env.AMC_API_KEY is loaded from .env file

// Mock console methods to reduce noise during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Only mock console for unit tests, allow real console for integration tests
  if (process.env.NODE_ENV === 'test' && process.env.JEST_WORKER_ID) {
    // Check if this is a unit test (in unit directory) or integration test
    const testPath = expect.getState().testPath || '';
    if (testPath.includes('/tests/unit/')) {
      console.log = jest.fn();
      console.error = jest.fn();
      console.warn = jest.fn();
    }
  }
});

afterAll(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
}); 