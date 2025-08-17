# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
