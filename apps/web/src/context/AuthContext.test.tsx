import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';
import { api } from '../services/api';
import { mockUser, mockLoginResponse } from '../test/mocks/mockData';

vi.mock('../services/api', () => ({
  api: {
    setToken: vi.fn(),
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
  ApiRequestError: class ApiRequestError extends Error {
    code: string;
    status: number;
    constructor(message: string, code: string, status: number) {
      super(message);
      this.code = code;
      this.status = status;
      this.name = 'ApiRequestError';
    }
  },
}));

const mockApi = vi.mocked(api);

function TestConsumer() {
  const { user, isLoading, isAuthenticated, login, logout, error, clearError } = useAuth();

  const handleLogin = async () => {
    try {
      await login('testuser');
    } catch {
      // Error is handled via context error state
    }
  };

  const handleLoginWithRef = async () => {
    try {
      await login('testuser', 'ref123');
    } catch {
      // Error is handled via context error state
    }
  };

  return (
    <div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="user">{user ? user.username : 'null'}</div>
      <div data-testid="error">{error || 'null'}</div>
      <button onClick={handleLogin}>Login</button>
      <button onClick={handleLoginWithRef}>Login with Ref</button>
      <button onClick={logout}>Logout</button>
      <button onClick={clearError}>Clear Error</button>
    </div>
  );
}

describe('AuthContext', () => {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<TestConsumer />)).toThrow('useAuth must be used within an AuthProvider');
      consoleError.mockRestore();
    });
  });

  describe('AuthProvider', () => {
    it('should initialize with loading true and no user', async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });

    it('should restore user from stored token', async () => {
      localStorageMock.getItem.mockReturnValue('stored-token');
      mockApi.getCurrentUser.mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('testuser');
      });
      expect(mockApi.setToken).toHaveBeenCalledWith('stored-token');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });

    it('should clear invalid stored token', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-token');
      mockApi.getCurrentUser.mockRejectedValue(new Error('Unauthorized'));

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kassa_token');
      expect(mockApi.setToken).toHaveBeenCalledWith(null);
    });
  });

  describe('login', () => {
    it('should login successfully and store token', async () => {
      const user = userEvent.setup();
      mockApi.login.mockResolvedValue(mockLoginResponse);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      await user.click(screen.getByText('Login'));

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('testuser');
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('kassa_token', mockLoginResponse.token);
      expect(mockApi.login).toHaveBeenCalledWith({ username: 'testuser', referralCode: undefined });
    });

    it('should pass referral code to login', async () => {
      const user = userEvent.setup();
      mockApi.login.mockResolvedValue(mockLoginResponse);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      await user.click(screen.getByText('Login with Ref'));

      expect(mockApi.login).toHaveBeenCalledWith({ username: 'testuser', referralCode: 'ref123' });
    });

    it('should set error on login failure', async () => {
      const user = userEvent.setup();
      const { ApiRequestError } = await import('../services/api');
      mockApi.login.mockRejectedValue(new ApiRequestError('Invalid username', 'VALIDATION_ERROR', 400));

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      await user.click(screen.getByText('Login'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid username');
      });
    });

    it('should set generic error for unexpected failures', async () => {
      const user = userEvent.setup();
      mockApi.login.mockRejectedValue(new Error('Network error'));

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      await user.click(screen.getByText('Login'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('An unexpected error occurred');
      });
    });
  });

  describe('logout', () => {
    it('should logout and clear stored data', async () => {
      const user = userEvent.setup();
      localStorageMock.getItem.mockReturnValue('stored-token');
      mockApi.getCurrentUser.mockResolvedValue(mockUser);
      mockApi.logout.mockResolvedValue(undefined);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('testuser');
      });

      await user.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kassa_token');
      expect(mockApi.setToken).toHaveBeenCalledWith(null);
    });

    it('should clear local state even if logout API fails', async () => {
      const user = userEvent.setup();
      localStorageMock.getItem.mockReturnValue('stored-token');
      mockApi.getCurrentUser.mockResolvedValue(mockUser);
      mockApi.logout.mockRejectedValue(new Error('Server error'));

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('testuser');
      });

      await user.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kassa_token');
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      const user = userEvent.setup();
      mockApi.login.mockRejectedValue(new Error('Some error'));

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      await user.click(screen.getByText('Login'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).not.toHaveTextContent('null');
      });

      await user.click(screen.getByText('Clear Error'));

      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });
  });
});
