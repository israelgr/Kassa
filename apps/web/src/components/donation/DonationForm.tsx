import { useState, FormEvent } from 'react';
import { donationAmountSchema } from '@kassa/shared';
import type { Donation } from '@kassa/shared';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { cn } from '../../lib/utils';
import { TIMING, QUICK_DONATION_AMOUNTS } from '../../lib/constants';

interface DonationFormProps {
  onDonate: (amount: number) => Promise<Donation>;
  onSuccess?: (donation: Donation) => void;
}

export function DonationForm({ onDonate, onSuccess }: DonationFormProps) {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const numAmount = parseFloat(amount);
    const result = donationAmountSchema.safeParse(numAmount);

    if (!result.success) {
      setError(result.error.errors[0]?.message || 'Invalid amount');
      return;
    }

    try {
      setIsSubmitting(true);
      const donation = await onDonate(result.data);
      setSuccess(true);
      setAmount('');
      onSuccess?.(donation);

      setTimeout(() => setSuccess(false), TIMING.SUCCESS_MESSAGE_DURATION);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process donation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Make a Donation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-6">
          {QUICK_DONATION_AMOUNTS.map((value) => (
            <Button
              key={value}
              type="button"
              variant={amount === value.toString() ? 'default' : 'outline'}
              onClick={() => handleQuickAmount(value)}
              disabled={isSubmitting}
              className="flex-1 min-w-[60px]"
            >
              ${value}
            </Button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Custom Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                  setSuccess(false);
                }}
                placeholder="0.00"
                min="1"
                step="0.01"
                disabled={isSubmitting}
                className={cn('pl-7')}
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert variant="success">
              <AlertDescription>Thank you for your donation!</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={isSubmitting || !amount} className="w-full">
            {isSubmitting ? 'Processing...' : 'Donate Now'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
