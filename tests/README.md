# AMC MCP Server Test Suite

This directory contains comprehensive unit tests for the AMC MCP Server project.

## Test Structure

```
tests/
├── README.md                    # This file
├── jest.config.js              # Jest configuration
├── unit/                        # Unit tests
│   ├── README.md               # Unit tests documentation
│   ├── setup.ts                # Test setup and configuration
│   ├── mockData.ts             # Mock data for testing
│   ├── types.test.ts           # Tests for TypeScript interfaces
│   ├── amcClient.test.ts       # Tests for AMC API client
│   ├── mcpTools.test.ts        # Tests for MCP tools
│   └── playwrightBookingService.test.ts # Tests for Playwright booking service
├── integration/                 # Integration tests (future)
│   └── ...                      
└── runTests.ts                 # Test runner script
```

## Test Categories

### 1. **Unit Tests** (`*.test.ts`)
- **Types**: Validate all TypeScript interfaces and type definitions
- **AMC Client**: Test API wrapper functions with mocked responses
- **MCP Tools**: Test tool implementations and validation logic
- **Playwright Service**: Test browser automation logic with mocked Playwright

### 2. **Mock Data** (`tests/unit/mockData.ts`)
- Sample movies, theaters, and showtimes for testing
- Input/output data structures
- Error scenarios and edge cases
- Booking request/response examples

## Running Tests

### Prerequisites
```bash
npm install
```

### Basic Test Commands
```bash
# Run all tests (unit tests only for now)
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests (not yet implemented)
npm run test:integration
```

### Individual Test Files
```bash
# Run specific test file
npx jest tests/unit/types.test.ts

# Run tests matching pattern
npx jest --testNamePattern="AMCMovie"

# Run tests with verbose output
npx jest --verbose
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- **Preset**: `ts-jest` for TypeScript support
- **Environment**: Node.js
- **Coverage**: HTML, LCOV, and text reports
- **Timeout**: 10 seconds per test
- **Setup**: Automatic test setup and teardown
- **Roots**: Focused on unit tests (`tests/unit/`)

### Test Setup (`tests/unit/setup.ts`)
- Environment variable configuration
- Console output suppression during tests
- Global test utilities and helpers
- Jest matcher extensions

## Mock Strategy

### Why Mock Data?
Since we don't have real AMC API access yet, we use comprehensive mocks to:
- Test all code paths and edge cases
- Validate input/output schemas
- Test error handling scenarios
- Ensure type safety
- Verify business logic

### Mock Data Includes
- **Movies**: Sample movie data with all properties
- **Theaters**: Theater information with addresses and amenities
- **Showtimes**: Movie screening times and availability
- **Input Data**: Valid and invalid test inputs
- **Error Responses**: API errors and validation failures
- **Booking Scenarios**: Successful and failed booking attempts

## Test Coverage

### Current Coverage Areas
- ✅ **Types Module**: 100% interface validation
- ✅ **AMC Client**: API wrapper functions and error handling
- ✅ **MCP Tools**: Tool implementations and validation
- ✅ **Playwright Service**: Browser automation logic
- ✅ **Input Validation**: Zod schema validation
- ✅ **Error Handling**: Structured error responses

### Coverage Goals
- **Statements**: >90%
- **Branches**: >85%
- **Functions**: >95%
- **Lines**: >90%

## Adding New Tests

### 1. **Create Test File**
```typescript
// tests/unit/newModule.test.ts
import { NewModule } from '../src/newModule';

describe('NewModule', () => {
  it('should work correctly', () => {
    // Test implementation
  });
});
```

### 2. **Add Mock Data** (if needed)
```typescript
// tests/unit/mockData.ts
export const mockNewData = {
  // Mock data structure
};
```

### 3. **Update Test Configuration**
- Add new test patterns to `jest.config.js` if needed
- Update coverage exclusions if necessary

## Best Practices

### Test Naming
- Use descriptive test names that explain the scenario
- Group related tests with `describe` blocks
- Use consistent naming patterns

### Test Structure
```typescript
describe('ModuleName', () => {
  describe('FunctionName', () => {
    it('should handle success case', async () => {
      // Arrange
      // Act
      // Assert
    });

    it('should handle error case', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### Mocking
- Mock external dependencies (APIs, databases, etc.)
- Use realistic mock data that matches real-world scenarios
- Test both success and failure paths

### Assertions
- Test one concept per test
- Use specific assertions (e.g., `toBe` vs `toEqual`)
- Test edge cases and error conditions
- Validate error messages and structures

## Future Enhancements

### Integration Tests
When real API access is available:
- Test with actual AMC API endpoints
- Validate real response formats
- Test rate limiting and error handling
- End-to-end booking flow testing

### Performance Tests
- Load testing for concurrent requests
- Memory usage monitoring
- Response time benchmarking

### Security Tests
- Input validation security
- Authentication flow testing
- Rate limiting effectiveness

## Troubleshooting

### Common Issues
1. **Jest not found**: Run `npm install --save-dev jest`
2. **TypeScript errors**: Ensure `ts-jest` is installed
3. **Mock failures**: Check mock data structure matches interfaces
4. **Timeout errors**: Increase timeout in Jest config if needed

### Debug Mode
```bash
# Run tests with Node.js debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Run specific test with debugging
npx jest --runInBand --testNamePattern="specific test name"
```

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain or improve coverage
4. Update this documentation if needed

## Support

For test-related issues:
- Check Jest documentation: https://jestjs.io/
- Review TypeScript testing: https://jestjs.io/docs/getting-started#using-typescript
- Check project issues for known problems 