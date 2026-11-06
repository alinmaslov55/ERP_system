import React, { useState } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { Boxes, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { isAxiosError } from 'axios';
import { useAuth } from './useAuth';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@stockpilot.io');
  const [password, setPassword] = useState('password123');
  const [remember, setRemember] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/';

  const { isAuthenticated, isLoading, isLoggingIn, login } = useAuth();

  // If already authenticated, redirect to destination immediately
  if (!isLoading && isAuthenticated) {
    return <Navigate to={redirectTarget} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      await login({
        email,
        password,
        remember,
      });

      navigate(redirectTarget, { replace: true });
    } catch (err: unknown) {
      if (isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(err)) {
        const serverMsg =
          err.response?.data?.message ||
          err.response?.data?.errors?.email?.[0] ||
          err.response?.data?.errors?.password?.[0];
        setErrorMessage(serverMsg || 'Failed to authenticate. Please check your credentials.');
      } else {
        setErrorMessage('Cannot connect to backend server. Make sure PHP server is running.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
            <Boxes className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sign In to StockPilot</h1>
          <p className="text-sm text-slate-500">Enterprise Inventory & Warehouse Management</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@stockpilot.io"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Remember me on this machine</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn || isLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Seeded Demo Credentials Helper */}
          <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-1">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>Default Development Account</span>
            </div>
            <p className="text-slate-500">
              Email: <code className="font-mono text-slate-700 font-semibold">admin@stockpilot.io</code>
              <br />
              Password: <code className="font-mono text-slate-700 font-semibold">password123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
