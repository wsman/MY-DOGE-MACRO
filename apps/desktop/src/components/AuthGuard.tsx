/**
 * MY-DOGE-MACRO Auth Guard Component
 * Route protection for authenticated routes
 * Version: v2.0.0
 */

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: string;
}

export function AuthGuard({ children, fallback = '/login' }: AuthGuardProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuthStore();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--accent-primary)] border-t-transparent"></div>
          <p className="text-[var(--text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallback} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/**
 * Guest guard - redirect authenticated users
 */
interface GuestGuardProps {
  children: ReactNode;
  redirectAuthenticated?: string;
}

export function GuestGuard({ children, redirectAuthenticated = '/' }: GuestGuardProps) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to={redirectAuthenticated} replace />;
  }

  return <>{children}</>;
}

/**
 * Optional auth wrapper - doesn't redirect but provides auth context
 */
interface OptionalAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function OptionalAuth({ children, fallback = null }: OptionalAuthProps) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}