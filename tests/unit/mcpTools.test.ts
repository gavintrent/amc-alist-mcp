import { MCPTools } from '../../src/mcpTools';
import { AMCClient } from '../../src/amcClient';
import { PlaywrightBookingService } from '../../src/playwrightBookingService';
import {
  mockMovies,
  mockTheaters,
  mockShowtimes,
  mockListTheatersInput,
  mockListMoviesInput,
  mockListShowtimesInput,
  mockReserveTicketsInput,
  mockBookTicketsInput
} from './mockData';

// Mock the AMCClient and PlaywrightBookingService
jest.mock('../../src/amcClient');
jest.mock('../../src/playwrightBookingService');

const MockedAMCClient = AMCClient as jest.MockedClass<typeof AMCClient>;
const MockedPlaywrightBookingService = PlaywrightBookingService as jest.MockedClass<typeof PlaywrightBookingService>;

describe('MCPTools', () => {
  let mcpTools: MCPTools;
  let mockAmcClient: jest.Mocked<AMCClient>;
  let mockPlaywrightService: jest.Mocked<PlaywrightBookingService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock instances
    mockAmcClient = {
      getNowPlayingMovies: jest.fn(),
      getTheatersByZip: jest.fn(),
      getShowtimes: jest.fn(),
      getTheaterById: jest.fn(),
      getMovieById: jest.fn(),
      validateApiKey: jest.fn()
    } as any;

    mockPlaywrightService = {
      bookTickets: jest.fn()
    } as any;

    // Mock the constructors
    MockedAMCClient.mockImplementation(() => mockAmcClient);
    MockedPlaywrightBookingService.mockImplementation(() => mockPlaywrightService);

    // Create a real MCPTools instance with mocked dependencies
    mcpTools = new MCPTools(mockAmcClient);
    
    // Replace the playwright service with our mock
    (mcpTools as any).playwrightService = mockPlaywrightService;
  });

  describe('Constructor', () => {
    it('should create MCPTools instance with AMC client', () => {
      expect(mcpTools).toBeInstanceOf(MCPTools);
    });

    it('should validate Zod schema directly', () => {
      // Test Zod validation directly
      const { z } = require('zod');
      const ListTheatersSchema = z.object({
        zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format')
      });

      // This should pass
      expect(() => ListTheatersSchema.parse({ zip: '90210' })).not.toThrow();
      
      // This should fail
      expect(() => ListTheatersSchema.parse({ zip: 'invalid' })).toThrow();
      expect(() => ListTheatersSchema.parse({ zip: '' })).toThrow();
    });
  });

  describe('listTheaters', () => {
    it('should list theaters successfully with valid input', async () => {
      mockAmcClient.getTheatersByZip.mockResolvedValue(mockTheaters);

      const result = await mcpTools.listTheaters(mockListTheatersInput);

      expect(result).toEqual({
        theaters: mockTheaters,
        totalCount: mockTheaters.length
      });
      expect(mockAmcClient.getTheatersByZip).toHaveBeenCalledWith('90210');
    });

    it('should throw validation error for invalid ZIP code', async () => {
      const invalidInput = { zip: 'invalid' };

      await expect(mcpTools.listTheaters(invalidInput)).rejects.toThrow();
    });

    it('should throw validation error for empty ZIP code', async () => {
      const invalidInput = { zip: '' };

      await expect(mcpTools.listTheaters(invalidInput)).rejects.toThrow();
    });

    it('should handle AMC API errors', async () => {
      const apiError = new Error('AMC API error');
      mockAmcClient.getTheatersByZip.mockRejectedValue(apiError);

      await expect(mcpTools.listTheaters(mockListTheatersInput)).rejects.toThrow();
    });
  });

  describe('listMovies', () => {
    it('should list movies successfully', async () => {
      mockAmcClient.getNowPlayingMovies.mockResolvedValue(mockMovies);

      const result = await mcpTools.listMovies(mockListMoviesInput);

      expect(result).toEqual({
        movies: mockMovies,
        totalCount: mockMovies.length
      });
      expect(mockAmcClient.getNowPlayingMovies).toHaveBeenCalled();
    });

    it('should handle AMC API errors', async () => {
      const apiError = new Error('AMC API error');
      mockAmcClient.getNowPlayingMovies.mockRejectedValue(apiError);

      await expect(mcpTools.listMovies(mockListMoviesInput)).rejects.toThrow();
    });
  });

  describe('listShowtimes', () => {
    it('should list showtimes successfully with valid input', async () => {
      mockAmcClient.getShowtimes.mockResolvedValue(mockShowtimes);
      mockAmcClient.getTheaterById.mockResolvedValue(mockTheaters[0]!);

      const result = await mcpTools.listShowtimes(mockListShowtimesInput);

      expect(result).toEqual({
        showtimes: mockShowtimes,
        totalCount: mockShowtimes.length,
        theater: {
          id: mockTheaters[0]!.id,
          name: mockTheaters[0]!.name,
          address: mockTheaters[0]!.address,
          phone: mockTheaters[0]!.phone,
          amenities: mockTheaters[0]!.amenities
        }
      });
      expect(mockAmcClient.getShowtimes).toHaveBeenCalledWith('theater_001', '2024-01-15');
      expect(mockAmcClient.getTheaterById).toHaveBeenCalledWith('theater_001');
    });

    it('should throw validation error for invalid theater ID', async () => {
      const invalidInput = { ...mockListShowtimesInput, theaterId: '' };

      await expect(mcpTools.listShowtimes(invalidInput)).rejects.toThrow();
    });

    it('should throw validation error for invalid date format', async () => {
      const invalidInput = { ...mockListShowtimesInput, date: 'invalid-date' };

      await expect(mcpTools.listShowtimes(invalidInput)).rejects.toThrow();
    });

    it('should handle AMC API errors', async () => {
      const apiError = new Error('AMC API error');
      mockAmcClient.getShowtimes.mockRejectedValue(apiError);

      await expect(mcpTools.listShowtimes(mockListShowtimesInput)).rejects.toThrow();
    });
  });

  describe('reserveTickets', () => {
    it('should return stub response for valid input', async () => {
      const result = await mcpTools.reserveTickets(mockReserveTicketsInput);

      expect(result).toEqual({
        reservationId: expect.stringMatching(/^stub_\d+$/),
        status: 'pending',
        message: 'Ticket reservation is not yet implemented. This is a stub response for testing purposes.'
      });
    });

    it('should throw validation error for invalid showtime ID', async () => {
      const invalidInput = { ...mockReserveTicketsInput, showtimeId: '' };

      await expect(mcpTools.reserveTickets(invalidInput)).rejects.toThrow();
    });

    it('should throw validation error for invalid quantity', async () => {
      const invalidInput = { ...mockReserveTicketsInput, quantity: 0 };

      await expect(mcpTools.reserveTickets(invalidInput)).rejects.toThrow();
    });

    it('should throw validation error for quantity exceeding maximum', async () => {
      const invalidInput = { ...mockReserveTicketsInput, quantity: 11 };

      await expect(mcpTools.reserveTickets(invalidInput)).rejects.toThrow();
    });
  });

  describe('bookTickets', () => {
    it('should book tickets successfully with valid input', async () => {
      const mockBookingResult = {
        success: true,
        confirmationNumber: 'CONF-001',
        bookingDetails: {
          movieTitle: 'Dune: Part Two',
          theaterName: 'AMC Century City 15',
          showtime: '2024-01-15T19:00:00Z',
          seats: ['A5', 'A6'],
          totalPrice: 37.98
        }
      };

      mockPlaywrightService.bookTickets.mockResolvedValue(mockBookingResult);

      const result = await mcpTools.bookTickets(mockBookTicketsInput);

      expect(result).toEqual(mockBookingResult);
      expect(mockPlaywrightService.bookTickets).toHaveBeenCalledWith(mockBookTicketsInput);
    });

    it('should throw validation error for invalid email', async () => {
      const invalidInput = { ...mockBookTicketsInput, email: 'invalid-email' };

      await expect(mcpTools.bookTickets(invalidInput)).rejects.toThrow();
    });

    it('should throw validation error for empty password', async () => {
      const invalidInput = { ...mockBookTicketsInput, password: '' };

      await expect(mcpTools.bookTickets(invalidInput)).rejects.toThrow();
    });

    it('should throw validation error for invalid seat count', async () => {
      const invalidInput = { ...mockBookTicketsInput, seatCount: 0 };

      await expect(mcpTools.bookTickets(invalidInput)).rejects.toThrow();
    });

    it('should throw validation error for seat count exceeding maximum', async () => {
      const invalidInput = { ...mockBookTicketsInput, seatCount: 11 };

      await expect(mcpTools.bookTickets(invalidInput)).rejects.toThrow();
    });

    it('should handle Playwright service errors', async () => {
      const serviceError = new Error('Playwright service error');
      mockPlaywrightService.bookTickets.mockRejectedValue(serviceError);

      await expect(mcpTools.bookTickets(mockBookTicketsInput)).rejects.toThrow();
    });
  });

  describe('getToolDefinitions', () => {
    it('should return all tool definitions', () => {
      const toolDefs = mcpTools.getToolDefinitions();

      expect(toolDefs).toHaveLength(5);
      expect(toolDefs.map(tool => tool.name)).toEqual([
        'list_theaters',
        'list_movies',
        'list_showtimes',
        'reserve_tickets',
        'book_tickets'
      ]);
    });

    it('should include correct input schemas for each tool', () => {
      const toolDefs = mcpTools.getToolDefinitions();

      // Check list_theaters schema
      const listTheatersTool = toolDefs.find(tool => tool.name === 'list_theaters');
      expect(listTheatersTool?.inputSchema.properties?.zip).toBeDefined();
      expect(listTheatersTool?.inputSchema.required).toContain('zip');

      // Check list_movies schema
      const listMoviesTool = toolDefs.find(tool => tool.name === 'list_movies');
      expect(listMoviesTool?.inputSchema.properties).toEqual({});
      expect(listMoviesTool?.inputSchema.required).toEqual([]);

      // Check list_showtimes schema
      const listShowtimesTool = toolDefs.find(tool => tool.name === 'list_showtimes');
      expect(listShowtimesTool?.inputSchema.properties?.theaterId).toBeDefined();
      expect(listShowtimesTool?.inputSchema.properties?.date).toBeDefined();
      expect(listShowtimesTool?.inputSchema.required).toContain('theaterId');
      expect(listShowtimesTool?.inputSchema.required).toContain('date');

      // Check reserve_tickets schema
      const reserveTicketsTool = toolDefs.find(tool => tool.name === 'reserve_tickets');
      expect(reserveTicketsTool?.inputSchema.properties?.showtimeId).toBeDefined();
      expect(reserveTicketsTool?.inputSchema.properties?.quantity).toBeDefined();
      expect(reserveTicketsTool?.inputSchema.required).toContain('showtimeId');
      expect(reserveTicketsTool?.inputSchema.required).toContain('quantity');

      // Check book_tickets schema
      const bookTicketsTool = toolDefs.find(tool => tool.name === 'book_tickets');
      expect(bookTicketsTool?.inputSchema.properties?.email).toBeDefined();
      expect(bookTicketsTool?.inputSchema.properties?.password).toBeDefined();
      expect(bookTicketsTool?.inputSchema.properties?.theaterId).toBeDefined();
      expect(bookTicketsTool?.inputSchema.properties?.showtimeId).toBeDefined();
      expect(bookTicketsTool?.inputSchema.properties?.seatCount).toBeDefined();
      expect(bookTicketsTool?.inputSchema.required).toContain('email');
      expect(bookTicketsTool?.inputSchema.required).toContain('password');
      expect(bookTicketsTool?.inputSchema.required).toContain('theaterId');
      expect(bookTicketsTool?.inputSchema.required).toContain('showtimeId');
      expect(bookTicketsTool?.inputSchema.required).toContain('seatCount');
    });

    it('should include seat preferences schema for book_tickets', () => {
      const toolDefs = mcpTools.getToolDefinitions();
      const bookTicketsTool = toolDefs.find(tool => tool.name === 'book_tickets');
      
      expect(bookTicketsTool?.inputSchema.properties?.seatPreferences).toBeDefined();
      expect(bookTicketsTool?.inputSchema.properties?.seatPreferences?.properties?.row?.enum).toEqual(['front', 'middle', 'back']);
      expect(bookTicketsTool?.inputSchema.properties?.seatPreferences?.properties?.position?.enum).toEqual(['aisle', 'center']);
    });
  });

  describe('Error Handling', () => {
    it('should create MCP errors with correct structure', async () => {
      // Test validation error
      const invalidInput = { zip: 'invalid' };
      
      try {
        await mcpTools.listTheaters(invalidInput);
      } catch (error: any) {
        expect(error.error).toBe('VALIDATION_ERROR');
        expect(error.message).toBe('Invalid input parameters');
        expect(error.code).toBeDefined();
      }
    });

    it('should handle unknown errors gracefully', async () => {
      const unknownError = new Error('Unknown error');
      mockAmcClient.getNowPlayingMovies.mockRejectedValue(unknownError);

      try {
        await mcpTools.listMovies(mockListMoviesInput);
      } catch (error: any) {
        expect(error.error).toBe('AMC_API_ERROR');
        expect(error.message).toBe('Failed to fetch movies');
        expect(error.code).toBe('Unknown error');
      }
    });
  });
}); 