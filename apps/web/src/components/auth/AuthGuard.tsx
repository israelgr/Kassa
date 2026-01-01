import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../ui/spinner';
import type { ReactNode } from 'react';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const loginUrl = location.search ? `/login${location.search}` : '/login';
    return <Navigate to={loginUrl} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
