import type {
  LoginRequest,
  LoginResponse,
  User,
  Donation,
  DonationSummary,
  DonationListResponse,
  ReferralLinkResponse,
  ReferralStats,
  ApiError,
} from '@kassa/shared';

const API_BASE = '/api/v1';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new ApiRequestError(
        error.message || 'Request failed',
        error.error || 'UNKNOWN_ERROR',
        response.status,
        error.details
      );
    }

    return data as T;
  }

  // Auth endpoints
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.token = response.token;
    return response;
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' });
    this.token = null;
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Donation endpoints
  async createDonation(amount: number): Promise<Donation> {
    return this.request<Donation>('/donations', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async getDonations(page = 1, limit = 20): Promise<DonationListResponse> {
    return this.request<DonationListResponse>(
      `/donations?page=${page}&limit=${limit}`
    );
  }

  async getDonationSummary(): Promise<DonationSummary> {
    return this.request<DonationSummary>('/donations/summary');
  }

  // Referral endpoints
  async getReferralLink(): Promise<ReferralLinkResponse> {
    return this.request<ReferralLinkResponse>('/referrals/link');
  }

  async getReferralStats(): Promise<ReferralStats> {
    return this.request<ReferralStats>('/referrals/stats');
  }
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export const api = new ApiService();
