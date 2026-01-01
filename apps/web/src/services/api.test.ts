import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, ApiRequestError } from './api';
import { mockUser, mockDonation, mockDonations, mockDonationSummary, mockLoginResponse, mockReferralStats, mockReferralLink } from '../test/mocks/mockData';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.setToken(null);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('setToken()', () => {
    it('should store token for subsequent requests', async () => {
      api.setToken('test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      await api.getCurrentUser();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should clear token when null passed', async () => {
      api.setToken('test-token');
      api.setToken(null);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      await api.getCurrentUser();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String),
          }),
        })
      );
    });
  });

  describe('login()', () => {
    it('should POST to /auth/login with credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      });

      await api.login({ username: 'testuser' });

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser' }),
      });
    });

    it('should store received token automatically', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      });

      await api.login({ username: 'testuser' });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      await api.getCurrentUser();

      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockLoginResponse.token}`,
          }),
        })
      );
    });

    it('should return LoginResponse on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      });

      const result = await api.login({ username: 'testuser' });

      expect(result).toEqual(mockLoginResponse);
    });

    it('should throw ApiRequestError on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'VALIDATION_ERROR', message: 'Invalid username' }),
      });

      await expect(api.login({ username: 'ab' })).rejects.toThrow(ApiRequestError);
    });
  });

  describe('logout()', () => {
    it('should POST to /auth/logout', async () => {
      api.setToken('test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await api.logout();

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/logout', expect.objectContaining({
        method: 'POST',
      }));
    });

    it('should clear stored token', async () => {
      api.setToken('test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await api.logout();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      await api.getCurrentUser();

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      expect(lastCall[1].headers.Authorization).toBeUndefined();
    });
  });

  describe('getCurrentUser()', () => {
    it('should GET /auth/me', async () => {
      api.setToken('test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      await api.getCurrentUser();

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/me', expect.any(Object));
    });

    it('should return User on success', async () => {
      api.setToken('test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      const result = await api.getCurrentUser();
      expect(result).toEqual(mockUser);
    });
  });

  describe('createDonation()', () => {
    it('should POST to /donations with amount', async () => {
      api.setToken('test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDonation,
      });

      await api.createDonation(25);

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/donations', {
        method: 'POST',
        headers: expect.any(Object),
        body: JSON.stringify({ amount: 25 }),
      });
    });

    it('should return created Donation', async () => {
      api.setToken('test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDonation,
      });

      const result = await api.createDonation(25);
      expect(result).toEqual(mockDonation);
    });
  });

  describe('getDonations()', () => {
    it('should GET /donations with pagination params', async () => {
      api.setToken('test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ donations: mockDonations, pagination: { page: 2, limit: 10, total: 3, totalPages: 1 } }),
      });

      await api.getDonations(2, 10);

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/donations?page=2&limit=10', expect.any(Object));
    });

    it('should use default pagination when not specified', async () => {
      api.setToken('test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ donations: mockDonations, pagination: { page: 1, limit: 20, total: 3, totalPages: 1 } }),
      });

      await api.getDonations();

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/donations?page=1&limit=20', expect.any(Object));
    });
  });

  describe('getDonationSummary()', () => {
    it('should GET /donations/summary', async () => {
      api.setToken('test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDonationSummary,
      });

      const result = await api.getDonationSummary();

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/donations/summary', expect.any(Object));
      expect(result).toEqual(mockDonationSummary);
    });
  });

  describe('getReferralLink()', () => {
    it('should GET /referrals/link', async () => {
      api.setToken('test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockReferralLink,
      });

      const result = await api.getReferralLink();

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/referrals/link', expect.any(Object));
      expect(result).toEqual(mockReferralLink);
    });
  });

  describe('getReferralStats()', () => {
    it('should GET /referrals/stats', async () => {
      api.setToken('test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockReferralStats,
      });

      const result = await api.getReferralStats();

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/referrals/stats', expect.any(Object));
      expect(result).toEqual(mockReferralStats);
    });
  });
});

describe('ApiRequestError', () => {
  it('should extend Error', () => {
    const error = new ApiRequestError('Test error', 'TEST_ERROR', 400);
    expect(error).toBeInstanceOf(Error);
  });

  it('should store code, status, and details', () => {
    const details = [{ field: 'username', message: 'Required' }];
    const error = new ApiRequestError('Test error', 'TEST_ERROR', 400, details);

    expect(error.code).toBe('TEST_ERROR');
    expect(error.status).toBe(400);
    expect(error.details).toEqual(details);
  });

  it('should have name ApiRequestError', () => {
    const error = new ApiRequestError('Test', 'TEST', 400);
    expect(error.name).toBe('ApiRequestError');
  });
});
