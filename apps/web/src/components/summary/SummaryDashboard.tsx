import { useDonations } from '../../hooks/useDonations';
import { useReferralStats } from '../../hooks/useReferralStats';
import { DonationForm } from '../donation/DonationForm';
import { DonationHistory } from '../donation/DonationHistory';
import { ReferralLink } from '../referral/ReferralLink';
import { ReferralLevelBreakdown } from '../referral/ReferralLevelBreakdown';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function SummaryDashboard() {
  const {
    donations,
    summary,
    isLoading: donationsLoading,
    page,
    totalPages,
    createDonation,
    loadMore,
    refresh: refreshDonations,
  } = useDonations();

  const {
    stats,
    referralLink,
    isLoading: referralLoading,
    refresh: refreshReferrals,
  } = useReferralStats();

  const handleDonationSuccess = () => {
    refreshDonations();
    refreshReferrals();
  };

  const isLoading = donationsLoading || referralLoading;

  if (isLoading && !summary && !stats) {
    return (
      <div className="dashboard loading-screen">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* User's Stats Summary */}
      <section className="dashboard-section user-stats">
        <h2>Your Impact</h2>
        <div className="stats-grid">
          <div className="stat-card primary">
            <span className="stat-value">
              {summary ? formatCurrency(summary.totalDonated) : '$0.00'}
            </span>
            <span className="stat-label">Your Total Donations</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{summary?.donationCount || 0}</span>
            <span className="stat-label">Donations Made</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats?.totalDescendants || 0}</span>
            <span className="stat-label">People Referred</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {stats ? formatCurrency(stats.totalDescendantDonations) : '$0.00'}
            </span>
            <span className="stat-label">Raised by Network</span>
          </div>
        </div>
      </section>

      {/* Referral Link */}
      {referralLink && (
        <section className="dashboard-section">
          <ReferralLink referralUrl={referralLink.referralUrl} />
        </section>
      )}

      {/* Donation Form */}
      <section className="dashboard-section">
        <DonationForm onDonate={createDonation} onSuccess={handleDonationSuccess} />
      </section>

      {/* Referral Network Breakdown */}
      {stats && (
        <section className="dashboard-section">
          <ReferralLevelBreakdown
            breakdown={stats.levelBreakdown}
            totalDescendants={stats.totalDescendants}
            totalDescendantDonations={stats.totalDescendantDonations}
          />
        </section>
      )}

      {/* Donation History */}
      <section className="dashboard-section">
        <DonationHistory
          donations={donations}
          isLoading={donationsLoading}
          hasMore={page < totalPages}
          onLoadMore={loadMore}
        />
      </section>
    </div>
  );
}
