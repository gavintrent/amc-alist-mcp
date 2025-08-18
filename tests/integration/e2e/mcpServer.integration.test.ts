import request from 'supertest';
import { Express } from 'express';
import { app } from '../../../src/index';
import { AMCClient } from '../../../src/amcClient';

describe('MCP Server End-to-End Integration Tests', () => {
  let server: any;
  let amcClient: AMCClient;
  
  const apiKey = process.env.AMC_API_KEY;
  const testZip = process.env.AMC_TEST_ZIP || '10001';

  beforeAll(async () => {
    if (!apiKey) {
      console.warn('AMC_API_KEY not set - skipping integration tests');
      return;
    }

    // Create server instance
    server = app.listen(0); // Use random port
    
    // Create AMC client for direct testing
    amcClient = new AMCClient(apiKey);
    
    console.log(`MCP Server started for integration testing`);
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  describe('Server Health and Discovery', () => {
    it('should respond to health check', async () => {
      if (!apiKey) {
        console.warn('Warning: Skipping test - no API key');
        return;
      }

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
      
      console.log(`Success: Server health check passed`);
    });

    it('should provide MCP manifest', async () => {
      if (!apiKey) {
        console.warn('Warning: Skipping test - no API key');
        return;
      }

      const response = await request(app)
        .get('/manifest')
        .expect(200);

      expect(response.body).toHaveProperty('tools');
      expect(Array.isArray(response.body.tools)).toBe(true);
      expect(response.body.tools.length).toBeGreaterThan(0);
      
      // Check for expected tools
      const toolNames = response.body.tools.map((tool: any) => tool.name);
      expect(toolNames).toContain('list_movies');
      expect(toolNames).toContain('list_theaters');
      expect(toolNames).toContain('list_showtimes');
      expect(toolNames).toContain('book_tickets');
      
      console.log(`Success: MCP manifest contains ${response.body.tools.length} tools`);
    });
  });

  describe('MCP Tools Integration', () => {
    it('should list theaters through MCP endpoint', async () => {
      if (!apiKey) {
        console.warn('Warning: Skipping test - no API key');
        return;
      }

      const response = await request(app)
        .post('/tools/list_theaters')
        .send({ zipCode: testZip })
        .expect(200);

      expect(response.body).toHaveProperty('theaters');
      expect(Array.isArray(response.body.theaters)).toBe(true);
      expect(response.body.theaters.length).toBeGreaterThan(0);
      
      // Validate first theater structure
      const firstTheater = response.body.theaters[0];
      expect(firstTheater).toHaveProperty('id');
      expect(firstTheater).toHaveProperty('name');
      expect(firstTheater).toHaveProperty('address');
      
      console.log(`Success: MCP list_theaters returned ${response.body.theaters.length} theaters`);
    }, 15000);

    it('should list movies through MCP endpoint', async () => {
      if (!apiKey) {
        console.warn('Warning: Skipping test - no API key');
        return;
      }

      const response = await request(app)
        .post('/tools/list_movies')
        .send({})
        .expect(200);

      expect(response.body).toHaveProperty('movies');
      expect(Array.isArray(response.body.movies)).toBe(true);
      expect(response.body.movies.length).toBeGreaterThan(0);
      
      // Validate first movie structure
      const firstMovie = response.body.movies[0];
      expect(firstMovie).toHaveProperty('id');
      expect(firstMovie).toHaveProperty('title');
      expect(firstMovie).toHaveProperty('releaseDate');
      
      console.log(`Success: MCP list_movies returned ${response.body.movies.length} movies`);
    }, 15000);

    it('should list showtimes through MCP endpoint', async () => {
      if (!apiKey) {
        console.warn('Warning: Skipping test - no API key');
        return;
      }

      // First get a movie and theater to test with
      const moviesResponse = await request(app)
        .post('/tools/list_movies')
        .send({});
      
      const theatersResponse = await request(app)
        .post('/tools/list_theaters')
        .send({ zipCode: testZip });
      
      if (moviesResponse.body.movies.length === 0 || theatersResponse.body.theaters.length === 0) {
        console.warn('Warning: No movies or theaters found for testing');
        return;
      }

      const movieId = moviesResponse.body.movies[0].id;
      const theaterId = theatersResponse.body.theaters[0].id;
      const date = new Date().toISOString().split('T')[0]; // Today's date

      const response = await request(app)
        .post('/tools/list_showtimes')
        .send({
          movieId,
          theaterId,
          date
        })
        .expect(200);

      expect(response.body).toHaveProperty('showtimes');
      expect(Array.isArray(response.body.showtimes)).toBe(true);
      
      if (response.body.showtimes.length > 0) {
        // Validate first showtime structure
        const firstShowtime = response.body.showtimes[0];
        expect(firstShowtime).toHaveProperty('id');
        expect(firstShowtime).toHaveProperty('time');
        expect(firstShowtime).toHaveProperty('movieId');
        expect(firstShowtime).toHaveProperty('theaterId');
        
        console.log(`Success: MCP list_showtimes returned ${response.body.showtimes.length} showtimes`);
      } else {
        console.log(`Info: No showtimes found for the selected movie and theater`);
      }
    }, 20000);

    it('should handle invalid input gracefully', async () => {
      if (!apiKey) {
        console.warn('Warning: Skipping test - no API key');
        return;
      }

      // Test with invalid ZIP code
      const response = await request(app)
        .post('/tools/list_theaters')
        .send({ zipCode: 'invalid' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('validation');
      
      console.log(`Success: MCP endpoint properly validated invalid input`);
    });

    it('should handle missing required fields', async () => {
      if (!apiKey) {
        console.warn('Warning: Skipping test - no API key');
        return;
      }

      // Test with missing ZIP code
      const response = await request(app)
        .post('/tools/list_theaters')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('validation');
      
      console.log(`Success: MCP endpoint properly handled missing required fields`);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle AMC API errors gracefully', async () => {
      if (!apiKey) {
        console.warn('Warning: Skipping test - no API key');
        return;
      }

      // Test with invalid theater ID
      const response = await request(app)
        .post('/tools/list_showtimes')
        .send({
          movieId: 'invalid_movie_id',
          theaterId: 'invalid_theater_id',
          date: '2024-01-01'
        })
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('AMC API');
      
      console.log(`Success: MCP endpoint properly handled AMC API errors`);
    }, 15000);

    it('should handle server errors gracefully', async () => {
      if (!apiKey) {
        console.warn('Warning: Skipping test - no API key');
        return;
      }

      // Test with malformed request body
      const response = await request(app)
        .post('/tools/list_theaters')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      
      console.log(`Success: MCP endpoint properly handled malformed requests`);
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle concurrent requests', async () => {
      if (!apiKey) {
        console.warn('Warning: Skipping test - no API key');
        return;
      }

      const concurrentRequests = 3;
      const promises: any[] = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(app)
            .post('/tools/list_movies')
            .send({})
            .expect(200)
        );
      }

      const responses = await Promise.all(promises);
      
      responses.forEach((response, index) => {
        expect(response.body).toHaveProperty('movies');
        expect(Array.isArray(response.body.movies)).toBe(true);
      });
      
      console.log(`Success: Successfully handled ${concurrentRequests} concurrent requests`);
    }, 30000);

    it('should maintain consistent response structure', async () => {
      if (!apiKey) {
        console.warn('Warning: Skipping test - no API key');
        return;
      }

      // Make multiple requests and verify consistent structure
      const responses: any[] = [];
      
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post('/tools/list_movies')
          .send({});
        
        responses.push(response.body);
      }
      
      // Verify all responses have the same structure
      responses.forEach((response, index) => {
        expect(response).toHaveProperty('movies');
        expect(Array.isArray(response.movies)).toBe(true);
        
        if (response.movies.length > 0) {
          expect(response.movies[0]).toHaveProperty('id');
          expect(response.movies[0]).toHaveProperty('title');
          expect(response.movies[0]).toHaveProperty('releaseDate');
        }
      });
      
      console.log(`Success: Response structure remained consistent across ${responses.length} requests`);
    }, 45000);
  });
}); 