export interface User {
  id: number;
  username: string;
  referralCode: string;
  referrerId: number | null;
  createdAt: string;
}

export interface UserWithReferrer extends User {
  referrer: {
    id: number;
    username: string;
  } | null;
}

export interface LoginRequest {
  username: string;
  referralCode?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  isNewUser: boolean;
}

export interface AuthUser {
  id: number;
  username: string;
  referralCode: string;
}
