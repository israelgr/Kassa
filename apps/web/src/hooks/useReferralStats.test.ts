import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useReferralStats } from './useReferralStats';
import { api } from '../services/api';
import { mockReferralStats, mockReferralLink } from '../test/mocks/mockData';

vi.mock('../services/api', () => ({
  api: {
    getReferralStats: vi.fn(),
    getReferralLink: vi.fn(),
  },
  ApiRequestError: class ApiRequestError extends Error {
    code: string;
    status: number;
    constructor(message: string, code: string, status: number) {
      super(message);
      this.code = code;
      this.status = status;
      this.name = 'ApiRequestError';
    }
  },
}));

const mockApi = vi.mocked(api);

describe('useReferralStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch stats and referral link on mount', async () => {
    mockApi.getReferralStats.mockResolvedValue(mockReferralStats);
    mockApi.getReferralLink.mockResolvedValue(mockReferralLink);

    const { result } = renderHook(() => useReferralStats());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats).toEqual(mockReferralStats);
    expect(result.current.referralLink).toEqual(mockReferralLink);
    expect(result.current.error).toBeNull();
  });

  it('should set error on stats fetch failure', async () => {
    const { ApiRequestError } = await import('../services/api');
    mockApi.getReferralStats.mockRejectedValue(
      new ApiRequestError('Failed to fetch stats', 'SERVER_ERROR', 500)
    );
    mockApi.getReferralLink.mockResolvedValue(mockReferralLink);

    const { result } = renderHook(() => useReferralStats());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch stats');
    expect(result.current.stats).toBeNull();
  });

  it('should set error on link fetch failure', async () => {
    const { ApiRequestError } = await import('../services/api');
    mockApi.getReferralStats.mockResolvedValue(mockReferralStats);
    mockApi.getReferralLink.mockRejectedValue(
      new ApiRequestError('Failed to fetch link', 'SERVER_ERROR', 500)
    );

    const { result } = renderHook(() => useReferralStats());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch link');
    expect(result.current.referralLink).toBeNull();
  });

  it('should set generic error for non-API errors', async () => {
    mockApi.getReferralStats.mockRejectedValue(new Error('Network error'));
    mockApi.getReferralLink.mockResolvedValue(mockReferralLink);

    const { result } = renderHook(() => useReferralStats());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load referral stats');
  });

  describe('refresh', () => {
    it('should refresh data when called', async () => {
      mockApi.getReferralStats.mockResolvedValue(mockReferralStats);
      mockApi.getReferralLink.mockResolvedValue(mockReferralLink);

      const { result } = renderHook(() => useReferralStats());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updatedStats = { ...mockReferralStats, totalDescendants: 25 };
      mockApi.getReferralStats.mockResolvedValueOnce(updatedStats);

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.stats).toEqual(updatedStats);
      expect(mockApi.getReferralStats).toHaveBeenCalledTimes(2);
      expect(mockApi.getReferralLink).toHaveBeenCalledTimes(2);
    });

    it('should set loading state during refresh', async () => {
      mockApi.getReferralStats.mockResolvedValue(mockReferralStats);
      mockApi.getReferralLink.mockResolvedValue(mockReferralLink);

      const { result } = renderHook(() => useReferralStats());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let refreshPromise: Promise<void>;
      act(() => {
        refreshPromise = result.current.refresh();
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await refreshPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should clear error on successful refresh', async () => {
      const { ApiRequestError } = await import('../services/api');
      mockApi.getReferralStats.mockRejectedValueOnce(
        new ApiRequestError('Server error', 'SERVER_ERROR', 500)
      );
      mockApi.getReferralLink.mockResolvedValue(mockReferralLink);

      const { result } = renderHook(() => useReferralStats());

      await waitFor(() => {
        expect(result.current.error).toBe('Server error');
      });

      mockApi.getReferralStats.mockResolvedValueOnce(mockReferralStats);

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.stats).toEqual(mockReferralStats);
    });
  });

  it('should have initial state with null values', () => {
    mockApi.getReferralStats.mockImplementation(() => new Promise(() => {}));
    mockApi.getReferralLink.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useReferralStats());

    expect(result.current.stats).toBeNull();
    expect(result.current.referralLink).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });
});
