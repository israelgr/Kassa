import { useDonations } from '../../hooks/useDonations';
import { useReferralStats } from '../../hooks/useReferralStats';
import { formatCurrency } from '../../lib/utils';
import { DonationForm } from '../donation/DonationForm';
import { DonationHistory } from '../donation/DonationHistory';
import { ReferralLink } from '../referral/ReferralLink';
import { ReferralLevelBreakdown } from '../referral/ReferralLevelBreakdown';
import { Card, CardContent } from '../ui/card';
import { Spinner } from '../ui/spinner';
import { Heart, Gift, Users, TrendingUp } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-500">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your Impact</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary-500 to-primary-600">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {summary ? formatCurrency(summary.totalDonated) : '$0.00'}
                  </p>
                  <p className="text-sm text-primary-100">Your Total Donations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Gift className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary?.donationCount || 0}
                  </p>
                  <p className="text-sm text-gray-500">Donations Made</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.totalDescendants || 0}
                  </p>
                  <p className="text-sm text-gray-500">People Referred</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats ? formatCurrency(stats.totalDescendantDonations) : '$0.00'}
                  </p>
                  <p className="text-sm text-gray-500">Raised by Network</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {referralLink && (
        <section>
          <ReferralLink referralUrl={referralLink.referralUrl} />
        </section>
      )}

      <section>
        <DonationForm onDonate={createDonation} onSuccess={handleDonationSuccess} />
      </section>

      {stats && (
        <section>
          <ReferralLevelBreakdown
            breakdown={stats.levelBreakdown}
            totalDescendants={stats.totalDescendants}
            totalDescendantDonations={stats.totalDescendantDonations}
          />
        </section>
      )}

      <section>
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
