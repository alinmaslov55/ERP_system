import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Shield,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface TopBarProps {
  onMenuClick: () => void;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  onSignOut?: () => Promise<void> | void;
  isSigningOut?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  onMenuClick,
  userName = 'Admin User',
  userEmail = 'admin@stockpilot.io',
  userRole = 'admin',
  onSignOut,
  isSigningOut = false,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setProfileDropdownOpen(false);
    if (onSignOut) {
      await onSignOut();
    } else {
      navigate('/login');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'manager':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'warehouse_operator':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'sales_operator':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs sm:px-6">
      {/* Left: Hamburger & Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden -ml-1.5 p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          aria-label="Open mobile menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Quick Search */}
        <div className="relative w-full max-w-md hidden sm:block">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search SKUs, orders, customers..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-12 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
            <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
              Ctrl+K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right: Status Pill, Notifications & User Profile */}
      <div className="flex items-center gap-3">
        {/* System Health Pill */}
        <div className="hidden md:flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-100">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          <span>API: Online</span>
        </div>

        {/* Notifications Icon Button */}
        <button
          type="button"
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
        </button>

        <div className="h-6 w-px bg-slate-200" />

        {/* User Profile Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setProfileDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-slate-100 transition-colors focus:outline-none"
            aria-expanded={profileDropdownOpen}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-xs">
              {initials}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-tight">{userName}</span>
              <span
                className={`inline-flex items-center self-start text-[10px] font-medium px-1.5 py-0.2 rounded border capitalize ${getRoleBadgeColor(
                  userRole
                )}`}
              >
                {userRole.replace('_', ' ')}
              </span>
            </div>
            <ChevronDown className="hidden md:block h-3.5 w-3.5 text-slate-400" />
          </button>

          {/* Profile Dropdown */}
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-slate-900/5 focus:outline-none z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">{userName}</p>
                <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <Shield className="h-3 w-3 text-slate-400" />
                  <span className="text-[11px] text-slate-600 capitalize">
                    Role: <strong className="text-slate-800">{userRole.replace('_', ' ')}</strong>
                  </span>
                </div>
              </div>

              <div className="py-1">
                <Link
                  to="/admin/users"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User className="h-4 w-4 text-slate-400" />
                  <span>User Profile & Team</span>
                </Link>
              </div>

              <div className="border-t border-slate-100 py-1">
                <button
                  type="button"
                  disabled={isSigningOut}
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {isSigningOut ? (
                    <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                  ) : (
                    <LogOut className="h-4 w-4 text-red-500" />
                  )}
                  <span>{isSigningOut ? 'Signing Out...' : 'Sign Out'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

