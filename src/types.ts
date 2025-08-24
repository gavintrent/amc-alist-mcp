// AMC API Response Types
export interface AMCMovie {
  id: string;
  name: string; // AMC uses 'name' instead of 'title'
  title?: string; // Keep for backward compatibility
  runTime: number; // AMC uses 'runTime' instead of 'runtime'
  runtime?: number; // Keep for backward compatibility
  releaseDateUtc: string; // AMC uses 'releaseDateUtc'
  releaseDate?: string; // Keep for backward compatibility
  posterDynamic?: string; // AMC uses 'posterDynamic' instead of 'posterUrl'
  posterUrl?: string; // Keep for backward compatibility
  synopsis?: string;
  mpaaRating?: string; // AMC uses 'mpaaRating' instead of 'rating'
  rating?: string; // Keep for backward compatibility
  genre?: string; // AMC uses 'genre' (singular) instead of 'genres'
  genres?: string[]; // Keep for backward compatibility
  slug?: string;
  sortableName?: string;
  starringActors?: string;
  directors?: string;
  score?: number;
  hasScheduledShowtimes?: boolean;
  availableForAList?: boolean;
  preferredMediaType?: string;
  websiteUrl?: string;
  showtimesUrl?: string;
  distributorId?: number;
  distributorCode?: string;
  vuduUrl?: string;
  earliestShowingUtc?: string;
  onlineTicketAvailabilityDateUtc?: string;
  attributes?: Array<{
    code: string;
    name: string;
    description?: string;
  }>;
  media?: {
    posterThumbnail?: string;
    posterStandard?: string;
    posterLarge?: string;
    posterDynamic?: string;
    posterAlternateDynamic?: string;
    poster3DDynamic?: string;
    posterIMAXDynamic?: string;
    heroDesktopDynamic?: string;
    heroMobileDynamic?: string;
    trailerHd?: string;
    trailerMp4?: string;
    trailerFlv?: string;
    trailerTeaserDynamic?: string;
    trailerAlternateDynamic?: string;
    primaryTrailerExternalVideoId?: string;
    primaryTrailerVideoId?: string;
  };
  _links?: any;
}

// Location suggestions API response types
export interface AMCLocationSuggestion {
  title: string;
  type: string;
  _links: {
    self: {
      href: string;
      templated: boolean;
    };
    'https://api.amctheatres.com/rels/v2/locations': {
      href: string;
      templated: boolean;
    };
  };
}

export interface AMCLocationSuggestionsResponse {
  pageSize: number;
  pageNumber: number;
  count: number;
  _embedded: {
    suggestions: AMCLocationSuggestion[];
  };
  _links: {
    self: {
      href: string;
      templated: boolean;
    };
  };
}

// Locations API response types
export interface AMCLocationTheater {
  id: string;
  longName: string;
  name: string;
  guestServicesPhoneNumber: string;
  utcOffset: string;
  timezone: string;
  slug: string;
  facebookUrl: string;
  websiteUrl: string;
  ticketable: string;
  attributes: Array<{
    code: string;
    name: string;
    description: string;
  }>;
  location: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    cityUrlSuffixText: string;
    postalCode: string;
    state: string;
    stateName: string;
    stateUrlSuffixText: string;
    country: string;
    latitude: number;
    longitude: number;
    directionsUrl: string;
    marketName: string;
    marketUrlSuffixText: string;
  };
  media: {
    theatreImageIcon: string;
    theatreImageLarge: string;
    theatreImageStandard: string;
    theatreImageThumbnail: string;
    heroDesktopDynamic: string;
    heroMobileDynamic: string;
    interiorDynamic: string;
    exteriorDynamic: string;
    promotionDynamic: string;
  };
  _links: any;
  redemptionMethods: string[];
  westWorldMediaNumber?: number;
  loyaltyVersionId: number;
  onlineConcessions: boolean;
  deliveryToSeat: boolean;
  concessionsDeliveryOptions: string[];
  convenienceFeeTaxPercent: number;
  convenienceFeeTaxFlatAmount: number;
  brand: string;
  subscriptionUsageLevel: number;
}

export interface AMCLocation {
  rank: number;
  distance: number;
  _embedded: {
    theatre: AMCLocationTheater;
  };
  _links: any;
}

