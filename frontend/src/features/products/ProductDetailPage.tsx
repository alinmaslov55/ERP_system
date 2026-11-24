import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Package,
  DollarSign,
  Layers,
  Warehouse,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import axios from '../../lib/axios';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { Can } from '../auth/Can';
import { ProductFormModal } from './ProductFormModal';
import type { Product } from './types';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);

  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await axios.get<{ data: Product }>(`/products/${id}`);
      return res.data.data;
    },
    enabled: Boolean(id),
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      await axios.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(`Product "${product?.name}" archived.`, 'Product Archived');
      navigate('/inventory/products');
    },
    onError: (err: unknown) => {
      const msg = isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message || 'Failed to archive product.'
        : 'Failed to archive product.';
      toast.error(msg, 'Error');
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="text-sm font-medium">Loading product details...</span>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
        <h2 className="mt-3 text-lg font-bold text-slate-900">Product Not Found</h2>
        <p className="mt-1 text-sm text-slate-600">
          {isAxiosError(error) ? error.response?.data?.message || error.message : 'Unable to load product.'}
        </p>
        <Link
          to="/inventory/products"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Catalog</span>
        </Link>
      </div>
    );
  }

  const costPrice = parseFloat(String(product.cost_price || 0));
  const sellingPrice = parseFloat(String(product.selling_price || 0));
  const profit = sellingPrice - costPrice;
  const marginPct = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/inventory/products"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Product Catalog</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{product.name}</h1>
            <Badge variant="slate" size="sm" className="font-mono">
              {product.sku}
            </Badge>
            <Badge variant={product.is_active ? 'emerald' : 'red'} dot size="sm">
              {product.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        <Can permission="products.manage">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit Product</span>
            </button>
            <button
              type="button"
              onClick={() => setIsArchiveDialogOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Archive</span>
            </button>
          </div>
        </Can>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* General Attributes */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Package className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Product Specifications
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-xs text-slate-400 block">Category</span>
              <span className="font-semibold text-slate-800">
                {product.category?.name || 'Unassigned'}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Unit of Measure</span>
              <span className="font-semibold text-slate-800 capitalize">
                {product.unit || 'piece'}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Reorder Threshold</span>
              <span className="font-mono font-semibold text-slate-800">
                {product.reorder_level} {product.unit || 'piece'}(s)
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Description</span>
            <p className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-100 whitespace-pre-wrap">
              {product.description || 'No description provided for this item.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-6 pt-2 text-xs text-slate-400 border-t border-slate-100">
            {product.created_at && (
              <span>Created: {new Date(product.created_at).toLocaleString()}</span>
            )}
            {product.updated_at && (
              <span>Last Updated: {new Date(product.updated_at).toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Pricing & Margin Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Pricing & Margins
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Unit Cost Price</span>
              <span className="font-mono text-base font-semibold text-slate-800">
                ${costPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Unit Selling Price</span>
              <span className="font-mono text-lg font-bold text-slate-900">
                ${sellingPrice.toFixed(2)}
              </span>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Gross Profit / Margin</span>
              <div className="text-right">
                <span
                  className={`font-mono text-sm font-bold block ${
                    profit >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  ${profit.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-400">
                  {marginPct.toFixed(1)}% margin
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Warehouse Stock Breakdown (Ready for INV-001) */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Warehouse className="h-4 w-4 text-slate-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Per-Warehouse Stock Breakdown
            </h2>
          </div>
          <Badge variant="slate" size="sm">
            INV-001 Pending
          </Badge>
        </div>

        <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
          <Layers className="h-8 w-8 text-slate-300 mb-2" />
          <p className="text-sm font-medium text-slate-700">
            Warehouse stock balances not yet linked
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            On-hand, reserved, and available quantities across active warehouses will populate here once Inventory Balances (INV-001) are enabled.
          </p>
        </div>
      </div>

      {/* Edit Product Modal */}
      <ProductFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        productToEdit={product}
      />

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isArchiveDialogOpen}
        onClose={() => setIsArchiveDialogOpen(false)}
        onConfirm={() => archiveMutation.mutate()}
        isLoading={archiveMutation.isPending}
        title="Archive Product"
        description={
          <>
            Are you sure you want to archive{' '}
            <strong className="text-slate-900 font-semibold">{product.name}</strong> (
            <code className="font-mono font-semibold text-slate-800">{product.sku}</code>)?
            Historical records will remain intact.
          </>
        }
        confirmLabel="Archive Product"
        variant="danger"
      />
    </div>
  );
};

export default ProductDetailPage;
