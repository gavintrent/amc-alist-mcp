import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  AMCMovie,
  AMCTheater,
  AMCShowtime,
  AMCApiResponse,
  AMCError,
  AMCLocationSuggestionsResponse,
  AMCLocationsResponse,
  AMCShowtimesResponse,
  AMCLocationTheater
} from './types';

export class AMCClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('AMC API key is required');
    }

    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: 'https://api.amctheatres.com/v2',
      timeout: 10000,
      headers: {
        'X-AMC-Vendor-Key': this.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response) {
          const amcError: AMCError = {
            code: error.response.status.toString(),
            message: error.response.data?.message || 'AMC API request failed',
            details: error.response.data
          };
          throw amcError;
        }
        throw error;
      }
    );
  }

  /**
   * Get now-playing movies from AMC
   */
  async getNowPlayingMovies(): Promise<AMCMovie[]> {
    try {
      const response = await this.client.get<AMCApiResponse<AMCMovie[]>>('/movies/views/now-playing');
      // AMC API uses HAL format with movies in _embedded.movies
      if (response.data._embedded && response.data._embedded.movies) {
        return response.data._embedded.movies;
      }
      // Fallback to other possible locations
      return response.data.movies || response.data.data || [];
    } catch (error) {
      console.error('Error fetching now-playing movies:', error);
      throw error;
    }
  }

  /**
   * Get theaters near a specific ZIP code, and optionally a radius
   * Note: AMC API uses location-based endpoints for ZIP code searches
   */
  async getTheatersByZip(zip: string, rad: number = 25): Promise<AMCTheater[]> {
    try {
      // First, get location suggestions for the ZIP code
      const locationResponse = await this.client.get<AMCLocationSuggestionsResponse>('/location-suggestions', {
        params: {
          query: zip,
          'page-size': 10,
          'page-number': 1
        }
      });
      
      // Check if we got location suggestions with coordinates
      if (locationResponse.data && 
          locationResponse.data._embedded && 
          locationResponse.data._embedded.suggestions && 
          locationResponse.data._embedded.suggestions.length > 0) {
        
        const suggestion = locationResponse.data._embedded.suggestions[0]; // Get first suggestion
        
        // Extract coordinates from the locations link
        if (suggestion && suggestion._links['https://api.amctheatres.com/rels/v2/locations']) {
          const locationsLink = suggestion._links['https://api.amctheatres.com/rels/v2/locations'];
          if (locationsLink && locationsLink.href) {
            // Parse the URL to extract latitude and longitude
            const url = new URL(locationsLink.href);
            const latitude = url.searchParams.get('latitude');
            const longitude = url.searchParams.get('longitude');
            
            if (latitude && longitude) {
              // Now call the locations endpoint with the coordinates
              const theatersResponse = await this.client.get<AMCLocationsResponse>('/locations', {
                params: {
                  latitude: parseFloat(latitude),
                  longitude: parseFloat(longitude),
                  'page-size': 50, // Get more theaters
                  'page-number': 1
                }
              });
              
              if (theatersResponse.data && 
                  theatersResponse.data._embedded && 
                  theatersResponse.data._embedded.locations) {
                
                // Transform the API response to our standard AMCTheater format
                return theatersResponse.data._embedded.locations.map(location => ({
                  id: location._embedded.theatre.id,
                  name: location._embedded.theatre.name,
                  address: {
                    street: location._embedded.theatre.location.addressLine1,
                    city: location._embedded.theatre.location.city,
                    state: location._embedded.theatre.location.state,
                    zipCode: location._embedded.theatre.location.postalCode,
                    country: location._embedded.theatre.location.country
                  },
                  phone: location._embedded.theatre.guestServicesPhoneNumber,
                  amenities: location._embedded.theatre.attributes.map(attr => attr.name),
                  distance: location.distance
                }));
              }
            }
          }
        }
      }
      
      // Fallback: if we couldn't get coordinates, try the general theatres endpoint
      console.warn(`Could not get coordinates for ZIP ${zip}, trying fallback endpoint`);
      const response = await this.client.get<AMCApiResponse<AMCTheater[]>>('/theatres', {
        params: {
          zipCode: zip,
          radius: rad
        }
      });
      return response.data.theatres || response.data.data || [];
    } catch (error) {
      console.error(`Error fetching theaters for ZIP ${zip}:`, error);
      throw error;
    }
  }

  /**
   * Get theaters near specific coordinates
   */
  async getTheatersByCoordinates(latitude: number, longitude: number, pageSize: number = 50): Promise<AMCTheater[]> {
    try {
      const response = await this.client.get<AMCLocationsResponse>('/locations', {
        params: {
          latitude,
          longitude,
          'page-size': pageSize,
          'page-number': 1
        }
      });
      
      if (response.data && 
          response.data._embedded && 
          response.data._embedded.locations) {
        
        // Transform the API response to our standard AMCTheater format
        return response.data._embedded.locations.map(location => ({
          id: location._embedded.theatre.id,
          name: location._embedded.theatre.name,
          address: {
            street: location._embedded.theatre.location.addressLine1,
            city: location._embedded.theatre.location.city,
            state: location._embedded.theatre.location.state,
            zipCode: location._embedded.theatre.location.postalCode,
            country: location._embedded.theatre.location.country
          },
          phone: location._embedded.theatre.guestServicesPhoneNumber,
          amenities: location._embedded.theatre.attributes.map(attr => attr.name),
          distance: location.distance
        }));
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching theaters for coordinates ${latitude}, ${longitude}:`, error);
      throw error;
    }
  }

  /**
   * Get showtimes for a specific theater on a given date
   * Note: AMC API uses "theatres" (British spelling) not "theaters"
   */
  async getShowtimes(theaterId: string, date: string): Promise<AMCShowtime[]> {
    try {
      const response = await this.client.get<AMCShowtimesResponse>(`/theatres/${theaterId}/showtimes/${date}`, {
        params: {
          // Date is now part of the URL path, not a query parameter
        }
      });
      
      // AMC API returns showtimes in _embedded.showtimes
      if (response.data && response.data._embedded && response.data._embedded.showtimes) {
        return response.data._embedded.showtimes;
      }
      
      // Return empty array if no showtimes found
      return [];
    } catch (error) {
      console.error(`Error fetching showtimes for theater ${theaterId} on ${date}:`, error);
      throw error;
    }
  }

  /**
   * Get theater details by ID
   * Note: AMC API uses "theatres" (British spelling) not "theaters"
   */
  async getTheaterById(theaterId: string): Promise<AMCTheater> {
    try {
      const response = await this.client.get<AMCLocationTheater>(`/theatres/${theaterId}`);
      const rawTheater = response.data;
      
      // Transform the raw AMC API response to match our AMCTheater interface
      return {
        id: rawTheater.id,
        name: rawTheater.name,
        address: {
          street: rawTheater.location.addressLine1,
          city: rawTheater.location.city,
          state: rawTheater.location.state,
          zipCode: rawTheater.location.postalCode,
          country: rawTheater.location.country
        },
        phone: rawTheater.guestServicesPhoneNumber,
        amenities: rawTheater.attributes.map(attr => attr.name)
      };
    } catch (error) {
      console.error(`Error fetching theater ${theaterId}:`, error);
      throw error;
    }
  }

  /**
   * Get movie details by ID
   */
  async getMovieById(movieId: string): Promise<AMCMovie> {
    try {
      const response = await this.client.get<AMCMovie>(`/movies/${movieId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching movie ${movieId}:`, error);
      throw error;
    }
  }

  /**
   * Validate API key by making a simple request
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.client.get('/movies/views/now-playing', { params: { limit: 1 } });
      return true;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  /**
   * Get coming soon movies
   */
  async getComingSoonMovies(): Promise<AMCMovie[]> {
    try {
      const response = await this.client.get<AMCApiResponse<AMCMovie[]>>('/movies/views/coming-soon');
      // AMC API uses HAL format with movies in _embedded.movies
      if (response.data._embedded && response.data._embedded.movies) {
        return response.data._embedded.movies;
      }
      // Fallback to other possible locations
      return response.data.movies || response.data.data || [];
    } catch (error) {
      console.error('Error fetching coming soon movies:', error);
      throw error;
    }
  }

  /**
   * Get advance movies (movies available for advance tickets)
   */
  async getAdvanceMovies(): Promise<AMCMovie[]> {
    try {
      const response = await this.client.get<AMCApiResponse<AMCMovie[]>>('/movies/views/advance');
      // AMC API uses HAL format with movies in _embedded.movies
      if (response.data._embedded && response.data._embedded.movies) {
        return response.data._embedded.movies;
      }
      // Fallback to other possible locations
      return response.data.movies || response.data.data || [];
    } catch (error) {
      console.error('Error fetching advance movies:', error);
      throw error;
    }
  }

  /**
   * Get all active movies
   */
  async getAllActiveMovies(): Promise<AMCMovie[]> {
    try {
      const response = await this.client.get<AMCApiResponse<AMCMovie[]>>('/movies/views/all/active');
      // AMC API uses HAL format with movies in _embedded.movies
      if (response.data._embedded && response.data._embedded.movies) {
        return response.data._embedded.movies;
      }
      // Fallback to other possible locations
      return response.data.movies || response.data.data || [];
    } catch (error) {
      console.error('Error fetching all active movies:', error);
      throw error;
    }
  }
} 