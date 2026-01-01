import { useState, FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usernameSchema, referralCodeSchema } from '@kassa/shared';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';

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

    const usernameResult = usernameSchema.safeParse(username);
    if (!usernameResult.success) {
      setValidationError(usernameResult.error.errors[0]?.message || 'Invalid username');
      return;
    }

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          disabled={isSubmitting || isLoading}
          autoComplete="username"
          autoFocus
        />
        <p className="text-xs text-gray-500">
          3-50 characters, letters, numbers, and underscores only
        </p>
      </div>

      {initialReferralCode && (
        <div className="space-y-2">
          <Label htmlFor="referralCode">Referral Code</Label>
          <Input
            id="referralCode"
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            disabled={isSubmitting || isLoading}
            readOnly={!!initialReferralCode}
            className="bg-gray-100 dark:bg-gray-700"
          />
          <p className="text-xs text-primary-600">You were referred by a friend!</p>
        </div>
      )}

      {displayError && (
        <Alert variant="destructive">
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isSubmitting || isLoading} className="w-full">
        {isSubmitting ? 'Signing in...' : 'Sign In / Sign Up'}
      </Button>

      <p className="text-center text-sm text-gray-500">
        New users are automatically registered. Existing users are logged in.
      </p>
    </form>
  );
}
