import { AMCClient } from '../../../src/amcClient';
import { AMCMovie, AMCTheater, AMCShowtime } from '../../../src/types';

describe('AMC Client Integration Tests', () => {
  let amcClient: AMCClient;
  const apiKey = process.env.AMC_API_KEY;

  beforeAll(() => {
    if (!apiKey) {
      console.warn('AMC_API_KEY not set - skipping integration tests');
      return;
    }
    amcClient = new AMCClient(apiKey);
  });

  describe('API Key Validation', () => {
    it('should validate a real API key', async () => {
      if (!apiKey) {
        console.warn('Skipping test - no API key');
        return;
      }

      const isValid = await amcClient.validateApiKey();
      expect(isValid).toBe(true);
    }, 10000);
  });

  describe('Movies API', () => {
    it('should fetch real now playing movies', async () => {
      if (!apiKey) {
        console.warn('Skipping test - no API key');
        return;
      }

      const movies = await amcClient.getNowPlayingMovies();
      
      expect(Array.isArray(movies)).toBe(true);
      expect(movies.length).toBeGreaterThan(0);
      
      // Validate first movie structure
      const firstMovie = movies[0];
      expect(firstMovie).toHaveProperty('id');
      expect(firstMovie).toHaveProperty('title');
      expect(firstMovie).toHaveProperty('releaseDate');
      
      console.log(`Found ${movies.length} movies playing now`);
      console.log(`First movie: ${firstMovie.title} (${firstMovie.releaseDate})`);
    }, 15000);
  });

  describe('Theaters API', () => {
    it('should fetch theaters by ZIP code', async () => {
      if (!apiKey) {
        console.warn('Skipping test - no API key');
        return;
      }

      const testZip = process.env.AMC_TEST_ZIP || '10001'; // NYC default
      const theaters = await amcClient.getTheatersByZip(testZip);
      
      expect(Array.isArray(theaters)).toBe(true);
      expect(theaters.length).toBeGreaterThan(0);
      
      // Validate first theater structure
      const firstTheater = theaters[0];
      expect(firstTheater).toHaveProperty('id');
      expect(firstTheater).toHaveProperty('name');
      expect(firstTheater).toHaveProperty('address');
      
      console.log(`Found ${theaters.length} theaters near ZIP ${testZip}`);
      console.log(`First theater: ${firstTheater.name}`);
    }, 15000);

    it('should fetch theater details by ID', async () => {
      if (!apiKey) {
        console.warn('Skipping test - no API key');
        return;
      }

      // First get a list of theaters to get a valid ID
      const testZip = process.env.AMC_TEST_ZIP || '10001';
      const theaters = await amcClient.getTheatersByZip(testZip);
      
      if (theaters.length === 0) {
        console.warn('No theaters found for testing');
        return;
      }

      const theaterId = theaters[0].id;
      const theater = await amcClient.getTheaterById(theaterId);
      
      expect(theater).toBeDefined();
      expect(theater.id).toBe(theaterId);
      expect(theater).toHaveProperty('name');
      expect(theater).toHaveProperty('address');
      
      console.log(`Retrieved theater: ${theater.name}`);
    }, 20000);
  });

  describe('Showtimes API', () => {
    it('should fetch showtimes for a movie and theater', async () => {
      if (!apiKey) {
        console.warn('Skipping test - no API key');
        return;
      }

      // Get a movie and theater to test with
      const movies = await amcClient.getNowPlayingMovies();
      const testZip = process.env.AMC_TEST_ZIP || '10001';
      const theaters = await amcClient.getTheatersByZip(testZip);
      
      if (movies.length === 0 || theaters.length === 0) {
        console.warn('No movies or theaters found for testing');
        return;
      }

      const movieId = movies[0].id;
      const theaterId = theaters[0].id;
      const date = new Date().toISOString().split('T')[0]; // Today's date
      
      const showtimes = await amcClient.getShowtimes(movieId, theaterId, date);
      
      expect(Array.isArray(showtimes)).toBe(true);
      
      if (showtimes.length > 0) {
        // Validate first showtime structure
        const firstShowtime = showtimes[0];
        expect(firstShowtime).toHaveProperty('id');
        expect(firstShowtime).toHaveProperty('time');
        expect(firstShowtime).toHaveProperty('movieId');
        expect(firstShowtime).toHaveProperty('theaterId');
        
        console.log(`Found ${showtimes.length} showtimes for ${movies[0].title} at ${theaters[0].name}`);
        console.log(`First showtime: ${firstShowtime.time}`);
      } else {
        console.log(`No showtimes found for ${movies[0].title} at ${theaters[0].name} on ${date}`);
      }
    }, 20000);
  });

  describe('Error Handling', () => {
    it('should handle invalid API key gracefully', async () => {
      const invalidClient = new AMCClient('invalid_key');
      
      await expect(invalidClient.validateApiKey()).resolves.toBe(false);
    }, 10000);

    it('should handle invalid ZIP code gracefully', async () => {
      if (!apiKey) {
        console.warn('Skipping test - no API key');
        return;
      }

      const invalidZip = '00000'; // Invalid ZIP
      
      try {
        const theaters = await amcClient.getTheatersByZip(invalidZip);
        // Some APIs return empty arrays for invalid ZIPs
        expect(Array.isArray(theaters)).toBe(true);
        console.log(`Invalid ZIP ${invalidZip} returned ${theaters.length} theaters`);
      } catch (error) {
        // Some APIs throw errors for invalid ZIPs
        expect(error).toBeDefined();
        console.log(`Invalid ZIP ${invalidZip} threw error: ${error.message}`);
      }
    }, 15000);
  });
}); 