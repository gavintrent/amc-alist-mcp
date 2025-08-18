# AMC MCP Server

An MCP (Model Context Protocol) server that integrates with AMC Theatres APIs to expose structured tools for LLMs like ChatGPT, Claude, and LangChain agents.

## Features

- **List Movies**: Get currently playing movies at AMC theaters
- **Find Theaters**: Locate AMC theaters near a specific ZIP code
- **Showtimes**: Get showtimes for any theater on a specific date
- **Ticket Reservations**: Stub implementation for future e-commerce integration
- **Automated Ticket Booking**: **NEW!** Book tickets using Playwright browser automation
- **MCP Compliant**: Follows Model Context Protocol best practices
- **TypeScript**: Built with strict typing and modern ES2022 features
- **Docker Ready**: Containerized for easy deployment

## Prerequisites

- Node.js 18+ 
- AMC API key from [AMC Developer Portal](https://developer.amctheatres.com)
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd amc-mcp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your AMC API key:
   ```env
   AMC_API_KEY=your_actual_api_key_here
   PORT=3000
   NODE_ENV=development
   ```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Docker
```bash
# Build the image
docker build -t amc-mcp-server .

# Run the container
docker run -p 3000:3000 --env-file .env amc-mcp-server
```

## Testing the API

### Health Check
```bash
curl http://localhost:3000/health
```

### API Key Validation
```bash
curl http://localhost:3000/validate
```

### List Movies
```bash
curl -X POST http://localhost:3000/tools/list_movies \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Find Theaters
```bash
curl -X POST http://localhost:3000/tools/list_theaters \
  -H "Content-Type: application/json" \
  -d '{"zip": "90210"}'
```

### Get Showtimes
```bash
curl -X POST http://localhost:3000/tools/list_showtimes \
  -H "Content-Type: application/json" \
  -d '{"theaterId": "123", "date": "2024-01-15"}'
```

### Book Tickets (NEW!)
```bash
curl -X POST http://localhost:3000/tools/book_tickets \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "userpassword",
    "theaterId": "123",
    "showtimeId": "456",
    "seatCount": 2,
    "seatPreferences": {
      "row": "middle",
      "position": "aisle"
    }
  }'
```

## MCP Integration

### Manifest
The server provides a manifest at `/manifest.json` for MCP autodiscovery:

```json
{
  "name": "amc-mcp-server",
  "version": "0.1.0",
  "tools": [
    {
      "name": "list_theaters",
      "description": "Find AMC theaters near a specific ZIP code"
    },
    {
      "name": "list_movies", 
      "description": "List currently playing movies at AMC theaters"
    }
    // ... more tools
  ]
}
```

### Claude Desktop Integration
1. Open Claude Desktop
2. Go to Settings → MCP Servers
3. Add your server URL: `http://localhost:3000`
4. The tools will be automatically discovered and available

## Project Structure

```
amc-mcp/
├── src/
│   ├── index.ts          # Express server entrypoint
│   ├── mcpTools.ts       # MCP tool definitions and handlers
│   ├── amcClient.ts      # AMC API wrapper client
│   └── types.ts          # TypeScript interfaces and types
├── manifest.json         # MCP discovery manifest
├── Dockerfile            # Container configuration
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Testing

### Unit Tests
Run the comprehensive unit test suite:
```bash
npm test
npm run test:unit
```

### Integration Tests
The project includes integration tests that test real AMC APIs and website interactions:

**Prerequisites:**
- Valid AMC API key for API tests
- Valid AMC account credentials for Playwright tests
- Playwright browsers installed

**Setup:**
```bash
# Install Playwright browsers
npx playwright install

# Create .env file with your credentials
cp env.example .env
# Edit .env with your real credentials
```

**Running Integration Tests:**
```bash
# Run all integration tests
npm run test:integration

# Run specific test categories
npm run test:integration:api        # API integration tests
npm run test:integration:playwright # Browser automation tests
npm run test:integration:e2e        # End-to-end server tests

# Use the convenience script
./tests/integration/run-integration-tests.sh
```

**Note:** Integration tests require real credentials and will make actual API calls and browser interactions. See `tests/integration/HOW_TO_RUN.md` for detailed instructions.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health check |
| `/validate` | GET | Validate AMC API key |
| `/manifest.json` | GET | MCP manifest for autodiscovery |
| `/tools/list_movies` | POST | List currently playing movies |
| `/tools/list_theaters` | POST | Find theaters by ZIP code |
| `/tools/list_showtimes` | POST | Get showtimes for theater/date |
| `/tools/reserve_tickets` | POST | Reserve tickets (stub) |
| `/tools/book_tickets` | POST | **NEW!** Book tickets with Playwright automation |

## Data Models

### Movie
```typescript
interface AMCMovie {
  id: string;
  title: string;
  runtime: number;
  releaseDate: string;
  posterUrl?: string;
  synopsis?: string;
  rating?: string;
  genres?: string[];
}
```

### Theater
```typescript
interface AMCTheater {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone?: string;
  amenities?: string[];
  distance?: number;
}
```

### Showtime
```typescript
interface AMCShowtime {
  id: string;
  movieId: string;
  movieTitle: string;
  startDateTime: string;
  endDateTime: string;
  auditorium: string;
  format?: string;
  ticketPrice?: number;
  availableSeats?: number;
}
```

## Deployment

### Render
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Fly.io
```bash
flyctl launch
flyctl deploy
```

### AWS Lightsail
1. Create container service
2. Push Docker image
3. Configure environment variables

## Security

- **API Key**: Stored in environment variables
- **CORS**: Configurable for production
- **Helmet**: Security headers enabled
- **Input Validation**: Zod schema validation
- **Rate Limiting**: Respects AMC API limits

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run clean` - Clean build artifacts

### Adding New Tools
1. Define input/output types in `src/types.ts`
2. Add validation schema in `src/mcpTools.ts`
3. Implement tool handler
4. Add to tool definitions
5. Update manifest

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- Check the `/health` endpoint for server status
- Validate your API key at `/validate`
- Review logs for detailed error information
- Ensure your AMC API key has proper permissions

## Future Enhancements

- [x] **User authentication and loyalty integration** - Implemented with Playwright
- [x] **Seat map selection** - Implemented with automated seat picking
- [ ] Real-time ticket availability
- [ ] Push notifications for new releases
- [ ] Integration with LangChain agents
- [ ] Advanced search and filtering
- [ ] Movie reviews and ratings 