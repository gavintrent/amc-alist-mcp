// Mock data for testing AMC MCP Server functions
// This allows us to test functionality without real API access

import {
  AMCMovie,
  AMCTheater,
  AMCShowtime,
  ListTheatersInput,
  ListMoviesInput,
  ListShowtimesInput,
  ReserveTicketsInput,
  BookTicketsInput
} from '../../src/types';

// Mock AMC API responses
export const mockMovies: AMCMovie[] = [
  {
    id: 'movie_001',
    title: 'Dune: Part Two',
    runtime: 166,
    releaseDate: '2024-03-01',
    posterUrl: 'https://example.com/dune2.jpg',
    synopsis: 'Paul Atreides unites with Chani and the Fremen to lead the rebellion against the Emperor.',
    rating: 'PG-13',
    genres: ['Sci-Fi', 'Adventure', 'Drama']
  },
  {
    id: 'movie_002',
    title: 'The Batman',
    runtime: 176,
    releaseDate: '2024-03-04',
    posterUrl: 'https://example.com/batman.jpg',
    synopsis: 'Batman ventures into Gotham City\'s underworld when a sadistic killer leaves behind a trail of cryptic clues.',
    rating: 'PG-13',
    genres: ['Action', 'Crime', 'Drama']
  },
  {
    id: 'movie_003',
    title: 'Spider-Man: No Way Home',
    runtime: 148,
    releaseDate: '2024-03-08',
    posterUrl: 'https://example.com/spiderman.jpg',
    synopsis: 'Spider-Man\'s identity is revealed and he asks Doctor Strange for help.',
    rating: 'PG-13',
    genres: ['Action', 'Adventure', 'Sci-Fi']
  }
];

export const mockTheaters: AMCTheater[] = [
  {
    id: 'theater_001',
    name: 'AMC Century City 15',
    address: {
      street: '10250 Santa Monica Blvd',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90067',
      country: 'USA'
    },
    phone: '(310) 289-4262',
    amenities: ['IMAX', 'Dolby Cinema', 'Recliner Seats', 'Food & Beverage'],
    distance: 0.5
  },
  {
    id: 'theater_002',
    name: 'AMC Burbank 16',
    address: {
      street: '125 E Palm Ave',
      city: 'Burbank',
      state: 'CA',
      zipCode: '91502',
      country: 'USA'
    },
    phone: '(818) 953-9262',
    amenities: ['IMAX', 'Dolby Cinema', 'Recliner Seats'],
    distance: 2.1
  },
  {
    id: 'theater_003',
    name: 'AMC Universal CityWalk 19',
    address: {
      street: '100 Universal City Plaza',
      city: 'Universal City',
      state: 'CA',
      zipCode: '91608',
      country: 'USA'
    },
    phone: '(818) 622-4455',
    amenities: ['IMAX', '4DX', 'Dolby Cinema', 'Recliner Seats'],
    distance: 3.2
  }
];

export const mockShowtimes: AMCShowtime[] = [
  {
    id: 'showtime_001',
    movieId: 'movie_001',
    movieTitle: 'Dune: Part Two',
    startDateTime: '2024-01-15T19:00:00Z',
    endDateTime: '2024-01-15T21:46:00Z',
    auditorium: 'Theater 1',
    format: 'IMAX',
    ticketPrice: 18.99,
    availableSeats: 45
  },
  {
    id: 'showtime_002',
    movieId: 'movie_001',
    movieTitle: 'Dune: Part Two',
    startDateTime: '2024-01-15T22:00:00Z',
    endDateTime: '2024-01-16T00:46:00Z',
    auditorium: 'Theater 2',
    format: 'Dolby Cinema',
    ticketPrice: 20.99,
    availableSeats: 32
  },
  {
    id: 'showtime_003',
    movieId: 'movie_002',
    movieTitle: 'The Batman',
    startDateTime: '2024-01-15T19:30:00Z',
    endDateTime: '2024-01-15T22:26:00Z',
    auditorium: 'Theater 3',
    format: 'Standard',
    ticketPrice: 15.99,
    availableSeats: 67
  }
];

// Mock input data for testing
export const mockListTheatersInput: ListTheatersInput = {
  zip: '90210'
};

export const mockListMoviesInput: ListMoviesInput = {};

export const mockListShowtimesInput: ListShowtimesInput = {
  theaterId: 'theater_001',
  date: '2024-01-15'
};

export const mockReserveTicketsInput: ReserveTicketsInput = {
  showtimeId: 'showtime_001',
  quantity: 2
};

export const mockBookTicketsInput: BookTicketsInput = {
  email: 'test@example.com',
  password: 'testpassword123',
  theaterId: 'theater_001',
  showtimeId: 'showtime_001',
  seatCount: 2,
  seatPreferences: {
    row: 'middle',
    position: 'aisle'
  }
};

// Mock API responses
export const mockAMCApiResponse = {
  movies: mockMovies,
  theaters: mockTheaters,
  showtimes: mockShowtimes
};

// Mock error responses
export const mockAMCError = {
  code: 'API_ERROR',
  message: 'Mock API error for testing',
  details: { status: 500, endpoint: '/test' }
};

export const mockMCPError = {
  error: 'VALIDATION_ERROR',
  message: 'Invalid input parameters',
  code: 'Zod validation failed'
};

// Mock successful booking response
export const mockSuccessfulBooking = {
  success: true,
  confirmationNumber: 'CONF-2024-001',
  bookingDetails: {
    movieTitle: 'Dune: Part Two',
    theaterName: 'AMC Century City 15',
    showtime: '2024-01-15T19:00:00Z',
    seats: ['A5', 'A6'],
    totalPrice: 37.98
  }
};

// Mock failed booking response
export const mockFailedBooking = {
  success: false,
  errorMessage: 'Mock booking failure for testing'
}; 