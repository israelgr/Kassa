import { useState, FormEvent } from 'react';
import { donationAmountSchema } from '@kassa/shared';
import type { Donation } from '@kassa/shared';

interface DonationFormProps {
  onDonate: (amount: number) => Promise<Donation>;
  onSuccess?: (donation: Donation) => void;
}

const QUICK_AMOUNTS = [5, 10, 25, 50, 100];

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

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process donation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="donation-form-container">
      <h3>Make a Donation</h3>

      <div className="quick-amounts">
        {QUICK_AMOUNTS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleQuickAmount(value)}
            className={`quick-amount-btn ${amount === value.toString() ? 'active' : ''}`}
            disabled={isSubmitting}
          >
            ${value}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="donation-form">
        <div className="form-group">
          <label htmlFor="amount">Custom Amount</label>
          <div className="amount-input-wrapper">
            <span className="currency-symbol">$</span>
            <input
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
            />
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Thank you for your donation!</div>}

        <button type="submit" disabled={isSubmitting || !amount} className="btn btn-primary">
          {isSubmitting ? 'Processing...' : 'Donate Now'}
        </button>
      </form>
    </div>
  );
}
