import { z } from 'zod';
import { AMCClient } from './amcClient';
import { PlaywrightBookingService } from './playwrightBookingService';
import {
  ListTheatersInput,
  ListTheatersOutput,
  ListMoviesInput,
  ListMoviesOutput,
  ListShowtimesInput,
  ListShowtimesOutput,
  ReserveTicketsInput,
  ReserveTicketsOutput,
  BookTicketsInput,
  BookTicketsOutput,
  MCPError
} from './types';

// Input validation schemas using Zod
const ListTheatersSchema = z.object({
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format')
});

const ListShowtimesSchema = z.object({
  theaterId: z.string().min(1, 'Theater ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
});

const ReserveTicketsSchema = z.object({
  showtimeId: z.string().min(1, 'Showtime ID is required'),
  quantity: z.number().int().positive().max(10, 'Maximum 10 tickets per reservation')
});

const BookTicketsSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(1, 'Password is required'),
  theaterId: z.string().min(1, 'Theater ID is required'),
  showtimeId: z.string().min(1, 'Showtime ID is required'),
  seatCount: z.number().int().positive().max(10, 'Maximum 10 tickets per booking'),
  seatPreferences: z.object({
    row: z.enum(['front', 'middle', 'back']).optional(),
    position: z.enum(['aisle', 'center']).optional()
  }).optional()
});

export class MCPTools {
  private amcClient: AMCClient;
  private playwrightService: PlaywrightBookingService;

  constructor(amcClient: AMCClient) {
    this.amcClient = amcClient;
    this.playwrightService = new PlaywrightBookingService();
  }

