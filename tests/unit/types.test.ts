import {
  AMCMovie,
  AMCTheater,
  AMCShowtime,
  ListTheatersInput,
  ListMoviesInput,
  ListShowtimesInput,
  ReserveTicketsInput,
  BookTicketsInput,
  ListTheatersOutput,
  ListMoviesOutput,
  ListShowtimesOutput,
  ReserveTicketsOutput,
  BookTicketsOutput,
  AMCError,
  MCPError,
  AMCApiResponse,
  UserSession
} from '../../src/types';

describe('Types Module', () => {
  describe('AMCMovie Interface', () => {
    it('should have all required properties', () => {
      const movie: AMCMovie = {
        id: 'test_id',
        title: 'Test Movie',
        runtime: 120,
        releaseDate: '2024-01-01'
      };

      expect(movie.id).toBe('test_id');
      expect(movie.title).toBe('Test Movie');
      expect(movie.runtime).toBe(120);
      expect(movie.releaseDate).toBe('2024-01-01');
    });

    it('should support optional properties', () => {
      const movie: AMCMovie = {
        id: 'test_id',
        title: 'Test Movie',
        runtime: 120,
        releaseDate: '2024-01-01',
        posterUrl: 'https://example.com/poster.jpg',
        synopsis: 'A test movie synopsis',
        rating: 'PG-13',
        genres: ['Action', 'Adventure']
      };

      expect(movie.posterUrl).toBe('https://example.com/poster.jpg');
      expect(movie.synopsis).toBe('A test movie synopsis');
      expect(movie.rating).toBe('PG-13');
      expect(movie.genres).toEqual(['Action', 'Adventure']);
    });
  });

  describe('AMCTheater Interface', () => {
    it('should have all required properties', () => {
      const theater: AMCTheater = {
        id: 'theater_001',
        name: 'Test Theater',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        }
      };

      expect(theater.id).toBe('theater_001');
      expect(theater.name).toBe('Test Theater');
      expect(theater.address.street).toBe('123 Test St');
      expect(theater.address.city).toBe('Test City');
      expect(theater.address.state).toBe('CA');
      expect(theater.address.zipCode).toBe('90210');
      expect(theater.address.country).toBe('USA');
    });

    it('should support optional properties', () => {
      const theater: AMCTheater = {
        id: 'theater_001',
        name: 'Test Theater',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        phone: '(555) 123-4567',
        amenities: ['IMAX', 'Dolby Cinema'],
        distance: 1.5
      };

      expect(theater.phone).toBe('(555) 123-4567');
      expect(theater.amenities).toEqual(['IMAX', 'Dolby Cinema']);
      expect(theater.distance).toBe(1.5);
    });
  });

  describe('AMCShowtime Interface', () => {
    it('should have all required properties', () => {
      const showtime: AMCShowtime = {
        id: 'showtime_001',
        movieId: 'movie_001',
        movieTitle: 'Test Movie',
        startDateTime: '2024-01-15T19:00:00Z',
        endDateTime: '2024-01-15T21:00:00Z',
        auditorium: 'Theater 1'
      };

      expect(showtime.id).toBe('showtime_001');
      expect(showtime.movieId).toBe('movie_001');
      expect(showtime.movieTitle).toBe('Test Movie');
      expect(showtime.startDateTime).toBe('2024-01-15T19:00:00Z');
      expect(showtime.endDateTime).toBe('2024-01-15T21:00:00Z');
      expect(showtime.auditorium).toBe('Theater 1');
    });

    it('should support optional properties', () => {
      const showtime: AMCShowtime = {
        id: 'showtime_001',
        movieId: 'movie_001',
        movieTitle: 'Test Movie',
        startDateTime: '2024-01-15T19:00:00Z',
        endDateTime: '2024-01-15T21:00:00Z',
        auditorium: 'Theater 1',
        format: 'IMAX',
        ticketPrice: 18.99,
        availableSeats: 45
      };

      expect(showtime.format).toBe('IMAX');
      expect(showtime.ticketPrice).toBe(18.99);
      expect(showtime.availableSeats).toBe(45);
    });
  });

  describe('Input Interfaces', () => {
    it('should validate ListTheatersInput', () => {
      const input: ListTheatersInput = { zip: '90210' };
      expect(input.zip).toBe('90210');
    });

    it('should validate ListMoviesInput', () => {
      const input: ListMoviesInput = {};
      expect(input).toEqual({});
    });

    it('should validate ListShowtimesInput', () => {
      const input: ListShowtimesInput = {
        theaterId: 'theater_001',
        date: '2024-01-15'
      };
      expect(input.theaterId).toBe('theater_001');
      expect(input.date).toBe('2024-01-15');
    });

    it('should validate ReserveTicketsInput', () => {
      const input: ReserveTicketsInput = {
        showtimeId: 'showtime_001',
        quantity: 2
      };
      expect(input.showtimeId).toBe('showtime_001');
      expect(input.quantity).toBe(2);
    });

    it('should validate BookTicketsInput', () => {
      const input: BookTicketsInput = {
        email: 'test@example.com',
        password: 'testpassword',
        theaterId: 'theater_001',
        showtimeId: 'showtime_001',
        seatCount: 2,
        seatPreferences: {
          row: 'middle',
          position: 'aisle'
        }
      };

      expect(input.email).toBe('test@example.com');
      expect(input.password).toBe('testpassword');
      expect(input.theaterId).toBe('theater_001');
      expect(input.showtimeId).toBe('showtime_001');
      expect(input.seatCount).toBe(2);
      expect(input.seatPreferences?.row).toBe('middle');
      expect(input.seatPreferences?.position).toBe('aisle');
    });
  });

  describe('Output Interfaces', () => {
    it('should validate ListTheatersOutput', () => {
      const output: ListTheatersOutput = {
        theaters: [],
        totalCount: 0
      };
      expect(output.theaters).toEqual([]);
      expect(output.totalCount).toBe(0);
    });

    it('should validate ListMoviesOutput', () => {
      const output: ListMoviesOutput = {
        movies: [],
        totalCount: 0
      };
      expect(output.movies).toEqual([]);
      expect(output.totalCount).toBe(0);
    });

    it('should validate ListShowtimesOutput', () => {
      const output: ListShowtimesOutput = {
        showtimes: [],
        totalCount: 0,
        theater: {
          id: 'theater_001',
          name: 'Test Theater',
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'CA',
            zipCode: '90210',
            country: 'USA'
          }
        }
      };
      expect(output.showtimes).toEqual([]);
      expect(output.totalCount).toBe(0);
      expect(output.theater.id).toBe('theater_001');
    });

    it('should validate ReserveTicketsOutput', () => {
      const output: ReserveTicketsOutput = {
        reservationId: 'res_001',
        status: 'pending',
        message: 'Reservation pending'
      };
      expect(output.reservationId).toBe('res_001');
      expect(output.status).toBe('pending');
      expect(output.message).toBe('Reservation pending');
    });

    it('should validate BookTicketsOutput', () => {
      const output: BookTicketsOutput = {
        success: true,
        confirmationNumber: 'CONF-001',
        bookingDetails: {
          movieTitle: 'Test Movie',
          theaterName: 'Test Theater',
          showtime: '2024-01-15T19:00:00Z',
          seats: ['A1', 'A2'],
          totalPrice: 35.98
        }
      };

      expect(output.success).toBe(true);
      expect(output.confirmationNumber).toBe('CONF-001');
      expect(output.bookingDetails?.movieTitle).toBe('Test Movie');
    });
  });

  describe('Error Interfaces', () => {
    it('should validate AMCError', () => {
      const error: AMCError = {
        code: 'API_ERROR',
        message: 'API request failed',
        details: { status: 500 }
      };
      expect(error.code).toBe('API_ERROR');
      expect(error.message).toBe('API request failed');
      expect(error.details).toEqual({ status: 500 });
    });

    it('should validate MCPError', () => {
      const error: MCPError = {
        error: 'VALIDATION_ERROR',
        message: 'Invalid input',
        code: 'ZOD_ERROR'
      };
      expect(error.error).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('ZOD_ERROR');
    });
  });

  describe('UserSession Interface', () => {
    it('should validate UserSession', () => {
      const session: UserSession = {
        userId: 'user_001',
        email: 'test@example.com',
        lastLogin: new Date(),
        isActive: true
      };

      expect(session.userId).toBe('user_001');
      expect(session.email).toBe('test@example.com');
      expect(session.lastLogin).toBeInstanceOf(Date);
      expect(session.isActive).toBe(true);
    });

    it('should support optional sessionToken', () => {
      const session: UserSession = {
        userId: 'user_001',
        email: 'test@example.com',
        sessionToken: 'token_123',
        lastLogin: new Date(),
        isActive: true
      };

      expect(session.sessionToken).toBe('token_123');
    });
  });
}); 