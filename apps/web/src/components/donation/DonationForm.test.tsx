import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DonationForm } from './DonationForm';
import { mockDonation } from '../../test/mocks/mockData';

describe('DonationForm', () => {
  const mockOnDonate = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render quick donation buttons', () => {
    render(<DonationForm onDonate={mockOnDonate} />);
    expect(screen.getByRole('button', { name: '$5' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '$10' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '$25' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '$50' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '$100' })).toBeInTheDocument();
  });

  it('should render custom amount input', () => {
    render(<DonationForm onDonate={mockOnDonate} />);
    expect(screen.getByLabelText(/custom amount/i)).toBeInTheDocument();
  });

  it('should render submit button', () => {
    render(<DonationForm onDonate={mockOnDonate} />);
    expect(screen.getByRole('button', { name: /donate now/i })).toBeInTheDocument();
  });

  it('should set amount when quick button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<DonationForm onDonate={mockOnDonate} />);

    await user.click(screen.getByRole('button', { name: '$25' }));

    const input = screen.getByLabelText(/custom amount/i);
    expect(input).toHaveValue(25);
  });

  it('should disable submit button when no amount', () => {
    render(<DonationForm onDonate={mockOnDonate} />);
    expect(screen.getByRole('button', { name: /donate now/i })).toBeDisabled();
  });

  it('should enable submit button when amount is entered', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<DonationForm onDonate={mockOnDonate} />);

    await user.type(screen.getByLabelText(/custom amount/i), '50');

    expect(screen.getByRole('button', { name: /donate now/i })).not.toBeDisabled();
  });

  it('should show error for invalid amount', async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    render(<DonationForm onDonate={mockOnDonate} />);

    const input = screen.getByLabelText(/custom amount/i);
    await user.clear(input);
    await user.type(input, '0.5');

    const form = input.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(mockOnDonate).not.toHaveBeenCalled();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it('should call onDonate with amount on valid submit', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockOnDonate.mockResolvedValue(mockDonation);

    render(<DonationForm onDonate={mockOnDonate} />);

    await user.click(screen.getByRole('button', { name: '$25' }));
    await user.click(screen.getByRole('button', { name: /donate now/i }));

    await waitFor(() => {
      expect(mockOnDonate).toHaveBeenCalledWith(25);
    });
  });

  it('should call onDonate with custom amount', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockOnDonate.mockResolvedValue(mockDonation);

    render(<DonationForm onDonate={mockOnDonate} />);

    await user.type(screen.getByLabelText(/custom amount/i), '75.50');
    await user.click(screen.getByRole('button', { name: /donate now/i }));

    await waitFor(() => {
      expect(mockOnDonate).toHaveBeenCalledWith(75.5);
    });
  });

  it('should show success message after donation', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockOnDonate.mockResolvedValue(mockDonation);

    render(<DonationForm onDonate={mockOnDonate} />);

    await user.click(screen.getByRole('button', { name: '$25' }));
    await user.click(screen.getByRole('button', { name: /donate now/i }));

    await waitFor(() => {
      expect(screen.getByText(/thank you for your donation/i)).toBeInTheDocument();
    });
  });

  it('should clear amount after successful donation', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockOnDonate.mockResolvedValue(mockDonation);

    render(<DonationForm onDonate={mockOnDonate} />);

    await user.click(screen.getByRole('button', { name: '$25' }));
    await user.click(screen.getByRole('button', { name: /donate now/i }));

    await waitFor(() => {
      const input = screen.getByLabelText(/custom amount/i);
      expect(input).toHaveValue(null);
    });
  });

  it('should call onSuccess after successful donation', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockOnDonate.mockResolvedValue(mockDonation);

    render(<DonationForm onDonate={mockOnDonate} onSuccess={mockOnSuccess} />);

    await user.click(screen.getByRole('button', { name: '$25' }));
    await user.click(screen.getByRole('button', { name: /donate now/i }));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockDonation);
    });
  });

  it('should show processing state while submitting', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockOnDonate.mockImplementation(() => new Promise(() => {}));

    render(<DonationForm onDonate={mockOnDonate} />);

    await user.click(screen.getByRole('button', { name: '$25' }));
    await user.click(screen.getByRole('button', { name: /donate now/i }));

    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('should disable quick buttons while submitting', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockOnDonate.mockImplementation(() => new Promise(() => {}));

    render(<DonationForm onDonate={mockOnDonate} />);

    await user.click(screen.getByRole('button', { name: '$25' }));
    await user.click(screen.getByRole('button', { name: /donate now/i }));

    expect(screen.getByRole('button', { name: '$5' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '$10' })).toBeDisabled();
  });

  it('should show error when donation fails', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockOnDonate.mockRejectedValue(new Error('Payment failed'));

    render(<DonationForm onDonate={mockOnDonate} />);

    await user.click(screen.getByRole('button', { name: '$25' }));
    await user.click(screen.getByRole('button', { name: /donate now/i }));

    await waitFor(() => {
      expect(screen.getByText('Payment failed')).toBeInTheDocument();
    });
  });

  it('should hide success message after timeout', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockOnDonate.mockResolvedValue(mockDonation);

    render(<DonationForm onDonate={mockOnDonate} />);

    await user.click(screen.getByRole('button', { name: '$25' }));
    await user.click(screen.getByRole('button', { name: /donate now/i }));

    await waitFor(() => {
      expect(screen.getByText(/thank you for your donation/i)).toBeInTheDocument();
    });

    vi.advanceTimersByTime(4000);

    await waitFor(() => {
      expect(screen.queryByText(/thank you for your donation/i)).not.toBeInTheDocument();
    });
  });
});
