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
  const testApiKey = 'test_api_key_123';

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
          data: mockMovies,
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

    it('should handle empty response', async () => {
      const mockResponse = { data: { data: [] } };
      
      mockAxiosClient.get.mockResolvedValue(mockResponse);

      const result = await amcClient.getNowPlayingMovies();
      expect(result).toEqual([]);
    });
  });

  describe('getTheatersByZip', () => {
    it('should fetch theaters by ZIP code successfully', async () => {
      const mockResponse = {
        data: {
          data: mockTheaters,
          pagination: {
            page: 1,
            limit: 10,
            total: mockTheaters.length,
            totalPages: 1
          }
        }
      };

      mockAxiosClient.get.mockResolvedValue(mockResponse);

      const result = await amcClient.getTheatersByZip('90210');
      
      expect(result).toEqual(mockTheaters);
    });

    it('should pass correct parameters to API', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        data: { data: mockTheaters }
      });

      mockAxiosClient.get.mockImplementation(mockGet);

      await amcClient.getTheatersByZip('90210');
      
      expect(mockGet).toHaveBeenCalledWith('/theaters', {
        params: {
          zipCode: '90210',
          radius: 25
        }
      });
    });
  });

  describe('getShowtimes', () => {
    it('should fetch showtimes successfully', async () => {
      const mockResponse = {
        data: {
          data: mockShowtimes,
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
        data: { data: mockShowtimes }
      });

      mockAxiosClient.get.mockImplementation(mockGet);

      await amcClient.getShowtimes('theater_001', '2024-01-15');
      
      expect(mockGet).toHaveBeenCalledWith('/theaters/theater_001/showtimes', {
        params: {
          date: '2024-01-15'
        }
      });
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
      
      expect(mockGet).toHaveBeenCalledWith('/theaters/theater_001');
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
      
      expect(mockGet).toHaveBeenCalledWith('/movies/movie_001');
    });
  });

  describe('searchMovies', () => {
    it('should search movies successfully', async () => {
      const mockResponse = {
        data: {
          data: mockMovies,
          pagination: {
            page: 1,
            limit: 10,
            total: mockMovies.length,
            totalPages: 1
          }
        }
      };

      mockAxiosClient.get.mockResolvedValue(mockResponse);

      const result = await amcClient.searchMovies('Dune');
      
      expect(result).toEqual(mockMovies);
    });

    it('should pass search query to API', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        data: { data: mockMovies }
      });

      mockAxiosClient.get.mockImplementation(mockGet);

      await amcClient.searchMovies('Dune');
      
      expect(mockGet).toHaveBeenCalledWith('/movies/search', {
        params: {
          q: 'Dune'
        }
      });
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
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const mockError = new Error('Network error');

      mockAxiosClient.get.mockRejectedValue(mockError);

      await expect(amcClient.getNowPlayingMovies()).rejects.toThrow('Network error');
    });
  });
}); 