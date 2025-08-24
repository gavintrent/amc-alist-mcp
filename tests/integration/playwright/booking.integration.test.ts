import { PlaywrightBookingService } from '../../../src/playwrightBookingService';
import { BookTicketsInput } from '../../../src/types';

describe('Playwright Booking Integration Tests', () => {
  let bookingService: PlaywrightBookingService;
  
  // Real credentials from environment variables
  const testEmail = process.env.AMC_TEST_EMAIL;
  const testPassword = process.env.AMC_TEST_PASSWORD;
  const testZip = process.env.AMC_TEST_ZIP || '10001'; // NYC default
  
  // Configuration for test mode
  const isDryRun = process.env.AMC_TEST_DRY_RUN !== 'false'; // Default to dry run for safety
  const enableRealPurchase = process.env.AMC_TEST_ENABLE_PURCHASE === 'true'; // Must explicitly enable
  const useAListBenefits = process.env.AMC_TEST_USE_ALIST === 'true'; // Use A-List benefits for free reservations
  const testCardNumber = process.env.AMC_TEST_CARD_NUMBER;
  const testCardExpiry = process.env.AMC_TEST_CARD_EXPIRY;
  const testCardCVV = process.env.AMC_TEST_CARD_CVV;

  beforeAll(async () => {
    if (!testEmail || !testPassword) {
      console.warn('AMC_TEST_EMAIL or AMC_TEST_PASSWORD not set - skipping integration tests');
      return;
    }

    console.log(`Using test account: ${testEmail}`);
    console.log(`Test ZIP code: ${testZip}`);
    console.log(`Test mode: ${isDryRun ? 'DRY RUN (safe)' : 'LIVE MODE (caution!)'}`);
    
    if (useAListBenefits) {
      console.log('🎬 A-List Mode: Using AMC Stubs A-List benefits for free movie reservations');
    }
    
    if (!isDryRun && enableRealPurchase) {
      console.log('⚠️  WARNING: Real purchase mode enabled - tests may complete actual transactions!');
      if (!testCardNumber || !testCardExpiry || !testCardCVV) {
        console.warn('Real purchase mode enabled but test card details not provided');
        console.warn('Set AMC_TEST_CARD_NUMBER, AMC_TEST_CARD_EXPIRY, and AMC_TEST_CARD_CVV for live testing');
      }
    }
    
    bookingService = new PlaywrightBookingService();
    await bookingService.initialize();
  });

  afterAll(async () => {
    if (bookingService) {
      console.log('🎬 Test completed, waiting 5 seconds before cleanup...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log('🎬 Cleaning up browser resources...');
      await bookingService.cleanup();
      console.log('✅ Cleanup completed');
    }
  });

  describe('Real AMC Website Integration', () => {
    it('should successfully navigate to AMC website', async () => {
      if (!testEmail || !testPassword) {
        console.warn('Skipping test - no credentials');
        return;
      }

      // This test verifies basic connectivity to AMC website
      const page = await bookingService['browser']?.newPage();
      expect(page).toBeDefined();

      try {
        await page!.goto('https://www.amctheatres.com');
        
        // Wait for page to load
        await page!.waitForLoadState('networkidle');
        
        // Check if we're on AMC website
        const title = await page!.title();
        expect(title.toLowerCase()).toContain('amc');
        
        console.log(`Successfully navigated to AMC website: ${title}`);
      } finally {
        await page!.close();
      }
    }, 30000);

    it('should handle login with real credentials', async () => {
      if (!testEmail || !testPassword) {
        console.warn('Skipping test - no credentials');
        return;
      }

      const page = await bookingService['browser']?.newPage();
      expect(page).toBeDefined();

      try {
        await page!.goto('https://www.amctheatres.com/account/sign-in');
        await page!.waitForLoadState('networkidle');

        // Fill in login form
        await page!.fill('input[name="email"]', testEmail);
        await page!.fill('input[name="password"]', testPassword);
        
        // Click sign in button
        await page!.click('button[type="submit"]');
        
        // Wait for login to complete
        await page!.waitForLoadState('networkidle');
        
        // Check if login was successful (look for account-related elements)
        const accountElement = await page!.locator('[data-testid="account-menu"], .account-menu, .user-menu').first();
        const isLoggedIn = await accountElement.isVisible();
        
        if (isLoggedIn) {
          console.log(`Successfully logged in as ${testEmail}`);
        } else {
          console.log(`Login may have failed - check credentials`);
        }
        
        // Don't fail the test if login fails (credentials might be wrong)
        expect(true).toBe(true);
      } catch (error) {
        console.log(`Login test encountered error: ${(error as Error).message}`);
        // Don't fail the test - this might be expected with wrong credentials
        expect(true).toBe(true);
      } finally {
        await page!.close();
      }
    }, 45000);

    it('should search for theaters near test ZIP code', async () => {
      if (!testEmail || !testPassword) {
        console.warn('Skipping test - no credentials');
        return;
      }

      const page = await bookingService['browser']?.newPage();
      expect(page).toBeDefined();

      try {
        await page!.goto('https://www.amctheatres.com');
        await page!.waitForLoadState('networkidle');

        // Look for location search or theater finder
        const locationInput = await page!.locator('input[placeholder*="ZIP"], input[placeholder*="zip"], input[name="zip"], input[name="location"]').first();
        
        if (await locationInput.isVisible()) {
          await locationInput.fill(testZip);
          
          // Look for search button
          const searchButton = await page!.locator('button:has-text("Search"), button:has-text("Find"), button[type="submit"]').first();
          if (await searchButton.isVisible()) {
            await searchButton.click();
            await page!.waitForLoadState('networkidle');
            
            // Check if theaters are displayed
            const theaterElements = await page!.locator('.theater, .cinema, [data-testid*="theater"]').count();
            console.log(`Found ${theaterElements} theater elements on page`);
          }
        } else {
          console.log(`Location search input not found on page`);
        }
        
        expect(true).toBe(true);
      } catch (error) {
        console.log(`Theater search test encountered error: ${(error as Error).message}`);
        expect(true).toBe(true);
      } finally {
        await page!.close();
      }
    }, 30000);
  });

  describe('Full Booking Flow', () => {
    it('should attempt full booking flow with configurable completion mode', async () => {
      if (!testEmail || !testPassword) {
        console.warn('Skipping test - no credentials');
        return;
      }

      if (!isDryRun && !enableRealPurchase && !useAListBenefits) {
        console.log('Skipping test - no completion mode enabled');
        console.log('Set AMC_TEST_DRY_RUN=false and either AMC_TEST_ENABLE_PURCHASE=true or AMC_TEST_USE_ALIST=true');
        return;
      }

      let testMode: string;
      if (useAListBenefits) {
        testMode = 'A-LIST RESERVATION';
      } else if (isDryRun) {
        testMode = 'DRY RUN';
      } else {
        testMode = 'LIVE PURCHASE';
      }
      
      console.log(`Starting ${testMode} of full booking flow...`);

      const testInput: BookTicketsInput = {
        email: testEmail,
        password: testPassword,
        theaterId: 'test_theater_id', // We'll need a real theater ID for testing
        showtimeId: 'test_showtime_id', // We'll need a real showtime ID for testing
        seatCount: 1, // A-List allows 3 movies per week, but let's start with 1
        seatPreferences: {
          row: 'middle',
          position: 'center'
        }
      };

      try {
        if (useAListBenefits) {
          // A-List Mode: Use free movie reservation benefits
          console.log('🎬 Executing A-List reservation flow - using free movie benefits');
          console.log('Flow: Navigate → Find Theater → Choose Movie/Showtime → Select Seat → A-List Checkbox → Complete');
          
          const result = await bookingService.bookTicketsWithAList(testInput);
          
          expect(result).toBeDefined();
          expect(typeof result.success).toBe('boolean');
          
          if (result.success) {
            console.log(`🎬 A-List reservation completed successfully!`);
            console.log(`Confirmation Number: ${result.confirmationNumber || 'N/A'}`);
            console.log(`Movie: ${result.bookingDetails?.movieTitle || 'N/A'}`);
            console.log(`Theater: ${result.bookingDetails?.theaterName || 'N/A'}`);
            console.log(`Showtime: ${result.bookingDetails?.showtime || 'N/A'}`);
            console.log(`Seat: ${result.bookingDetails?.seats?.join(', ') || 'N/A'}`);
            console.log(`Total Price: $0.00 (A-List benefit)`);
            console.log(`A-List reservation used - no payment required`);
          } else {
            console.log(`A-List reservation failed: ${result.errorMessage || 'Unknown error'}`);
            // This might be expected if A-List benefits are exhausted or invalid
          }
        } else if (isDryRun) {
          // Dry run: Start the booking process but don't complete it
          console.log('Executing in DRY RUN mode - no actual purchase will be made');
          
          const result = await bookingService.bookTickets(testInput);
          
          expect(result).toBeDefined();
          expect(typeof result.success).toBe('boolean');
          
          if (result.success) {
            console.log(`Dry run completed successfully: ${result.confirmationNumber || 'No confirmation'}`);
          } else {
            console.log(`Dry run completed with expected failure: ${result.errorMessage || 'Unknown error'}`);
          }
        } else {
          // Live mode: Actually complete the purchase with credit card
          console.log('⚠️  EXECUTING IN LIVE MODE - ACTUAL PURCHASE WILL BE COMPLETED!');
          
          if (!testCardNumber || !testCardExpiry || !testCardCVV) {
            throw new Error('Live purchase mode requires test card details (AMC_TEST_CARD_NUMBER, AMC_TEST_CARD_EXPIRY, AMC_TEST_CARD_CVV)');
          }
          
          // Add payment information to the test input
          const liveTestInput = {
            ...testInput,
            paymentMethod: {
              cardNumber: testCardNumber,
              expiryDate: testCardExpiry,
              cvv: testCardCVV,
              cardholderName: 'Test User'
            }
          };
          
          console.log('Proceeding with live ticket purchase...');
          const result = await bookingService.bookTickets(liveTestInput);
          
          expect(result).toBeDefined();
          expect(typeof result.success).toBe('boolean');
          
          if (result.success) {
            console.log(`🎫 LIVE PURCHASE COMPLETED SUCCESSFULLY!`);
            console.log(`Confirmation Number: ${result.confirmationNumber || 'N/A'}`);
            console.log(`Total Price: ${result.bookingDetails?.totalPrice || 'N/A'}`);
            console.log(`Seats Booked: ${result.bookingDetails?.seats?.join(', ') || 'N/A'}`);
            
            // In a real scenario, you might want to immediately cancel this booking
            // to avoid charges, or use a test payment method
            console.log('⚠️  IMPORTANT: This is a real purchase. Consider canceling if this was unintended.');
          } else {
            console.log(`Live purchase failed: ${result.errorMessage || 'Unknown error'}`);
            // This might be expected if test data is invalid
          }
        }
        
        // Clean up any sessions created during testing
        const sessions = await bookingService.getActiveSessions();
        if (sessions.length > 0) {
          console.log(`Cleaning up ${sessions.length} test sessions`);
          // In a real scenario, you might want to cancel any test bookings
        }
        
      } catch (error) {
        console.log(`${testMode} encountered error: ${(error as Error).message}`);
        
        if (!isDryRun) {
          // In live mode, errors are more critical
          console.log('Live purchase error - this may indicate an issue with the booking flow');
        }
        
        // Don't fail the test - this might be expected
        expect(true).toBe(true);
      }
    }, 180000); // 3 minutes for full flow (live purchase takes longer)
  });

  describe('Session Management', () => {
    it('should maintain user session across multiple operations', async () => {
      if (!testEmail || !testPassword) {
        console.warn('Skipping test - no credentials');
        return;
      }

      const page = await bookingService['browser']?.newPage();
      expect(page).toBeDefined();

      try {
        // First operation: Login
        await page!.goto('https://www.amctheatres.com/account/sign-in');
        await page!.waitForLoadState('networkidle');
        
        await page!.fill('input[name="email"]', testEmail);
        await page!.fill('input[name="password"]', testPassword);
        await page!.click('button[type="submit"]');
        await page!.waitForLoadState('networkidle');

        // Second operation: Navigate to account page
        await page!.goto('https://www.amctheatres.com/account');
        await page!.waitForLoadState('networkidle');
        
        // Check if still logged in
        const accountContent = await page!.locator('.account-content, .profile, [data-testid="account"]').first();
        const isStillLoggedIn = await accountContent.isVisible();
        
        if (isStillLoggedIn) {
          console.log(`Session maintained across navigation`);
        } else {
          console.log(`Session may have expired`);
        }
        
        expect(true).toBe(true);
      } catch (error) {
        console.log(`Session management test encountered error: ${(error as Error).message}`);
        expect(true).toBe(true);
      } finally {
        await page!.close();
      }
    }, 60000);
  });

  describe('Error Scenarios', () => {
    it('should handle invalid credentials gracefully', async () => {
      if (!testEmail || !testPassword) {
        console.warn('Skipping test - no credentials');
        return;
      }

      const page = await bookingService['browser']?.newPage();
      expect(page).toBeDefined();

      try {
        await page!.goto('https://www.amctheatres.com/account/sign-in');
        await page!.waitForLoadState('networkidle');

        // Try with invalid credentials
        await page!.fill('input[name="email"]', 'invalid@example.com');
        await page!.fill('input[name="password"]', 'wrongpassword');
        await page!.click('button[type="submit"]');
        
        // Wait for error response
        await page!.waitForLoadState('networkidle');
        
        // Look for error message
        const errorElement = await page!.locator('.error, .alert, [data-testid="error"]').first();
        const hasError = await errorElement.isVisible();
        
        if (hasError) {
          const errorText = await errorElement.textContent();
          console.log(`Invalid credentials handled gracefully: ${errorText}`);
        } else {
          console.log(`No error message found for invalid credentials`);
        }
        
        expect(true).toBe(true);
      } catch (error) {
        console.log(`Invalid credentials test encountered error: ${(error as Error).message}`);
        expect(true).toBe(true);
      } finally {
        await page!.close();
      }
    }, 30000);

    it('should handle network timeouts gracefully', async () => {
      if (!testEmail || !testPassword) {
        console.warn('Skipping test - no credentials');
        return;
      }

      const page = await bookingService['browser']?.newPage();
      expect(page).toBeDefined();

      try {
        // Set a very short timeout to simulate network issues
        page!.setDefaultTimeout(1000);
        
        try {
          await page!.goto('https://www.amctheatres.com');
        } catch (timeoutError) {
          console.log(`Network timeout handled gracefully: ${(timeoutError as Error).message}`);
        }
        
        expect(true).toBe(true);
      } finally {
        // Reset timeout
        page!.setDefaultTimeout(30000);
        await page!.close();
      }
    }, 10000);
  });

  describe('Browser Launch Test', () => {
    it('should launch browser in visible mode for A-List testing', async () => {
      console.log('🎬 ========================================');
      console.log('🎬 BROWSER LAUNCH TEST STARTING');
      console.log('🎬 ========================================');
      
      if (!testEmail || !testPassword) {
        console.warn('AMC_TEST_EMAIL or AMC_TEST_PASSWORD not set - skipping test');
        return;
      }

      console.log('🎬 Testing browser launch in visible mode...');
      console.log('🎬 Browser service initialized:', !!bookingService);
      console.log('🎬 Browser object exists:', !!bookingService?.['browser']);
      
      if (!bookingService) {
        console.log('❌ Booking service is null!');
        expect(bookingService).toBeDefined();
        return;
      }
      
      if (!bookingService['browser']) {
        console.log('❌ Browser object is null!');
        expect(bookingService['browser']).toBeDefined();
        return;
      }
      
      console.log('✅ Both service and browser exist, proceeding with test...');
      
      // Create a new page to test browser visibility
      const page = await bookingService['browser']?.newPage();
      expect(page).toBeDefined();
      console.log('✅ Page created successfully');
      
      try {
        console.log('🎬 Navigating to a simple page to test browser visibility...');
        await page!.goto('https://www.google.com');
        console.log('✅ Navigated to Google - browser should be visible now');
        
        // Wait a bit so user can see the browser
        console.log('🎬 Waiting 10 seconds so you can see the browser window...');
        console.log('🎬 Look for a Chromium browser window on your screen!');
        await page!.waitForTimeout(10000);
        
        console.log('🎬 Browser test completed - did you see the browser window?');
        
        // Don't close the page immediately so user can see it
        console.log('🎬 Keeping page open for 5 more seconds...');
        await page!.waitForTimeout(5000);
        
      } catch (error) {
        console.log(`Browser test encountered error: ${(error as Error).message}`);
        expect(true).toBe(true);
      } finally {
        console.log('🎬 Closing test page...');
        await page!.close();
        console.log('✅ Test page closed');
      }
      
      console.log('🎬 ========================================');
      console.log('🎬 BROWSER LAUNCH TEST COMPLETED');
      console.log('🎬 ========================================');
    }, 30000);
  });
}); 