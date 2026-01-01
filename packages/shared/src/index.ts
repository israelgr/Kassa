// Types
export * from './types/user';
export * from './types/donation';
export * from './types/referral';

// Validation schemas
export * from './validation/schemas';

// API error types
export interface ApiError {
  error: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}
