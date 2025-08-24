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
      // Check if we should run in headless mode (default to false for A-List testing)
      const isHeadless = process.env.AMC_TEST_HEADLESS === 'true';
      const slowMo = process.env.AMC_TEST_SLOW_MO ? parseInt(process.env.AMC_TEST_SLOW_MO) : 1000;
      
      console.log('🎬 Browser configuration:');
      console.log(`🎬 - Headless mode: ${isHeadless}`);
      console.log(`🎬 - Slow motion: ${slowMo}ms`);
      console.log('🎬 Launching Chromium browser...');
      
      this.browser = await chromium.launch({
        headless: isHeadless, // Show browser window by default so user can see navigation live
        slowMo: slowMo, // Slow down actions so user can see what's happening
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--start-maximized' // Start with maximized window for better visibility
        ]
      });
      
      if (this.browser) {
        console.log('✅ Browser object created successfully');
        
        if (isHeadless) {
          console.log('🎬 Playwright browser initialized in HEADLESS mode');
        } else {
          console.log('🎬 Playwright browser initialized in VISIBLE mode - you can watch the automation live!');
          console.log('🎬 Browser window will open and you can see each step as it happens');
          console.log(`🎬 Actions are slowed down by ${slowMo}ms so you can follow along`);
          
          // Force a small delay to ensure browser window is visible
          console.log('🎬 Waiting for browser window to become visible...');
          await new Promise(resolve => setTimeout(resolve, 5000)); // Increased from 2000ms to 5000ms
          console.log('🎬 Browser should now be visible!');
        }
      } else {
        throw new Error('Browser object is null after launch');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Playwright browser:', error);
      throw new Error(`Browser initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      
      // Step 1: Navigate to AMC homepage and trigger sign-in popup
      console.log('Navigating to AMC homepage...');
      await page.goto('https://www.amctheatres.com');
      await page.waitForLoadState('networkidle');
      
      // Look for and click the sign-in button to trigger popup
      console.log('Looking for sign-in button...');
      const signInButton = await page.locator('button:has-text("Sign In"), button:has-text("Sign In"), a:has-text("Sign In"), [data-testid="sign-in-button"]').first();
      
      if (await signInButton.isVisible()) {
        console.log('Sign-in button found, clicking to open popup...');
        await signInButton.click();
        await page.waitForTimeout(2000); // Wait for popup animation
      } else {
        console.log('Sign-in button not found, trying alternative selectors...');
        const altSignInButton = await page.locator('[data-testid*="sign"], .sign-in, .login, [aria-label*="sign"]').first();
        if (await altSignInButton.isVisible()) {
          await altSignInButton.click();
          await page.waitForTimeout(2000);
        }
      }

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
   * Handle user login to AMC (via popup modal)
   */
  private async handleLogin(page: Page, email: string, password: string): Promise<boolean> {
    try {
      console.log('🔐 Starting login process via popup modal...');
      console.log(`🔐 Looking for login form elements in popup...`);
      
      // Wait for the sign-in popup/modal to be visible
      // Look for common popup selectors
      const popupSelectors = [
        '.modal', '.popup', '.overlay', '[data-testid="modal"]', '[data-testid="popup"]',
        '.sign-in-modal', '.login-modal', '.auth-modal', '.signin-popup'
      ];
      
      let popupVisible = false;
      for (const selector of popupSelectors) {
        try {
          const popup = await page.locator(selector).first();
          if (await popup.isVisible()) {
            console.log(`✅ Found popup with selector: ${selector}`);
            popupVisible = true;
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!popupVisible) {
        console.log('⚠️  No popup found, looking for form elements directly...');
      }
      
      // Wait for login form to be visible (either in popup or on page)
      await page.waitForSelector('input[type="email"], input[name="email"], input[placeholder*="email"]', { timeout: 10000 });
      console.log('✅ Login form found and loaded');
      
      // Fill in email and password
      console.log(`🔐 Filling in email: ${email}`);
      await page.fill('input[type="email"], input[name="email"], input[placeholder*="email"]', email);
      
      console.log('🔐 Filling in password (hidden for security)');
      await page.fill('input[type="password"], input[name="password"], input[placeholder*="password"]', password);
      
      console.log('🔐 Looking for submit button...');
      // Click login button
      await page.click('button[type="submit"], input[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
      console.log('✅ Login button clicked');
      
      // Wait for login to complete (popup should close or page should update)
      console.log('🔐 Waiting for login response...');
      await page.waitForLoadState('networkidle');
      console.log('✅ Page loaded after login attempt');
      
      // Check if login was successful (look for user account elements or redirect)
      console.log('🔐 Checking if login was successful...');
      const isLoggedIn = await page.locator('[data-testid="user-menu"], .user-menu, .account-menu, .user-account, .profile-menu').count() > 0;
      
      if (isLoggedIn) {
        console.log('🎉 Login successful - user account elements found');
        return true;
      } else {
        console.log('⚠️  Login may have failed - checking for error messages...');
        // Check for error messages in popup or on page
        const errorElement = await page.locator('.error-message, .alert-error, [data-testid="error"], .error, .alert').first();
        if (await errorElement.isVisible()) {
          const errorText = await errorElement.textContent();
          console.log(`❌ Login failed with error: ${errorText}`);
        } else {
          console.log('⚠️  No error message found, but login status unclear');
        }
        return false;
      }
    } catch (error) {
      console.error('❌ Error during login:', error);
      return false;
    }
  }

  /**
   * Build URL for specific showtime
   */
  private async buildShowtimeUrl(theaterId: string, showtimeId: string): Promise<string> {
    // AMC URL structure: https://www.amctheatres.com/showtimes/{showtimeId}/seats
    // Theater ID is a slug like 'amc-century-city-15'
    // Showtime ID is a number like '135683165'
    return `https://www.amctheatres.com/showtimes/${showtimeId}/seats`;
  }

  /**
   * Select seats for the booking
   */
  private async selectSeats(page: Page, seatCount: number, preferences?: any): Promise<{ success: boolean; errorMessage?: string }> {
    try {
      console.log(`💺 Starting seat selection process...`);
      console.log(`💺 Looking for ${seatCount} seats with preferences:`, preferences || 'none');
      
      // Wait for seat selection interface to load
      console.log('💺 Waiting for seat map to load...');
      await page.waitForSelector('.seat-map, [data-testid="seat-map"]', { timeout: 15000 });
      console.log('✅ Seat map loaded');
      
      // Find available seats
      console.log('💺 Looking for available seats...');
      const availableSeats = await page.locator('.seat.available, .seat:not(.occupied):not(.reserved)').all();
      console.log(`💺 Found ${availableSeats.length} available seats`);
      
      if (availableSeats.length < seatCount) {
        console.log(`❌ Not enough seats available. Requested: ${seatCount}, Available: ${availableSeats.length}`);
        return {
          success: false,
          errorMessage: `Only ${availableSeats.length} seats available, requested ${seatCount}`
        };
      }

      // Select seats based on preferences or default selection
      console.log('💺 Starting seat selection...');
      let selectedSeats: string[] = [];
      
      for (let i = 0; i < seatCount; i++) {
        if (i < availableSeats.length) {
          const seat = availableSeats[i];
          if (seat) {
            console.log(`💺 Selecting seat ${i + 1}/${seatCount}...`);
            await seat.click();
            const seatId = await seat.getAttribute('data-seat-id') || `seat-${i}`;
            selectedSeats.push(seatId);
            console.log(`✅ Seat ${i + 1} selected: ${seatId}`);
            
            // Wait a bit between selections
            await page.waitForTimeout(500);
          }
        }
      }

      // Verify seats are selected
      console.log('💺 Verifying seat selection...');
      const selectedCount = await page.locator('.seat.selected').count();
      console.log(`💺 Total seats selected: ${selectedCount}/${seatCount}`);
      
      if (selectedCount === seatCount) {
        console.log(`🎉 All ${seatCount} seats selected successfully: ${selectedSeats.join(', ')}`);
        return { success: true };
      } else {
        console.log(`❌ Seat selection incomplete. Selected: ${selectedCount}, Requested: ${seatCount}`);
        return {
          success: false,
          errorMessage: `Failed to select all requested seats. Selected: ${selectedCount}, Requested: ${seatCount}`
        };
      }

    } catch (error) {
      console.error('❌ Error during seat selection:', error);
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

  /**
   * Search for theaters near the user's location
   */
  private async searchForTheaters(page: Page): Promise<boolean> {
    try {
      console.log('🏢 Starting theater search process...');
      console.log('🏢 Looking for location search input...');
      
      // Look for location search input
      const locationInput = await page.locator('input[placeholder*="ZIP"], input[placeholder*="zip"], input[name="zip"], input[name="location"]').first();
      
      if (await locationInput.isVisible()) {
        console.log('✅ Location search input found');
        
        // Use a default ZIP code if none provided (this would come from user input in real usage)
        const defaultZip = '10001'; // NYC default
        console.log(`🏢 Entering ZIP code: ${defaultZip}`);
        await locationInput.fill(defaultZip);
        
        // Look for search button
        console.log('🏢 Looking for search button...');
        const searchButton = await page.locator('button:has-text("Search"), button:has-text("Find"), button[type="submit"]').first();
        if (await searchButton.isVisible()) {
          console.log('✅ Search button found, clicking...');
          await searchButton.click();
          console.log('🏢 Waiting for search results...');
          await page.waitForLoadState('networkidle');
          
          // Check if theaters are displayed
          console.log('🏢 Counting theater results...');
          const theaterElements = await page.locator('.theater, .cinema, [data-testid*="theater"]').count();
          console.log(`🎬 Found ${theaterElements} theaters near location`);
          
          if (theaterElements > 0) {
            console.log('✅ Theater search successful');
            return true;
          } else {
            console.log('⚠️  No theaters found in search results');
          }
        } else {
          console.log('⚠️  Search button not found');
        }
      } else {
        console.log('⚠️  Location search input not found on this page');
      }
      
      console.log('🏢 Theater search not available on this page, proceeding with direct navigation');
      return true; // Don't fail if theater search isn't available
    } catch (error) {
      console.error('❌ Error during theater search:', error);
      return true; // Don't fail the test for theater search issues
    }
  }

  /**
   * Enable A-List reservation checkbox
   */
  private async enableAListReservation(page: Page): Promise<boolean> {
    try {
      console.log('🎬 Starting A-List reservation activation...');
      console.log('🎬 Looking for A-List reservation checkbox...');
      
      // Look for the A-List reservation checkbox
      // This is the specific text mentioned in the user's flow
      const aListCheckbox = await page.locator('input[type="checkbox"]:has-text("Make this one of my AMC Stubs A-List movie reservations"), input[type="checkbox"][name*="alist"], input[type="checkbox"][id*="alist"], [data-testid*="alist-checkbox"]').first();
      
      if (await aListCheckbox.isVisible()) {
        console.log('✅ A-List reservation checkbox found');
        
        // Check if it's already checked
        const isChecked = await aListCheckbox.isChecked();
        console.log(`🎬 Checkbox current state: ${isChecked ? 'checked' : 'unchecked'}`);
        
        if (!isChecked) {
          console.log('🎬 Checking the A-List reservation checkbox...');
          await aListCheckbox.check();
          console.log('✅ A-List reservation checkbox enabled');
          
          // Wait for any dynamic updates
          console.log('🎬 Waiting for checkbox state to update...');
          await page.waitForTimeout(1000);
          
          // Verify the checkbox is now checked
          const newState = await aListCheckbox.isChecked();
          console.log(`🎬 Checkbox new state: ${newState ? 'checked' : 'unchecked'}`);
          
          if (newState) {
            console.log('✅ A-List reservation successfully enabled');
          } else {
            console.log('⚠️  Checkbox state did not update as expected');
          }
        } else {
          console.log('✅ A-List reservation checkbox already enabled');
        }
        
        return true;
      } else {
        console.log('⚠️  A-List reservation checkbox not found, looking for alternative elements...');
        
        // Look for alternative A-List elements
        const alternativeElements = await page.locator('text="A-List", text="AMC Stubs", text="free reservation"').count();
        console.log(`🎬 Found ${alternativeElements} A-List related text elements`);
        
        if (alternativeElements > 0) {
          console.log('🎬 Found A-List related elements, attempting to enable reservation...');
          
          // Try to find and click any A-List related button or checkbox
          const aListButton = await page.locator('button:has-text("A-List"), button:has-text("Use A-List"), [data-testid*="alist"]').first();
          if (await aListButton.isVisible()) {
            console.log('✅ A-List button found, clicking to enable...');
            await aListButton.click();
            console.log('🎬 Waiting for A-List activation...');
            await page.waitForTimeout(1000);
            console.log('✅ A-List reservation enabled via button');
            return true;
          } else {
            console.log('⚠️  A-List button not found');
          }
        }
        
        console.log('❌ A-List reservation checkbox not found - benefits may be exhausted or unavailable');
        console.log('🎬 Available page elements for debugging:');
        
        // Log some page content for debugging
        try {
          const pageText = await page.textContent('body');
          const aListMentions = pageText?.match(/A-List|AMC Stubs|free reservation/gi) || [];
          console.log(`🎬 Found ${aListMentions.length} mentions of A-List related terms on page`);
        } catch (e) {
          console.log('🎬 Could not extract page text for debugging');
        }
        
        return false;
      }
    } catch (error) {
      console.error('❌ Error enabling A-List reservation:', error);
      return false;
    }
  }

  /**
   * Complete A-List reservation (no payment required)
   */
  private async completeAListReservation(page: Page): Promise<{ 
    success: boolean; 
    confirmationNumber?: string; 
    errorMessage?: string;
    bookingDetails?: any;
  }> {
    try {
      console.log('🎬 Starting A-List reservation completion...');
      
      // Look for and click the continue/checkout button
      console.log('🎬 Looking for continue/checkout button...');
      const continueButton = await page.locator('button:has-text("Continue"), button:has-text("Checkout"), button:has-text("Reserve"), [data-testid="continue-button"]').first();
      if (await continueButton.isVisible()) {
        console.log('✅ Continue/checkout button found, clicking...');
        await continueButton.click();
        console.log('🎬 Waiting for page to load after continue...');
        await page.waitForLoadState('networkidle');
        console.log('✅ Page loaded after continue');
      } else {
        console.log('⚠️  Continue/checkout button not found, proceeding to confirmation...');
      }

      // For A-List reservations, there should be no payment step
      // Look for final confirmation button
      console.log('🎬 Looking for final confirmation button...');
      const confirmButton = await page.locator('button:has-text("Confirm"), button:has-text("Book"), button:has-text("Reserve"), [data-testid="confirm-booking"]').first();
      if (await confirmButton.isVisible()) {
        console.log('✅ Confirmation button found, clicking to complete reservation...');
        await confirmButton.click();
        console.log('🎬 Waiting for confirmation page to load...');
        await page.waitForLoadState('networkidle');
        console.log('✅ Confirmation page loaded');
      } else {
        console.log('⚠️  Confirmation button not found, checking if already on confirmation page...');
      }

      // Wait for confirmation page
      console.log('🎬 Looking for confirmation/success elements...');
      await page.waitForSelector('.confirmation, [data-testid="confirmation"], .success-message, .reservation-confirmed', { timeout: 20000 });
      console.log('✅ Confirmation/success elements found');

      // Extract confirmation details
      console.log('🎬 Extracting confirmation details...');
      const confirmationNumber = await this.extractConfirmationNumber(page);
      const bookingDetails = await this.extractBookingDetails(page);

      if (confirmationNumber) {
        console.log(`🎉 A-List reservation completed successfully! Confirmation: ${confirmationNumber}`);
        console.log('🎬 Booking details extracted:', bookingDetails);
        return {
          success: true,
          confirmationNumber,
          bookingDetails
        };
      } else {
        console.log('⚠️  A-List reservation completed but no confirmation number found');
        console.log('🎬 Available booking details:', bookingDetails);
        return {
          success: false,
          errorMessage: 'A-List reservation completed but no confirmation number found'
        };
      }

    } catch (error) {
      console.error('❌ Error during A-List reservation completion:', error);
      return {
        success: false,
        errorMessage: `A-List reservation completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
} 