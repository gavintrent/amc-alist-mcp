// Integration Test Setup
// This file configures the environment for integration tests

import dotenv from 'dotenv';

// Load environment variables for integration tests
dotenv.config();

// Set longer timeouts for integration tests
jest.setTimeout(120000); // 2 minutes

// Configure console logging for integration tests
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  // Enhance logging for integration tests
  console.log = (...args) => {
    originalLog(`[INTEGRATION]`, ...args);
  };
  
  console.warn = (...args) => {
    originalWarn(`[INTEGRATION WARNING]`, ...args);
  };
  
  console.error = (...args) => {
    originalError(`[INTEGRATION ERROR]`, ...args);
  };
});

afterAll(() => {
  // Restore original console methods
  console.log = originalLog;
  console.warn = originalWarn;
  console.error = originalError;
});

// Global test utilities for integration tests
global.testUtils = {
  // Wait for a condition with timeout
  waitFor: async (condition: () => boolean | Promise<boolean>, timeout = 10000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Condition not met within ${timeout}ms`);
  },
  
  // Generate test data
  generateTestData: () => ({
    email: process.env.AMC_TEST_EMAIL || 'test@example.com',
    password: process.env.AMC_TEST_PASSWORD || 'testpassword',
    zip: process.env.AMC_TEST_ZIP || '10001',
    apiKey: process.env.AMC_API_KEY || 'test_api_key'
  }),
  
  // Check if integration tests should run
  shouldRunIntegrationTests: () => {
    return !!(process.env.AMC_API_KEY || process.env.AMC_TEST_EMAIL);
  }
};

// Type declaration for global test utilities
declare global {
  namespace NodeJS {
    interface Global {
      testUtils: {
        waitFor: (condition: () => boolean | Promise<boolean>, timeout?: number) => Promise<boolean>;
        generateTestData: () => {
          email: string;
          password: string;
          zip: string;
          apiKey: string;
        };
        shouldRunIntegrationTests: () => boolean;
      };
    }
  }
} 