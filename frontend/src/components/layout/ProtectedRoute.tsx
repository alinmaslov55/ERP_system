import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { Boxes, Loader2 } from 'lucide-react';
import { useAuth } from '../../features/auth/useAuth';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-50 antialiased">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/25">
            <Boxes className="h-8 w-8 animate-pulse" />
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span>Verifying session security...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const currentTarget = location.pathname + location.search;
    const redirectParam = encodeURIComponent(currentTarget);
    return <Navigate to={`/login?redirect=${redirectParam}`} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;

