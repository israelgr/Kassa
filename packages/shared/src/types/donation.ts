export interface Donation {
  id: number;
  userId: number;
  amount: number;
  createdAt: string;
}

export interface DonationRequest {
  amount: number;
}

export interface DonationSummary {
  totalDonated: number;
  donationCount: number;
  firstDonation: string | null;
  lastDonation: string | null;
}

export interface DonationListResponse {
  donations: Donation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
