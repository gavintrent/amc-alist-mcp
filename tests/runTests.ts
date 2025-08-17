#!/usr/bin/env node

// Test runner script for AMC MCP Server
// This script runs all tests with proper configuration

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

console.log('🧪 Running AMC MCP Server Test Suite\n');

// Check if tests directory exists
const testsDir = join(__dirname);
const unitTestsDir = join(__dirname, 'unit');
if (!existsSync(testsDir) || !existsSync(unitTestsDir)) {
  console.error('❌ Tests directory structure not found');
  process.exit(1);
}

// Check if Jest is installed
try {
  require.resolve('jest');
} catch (error) {
  console.error('❌ Jest not found. Please install it first: npm install --save-dev jest');
  process.exit(1);
}

// Run tests with Jest
try {
  console.log('📋 Running unit tests...\n');
  
  const jestConfig = join(__dirname, 'jest.config.js');
  const command = `npx jest --config ${jestConfig} --verbose --coverage`;
  
  execSync(command, { 
    stdio: 'inherit',
    cwd: join(__dirname, '..')
  });
  
  console.log('\n✅ All tests completed successfully!');
  
} catch (error) {
  console.error('\n❌ Tests failed with errors');
  process.exit(1);
} 