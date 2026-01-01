import { useState, useEffect, useCallback } from 'react';
import { api, ApiRequestError } from '../services/api';
import type { Donation, DonationSummary } from '@kassa/shared';

interface UseDonationsReturn {
  donations: Donation[];
  summary: DonationSummary | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  createDonation: (amount: number) => Promise<Donation>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useDonations(): UseDonationsReturn {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [summary, setSummary] = useState<DonationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const [donationsRes, summaryRes] = await Promise.all([
        api.getDonations(pageNum),
        api.getDonationSummary(),
      ]);

      setDonations((prev) =>
        append ? [...prev, ...donationsRes.donations] : donationsRes.donations
      );
      setSummary(summaryRes);
      setPage(donationsRes.pagination.page);
      setTotalPages(donationsRes.pagination.totalPages);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError('Failed to load donations');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createDonation = useCallback(async (amount: number): Promise<Donation> => {
    const donation = await api.createDonation(amount);
    setDonations((prev) => [donation, ...prev]);
    // Refresh summary after donation
    const summaryRes = await api.getDonationSummary();
    setSummary(summaryRes);
    return donation;
  }, []);

  const loadMore = useCallback(async () => {
    if (page < totalPages) {
      await fetchData(page + 1, true);
    }
  }, [page, totalPages, fetchData]);

  const refresh = useCallback(async () => {
    await fetchData(1, false);
  }, [fetchData]);

  return {
    donations,
    summary,
    isLoading,
    error,
    page,
    totalPages,
    createDonation,
    loadMore,
    refresh,
  };
}
