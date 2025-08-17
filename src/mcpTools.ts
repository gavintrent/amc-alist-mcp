import { z } from 'zod';
import { AMCClient } from './amcClient';
import {
  ListTheatersInput,
  ListTheatersOutput,
  ListMoviesInput,
  ListMoviesOutput,
  ListShowtimesInput,
  ListShowtimesOutput,
  ReserveTicketsInput,
  ReserveTicketsOutput,
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

export class MCPTools {
  private amcClient: AMCClient;

  constructor(amcClient: AMCClient) {
    this.amcClient = amcClient;
  }

  /**
   * List theaters near a ZIP code
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
   */
  async listMovies(input: ListMoviesInput): Promise<ListMoviesOutput> {
    try {
      const movies = await this.amcClient.getNowPlayingMovies();
      
      return {
        movies: movies.map(movie => ({
          id: movie.id,
          title: movie.title,
          runtime: movie.runtime,
          releaseDate: movie.releaseDate,
          posterUrl: movie.posterUrl,
          synopsis: movie.synopsis,
          rating: movie.rating,
          genres: movie.genres
        })),
        totalCount: movies.length
      };
    } catch (error) {
      throw this.createMCPError('AMC_API_ERROR', 'Failed to fetch movies', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * List showtimes for a theater on a specific date
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
          movieTitle: showtime.movieTitle,
          startDateTime: showtime.startDateTime,
          endDateTime: showtime.endDateTime,
          auditorium: showtime.auditorium,
          format: showtime.format,
          ticketPrice: showtime.ticketPrice,
          availableSeats: showtime.availableSeats
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
      }
    ];
  }

  private createMCPError(error: string, message: string, details?: string): MCPError {
    return {
      error,
      message,
      code: details
    };
  }
} 