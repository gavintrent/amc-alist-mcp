import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { BookTicketsInput, BookTicketsOutput, UserSession } from './types';

export class PlaywrightBookingService {
  private browser: Browser | null = null;
  private userSessions: Map<string, UserSession> = new Map();

  /**
   * Initialize the Playwright browser
   */
  async initialize(): Promise<void> {
    try {
      this.browser = await chromium.launch({
        headless: true, // Run headless on server
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      console.log('Playwright browser initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Playwright browser:', error);
      throw new Error('Browser initialization failed');
    }
  }

  /**
   * Book tickets using Playwright automation
   */
  async bookTickets(input: BookTicketsInput): Promise<BookTicketsOutput> {
    let context: BrowserContext | null = null;
    let page: Page | null = null;

    try {
      // Create a new browser context for this booking
      if (!this.browser) {
        await this.initialize();
      }
      
      context = await this.browser!.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 }
      });

      page = await context.newPage();
      
      // Step 1: Navigate to AMC login page
      console.log('Navigating to AMC login page...');
      await page.goto('https://www.amctheatres.com/account/sign-in');
      await page.waitForLoadState('networkidle');

      // Step 2: Handle login
      const loginSuccess = await this.handleLogin(page, input.email, input.password);
      if (!loginSuccess) {
        return {
          success: false,
          errorMessage: 'Login failed - please check your credentials'
        };
      }

      // Step 3: Navigate to the specific showtime
      console.log('Navigating to showtime...');
      const showtimeUrl = await this.buildShowtimeUrl(input.theaterId, input.showtimeId);
      await page.goto(showtimeUrl);
      await page.waitForLoadState('networkidle');

      // Step 4: Select seats
      console.log('Selecting seats...');
      const seatSelection = await this.selectSeats(page, input.seatCount, input.seatPreferences);
      if (!seatSelection.success) {
        return {
          success: false,
          errorMessage: seatSelection.errorMessage || 'Failed to select seats'
        };
      }

      // Step 5: Complete booking
      console.log('Completing booking...');
      const bookingResult = await this.completeBooking(page);
      
      if (bookingResult.success) {
        // Store successful session
        this.storeUserSession(input.email);
        
        return {
          success: true,
          confirmationNumber: bookingResult.confirmationNumber,
          bookingDetails: bookingResult.bookingDetails
        };
      } else {
        return {
          success: false,
          errorMessage: bookingResult.errorMessage || 'Booking completion failed'
        };
      }

    } catch (error) {
      console.error('Error during ticket booking:', error);
      return {
        success: false,
        errorMessage: `Booking automation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    } finally {
      // Clean up resources
      if (page) await page.close();
      if (context) await context.close();
    }
  }

  /**
   * Handle user login to AMC
   */
  private async handleLogin(page: Page, email: string, password: string): Promise<boolean> {
    try {
      // Wait for login form to be visible
      await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
      
      // Fill in email and password
      await page.fill('input[type="email"], input[name="email"]', email);
      await page.fill('input[type="password"], input[name="password"]', password);
      
      // Click login button
      await page.click('button[type="submit"], input[type="submit"]');
      
      // Wait for navigation or success indicator
      await page.waitForLoadState('networkidle');
      
      // Check if login was successful (look for user account elements or redirect)
      const isLoggedIn = await page.locator('[data-testid="user-menu"], .user-menu, .account-menu').count() > 0;
      
      if (isLoggedIn) {
        console.log('Login successful');
        return true;
      } else {
        // Check for error messages
        const errorElement = await page.locator('.error-message, .alert-error, [data-testid="error"]').first();
        if (await errorElement.isVisible()) {
          const errorText = await errorElement.textContent();
          console.log(`Login failed: ${errorText}`);
        }
        return false;
      }
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  }

  /**
   * Build URL for specific showtime
   */
  private async buildShowtimeUrl(theaterId: string, showtimeId: string): Promise<string> {
    // This would need to be adjusted based on AMC's actual URL structure
    return `https://www.amctheatres.com/movies/showtimes/${showtimeId}`;
  }

  /**
   * Select seats for the booking
   */
  private async selectSeats(page: Page, seatCount: number, preferences?: any): Promise<{ success: boolean; errorMessage?: string }> {
    try {
      // Wait for seat selection interface to load
      await page.waitForSelector('.seat-map, [data-testid="seat-map"]', { timeout: 15000 });
      
      // Find available seats
      const availableSeats = await page.locator('.seat.available, .seat:not(.occupied):not(.reserved)').all();
      
      if (availableSeats.length < seatCount) {
        return {
          success: false,
          errorMessage: `Only ${availableSeats.length} seats available, requested ${seatCount}`
        };
      }

      // Select seats based on preferences or default selection
      let selectedSeats: string[] = [];
      
      for (let i = 0; i < seatCount; i++) {
        if (i < availableSeats.length) {
          const seat = availableSeats[i];
          if (seat) {
            await seat.click();
            const seatId = await seat.getAttribute('data-seat-id') || `seat-${i}`;
            selectedSeats.push(seatId);
            
            // Wait a bit between selections
            await page.waitForTimeout(500);
          }
        }
      }

      // Verify seats are selected
      const selectedCount = await page.locator('.seat.selected').count();
      if (selectedCount === seatCount) {
        console.log(`Selected ${seatCount} seats: ${selectedSeats.join(', ')}`);
        return { success: true };
      } else {
        return {
          success: false,
          errorMessage: `Failed to select all requested seats. Selected: ${selectedCount}, Requested: ${seatCount}`
        };
      }

    } catch (error) {
      console.error('Error during seat selection:', error);
      return {
        success: false,
        errorMessage: `Seat selection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Complete the booking process
   */
  private async completeBooking(page: Page): Promise<{ 
    success: boolean; 
    confirmationNumber?: string; 
    errorMessage?: string;
    bookingDetails?: any;
  }> {
    try {
      // Look for and click the continue/checkout button
      const continueButton = await page.locator('button:has-text("Continue"), button:has-text("Checkout"), [data-testid="continue-button"]').first();
      if (await continueButton.isVisible()) {
        await continueButton.click();
        await page.waitForLoadState('networkidle');
      }

      // Look for final confirmation button
      const confirmButton = await page.locator('button:has-text("Confirm"), button:has-text("Book"), [data-testid="confirm-booking"]').first();
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        await page.waitForLoadState('networkidle');
      }

      // Wait for confirmation page
      await page.waitForSelector('.confirmation, [data-testid="confirmation"], .success-message', { timeout: 20000 });

      // Extract confirmation details
      const confirmationNumber = await this.extractConfirmationNumber(page);
      const bookingDetails = await this.extractBookingDetails(page);

      if (confirmationNumber) {
        console.log(`Booking completed successfully! Confirmation: ${confirmationNumber}`);
        return {
          success: true,
          confirmationNumber,
          bookingDetails
        };
      } else {
        return {
          success: false,
          errorMessage: 'Booking completed but no confirmation number found'
        };
      }

    } catch (error) {
      console.error('Error during booking completion:', error);
      return {
        success: false,
        errorMessage: `Booking completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Extract confirmation number from the page
   */
  private async extractConfirmationNumber(page: Page): Promise<string | null> {
    try {
      const confirmationElement = await page.locator('.confirmation-number, [data-testid="confirmation-number"], .order-number').first();
      if (await confirmationElement.isVisible()) {
        return await confirmationElement.textContent();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Extract booking details from the page
   */
  private async extractBookingDetails(page: Page): Promise<any> {
    try {
      const movieTitle = await page.locator('.movie-title, [data-testid="movie-title"]').first().textContent() || 'Unknown';
      const theaterName = await page.locator('.theater-name, [data-testid="theater-name"]').first().textContent() || 'Unknown';
      const showtime = await page.locator('.showtime, [data-testid="showtime"]').first().textContent() || 'Unknown';
      const totalPrice = await page.locator('.total-price, [data-testid="total-price"]').first().textContent() || '0';

      return {
        movieTitle: movieTitle.trim(),
        theaterName: theaterName.trim(),
        showtime: showtime.trim(),
        totalPrice: parseFloat(totalPrice.replace(/[^0-9.]/g, '')) || 0
      };
    } catch {
      return {
        movieTitle: 'Unknown',
        theaterName: 'Unknown',
        showtime: 'Unknown',
        totalPrice: 0
      };
    }
  }

  /**
   * Store user session for future use
   */
  private storeUserSession(email: string): void {
    const session: UserSession = {
      userId: `user_${Date.now()}`,
      email,
      lastLogin: new Date(),
      isActive: true
    };
    
    this.userSessions.set(email, session);
    console.log(`Stored session for user: ${email}`);
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.userSessions.clear();
    console.log('Playwright resources cleaned up');
  }

  /**
   * Get active user sessions
   */
  getActiveSessions(): UserSession[] {
    return Array.from(this.userSessions.values()).filter(session => session.isActive);
  }
} 