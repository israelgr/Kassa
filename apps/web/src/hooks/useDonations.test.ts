import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDonations } from './useDonations';
import { api } from '../services/api';
import { mockDonation, mockDonations, mockDonationSummary } from '../test/mocks/mockData';

vi.mock('../services/api', () => ({
  api: {
    getDonations: vi.fn(),
    getDonationSummary: vi.fn(),
    createDonation: vi.fn(),
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

describe('useDonations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch donations and summary on mount', async () => {
    mockApi.getDonations.mockResolvedValue({
      donations: mockDonations,
      pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
    });
    mockApi.getDonationSummary.mockResolvedValue(mockDonationSummary);

    const { result } = renderHook(() => useDonations());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.donations).toEqual(mockDonations);
    expect(result.current.summary).toEqual(mockDonationSummary);
    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it('should set error on fetch failure', async () => {
    const { ApiRequestError } = await import('../services/api');
    mockApi.getDonations.mockRejectedValue(
      new ApiRequestError('Server error', 'SERVER_ERROR', 500)
    );
    mockApi.getDonationSummary.mockResolvedValue(mockDonationSummary);

    const { result } = renderHook(() => useDonations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Server error');
    expect(result.current.donations).toEqual([]);
  });

  it('should set generic error for non-API errors', async () => {
    mockApi.getDonations.mockRejectedValue(new Error('Network error'));
    mockApi.getDonationSummary.mockResolvedValue(mockDonationSummary);

    const { result } = renderHook(() => useDonations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load donations');
  });

  describe('createDonation', () => {
    it('should create donation and update list', async () => {
      const newDonation = { ...mockDonation, id: 99, amount: 100 };
      mockApi.getDonations.mockResolvedValue({
        donations: mockDonations,
        pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
      });
      mockApi.getDonationSummary.mockResolvedValue(mockDonationSummary);
      mockApi.createDonation.mockResolvedValue(newDonation);

      const updatedSummary = { ...mockDonationSummary, totalDonated: 185 };
      mockApi.getDonationSummary.mockResolvedValueOnce(mockDonationSummary);
      mockApi.getDonationSummary.mockResolvedValueOnce(updatedSummary);

      const { result } = renderHook(() => useDonations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let createdDonation;
      await act(async () => {
        createdDonation = await result.current.createDonation(100);
      });

      expect(createdDonation).toEqual(newDonation);
      expect(result.current.donations[0]).toEqual(newDonation);
      expect(mockApi.createDonation).toHaveBeenCalledWith(100);
    });

    it('should refresh summary after creating donation', async () => {
      const newDonation = { ...mockDonation, id: 99, amount: 100 };
      mockApi.getDonations.mockResolvedValue({
        donations: mockDonations,
        pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
      });
      mockApi.getDonationSummary.mockResolvedValue(mockDonationSummary);
      mockApi.createDonation.mockResolvedValue(newDonation);

      const { result } = renderHook(() => useDonations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const summaryCallCount = mockApi.getDonationSummary.mock.calls.length;

      await act(async () => {
        await result.current.createDonation(100);
      });

      expect(mockApi.getDonationSummary.mock.calls.length).toBe(summaryCallCount + 1);
    });
  });

  describe('loadMore', () => {
    it('should load more donations and append to list', async () => {
      const page1 = [mockDonations[0]];
      const page2 = [mockDonations[1], mockDonations[2]];

      mockApi.getDonations.mockResolvedValueOnce({
        donations: page1,
        pagination: { page: 1, limit: 1, total: 3, totalPages: 3 },
      });
      mockApi.getDonationSummary.mockResolvedValue(mockDonationSummary);

      const { result } = renderHook(() => useDonations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.donations).toHaveLength(1);
      expect(result.current.page).toBe(1);
      expect(result.current.totalPages).toBe(3);

      mockApi.getDonations.mockResolvedValueOnce({
        donations: page2,
        pagination: { page: 2, limit: 1, total: 3, totalPages: 3 },
      });

      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.donations).toHaveLength(3);
      expect(result.current.page).toBe(2);
    });

    it('should not load more when on last page', async () => {
      mockApi.getDonations.mockResolvedValue({
        donations: mockDonations,
        pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
      });
      mockApi.getDonationSummary.mockResolvedValue(mockDonationSummary);

      const { result } = renderHook(() => useDonations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const callCount = mockApi.getDonations.mock.calls.length;

      await act(async () => {
        await result.current.loadMore();
      });

      expect(mockApi.getDonations.mock.calls.length).toBe(callCount);
    });
  });

  describe('refresh', () => {
    it('should refresh donations from first page', async () => {
      mockApi.getDonations.mockResolvedValue({
        donations: mockDonations,
        pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
      });
      mockApi.getDonationSummary.mockResolvedValue(mockDonationSummary);

      const { result } = renderHook(() => useDonations());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newDonations = [{ ...mockDonation, id: 99 }];
      mockApi.getDonations.mockResolvedValueOnce({
        donations: newDonations,
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.donations).toEqual(newDonations);
      expect(mockApi.getDonations).toHaveBeenLastCalledWith(1);
    });
  });
});
