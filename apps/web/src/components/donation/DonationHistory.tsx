import type { Donation } from '@kassa/shared';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { History } from 'lucide-react';

interface DonationHistoryProps {
  donations: Donation[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export function DonationHistory({
  donations,
  isLoading,
  hasMore,
  onLoadMore,
}: DonationHistoryProps) {
  if (isLoading && donations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <History className="h-5 w-5" />
            Your Donations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading donations...</div>
        </CardContent>
      </Card>
    );
  }

  if (donations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <History className="h-5 w-5" />
            Your Donations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            No donations yet. Make your first donation above!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <History className="h-5 w-5" />
          Your Donations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {donations.map((donation) => (
            <li
              key={donation.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <span className="font-semibold text-primary-700 dark:text-primary-400">
                {formatCurrency(donation.amount)}
              </span>
              <span className="text-sm text-gray-500">{formatDate(donation.createdAt)}</span>
            </li>
          ))}
        </ul>
        {hasMore && (
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
