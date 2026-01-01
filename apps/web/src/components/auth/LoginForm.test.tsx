import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';
import { mockLoginResponse } from '../../test/mocks/mockData';

const mockLogin = vi.fn();
const mockClearError = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    error: null,
    clearError: mockClearError,
    isLoading: false,
  }),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render username input', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument();
  });

  it('should render submit button', () => {
    render(<LoginForm />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should show username validation hint', () => {
    render(<LoginForm />);
    expect(screen.getByText(/3-50 characters/i)).toBeInTheDocument();
  });

  it('should not show referral code by default', () => {
    render(<LoginForm />);
    expect(screen.queryByLabelText(/referral code/i)).not.toBeInTheDocument();
  });

  it('should show referral code when initialReferralCode is provided', () => {
    render(<LoginForm initialReferralCode="abc123" />);
    expect(screen.getByLabelText(/referral code/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('abc123')).toBeInTheDocument();
  });

  it('should show referral message when code is provided', () => {
    render(<LoginForm initialReferralCode="abc123" />);
    expect(screen.getByText(/referred by a friend/i)).toBeInTheDocument();
  });

  it('should show validation error for short username', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const input = screen.getByLabelText(/username/i);
    await user.type(input, 'ab');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('should show validation error for invalid username characters', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const input = screen.getByLabelText(/username/i);
    await user.type(input, 'test@user!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('should call login with username on valid submit', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(mockLoginResponse);

    render(<LoginForm />);

    const input = screen.getByLabelText(/username/i);
    await user.type(input, 'validuser');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('validuser', undefined);
    });
  });

  it('should call login with username and referral code', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(mockLoginResponse);

    render(<LoginForm initialReferralCode="abc123def456abc123def456abc12345" />);

    const input = screen.getByLabelText(/username/i);
    await user.type(input, 'validuser');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('validuser', 'abc123def456abc123def456abc12345');
    });
  });

  it('should call onSuccess callback after successful login', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockLogin.mockResolvedValue(mockLoginResponse);

    render(<LoginForm onSuccess={onSuccess} />);

    const input = screen.getByLabelText(/username/i);
    await user.type(input, 'validuser');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should show signing in state while submitting', async () => {
    const user = userEvent.setup();
    let resolveLogin: (value: unknown) => void;
    mockLogin.mockImplementation(
      () => new Promise((resolve) => {
        resolveLogin = resolve;
      })
    );

    render(<LoginForm />);

    const input = screen.getByLabelText(/username/i);
    await user.type(input, 'validuser');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText('Signing in...')).toBeInTheDocument();

    resolveLogin!(mockLoginResponse);
  });

  it('should disable inputs while submitting', async () => {
    const user = userEvent.setup();
    mockLogin.mockImplementation(() => new Promise(() => {}));

    render(<LoginForm />);

    const input = screen.getByLabelText(/username/i);
    await user.type(input, 'validuser');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(input).toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should clear error when form is submitted', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(mockLoginResponse);

    render(<LoginForm />);

    const input = screen.getByLabelText(/username/i);
    await user.type(input, 'validuser');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(mockClearError).toHaveBeenCalled();
  });

  it('should show registration info text', () => {
    render(<LoginForm />);
    expect(screen.getByText(/new users are automatically registered/i)).toBeInTheDocument();
  });
});
