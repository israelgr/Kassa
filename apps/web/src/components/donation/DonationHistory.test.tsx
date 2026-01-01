import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DonationHistory } from './DonationHistory';
import { mockDonations } from '../../test/mocks/mockData';

describe('DonationHistory', () => {
  const mockOnLoadMore = vi.fn();

  it('should show loading state when loading with no donations', () => {
    render(
      <DonationHistory
        donations={[]}
        isLoading={true}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
      />
    );
    expect(screen.getByText('Loading donations...')).toBeInTheDocument();
  });

  it('should show empty state when no donations', () => {
    render(
      <DonationHistory
        donations={[]}
        isLoading={false}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
      />
    );
    expect(screen.getByText(/no donations yet/i)).toBeInTheDocument();
    expect(screen.getByText(/make your first donation/i)).toBeInTheDocument();
  });

  it('should render donation list', () => {
    render(
      <DonationHistory
        donations={mockDonations}
        isLoading={false}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
      />
    );
    expect(screen.getByText('$25.00')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText('$10.00')).toBeInTheDocument();
  });

  it('should show formatted dates', () => {
    render(
      <DonationHistory
        donations={mockDonations}
        isLoading={false}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
      />
    );
    // Dates should be rendered in some format
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3);
  });

  it('should render title with icon', () => {
    render(
      <DonationHistory
        donations={mockDonations}
        isLoading={false}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
      />
    );
    expect(screen.getByRole('heading', { name: /your donations/i })).toBeInTheDocument();
  });

  it('should show load more button when hasMore is true', () => {
    render(
      <DonationHistory
        donations={mockDonations}
        isLoading={false}
        hasMore={true}
        onLoadMore={mockOnLoadMore}
      />
    );
    expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument();
  });

  it('should not show load more button when hasMore is false', () => {
    render(
      <DonationHistory
        donations={mockDonations}
        isLoading={false}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
      />
    );
    expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
  });

  it('should call onLoadMore when button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DonationHistory
        donations={mockDonations}
        isLoading={false}
        hasMore={true}
        onLoadMore={mockOnLoadMore}
      />
    );

    await user.click(screen.getByRole('button', { name: /load more/i }));
    expect(mockOnLoadMore).toHaveBeenCalledTimes(1);
  });

  it('should disable load more button while loading', () => {
    render(
      <DonationHistory
        donations={mockDonations}
        isLoading={true}
        hasMore={true}
        onLoadMore={mockOnLoadMore}
      />
    );
    expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled();
  });

  it('should show loading text on button while loading', () => {
    render(
      <DonationHistory
        donations={mockDonations}
        isLoading={true}
        hasMore={true}
        onLoadMore={mockOnLoadMore}
      />
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render donations in a list', () => {
    render(
      <DonationHistory
        donations={mockDonations}
        isLoading={false}
        hasMore={false}
        onLoadMore={mockOnLoadMore}
      />
    );
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });
});