  /**
   * List theaters near a ZIP code
   * 
   * @param input - Input parameters for theater search
   * @param input.zip - ZIP code to search for theaters near (format: 5-digit or 9-digit with hyphen)
   * @returns Promise<ListTheatersOutput> - List of theaters with total count
   * 
   * @example
   * ```json
   * {
   *   "zip": "90210"
   * }
   * ```
   */
  async listTheaters(input: ListTheatersInput): Promise<ListTheatersOutput> {
    try {
      // Validate input
      const validatedInput = ListTheatersSchema.parse(input);
      
      const theaters = await this.amcClient.getTheatersByZip(validatedInput.zip);
      
      return {
        theaters: theaters.map(theater => ({
          id: theater.id,
          name: theater.name,
          address: theater.address,
          phone: theater.phone,
          amenities: theater.amenities,
          distance: theater.distance
        })),
        totalCount: theaters.length
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw this.createMCPError('VALIDATION_ERROR', 'Invalid input parameters', error.message);
      }
      throw this.createMCPError('AMC_API_ERROR', 'Failed to fetch theaters', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * List now-playing movies
   * 
   * @param input - Input parameters for movie search (no parameters required)
   * @returns Promise<ListMoviesOutput> - List of currently playing movies with total count
   * 
   * @example
   * ```json
   * {}
   * ```
   */
  async listMovies(input: ListMoviesInput): Promise<ListMoviesOutput> {
    try {
      const movies = await this.amcClient.getNowPlayingMovies();
      
      return {
        movies: movies.map(movie => ({
          id: movie.id,
          title: movie.name || movie.title || 'Untitled', // Use AMC's 'name' field with fallback
          runtime: movie.runTime || movie.runtime || 0, // Use AMC's 'runTime' field with fallback
          releaseDate: movie.releaseDateUtc || movie.releaseDate || 'Unknown', // Use AMC's 'releaseDateUtc' field with fallback
          posterUrl: movie.posterDynamic || movie.posterUrl, // Use AMC's 'posterDynamic' field
          synopsis: movie.synopsis,
          rating: movie.mpaaRating || movie.rating, // Use AMC's 'mpaaRating' field
          genres: movie.genre ? [movie.genre] : movie.genres || [] // Convert AMC's 'genre' to array with fallback
        })),
        totalCount: movies.length
      };
    } catch (error) {
      throw this.createMCPError('AMC_API_ERROR', 'Failed to fetch movies', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * List showtimes for a theater on a specific date
   * 
   * @param input - Input parameters for showtime search
   * @param input.theaterId - Theater ID to get showtimes for
   * @param input.date - Date in YYYY-MM-DD format (e.g., "2024-01-15")
   * @returns Promise<ListShowtimesOutput> - List of showtimes with theater info and total count
   * 
   * @example
   * ```json
   * {
   *   "theaterId": "123",
   *   "date": "2024-01-15"
   * }
   * ```
   */
  async listShowtimes(input: ListShowtimesInput): Promise<ListShowtimesOutput> {
    try {
      // Validate input
      const validatedInput = ListShowtimesSchema.parse(input);
      
      const [showtimes, theater] = await Promise.all([
        this.amcClient.getShowtimes(validatedInput.theaterId, validatedInput.date),
        this.amcClient.getTheaterById(validatedInput.theaterId)
      ]);
      
      return {
        showtimes: showtimes.map(showtime => ({
          id: showtime.id,
          movieId: showtime.movieId,
          movieTitle: showtime.movieName,
          startDateTime: showtime.showDateTimeUtc,
          endDateTime: showtime.sellUntilDateTimeUtc,
          auditorium: showtime.auditorium.toString(),
          format: showtime.premiumFormat,
          ticketPrice: showtime.ticketPrices?.[0]?.price,
          availableSeats: undefined // AMC API doesn't provide available seats count
        })),
        totalCount: showtimes.length,
        theater: {
          id: theater.id,
          name: theater.name,
          address: theater.address,
          phone: theater.phone,
          amenities: theater.amenities
        }
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw this.createMCPError('VALIDATION_ERROR', 'Invalid input parameters', error.message);
      }
      throw this.createMCPError('AMC_API_ERROR', 'Failed to fetch showtimes', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Reserve tickets (stub implementation for future use)
   * 
   * @param input - Input parameters for ticket reservation
   * @param input.showtimeId - Showtime ID to reserve tickets for
   * @param input.quantity - Number of tickets to reserve (1-10)
   * @returns Promise<ReserveTicketsOutput> - Reservation status with ID and message
   * 
   * @example
   * ```json
   * {
   *   "showtimeId": "456",
   *   "quantity": 2
   * }
   * ```
   * 
   * @note This is a stub implementation. Actual reservation functionality will be added
   * when AMC grants e-commerce access.
   */
  async reserveTickets(input: ReserveTicketsInput): Promise<ReserveTicketsOutput> {
    try {
      // Validate input
      const validatedInput = ReserveTicketsSchema.parse(input);
      
      // This is a stub implementation - actual reservation logic will be added
      // when AMC grants e-commerce access
      return {
        reservationId: `stub_${Date.now()}`,
        status: 'pending',
        message: 'Ticket reservation is not yet implemented. This is a stub response for testing purposes.'
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw this.createMCPError('VALIDATION_ERROR', 'Invalid input parameters', error.message);
      }
      throw this.createMCPError('RESERVATION_ERROR', 'Failed to reserve tickets', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Book tickets using Playwright automation
   * 
   * @param input - Input parameters for ticket booking
   * @param input.email - User's AMC account email
   * @param input.password - User's AMC account password
   * @param input.theaterId - Theater ID to book tickets at
   * @param input.showtimeId - Showtime ID to book tickets for
   * @param input.seatCount - Number of tickets to book (1-10)
   * @param input.seatPreferences - Optional seat preferences (row, position)
   * @returns Promise<BookTicketsOutput> - Booking result with confirmation or error
   * 
   * @example
   * ```json
   * {
   *   "email": "user@example.com",
   *   "password": "userpassword",
   *   "theaterId": "123",
   *   "showtimeId": "456",
   *   "seatCount": 2,
   *   "seatPreferences": {
   *     "row": "middle",
   *     "position": "aisle"
   *   }
   * }
   * ```
   */
  async bookTickets(input: BookTicketsInput): Promise<BookTicketsOutput> {
    try {
      // Validate input
      const validatedInput = BookTicketsSchema.parse(input);
      
      // Use Playwright service to automate the booking process
      const result = await this.playwrightService.bookTickets(validatedInput);
      
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw this.createMCPError('VALIDATION_ERROR', 'Invalid input parameters', error.message);
      }
      throw this.createMCPError('BOOKING_ERROR', 'Failed to book tickets', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Get tool definitions for MCP manifest
   */
  getToolDefinitions() {
    return [
      {
        name: 'list_theaters',
        description: 'Find AMC theaters near a specific ZIP code',
        inputSchema: {
          type: 'object',
          properties: {
            zip: {
              type: 'string',
              description: 'ZIP code to search for theaters near',
              pattern: '^\\d{5}(-\\d{4})?$'
            }
          },
          required: ['zip']
        }
      },
      {
        name: 'list_movies',
        description: 'List currently playing movies at AMC theaters',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'list_showtimes',
        description: 'Get showtimes for a specific theater on a given date',
        inputSchema: {
          type: 'object',
          properties: {
            theaterId: {
              type: 'string',
              description: 'Theater ID to get showtimes for'
            },
            date: {
              type: 'string',
              description: 'Date in YYYY-MM-DD format'
            }
          },
          required: ['theaterId', 'date']
        }
      },
      {
        name: 'reserve_tickets',
        description: 'Reserve tickets for a showtime (stub implementation)',
        inputSchema: {
          type: 'object',
          properties: {
            showtimeId: {
              type: 'string',
              description: 'Showtime ID to reserve tickets for'
            },
            quantity: {
              type: 'number',
              description: 'Number of tickets to reserve (max 10)',
              minimum: 1,
              maximum: 10
            }
          },
          required: ['showtimeId', 'quantity']
        }
      },
      {
        name: 'book_tickets',
        description: 'Book AMC tickets using user credentials via Playwright automation',
        inputSchema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              description: 'User\'s AMC account email address'
            },
            password: {
              type: 'string',
              description: 'User\'s AMC account password'
            },
            theaterId: {
              type: 'string',
              description: 'Theater ID to book tickets at'
            },
            showtimeId: {
              type: 'string',
              description: 'Showtime ID to book tickets for'
            },
            seatCount: {
              type: 'number',
              description: 'Number of tickets to book (1-10)',
              minimum: 1,
              maximum: 10
            },
            seatPreferences: {
              type: 'object',
              properties: {
                row: {
                  type: 'string',
                  enum: ['front', 'middle', 'back'],
                  description: 'Preferred row location'
                },
                position: {
                  type: 'string',
                  enum: ['aisle', 'center'],
                  description: 'Preferred seat position'
                }
              },
              description: 'Optional seat preferences'
            }
          },
          required: ['email', 'password', 'theaterId', 'showtimeId', 'seatCount']
        }
      }
    ];
  }

  private createMCPError(error: string, message: string, details?: string): never {
    const mcpError = new Error(message);
    (mcpError as any).error = error;
    (mcpError as any).code = details;
    throw mcpError;
  }
} 