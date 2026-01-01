import type { User, Donation, DonationSummary, ReferralStats, LevelBreakdown, LoginResponse } from '@kassa/shared';

export const mockUser: User = {
  id: 1,
  username: 'testuser',
  referralCode: 'abc123def456abc123def456abc12345',
  referrerId: null,
  createdAt: '2024-01-01T00:00:00Z',
};

export const mockDonation: Donation = {
  id: 1,
  userId: 1,
  amount: 25.00,
  createdAt: '2024-01-15T10:30:00Z',
};

export const mockDonations: Donation[] = [
  mockDonation,
  { id: 2, userId: 1, amount: 50.00, createdAt: '2024-01-14T09:00:00Z' },
  { id: 3, userId: 1, amount: 10.00, createdAt: '2024-01-13T15:45:00Z' },
];

export const mockDonationSummary: DonationSummary = {
  totalDonated: 85.00,
  donationCount: 3,
  firstDonation: '2024-01-13T15:45:00Z',
  lastDonation: '2024-01-15T10:30:00Z',
};

export const mockLevelBreakdown: LevelBreakdown[] = [
  { level: 1, userCount: 5, totalDonated: 250.00 },
  { level: 2, userCount: 12, totalDonated: 450.00 },
];

export const mockReferralStats: ReferralStats = {
  referrer: null,
  totalDescendants: 17,
  totalDescendantDonations: 700.00,
  levelBreakdown: mockLevelBreakdown,
};

export const mockLoginResponse: LoginResponse = {
  user: mockUser,
  token: 'mock-jwt-token-xyz123',
  isNewUser: false,
};

export const mockReferralLink = {
  referralCode: mockUser.referralCode,
  referralUrl: `http://localhost:5173?ref=${mockUser.referralCode}`,
};
