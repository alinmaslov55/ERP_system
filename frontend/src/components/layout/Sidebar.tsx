import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
} from 'lucide-react';
import { navigationConfig, type NavItem } from './navigationConfig';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  userRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  setIsOpen,
  isCollapsed,
  setIsCollapsed,
  userRole = 'admin',
}) => {
  const isItemVisible = (item: NavItem) => {
    if (!item.requiredRole) return true;
    return item.requiredRole === userRole || userRole === 'admin';
  };

  const navContent = (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Boxes className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-base leading-tight tracking-tight">StockPilot</span>
                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 uppercase">ERP</span>
              </div>
              <span className="text-xs text-slate-500 truncate">Inventory & Operations</span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigationConfig.map((group) => {
          if (group.requiredRole && group.requiredRole !== userRole && userRole !== 'admin') {
            return null;
          }

          const visibleItems = group.items.filter(isItemVisible);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="space-y-1">
              {!isCollapsed && (
                <h3 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  {group.title}
                </h3>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={() => setIsOpen(false)}
                    title={isCollapsed ? item.name : undefined}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      } ${isCollapsed ? 'justify-center px-2' : ''}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`h-5 w-5 shrink-0 transition-colors ${
                            isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />
                        {!isCollapsed && (
                          <span className="truncate flex-1">{item.name}</span>
                        )}
                        {!isCollapsed && item.badge && (
                          <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer / Role indicator & Desktop collapse */}
      <div className="border-t border-slate-100 p-3">
        {!isCollapsed && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <Shield className="h-4 w-4 text-blue-600 shrink-0" />
            <span className="truncate">
              Role: <strong className="font-semibold text-slate-800 capitalize">{userRole}</strong>
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className={`hidden lg:flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors ${
            isCollapsed ? 'justify-center px-2' : 'justify-between'
          }`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {!isCollapsed && <span>Collapse Sidebar</span>}
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </aside>

      {/* Desktop Sticky Sidebar */}
      <aside
        className={`hidden lg:flex shrink-0 flex-col h-full transition-all duration-200 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {navContent}
      </aside>
    </>
  );
};
