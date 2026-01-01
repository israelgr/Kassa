export const TIMING = {
  COPY_FEEDBACK_DURATION: 2000,
  SUCCESS_MESSAGE_DURATION: 3000,
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'kassa_token',
  THEME: 'kassa_theme',
} as const;

export const QUICK_DONATION_AMOUNTS = [5, 10, 25, 50, 100] as const;
