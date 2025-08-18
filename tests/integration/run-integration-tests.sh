#!/bin/bash

# Integration Test Runner
# This script runs integration tests with proper environment setup

echo "Starting AMC MCP Server Integration Tests"
echo "=============================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Warning: No .env file found. Using environment variables or defaults."
    echo "   Create a .env file with your test credentials for full testing."
fi

# Check for required environment variables
if [ -z "$AMC_API_KEY" ] && [ -z "$AMC_TEST_EMAIL" ]; then
    echo "Warning: No AMC_API_KEY or AMC_TEST_EMAIL set."
    echo "   Integration tests will be skipped or run with limited functionality."
    echo ""
    echo "   To run full integration tests, set these environment variables:"
    echo "   export AMC_API_KEY=your_api_key_here"
    echo "   export AMC_TEST_EMAIL=your_amc_email@example.com"
    echo "   export AMC_TEST_PASSWORD=your_amc_password"
    echo "   export AMC_TEST_ZIP=your_zip_code"
    echo ""
fi

# Install Playwright browsers if not already installed
echo "Checking Playwright browsers..."
if ! npx playwright --version > /dev/null 2>&1; then
    echo "Installing Playwright browsers..."
    npx playwright install
else
    echo "Playwright browsers already installed"
fi

echo ""
echo "Running Integration Tests..."
echo ""

# Run integration tests
npm run test:integration

echo ""
echo "Integration tests completed!"
echo ""
echo "Test Results:"
echo "   - Check the output above for test results"
echo "   - Failed tests will show detailed error information"
echo "   - Integration tests may take longer due to real API calls"
echo ""
echo "Tips:"
echo "   - Set AMC_API_KEY for API integration tests"
echo "   - Set AMC_TEST_EMAIL/AMC_TEST_PASSWORD for Playwright tests"
echo "   - Use 'npm run test:integration:api' for API-only tests"
echo "   - Use 'npm run test:integration:playwright' for browser tests"
echo "   - Use 'npm run test:integration:e2e' for end-to-end tests" 