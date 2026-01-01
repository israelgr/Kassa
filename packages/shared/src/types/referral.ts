export interface LevelBreakdown {
  level: number;
  userCount: number;
  totalDonated: number;
}

export interface ReferralStats {
  referrer: {
    id: number;
    username: string;
  } | null;
  totalDescendants: number;
  totalDescendantDonations: number;
  levelBreakdown: LevelBreakdown[];
}

export interface ReferralLinkResponse {
  referralCode: string;
  referralUrl: string;
}

export interface ReferralTreeUser {
  id: number;
  username: string;
  totalDonated: number;
  joinedAt: string;
}

export interface ReferralTreeLevel {
  level: number;
  users: ReferralTreeUser[];
}

export interface ReferralTreeResponse {
  tree: ReferralTreeLevel[];
}
