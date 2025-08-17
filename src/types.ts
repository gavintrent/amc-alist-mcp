// AMC API Response Types
export interface AMCMovie {
  id: string;
  title: string;
  runtime: number; // in minutes
  releaseDate: string;
  posterUrl?: string;
  synopsis?: string;
  rating?: string;
  genres?: string[];
}

export interface AMCTheater {
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
  distance?: number; // from search location
}

export interface AMCShowtime {
  id: string;
  movieId: string;
  movieTitle: string;
  startDateTime: string; // ISO 8601 format
  endDateTime: string; // ISO 8601 format
  auditorium: string;
  format?: string; // IMAX, Dolby, etc.
  ticketPrice?: number;
  availableSeats?: number;
}

// MCP Tool Input/Output Types
export interface ListTheatersInput {
  zip: string;
}

export interface ListTheatersOutput {
  theaters: AMCTheater[];
  totalCount: number;
}

export interface ListMoviesInput {
  // No input parameters needed for now-playing movies
}

export interface ListMoviesOutput {
  movies: AMCMovie[];
  totalCount: number;
}

export interface ListShowtimesInput {
  theaterId: string;
  date: string; // YYYY-MM-DD format
}

export interface ListShowtimesOutput {
  showtimes: AMCShowtime[];
  totalCount: number;
  theater: AMCTheater;
}

export interface ReserveTicketsInput {
  showtimeId: string;
  quantity: number;
  // Future: user authentication, seat selection, etc.
}

export interface ReserveTicketsOutput {
  reservationId: string;
  status: 'pending' | 'confirmed' | 'failed';
  message: string;
}

// Error Types
export interface AMCError {
  code: string;
  message: string;
  details?: any;
}

export interface MCPError {
  error: string;
  message: string;
  code?: string;
}

// API Response Wrapper
export interface AMCApiResponse<T> {
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta?: any;
} 