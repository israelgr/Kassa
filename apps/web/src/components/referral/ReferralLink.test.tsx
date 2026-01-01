import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReferralLink } from './ReferralLink';

vi.mock('../../lib/clipboard', () => ({
  copyToClipboard: vi.fn(),
}));

describe('ReferralLink', () => {
  const referralUrl = 'http://localhost:5173?ref=abc123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render card with title', () => {
    render(<ReferralLink referralUrl={referralUrl} />);
    expect(screen.getByRole('heading', { name: /share your referral link/i })).toBeInTheDocument();
  });

  it('should render description', () => {
    render(<ReferralLink referralUrl={referralUrl} />);
    expect(screen.getByText(/invite friends to donate/i)).toBeInTheDocument();
  });

  it('should render referral URL in input', () => {
    render(<ReferralLink referralUrl={referralUrl} />);
    const input = screen.getByDisplayValue(referralUrl);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('readonly');
  });

  it('should render copy button', () => {
    render(<ReferralLink referralUrl={referralUrl} />);
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('should call copyToClipboard when copy button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { copyToClipboard } = await import('../../lib/clipboard');
    vi.mocked(copyToClipboard).mockResolvedValue(true);

    render(<ReferralLink referralUrl={referralUrl} />);
    await user.click(screen.getByRole('button', { name: /copy/i }));

    expect(copyToClipboard).toHaveBeenCalledWith(referralUrl);
  });

  it('should show copied state after successful copy', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { copyToClipboard } = await import('../../lib/clipboard');
    vi.mocked(copyToClipboard).mockResolvedValue(true);

    render(<ReferralLink referralUrl={referralUrl} />);
    await user.click(screen.getByRole('button', { name: /copy/i }));

    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('should reset copied state after timeout', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { copyToClipboard } = await import('../../lib/clipboard');
    vi.mocked(copyToClipboard).mockResolvedValue(true);

    render(<ReferralLink referralUrl={referralUrl} />);
    await user.click(screen.getByRole('button', { name: /copy/i }));

    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });

    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });
  });

  it('should not show copied state if copy fails', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { copyToClipboard } = await import('../../lib/clipboard');
    vi.mocked(copyToClipboard).mockResolvedValue(false);

    render(<ReferralLink referralUrl={referralUrl} />);
    await user.click(screen.getByRole('button', { name: /copy/i }));

    await waitFor(() => {
      expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });
});