export interface AMCLocationsResponse {
  pageSize: number;
  pageNumber: number;
  count: number;
  latitude: number;
  longitude: number;
  _embedded: {
    locations: AMCLocation[];
  };
  _links: any;
}

export interface AMCShowtimesResponse {
  pageSize: number;
  pageNumber: number;
  count: number;
  lastUpdatedDateUtc: string;
  _embedded: {
    showtimes: AMCShowtime[];
  };
  _links: any;
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
  id: number;
  internalReleaseNumber: number;
  performanceNumber: number;
  movieId: number;
  movieName: string;
  sortableMovieName: string;
  genre: string;
  showDateTimeUtc: string;
  showDateTimeLocal: string;
  sellUntilDateTimeUtc: string;
  isSoldOut: boolean;
  isAlmostSoldOut: boolean;
  isCanceled: boolean;
  utcOffset: string;
  theatreId: number;
  auditorium: number;
  layoutId: number;
  layoutVersionNumber: number;
  runTime: number;
  mpaaRating: string;
  premiumFormat: string;
  purchaseUrl: string;
  mobilePurchaseUrl: string;
  movieUrl: string;
  wwmReleaseNumber: number;
  lastUpdatedDateUtc: string;
  isDiscountMatineePriced: boolean;
  discountMatineeMessage: string;
  visibilityDateTimeUtc?: string;
  isDiscountDaysEligible: boolean;
  estimatedFees: Array<{
    cost: number;
    tax: number;
    name: string;
    quantity: number;
  }>;
  attributes: Array<{
    code: string;
    name: string;
    description: string;
  }>;
  ticketPrices: Array<{
    price: number;
    type: string;
    sku: string;
    tax: number;
    priceCode: string;
    posType: string;
    agePolicy?: string;
  }>;
  media: {
    heroDesktopDynamic: string;
    heroMobileDynamic: string;
    posterDynamic: string;
    posterAlternateDynamic: string;
    poster3DDynamic: string;
    posterIMAXDynamic: string;
    trailerTeaserDynamic: string;
    trailerAlternateDynamic: string;
    posterDynamic180X74: string;
  };
  languages: Record<string, any>;
  _links: any;
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

// Transformed movie data for MCP tools (normalized field names)
export interface TransformedMovie {
  id: string;
  title: string;
  runtime: number;
  releaseDate: string;
  posterUrl?: string;
  synopsis?: string;
  rating?: string;
  genres?: string[];
}

export interface ListMoviesOutput {
  movies: TransformedMovie[];
  totalCount: number;
}

export interface ListShowtimesInput {
  theaterId: string;
  date: string; // YYYY-MM-DD format
}

export interface ListShowtimesOutput {
  showtimes: TransformedShowtime[];
  totalCount: number;
  theater: AMCTheater;
}

// Transformed showtime data for MCP tools (simplified field names)
export interface TransformedShowtime {
  id: number;
  movieId: number;
  movieTitle: string;
  startDateTime: string;
  endDateTime: string;
  auditorium: string;
  format?: string;
  ticketPrice?: number;
  availableSeats?: number;
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

// New booking types for Playwright automation
export interface BookTicketsInput {
  email: string;
  password: string;
  theaterId: string;
  showtimeId: string;
  seatCount: number;
  seatPreferences?: {
    row?: 'front' | 'middle' | 'back';
    position?: 'aisle' | 'center';
  };
}

export interface BookTicketsOutput {
  success: boolean;
  confirmationNumber?: string;
  errorMessage?: string;
  bookingDetails?: {
    movieTitle: string;
    theaterName: string;
    showtime: string;
    seats: string[];
    totalPrice: number;
  };
}

// Playwright session management
export interface UserSession {
  userId: string;
  email: string;
  sessionToken?: string;
  lastLogin: Date;
  isActive: boolean;
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
  data?: T;
  movies?: T; // For movie endpoints
  theaters?: T; // For theater endpoints (American spelling)
  theatres?: T; // For theater endpoints (British spelling - AMC uses this)
  showtimes?: T; // For showtime endpoints
  locations?: T; // For location-based endpoints
  _embedded?: {
    movies?: T;
    theaters?: T;
    theatres?: T;
    showtimes?: T;
    locations?: T;
  };
  pageSize?: number;
  pageNumber?: number;
  count?: number;
  _links?: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta?: any;
} 