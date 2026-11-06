import React from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  Warehouse,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Plus,
  ShoppingCart,
  ShoppingBag,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const kpis = [
    {
      title: 'Active Products',
      value: '2',
      change: '+2 this week',
      isPositive: true,
      icon: Package,
      iconBg: 'bg-blue-50 text-blue-600',
      href: '/inventory/products',
    },
    {
      title: 'Inventory Valuation',
      value: '$9,700.00',
      change: 'Calculated on-hand',
      isPositive: true,
      icon: DollarSign,
      iconBg: 'bg-emerald-50 text-emerald-600',
      href: '/reports',
    },
    {
      title: 'Low Stock Alerts',
      value: '0',
      change: 'All levels optimal',
      isPositive: true,
      icon: AlertTriangle,
      iconBg: 'bg-amber-50 text-amber-600',
      href: '/inventory/stock-levels',
    },
    {
      title: 'Active Warehouses',
      value: '2',
      change: 'Main Hub, West Hub',
      isPositive: true,
      icon: Warehouse,
      iconBg: 'bg-purple-50 text-purple-600',
      href: '/inventory/warehouses',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Operational Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Welcome to StockPilot ERP. Real-time overview of catalog, inventory, and order operations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/inventory/products"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Manage Products</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={kpi.title}
              to={kpi.href}
              className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{kpi.title}</span>
                <div className={`rounded-xl p-2.5 ${kpi.iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold tracking-tight text-slate-900">{kpi.value}</div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                  <span>{kpi.change}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Action Shortcuts */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4">Quick Operations</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            to="/inventory/products"
            className="group flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:border-blue-200 hover:bg-blue-50/40"
          >
            <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Package className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Product Catalog</h3>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 group-hover:text-blue-600 transition-all" />
              </div>
              <p className="mt-1 text-xs text-slate-500">View, create, edit, and archive SKU master records.</p>
            </div>
          </Link>

          <Link
            to="/purchasing/orders"
            className="group flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:border-blue-200 hover:bg-blue-50/40"
          >
            <div className="rounded-xl bg-purple-100 p-2.5 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Purchase Orders</h3>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 group-hover:text-purple-600 transition-all" />
              </div>
              <p className="mt-1 text-xs text-slate-500">Create multi-line POs and process goods receipts.</p>
            </div>
          </Link>

          <Link
            to="/sales/orders"
            className="group flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:border-blue-200 hover:bg-blue-50/40"
          >
            <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Sales Orders</h3>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 group-hover:text-emerald-600 transition-all" />
              </div>
              <p className="mt-1 text-xs text-slate-500">Record sales orders, reserve stock, and ship orders.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

