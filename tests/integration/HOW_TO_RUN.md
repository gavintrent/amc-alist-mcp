# How to Run Integration Tests

## Overview

The integration tests in this directory test the AMC MCP Server with real external dependencies:
- **API Tests**: Test real AMC API endpoints (requires valid API key)
- **Playwright Tests**: Test real browser automation with AMC website (requires valid AMC account)
- **End-to-End Tests**: Test complete MCP server workflows

## Prerequisites

### 1. Install Dependencies
```bash
npm install
```

### 2. Install Playwright Browsers
```bash
npx playwright install
```

### 3. Set Up Environment Variables

Create a `.env` file in the project root with your credentials:

```bash
# Required for API integration tests
AMC_API_KEY=your_valid_amc_api_key_here

# Required for Playwright integration tests
AMC_TEST_EMAIL=your_amc_email@example.com
AMC_TEST_PASSWORD=your_amc_password
AMC_TEST_ZIP=12345

# Optional
LOG_LEVEL=debug
NODE_ENV=test
```

**⚠️ Security Note**: Never commit your `.env` file to version control!

## Running Integration Tests

### Option 1: Use the Convenience Script
```bash
# Make the script executable (first time only)
chmod +x tests/integration/run-integration-tests.sh

# Run all integration tests
./tests/integration/run-integration-tests.sh
```

### Option 2: Use NPM Scripts
```bash
# Run all integration tests
npm run test:integration

# Run only API integration tests
npm run test:integration:api

# Run only Playwright integration tests
npm run test:integration:playwright

# Run only end-to-end tests
npm run test:integration:e2e
```

### Option 3: Run Specific Test Files
```bash
# Run specific integration test files
npm test -- tests/integration/api/amcClient.integration.test.ts
npm test -- tests/integration/playwright/booking.integration.test.ts
npm test -- tests/integration/e2e/mcpServer.integration.test.ts
```

## Test Categories

### 1. API Integration Tests (`tests/integration/api/`)
**Purpose**: Test real AMC API endpoints
**Requirements**: Valid `AMC_API_KEY`
**What it tests**:
- API key validation
- Real movie data fetching
- Real theater data fetching
- Real showtime data fetching
- Error handling with real API responses

**Example Output**:
```
✅ Found 25 movies playing now
✅ First movie: Avengers: Endgame (2024-01-15)
✅ Found 8 theaters near ZIP 10001
✅ First theater: AMC Empire 25
```

### 2. Playwright Integration Tests (`tests/integration/playwright/`)
**Purpose**: Test real browser automation with AMC website
**Requirements**: Valid AMC account credentials
**What it tests**:
- Real website navigation
- Real login functionality
- Real theater search
- Session management
- Error handling with real website

**Example Output**:
```
🔐 Using test account: your_email@example.com
📍 Test ZIP code: 10001
✅ Successfully navigated to AMC website: AMC Theatres
✅ Successfully logged in as your_email@example.com
✅ Found 12 theater elements on page
```

### 3. End-to-End Tests (`tests/integration/e2e/`)
**Purpose**: Test complete MCP server workflows
**Requirements**: All of the above
**What it tests**:
- Complete server startup
- MCP tool endpoints
- Request/response validation
- Error handling
- Performance and reliability

## What Happens When Tests Run

### With Valid Credentials
- Tests will make real API calls to AMC
- Tests will open real browser sessions
- Tests will interact with real AMC website
- All assertions will validate real data

### Without Valid Credentials
- Tests will be skipped gracefully
- You'll see warning messages
- Tests will still run but with limited functionality
- No errors or failures due to missing credentials

## Expected Test Durations

- **API Tests**: 15-30 seconds per test
- **Playwright Tests**: 30-60 seconds per test
- **End-to-End Tests**: 1-2 minutes per test
- **Full Suite**: 5-10 minutes total

## Troubleshooting

### Common Issues

1. **"AMC_API_KEY not set"**
   - Set the `AMC_API_KEY` environment variable
   - Ensure your API key is valid and active

2. **"AMC_TEST_EMAIL not set"**
   - Set your AMC account credentials
   - Use a test account if possible

3. **"Playwright browsers not installed"**
   - Run `npx playwright install`
   - This downloads browser binaries (~100MB)

4. **"Network timeout"**
   - Check your internet connection
   - AMC website might be slow
   - Increase timeout in test files if needed

5. **"Login failed"**
   - Verify your AMC credentials
   - Check if 2FA is enabled
   - Try logging in manually first

### Debug Mode

For debugging, set `LOG_LEVEL=debug` in your `.env` file:

```bash
LOG_LEVEL=debug
```

This will show detailed logging during test execution.

### Headed Browser Mode

To see the browser automation in action, modify the Playwright tests:

```typescript
// In tests/integration/playwright/booking.integration.test.ts
await bookingService['browser']?.newPage({ headless: false });
```

**Note**: This will slow down tests significantly.

## Test Data and Cleanup

### What Gets Created
- Browser sessions
- Test user sessions
- Temporary browser data

### Automatic Cleanup
- All tests include `afterAll` cleanup
- Browser resources are automatically closed
- No persistent data is left behind

### Manual Cleanup
If tests are interrupted, you may need to manually clean up:

```bash
# Kill any remaining Playwright processes
pkill -f playwright

# Clear browser data (optional)
rm -rf ~/.cache/ms-playwright
```

## Best Practices

### 1. Use Test Account
- Don't use your main AMC account
- Create a dedicated test account
- Use minimal personal information

### 2. Rate Limiting
- Don't run tests too frequently
- AMC may rate-limit API calls
- Add delays between test runs if needed

### 3. Environment Isolation
- Use separate credentials for different environments
- Don't mix production and test credentials
- Use `.env.local` for local development

### 4. Test Scheduling
- Run integration tests during off-peak hours
- Avoid running during AMC website maintenance
- Consider running tests in CI/CD pipeline

## Future Enhancements

- [ ] Add test data factories
- [ ] Implement test retry logic
- [ ] Add performance benchmarking
- [ ] Create test reports with screenshots
- [ ] Add parallel test execution
- [ ] Implement test data seeding

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your credentials are correct
3. Check AMC website status
4. Review test logs for specific error messages
5. Ensure all dependencies are installed

## Security Reminders

- **Never commit credentials to version control**
- **Use environment variables for sensitive data**
- **Consider using a test AMC account**
- **Rotate credentials regularly**
- **Monitor API usage and rate limits** 