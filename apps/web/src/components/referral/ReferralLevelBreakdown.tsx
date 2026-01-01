import type { LevelBreakdown } from '@kassa/shared';

interface ReferralLevelBreakdownProps {
  breakdown: LevelBreakdown[];
  totalDescendants: number;
  totalDescendantDonations: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function ReferralLevelBreakdown({
  breakdown,
  totalDescendants,
  totalDescendantDonations,
}: ReferralLevelBreakdownProps) {
  if (breakdown.length === 0) {
    return (
      <div className="referral-breakdown">
        <h3>Referral Network</h3>
        <p className="empty-state">
          No referrals yet. Share your link to start building your network!
        </p>
      </div>
    );
  }

  return (
    <div className="referral-breakdown">
      <h3>Referral Network</h3>

      <div className="summary-cards">
        <div className="summary-card">
          <span className="card-value">{totalDescendants}</span>
          <span className="card-label">Total Referrals</span>
        </div>
        <div className="summary-card">
          <span className="card-value">{formatCurrency(totalDescendantDonations)}</span>
          <span className="card-label">Total Raised</span>
        </div>
      </div>

      <table className="breakdown-table">
        <thead>
          <tr>
            <th>Level</th>
            <th>Users</th>
            <th>Donated</th>
          </tr>
        </thead>
        <tbody>
          {breakdown.map((level) => (
            <tr key={level.level}>
              <td>
                <span className="level-badge">Level {level.level}</span>
              </td>
              <td>{level.userCount}</td>
              <td>{formatCurrency(level.totalDonated)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>
              <strong>Total</strong>
            </td>
            <td>
              <strong>{totalDescendants}</strong>
            </td>
            <td>
              <strong>{formatCurrency(totalDescendantDonations)}</strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
