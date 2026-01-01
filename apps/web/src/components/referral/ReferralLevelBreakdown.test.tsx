import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReferralLevelBreakdown } from './ReferralLevelBreakdown';
import { mockLevelBreakdown } from '../../test/mocks/mockData';

describe('ReferralLevelBreakdown', () => {
  it('should show empty state when no breakdown data', () => {
    render(
      <ReferralLevelBreakdown
        breakdown={[]}
        totalDescendants={0}
        totalDescendantDonations={0}
      />
    );
    expect(screen.getByText(/no referrals yet/i)).toBeInTheDocument();
    expect(screen.getByText(/share your link/i)).toBeInTheDocument();
  });

  it('should render title', () => {
    render(
      <ReferralLevelBreakdown
        breakdown={mockLevelBreakdown}
        totalDescendants={17}
        totalDescendantDonations={700}
      />
    );
    expect(screen.getByRole('heading', { name: /referral network/i })).toBeInTheDocument();
  });

  it('should display total referrals', () => {
    render(
      <ReferralLevelBreakdown
        breakdown={mockLevelBreakdown}
        totalDescendants={17}
        totalDescendantDonations={700}
      />
    );
    expect(screen.getAllByText('17')).toHaveLength(2); // summary and table footer
    expect(screen.getByText('Total Referrals')).toBeInTheDocument();
  });

  it('should display total raised', () => {
    render(
      <ReferralLevelBreakdown
        breakdown={mockLevelBreakdown}
        totalDescendants={17}
        totalDescendantDonations={700}
      />
    );
    expect(screen.getAllByText('$700.00')).toHaveLength(2); // summary and table footer
    expect(screen.getByText('Total Raised')).toBeInTheDocument();
  });

  it('should render table with headers', () => {
    render(
      <ReferralLevelBreakdown
        breakdown={mockLevelBreakdown}
        totalDescendants={17}
        totalDescendantDonations={700}
      />
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /level/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /users/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /donated/i })).toBeInTheDocument();
  });

  it('should render level rows', () => {
    render(
      <ReferralLevelBreakdown
        breakdown={mockLevelBreakdown}
        totalDescendants={17}
        totalDescendantDonations={700}
      />
    );
    expect(screen.getByText('Level 1')).toBeInTheDocument();
    expect(screen.getByText('Level 2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('$250.00')).toBeInTheDocument();
    expect(screen.getByText('$450.00')).toBeInTheDocument();
  });

  it('should render footer with totals', () => {
    render(
      <ReferralLevelBreakdown
        breakdown={mockLevelBreakdown}
        totalDescendants={17}
        totalDescendantDonations={700}
      />
    );
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('should format currency correctly', () => {
    render(
      <ReferralLevelBreakdown
        breakdown={[{ level: 1, userCount: 3, totalDonated: 1234.56 }]}
        totalDescendants={3}
        totalDescendantDonations={1234.56}
      />
    );
    expect(screen.getAllByText('$1,234.56')).toHaveLength(3); // summary, row, and footer
  });

  it('should render badges for levels', () => {
    render(
      <ReferralLevelBreakdown
        breakdown={mockLevelBreakdown}
        totalDescendants={17}
        totalDescendantDonations={700}
      />
    );
    const badges = screen.getAllByText(/^Level \d$/);
    expect(badges).toHaveLength(2);
  });

  it('should handle single level breakdown', () => {
    render(
      <ReferralLevelBreakdown
        breakdown={[{ level: 1, userCount: 5, totalDonated: 100 }]}
        totalDescendants={5}
        totalDescendantDonations={100}
      />
    );
    expect(screen.getByText('Level 1')).toBeInTheDocument();
    expect(screen.queryByText('Level 2')).not.toBeInTheDocument();
  });

  it('should handle many levels', () => {
    const manyLevels = [
      { level: 1, userCount: 2, totalDonated: 50 },
      { level: 2, userCount: 4, totalDonated: 100 },
      { level: 3, userCount: 8, totalDonated: 200 },
      { level: 4, userCount: 16, totalDonated: 400 },
    ];
    render(
      <ReferralLevelBreakdown
        breakdown={manyLevels}
        totalDescendants={30}
        totalDescendantDonations={750}
      />
    );
    expect(screen.getByText('Level 1')).toBeInTheDocument();
    expect(screen.getByText('Level 2')).toBeInTheDocument();
    expect(screen.getByText('Level 3')).toBeInTheDocument();
    expect(screen.getByText('Level 4')).toBeInTheDocument();
  });
});
