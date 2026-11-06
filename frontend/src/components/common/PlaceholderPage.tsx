import React from 'react';
import { Link } from 'react-router-dom';
import { Construction, ArrowLeft, Package, Home } from 'lucide-react';

interface PlaceholderPageProps {
  code: string;
  title: string;
  description?: string;
  category?: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  code,
  title,
  description = 'This feature module is part of the Mini-ERP build roadmap and will be activated in upcoming development layers.',
  category = 'Module',
}) => {
  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="flex items-center gap-1 hover:text-slate-800 transition-colors">
          <Home className="h-3.5 w-3.5" />
          <span>Home</span>
        </Link>
        <span>/</span>
        <span className="text-slate-500">{category}</span>
        <span>/</span>
        <span className="font-semibold text-slate-800">{title}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
              {code}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>

      {/* Placeholder Status Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100">
          <Construction className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-900">Module Under Construction</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          Feature <strong className="font-semibold text-slate-700">{code}</strong> is registered in the ERP route
          tree and is ready for service implementation.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/inventory/products"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
          >
            <Package className="h-4 w-4" />
            <span>View Products Catalog</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;

