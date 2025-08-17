import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  AMCMovie,
  AMCTheater,
  AMCShowtime,
  AMCApiResponse,
  AMCError
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
      const response = await this.client.get<AMCApiResponse<AMCMovie[]>>('/movies/now-playing');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching now-playing movies:', error);
      throw error;
    }
  }

  /**
   * Get theaters near a specific ZIP code, and optionally a radius
   */
  async getTheatersByZip(zip: string, rad: number = 25): Promise<AMCTheater[]> {
    try {
      const response = await this.client.get<AMCApiResponse<AMCTheater[]>>('/theaters', {
        params: {
          zipCode: zip,
          radius: rad // default to 25 mile radius
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching theaters for ZIP ${zip}:`, error);
      throw error;
    }
  }

  /**
   * Get showtimes for a specific theater on a given date
   */
  async getShowtimes(theaterId: string, date: string): Promise<AMCShowtime[]> {
    try {
      const response = await this.client.get<AMCApiResponse<AMCShowtime[]>>(`/theaters/${theaterId}/showtimes`, {
        params: {
          date: date
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching showtimes for theater ${theaterId} on ${date}:`, error);
      throw error;
    }
  }

  /**
   * Get theater details by ID
   */
  async getTheaterById(theaterId: string): Promise<AMCTheater> {
    try {
      const response = await this.client.get<AMCTheater>(`/theaters/${theaterId}`);
      return response.data;
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
   * Search movies by title
   */
  async searchMovies(query: string): Promise<AMCMovie[]> {
    try {
      const response = await this.client.get<AMCApiResponse<AMCMovie[]>>('/movies/search', {
        params: {
          q: query
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error(`Error searching movies for "${query}":`, error);
      throw error;
    }
  }

  /**
   * Validate API key by making a simple request
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.client.get('/movies/now-playing', { params: { limit: 1 } });
      return true;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }
} 