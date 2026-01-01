import { z } from 'zod';

// Username validation: 3-50 chars, alphanumeric + underscore only
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must be at most 50 characters')
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Username can only contain letters, numbers, and underscores'
  )
  .transform((val) => val.toLowerCase());

// Referral code validation: 32-char hex string (UUID without hyphens)
export const referralCodeSchema = z
  .string()
  .length(32, 'Invalid referral code')
  .regex(/^[a-f0-9]+$/i, 'Invalid referral code format')
  .transform((val) => val.toLowerCase());

// Donation amount validation: minimum $1, max $1,000,000, rounded to 2 decimals
export const donationAmountSchema = z
  .number()
  .min(1, 'Minimum donation is $1')
  .max(1000000, 'Maximum donation is $1,000,000')
  .transform((val) => Math.round(val * 100) / 100);

// Login request schema
export const loginSchema = z.object({
  username: usernameSchema,
  referralCode: referralCodeSchema.optional(),
});

// Donation request schema
export const donationSchema = z.object({
  amount: donationAmountSchema,
});

// Pagination query schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type DonationInput = z.infer<typeof donationSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
