import { PlaywrightBookingService } from '../../src/playwrightBookingService';
import { mockBookTicketsInput, mockSuccessfulBooking, mockFailedBooking } from './mockData';

// Mock Playwright
jest.mock('playwright');

const mockChromium = {
  launch: jest.fn()
};

const mockBrowser = {
  newContext: jest.fn(),
  close: jest.fn()
};

const mockContext = {
  newPage: jest.fn(),
  close: jest.fn()
};

const mockPage = {
  goto: jest.fn(),
  waitForLoadState: jest.fn(),
  waitForSelector: jest.fn(),
  fill: jest.fn(),
  click: jest.fn(),
  locator: jest.fn(),
  waitForTimeout: jest.fn(),
  close: jest.fn()
};

const mockLocator = {
  count: jest.fn(),
  all: jest.fn(),
  first: jest.fn(),
  isVisible: jest.fn(),
  textContent: jest.fn(),
  getAttribute: jest.fn()
};

describe('PlaywrightBookingService', () => {
  let playwrightService: PlaywrightBookingService;
  let mockPlaywright: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Playwright module
    mockPlaywright = {
      chromium: mockChromium
    };
    
    // Mock the chromium.launch method
    mockChromium.launch.mockResolvedValue(mockBrowser);
    mockBrowser.newContext.mockResolvedValue(mockContext);
    mockContext.newPage.mockResolvedValue(mockPage);
    
    // Mock page methods
    mockPage.goto.mockResolvedValue(undefined);
    mockPage.waitForLoadState.mockResolvedValue(undefined);
    mockPage.waitForSelector.mockResolvedValue(undefined);
    mockPage.fill.mockResolvedValue(undefined);
    mockPage.click.mockResolvedValue(undefined);
    mockPage.waitForTimeout.mockResolvedValue(undefined);
    
    // Mock locator methods
    mockPage.locator.mockReturnValue(mockLocator);
    mockLocator.count.mockResolvedValue(0);
    mockLocator.all.mockResolvedValue([]);
    mockLocator.first.mockReturnValue(mockLocator);
    mockLocator.isVisible.mockResolvedValue(false);
    mockLocator.textContent.mockResolvedValue('Test Content');
    mockLocator.getAttribute.mockResolvedValue('test-attr');

    // Mock the Playwright module
    jest.doMock('playwright', () => mockPlaywright);
    
    playwrightService = new PlaywrightBookingService();
  });

  afterEach(async () => {
    await playwrightService.cleanup();
  });

  describe('Constructor', () => {
    it('should create PlaywrightBookingService instance', () => {
      expect(playwrightService).toBeInstanceOf(PlaywrightBookingService);
    });
  });

  describe('initialize', () => {
    it('should initialize browser successfully', async () => {
      await playwrightService.initialize();
      
      expect(mockChromium.launch).toHaveBeenCalledWith({
        headless: true,
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
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Browser initialization failed');
      mockChromium.launch.mockRejectedValue(error);

      await expect(playwrightService.initialize()).rejects.toThrow('Browser initialization failed');
    });
  });

  describe('bookTickets', () => {
    beforeEach(async () => {
      // Mock successful login
      mockLocator.count.mockResolvedValue(1); // Simulate successful login
      
      // Mock successful seat selection
      mockLocator.all.mockResolvedValue([
        { click: jest.fn(), getAttribute: jest.fn().mockResolvedValue('seat-A1') },
        { click: jest.fn(), getAttribute: jest.fn().mockResolvedValue('seat-A2') }
      ]);
      
      // Mock successful booking completion
      mockLocator.isVisible.mockResolvedValue(true);
      mockLocator.textContent.mockResolvedValue('CONF-001');
    });

    it('should book tickets successfully with valid input', async () => {
      const result = await playwrightService.bookTickets(mockBookTicketsInput);

      expect(result.success).toBe(true);
      expect(result.confirmationNumber).toBe('CONF-001');
      expect(mockPage.goto).toHaveBeenCalledWith('https://www.amctheatres.com/account/sign-in');
    });

    it('should handle login failure', async () => {
      // Mock login failure
      mockLocator.count.mockResolvedValue(0); // No user menu found
      mockLocator.isVisible.mockResolvedValue(true);
      mockLocator.textContent.mockResolvedValue('Invalid credentials');

      const result = await playwrightService.bookTickets(mockBookTicketsInput);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe('Login failed - please check your credentials');
    });

    it('should handle seat selection failure', async () => {
      // Mock successful login
      mockLocator.count.mockResolvedValue(1);
      
      // Mock seat selection failure - no available seats
      mockLocator.all.mockResolvedValue([]);

      const result = await playwrightService.bookTickets(mockBookTicketsInput);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('Only 0 seats available');
    });

    it('should handle booking completion failure', async () => {
      // Mock successful login and seat selection
      mockLocator.count.mockResolvedValue(1);
      mockLocator.all.mockResolvedValue([
        { click: jest.fn(), getAttribute: jest.fn().mockResolvedValue('seat-A1') }
      ]);
      
      // Mock booking completion failure
      mockLocator.isVisible.mockResolvedValue(false);

      const result = await playwrightService.bookTickets(mockBookTicketsInput);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('Booking completed but no confirmation number found');
    });

    it('should handle general errors gracefully', async () => {
      // Mock an error during the process
      mockPage.goto.mockRejectedValue(new Error('Navigation failed'));

      const result = await playwrightService.bookTickets(mockBookTicketsInput);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('Booking automation failed');
    });
  });

  describe('handleLogin', () => {
    it('should handle successful login', async () => {
      // Mock successful login flow
      mockLocator.count.mockResolvedValue(1); // User menu found
      
      const result = await (playwrightService as any).handleLogin(mockPage, 'test@example.com', 'password');
      
      expect(result).toBe(true);
      expect(mockPage.fill).toHaveBeenCalledWith('input[type="email"], input[name="email"]', 'test@example.com');
      expect(mockPage.fill).toHaveBeenCalledWith('input[type="password"], input[name="password"]', 'password');
      expect(mockPage.click).toHaveBeenCalledWith('button[type="submit"], input[type="submit"]');
    });

    it('should handle login failure', async () => {
      // Mock login failure
      mockLocator.count.mockResolvedValue(0); // No user menu found
      mockLocator.isVisible.mockResolvedValue(true);
      mockLocator.textContent.mockResolvedValue('Invalid credentials');
      
      const result = await (playwrightService as any).handleLogin(mockPage, 'test@example.com', 'password');
      
      expect(result).toBe(false);
    });

    it('should handle login errors', async () => {
      // Mock an error during login
      mockPage.waitForSelector.mockRejectedValue(new Error('Selector not found'));
      
      const result = await (playwrightService as any).handleLogin(mockPage, 'test@example.com', 'password');
      
      expect(result).toBe(false);
    });
  });

  describe('selectSeats', () => {
    it('should select seats successfully', async () => {
      // Mock available seats
      const mockSeats = [
        { click: jest.fn(), getAttribute: jest.fn().mockResolvedValue('seat-A1') },
        { click: jest.fn(), getAttribute: jest.fn().mockResolvedValue('seat-A2') }
      ];
      
      mockLocator.all.mockResolvedValue(mockSeats);
      mockLocator.count.mockResolvedValue(2); // 2 seats selected
      
      const result = await (playwrightService as any).selectSeats(mockPage, 2);
      
      expect(result.success).toBe(true);
      expect(mockSeats[0].click).toHaveBeenCalled();
      expect(mockSeats[1].click).toHaveBeenCalled();
    });

    it('should handle insufficient available seats', async () => {
      // Mock only 1 available seat when 2 are requested
      mockLocator.all.mockResolvedValue([
        { click: jest.fn(), getAttribute: jest.fn().mockResolvedValue('seat-A1') }
      ]);
      
      const result = await (playwrightService as any).selectSeats(mockPage, 2);
      
      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('Only 1 seats available, requested 2');
    });

    it('should handle seat selection errors', async () => {
      // Mock an error during seat selection
      mockPage.waitForSelector.mockRejectedValue(new Error('Seat map not found'));
      
      const result = await (playwrightService as any).selectSeats(mockPage, 2);
      
      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('Seat selection failed');
    });
  });

  describe('completeBooking', () => {
    it('should complete booking successfully', async () => {
      // Mock successful booking completion
      mockLocator.isVisible.mockResolvedValue(true);
      mockLocator.textContent.mockResolvedValue('CONF-001');
      
      const result = await (playwrightService as any).completeBooking(mockPage);
      
      expect(result.success).toBe(true);
      expect(result.confirmationNumber).toBe('CONF-001');
    });

    it('should handle missing confirmation number', async () => {
      // Mock successful booking but no confirmation number
      mockLocator.isVisible.mockResolvedValue(true);
      mockLocator.textContent.mockResolvedValue(null);
      
      const result = await (playwrightService as any).completeBooking(mockPage);
      
      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe('Booking completed but no confirmation number found');
    });

    it('should handle booking completion errors', async () => {
      // Mock an error during booking completion
      mockPage.waitForSelector.mockRejectedValue(new Error('Confirmation page not found'));
      
      const result = await (playwrightService as any).completeBooking(mockPage);
      
      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('Booking completion failed');
    });
  });

  describe('extractConfirmationNumber', () => {
    it('should extract confirmation number successfully', async () => {
      mockLocator.isVisible.mockResolvedValue(true);
      mockLocator.textContent.mockResolvedValue('CONF-123');
      
      const result = await (playwrightService as any).extractConfirmationNumber(mockPage);
      
      expect(result).toBe('CONF-123');
    });

    it('should return null if confirmation element not found', async () => {
      mockLocator.isVisible.mockResolvedValue(false);
      
      const result = await (playwrightService as any).extractConfirmationNumber(mockPage);
      
      expect(result).toBeNull();
    });
  });

  describe('extractBookingDetails', () => {
    it('should extract booking details successfully', async () => {
      // Mock different text content for each element
      mockLocator.textContent
        .mockResolvedValueOnce('Dune: Part Two') // movieTitle
        .mockResolvedValueOnce('AMC Century City 15') // theaterName
        .mockResolvedValueOnce('2024-01-15T19:00:00Z') // showtime
        .mockResolvedValueOnce('$37.98'); // totalPrice
      
      const result = await (playwrightService as any).extractBookingDetails(mockPage);
      
      expect(result.movieTitle).toBe('Dune: Part Two');
      expect(result.theaterName).toBe('AMC Century City 15');
      expect(result.showtime).toBe('2024-01-15T19:00:00Z');
      expect(result.totalPrice).toBe(37.98);
    });

    it('should handle missing booking details gracefully', async () => {
      // Mock missing elements
      mockLocator.textContent.mockResolvedValue(null);
      
      const result = await (playwrightService as any).extractBookingDetails(mockPage);
      
      expect(result.movieTitle).toBe('Unknown');
      expect(result.theaterName).toBe('Unknown');
      expect(result.showtime).toBe('Unknown');
      expect(result.totalPrice).toBe(0);
    });
  });

  describe('Session Management', () => {
    it('should store user session after successful booking', async () => {
      // Mock successful booking flow
      mockLocator.count.mockResolvedValue(1);
      mockLocator.all.mockResolvedValue([
        { click: jest.fn(), getAttribute: jest.fn().mockResolvedValue('seat-A1') }
      ]);
      mockLocator.isVisible.mockResolvedValue(true);
      mockLocator.textContent.mockResolvedValue('CONF-001');
      
      await playwrightService.bookTickets(mockBookTicketsInput);
      
      const sessions = playwrightService.getActiveSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].email).toBe('test@example.com');
      expect(sessions[0].isActive).toBe(true);
    });

    it('should return active sessions', () => {
      const sessions = playwrightService.getActiveSessions();
      expect(Array.isArray(sessions)).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources properly', async () => {
      await playwrightService.initialize();
      await playwrightService.cleanup();
      
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should handle cleanup when browser not initialized', async () => {
      await playwrightService.cleanup();
      
      // Should not throw error
      expect(mockBrowser.close).not.toHaveBeenCalled();
    });
  });
}); 