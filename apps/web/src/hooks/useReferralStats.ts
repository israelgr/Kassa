import { useState, useEffect, useCallback } from 'react';
import { api, ApiRequestError } from '../services/api';
import type { ReferralStats, ReferralLinkResponse } from '@kassa/shared';

interface UseReferralStatsReturn {
  stats: ReferralStats | null;
  referralLink: ReferralLinkResponse | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useReferralStats(): UseReferralStatsReturn {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referralLink, setReferralLink] = useState<ReferralLinkResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [statsRes, linkRes] = await Promise.all([
        api.getReferralStats(),
        api.getReferralLink(),
      ]);

      setStats(statsRes);
      setReferralLink(linkRes);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError('Failed to load referral stats');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    stats,
    referralLink,
    isLoading,
    error,
    refresh: fetchData,
  };
}
