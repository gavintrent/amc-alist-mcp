# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Enhanced `getTheatersByZip` function to properly handle AMC's two-step API process:
  - First calls `/location-suggestions` to get coordinates for a ZIP code
  - Then calls `/locations` with those coordinates to get nearby theaters
- Added new `getTheatersByCoordinates` function for direct coordinate-based theater searches
- Added comprehensive TypeScript interfaces for location-suggestions and locations API responses:
  - `AMCLocationSuggestion`
  - `AMCLocationSuggestionsResponse` 
  - `AMCLocationTheater`
  - `AMCLocation`
  - `AMCLocationsResponse`
- Improved theater data transformation to include amenities, phone numbers, and distance information

### Changed
- Updated `getTheatersByZip` to use proper AMC API endpoints and response parsing
- Enhanced theater data structure to match actual AMC API response format
- Improved error handling and fallback mechanisms for ZIP code searches

### Removed
- Removed `searchMovies` function and all related tests as it's not needed for the core functionality

### Fixed
- Fixed incorrect API endpoint usage in theater search functions
- Resolved type mismatches between expected and actual API responses
- Fixed `getShowtimes` function not returning showtimes - updated to properly handle AMC API response structure where showtimes are in `_embedded.showtimes`
- Updated `AMCShowtime` interface to match actual AMC API response fields
- Added `TransformedShowtime` interface for MCP tools to provide simplified showtime data
- Fixed `getTheaterById` function not returning proper theater data - now properly transforms AMC API response to match our interface

## [0.3.0] - 2024-01-15

### Added
- **Configurable test modes for integration testing**
- Environment variable control for dry run vs. live purchase testing
- Enhanced safety measures to prevent accidental real purchases
- Test payment method configuration for live testing scenarios
- Comprehensive logging for test mode identification
- **AMC Stubs A-List reservation support**
- Free movie reservation flow using A-List benefits
- Automated A-List checkbox detection and activation
- Theater search and location-based movie selection
- No-payment checkout for A-List reservations

### Features
- `AMC_TEST_DRY_RUN` - Default safe mode (prevents real purchases)
- `AMC_TEST_ENABLE_PURCHASE` - Explicit flag for live testing
- `AMC_TEST_USE_ALIST` - Use A-List benefits for free reservations
- `AMC_TEST_CARD_*` - Test payment method configuration
- Enhanced test output with mode-specific information
- Extended timeout for live purchase testing (3 minutes)
- A-List reservation flow: Navigate → Find Theater → Choose Movie/Showtime → Select Seat → A-List Checkbox → Complete

### Technical Details
- Dual-mode booking flow testing (dry run vs. live purchase)
- Payment method integration for complete booking validation
- Enhanced error handling for live purchase scenarios
- Updated environment variable documentation
- Improved test safety with explicit confirmation requirements
- New `bookTicketsWithAList()` method in PlaywrightBookingService
- Automated A-List checkbox detection and activation
- Theater search functionality for location-based testing

## [0.2.0] - 2024-01-15

### Added
- **Playwright-based ticket booking functionality** (`playwrightBookingService.ts`)
- New MCP tool: `book_tickets` for automated ticket booking
- User authentication handling for AMC accounts
- Browser automation for seat selection and booking completion
- Session management for user credentials
- Enhanced input validation with seat preferences
- Comprehensive error handling for booking automation

### Features
- `book_tickets` - Automated ticket booking using Playwright
- User login and authentication
- Seat selection with preferences (row, position)
- Booking confirmation and details extraction
- Session persistence for improved user experience

### Technical Details
- Playwright browser automation in headless mode
- Secure credential handling (no password logging)
- Robust error handling for web automation failures
- Modular booking service architecture
- Integration with existing MCP tools structure

## [0.1.0] - 2024-01-15

### Added
- Initial project setup with TypeScript configuration
- Express server with MCP-compliant endpoints
- AMC API client wrapper (`amcClient.ts`)
- MCP tools implementation (`mcpTools.ts`)
- Type definitions for movies, theaters, and showtimes (`types.ts`)
- Input validation using Zod schemas
- Docker containerization support
- MCP manifest for autodiscovery
- Comprehensive README documentation
- Environment configuration setup
- Health check and API validation endpoints
- Error handling and logging
- Security middleware (Helmet, CORS)

### Features
- `list_movies` - Get currently playing movies
- `list_theaters` - Find theaters by ZIP code
- `list_showtimes` - Get showtimes for theater/date
- `reserve_tickets` - Stub implementation for future use

### Technical Details
- Built with TypeScript and strict typing enabled
- Uses async/await for all API calls
- Follows MCP tool conventions with proper schemas
- Centralized AMC API interactions
- Modular, functional design
- Production-ready Docker configuration
