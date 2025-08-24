import { AMCClient } from '../../src/amcClient';
import { mockMovies, mockTheaters, mockShowtimes } from './mockData';

// Mock axios
jest.mock('axios');
const mockAxios = require('axios');

// Mock axios.create to return a mock client
const mockAxiosClient = {
  get: jest.fn(),
  interceptors: {
    response: {
      use: jest.fn()
    }
  }
};

// Set up the mock before any tests run
mockAxios.create.mockReturnValue(mockAxiosClient);

describe('AMCClient', () => {
  let amcClient: AMCClient;
  const testApiKey = 'A036EFEB-947A-41DB-B907-F5902C3EEBBB';

  beforeEach(() => {
    // Don't clear all mocks, just reset the specific mock client
    mockAxiosClient.get.mockReset();
    // Ensure the mock is still set up
    mockAxios.create.mockReturnValue(mockAxiosClient);
    amcClient = new AMCClient(testApiKey);
  });

  describe('Constructor', () => {
    it('should create client with API key', () => {
      expect(amcClient).toBeInstanceOf(AMCClient);
    });

    it('should throw error if no API key provided', () => {
      expect(() => new AMCClient('')).toThrow('AMC API key is required');
    });

    it('should use mocked axios client', () => {
      // Verify that the mock was called
      expect(mockAxios.create).toHaveBeenCalled();
      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.amctheatres.com/v2',
        timeout: 10000,
        headers: {
          'X-AMC-Vendor-Key': testApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    });
  });

  describe('getNowPlayingMovies', () => {
    it('should fetch now playing movies successfully', async () => {
      const mockResponse = {
        data: {
          _embedded: {
            movies: mockMovies
          },
          pagination: {
            page: 1,
            limit: 10,
            total: mockMovies.length,
            totalPages: 1
          }
        }
      };

      mockAxiosClient.get.mockResolvedValue(mockResponse);

      const result = await amcClient.getNowPlayingMovies();
      
      expect(result).toEqual(mockMovies);
      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.amctheatres.com/v2',
        timeout: 10000,
        headers: {
          'X-AMC-Vendor-Key': testApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    });

    it('should handle fallback response format', async () => {
      const mockResponse = {
        data: {
          movies: mockMovies
        }
      };

      mockAxiosClient.get.mockResolvedValue(mockResponse);

      const result = await amcClient.getNowPlayingMovies();
      
      expect(result).toEqual(mockMovies);
    });

    it('should handle empty response', async () => {
      const mockResponse = { data: { _embedded: { movies: [] } } };
      
      mockAxiosClient.get.mockResolvedValue(mockResponse);

      const result = await amcClient.getNowPlayingMovies();
      expect(result).toEqual([]);
    });
  });

  describe('getTheatersByZip', () => {
    it('should fetch theaters by ZIP code using location-based approach successfully', async () => {
      // Mock location suggestions response
      const mockLocationResponse = {
        data: {
          locations: [
            {
              latitude: 34.0522,
              longitude: -118.2437
            }
          ]
        }
      };

      // Mock theaters response
      const mockTheatersResponse = {
        data: {
          theatres: mockTheaters
        }
      };

      mockAxiosClient.get
        .mockResolvedValueOnce(mockLocationResponse)
        .mockResolvedValueOnce(mockTheatersResponse);

      const result = await amcClient.getTheatersByZip('90210');
      
      expect(result).toEqual(mockTheaters);
      expect(mockAxiosClient.get).toHaveBeenCalledWith('/v2/location-suggestions', {
        params: { query: '90210' }
      });
      expect(mockAxiosClient.get).toHaveBeenCalledWith('/v2/locations', {
        params: {
          longitude: -118.2437,
          latitude: 34.0522
        }
      });
    });

    it('should fallback to general theatres endpoint when location lookup fails', async () => {
      // Mock location suggestions response with no coordinates
      const mockLocationResponse = {
        data: {
          locations: []
        }
      };

      // Mock fallback theatres response
      const mockTheatersResponse = {
        data: {
          theatres: mockTheaters
        }
      };

      mockAxiosClient.get
        .mockResolvedValueOnce(mockLocationResponse)
        .mockResolvedValueOnce(mockTheatersResponse);

      const result = await amcClient.getTheatersByZip('90210');
      
      expect(result).toEqual(mockTheaters);
      expect(mockAxiosClient.get).toHaveBeenCalledWith('/v2/theatres', {
        params: {
          zipCode: '90210',
          radius: 25
        }
      });
    });

    it('should fallback to general theatres endpoint when location has no coordinates', async () => {
      // Mock location suggestions response with location but no coordinates
      const mockLocationResponse = {
        data: {
          locations: [
            {
              // No latitude/longitude
            }
          ]
        }
      };

      // Mock fallback theatres response
      const mockTheatersResponse = {
        data: {
          theatres: mockTheaters
        }
      };

      mockAxiosClient.get
        .mockResolvedValueOnce(mockLocationResponse)
        .mockResolvedValueOnce(mockTheatersResponse);

      const result = await amcClient.getTheatersByZip('90210');
      
      expect(result).toEqual(mockTheaters);
      expect(mockAxiosClient.get).toHaveBeenCalledWith('/v2/theatres', {
        params: {
          zipCode: '90210',
          radius: 25
        }
      });
    });

    it('should use custom radius when provided', async () => {
      const mockLocationResponse = {
        data: {
          locations: [
            {
              latitude: 34.0522,
              longitude: -118.2437
            }
          ]
        }
      };

      const mockTheatersResponse = {
        data: {
          theatres: mockTheaters
        }
      };

      mockAxiosClient.get
        .mockResolvedValueOnce(mockLocationResponse)
        .mockResolvedValueOnce(mockTheatersResponse);

      await amcClient.getTheatersByZip('90210', 50);
      
      expect(mockAxiosClient.get).toHaveBeenCalledWith('/v2/locations', {
        params: {
          longitude: -118.2437,
          latitude: 34.0522
        }
      });
    });
  });

  describe('getShowtimes', () => {
    it('should fetch showtimes successfully', async () => {
      const mockResponse = {
        data: {
          showtimes: mockShowtimes,
          pagination: {
            page: 1,
            limit: 10,
            total: mockShowtimes.length,
            totalPages: 1
          }
        }
      };

      mockAxiosClient.get.mockResolvedValue(mockResponse);

      const result = await amcClient.getShowtimes('theater_001', '2024-01-15');
      
      expect(result).toEqual(mockShowtimes);
    });

    it('should pass correct parameters to API', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        data: { showtimes: mockShowtimes }
      });

      mockAxiosClient.get.mockImplementation(mockGet);

      await amcClient.getShowtimes('theater_001', '2024-01-15');
      
      expect(mockGet).toHaveBeenCalledWith('/v2/theatres/theater_001/showtimes/2024-01-15', {
        params: {}
      });
    });

    it('should handle fallback response format', async () => {
      const mockResponse = {
        data: {
          data: mockShowtimes
        }
      };

      mockAxiosClient.get.mockResolvedValue(mockResponse);

      const result = await amcClient.getShowtimes('theater_001', '2024-01-15');
      
      expect(result).toEqual(mockShowtimes);
    });
  });

  describe('getTheaterById', () => {
    it('should fetch theater by ID successfully', async () => {
      const mockResponse = { data: mockTheaters[0] };

      mockAxiosClient.get.mockResolvedValue(mockResponse);

      const result = await amcClient.getTheaterById('theater_001');
      
      expect(result).toEqual(mockTheaters[0]);
    });

    it('should pass correct URL to API', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        data: mockTheaters[0]
      });

      mockAxiosClient.get.mockImplementation(mockGet);

      await amcClient.getTheaterById('theater_001');
      
      expect(mockGet).toHaveBeenCalledWith('/v2/theatres/theater_001');
    });
  });

  describe('getMovieById', () => {
    it('should fetch movie by ID successfully', async () => {
      const mockResponse = { data: mockMovies[0] };

      mockAxiosClient.get.mockResolvedValue(mockResponse);

      const result = await amcClient.getMovieById('movie_001');
      
      expect(result).toEqual(mockMovies[0]);
    });

    it('should pass correct URL to API', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        data: mockMovies[0]
      });

      mockAxiosClient.get.mockImplementation(mockGet);

      await amcClient.getMovieById('movie_001');
      
      expect(mockGet).toHaveBeenCalledWith('/v2/movies/movie_001');
    });
  });

  describe('validateApiKey', () => {
    it('should validate API key successfully', async () => {
      const mockResponse = { data: { data: [mockMovies[0]] } };

      mockAxiosClient.get.mockResolvedValue(mockResponse);

      const result = await amcClient.validateApiKey();
      
      expect(result).toBe(true);
    });

    it('should return false on validation failure', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      };

      mockAxiosClient.get.mockRejectedValue(mockError);

      const result = await amcClient.validateApiKey();
      
      expect(result).toBe(false);
    });

    it('should call correct endpoint for validation', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        data: { data: [mockMovies[0]] }
      });

      mockAxiosClient.get.mockImplementation(mockGet);

      await amcClient.validateApiKey();
      
      expect(mockGet).toHaveBeenCalledWith('/v2/movies/views/now-playing', {
        params: { limit: 1 }
      });
    });
  });

  describe('getComingSoonMovies', () => {
    it('should fetch coming soon movies successfully', async () => {
      const mockResponse = {
        data: {
          _embedded: {
            movies: mockMovies
          }
        }
      };

      mockAxiosClient.get.mockResolvedValue(mockResponse);

      const result = await amcClient.getComingSoonMovies();
      
      expect(result).toEqual(mockMovies);
      expect(mockAxiosClient.get).toHaveBeenCalledWith('/v2/movies/views/coming-soon');
    });

    it('should handle fallback response format', async () => {
      const mockResponse = {
        data: {
          movies: mockMovies
        }
      };

      mockAxiosClient.get.mockResolvedValue(mockResponse);

      const result = await amcClient.getComingSoonMovies();
      
      expect(result).toEqual(mockMovies);
    });

    it('should handle empty response', async () => {
      const mockResponse = { data: { _embedded: { movies: [] } } };
      
      mockAxiosClient.get.mockResolvedValue(mockResponse);

      const result = await amcClient.getComingSoonMovies();
      expect(result).toEqual([]);
    });
  });

  describe('getAdvanceMovies', () => {
    it('should fetch advance movies successfully', async () => {
      const mockResponse = {
        data: {
          _embedded: {
            movies: mockMovies
          }
        }
      };

      mockAxiosClient.get.mockResolvedValue(mockResponse);

      const result = await amcClient.getAdvanceMovies();
      
      expect(result).toEqual(mockMovies);
      expect(mockAxiosClient.get).toHaveBeenCalledWith('/v2/movies/views/advance');
    });

    it('should handle fallback response format', async () => {
      const mockResponse = {
        data: {
          movies: mockMovies
        }
      };

      mockAxiosClient.get.mockResolvedValue(mockResponse);

      const result = await amcClient.getAdvanceMovies();
      
      expect(result).toEqual(mockMovies);
    });
  });

  describe('getAllActiveMovies', () => {
    it('should fetch all active movies successfully', async () => {
      const mockResponse = {
        data: {
          _embedded: {
            movies: mockMovies
          }
        }
      };

      mockAxiosClient.get.mockResolvedValue(mockResponse);

      const result = await amcClient.getAllActiveMovies();
      
      expect(result).toEqual(mockMovies);
      expect(mockAxiosClient.get).toHaveBeenCalledWith('/v2/movies/views/all/active');
    });

    it('should handle fallback response format', async () => {
      const mockResponse = {
        data: {
          data: mockMovies
        }
      };

      mockAxiosClient.get.mockResolvedValue(mockResponse);

      const result = await amcClient.getAllActiveMovies();
      
      expect(result).toEqual(mockMovies);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const mockError = new Error('Network error');

      mockAxiosClient.get.mockRejectedValue(mockError);

      await expect(amcClient.getNowPlayingMovies()).rejects.toThrow('Network error');
    });
  });
}); 