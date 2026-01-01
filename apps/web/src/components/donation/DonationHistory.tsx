import type { Donation } from '@kassa/shared';

interface DonationHistoryProps {
  donations: Donation[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function DonationHistory({
  donations,
  isLoading,
  hasMore,
  onLoadMore,
}: DonationHistoryProps) {
  if (isLoading && donations.length === 0) {
    return (
      <div className="donation-history">
        <h3>Your Donations</h3>
        <div className="loading">Loading donations...</div>
      </div>
    );
  }

  if (donations.length === 0) {
    return (
      <div className="donation-history">
        <h3>Your Donations</h3>
        <p className="empty-state">No donations yet. Make your first donation above!</p>
      </div>
    );
  }

  return (
    <div className="donation-history">
      <h3>Your Donations</h3>
      <ul className="donation-list">
        {donations.map((donation) => (
          <li key={donation.id} className="donation-item">
            <span className="donation-amount">{formatCurrency(donation.amount)}</span>
            <span className="donation-date">{formatDate(donation.createdAt)}</span>
          </li>
        ))}
      </ul>
      {hasMore && (
        <button onClick={onLoadMore} disabled={isLoading} className="btn btn-secondary">
          {isLoading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
