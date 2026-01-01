import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginForm } from '../components/auth/LoginForm';
import { useEffect } from 'react';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();

  const referralCode = searchParams.get('ref') || undefined;
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  if (isLoading) {
    return (
      <div className="login-page loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Kassa</h1>
          <p>Viral Charity Fundraising</p>
        </div>

        {referralCode && (
          <div className="referral-banner">
            You've been invited to join! Sign up to start donating.
          </div>
        )}

        <LoginForm
          initialReferralCode={referralCode}
          onSuccess={() => navigate(from, { replace: true })}
        />
      </div>
    </div>
  );
}
