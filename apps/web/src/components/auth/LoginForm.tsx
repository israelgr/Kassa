import { useState, FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usernameSchema, referralCodeSchema } from '@kassa/shared';

interface LoginFormProps {
  initialReferralCode?: string;
  onSuccess?: () => void;
}

export function LoginForm({ initialReferralCode, onSuccess }: LoginFormProps) {
  const { login, error, clearError, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [referralCode, setReferralCode] = useState(initialReferralCode || '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    // Validate username
    const usernameResult = usernameSchema.safeParse(username);
    if (!usernameResult.success) {
      setValidationError(usernameResult.error.errors[0]?.message || 'Invalid username');
      return;
    }

    // Validate referral code if provided
    if (referralCode) {
      const refResult = referralCodeSchema.safeParse(referralCode);
      if (!refResult.success) {
        setValidationError(refResult.error.errors[0]?.message || 'Invalid referral code');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await login(usernameResult.data, referralCode || undefined);
      onSuccess?.();
    } catch {
      // Error is handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = validationError || error;

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div className="form-group">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          disabled={isSubmitting || isLoading}
          autoComplete="username"
          autoFocus
        />
        <small>3-50 characters, letters, numbers, and underscores only</small>
      </div>

      {initialReferralCode && (
        <div className="form-group">
          <label htmlFor="referralCode">Referral Code</label>
          <input
            id="referralCode"
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            disabled={isSubmitting || isLoading}
            readOnly={!!initialReferralCode}
          />
          <small>You were referred by a friend!</small>
        </div>
      )}

      {displayError && <div className="error-message">{displayError}</div>}

      <button type="submit" disabled={isSubmitting || isLoading} className="btn btn-primary">
        {isSubmitting ? 'Signing in...' : 'Sign In / Sign Up'}
      </button>

      <p className="login-hint">
        New users are automatically registered. Existing users are logged in.
      </p>
    </form>
  );
}
