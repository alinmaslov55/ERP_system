import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { AlertCircle, LogIn, RefreshCw, Loader2, Plus, Package } from 'lucide-react';
import axios from '../../lib/axios';
import { CreateProductForm } from './CreateProductForm';
import { DataTable, type ColumnDef } from '../../components/data-table/DataTable';
import { TableToolbar } from '../../components/data-table/TableToolbar';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';

export interface Product {
  id: number;
  sku: string;
  name: string;
  selling_price: string;
  is_active: boolean;
  category?: {
    id: number;
    name: string;
  };
}

export default function ProductList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [productToArchive, setProductToArchive] = useState<Product | null>(null);

  const queryClient = useQueryClient();
  const toast = useToast();

  const {
    data: products,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await axios.get('/products');
      return response.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(
        `Product "${productToArchive?.name}" has been archived.`,
        'Product Archived'
      );
      setProductToArchive(null);
    },
    onError: (err: unknown) => {
      const msg = isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message || 'Failed to archive product.'
        : 'Failed to archive product.';
      toast.error(msg, 'Archive Failed');
    },
  });

  const handleConfirmArchive = () => {
    if (productToArchive) {
      deleteMutation.mutate(productToArchive.id);
    }
  };

  // Filter products by search term client-side
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchTerm.trim()) return products;

    const term = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.sku.toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term) ||
        (p.category?.name && p.category.name.toLowerCase().includes(term))
    );
  }, [products, searchTerm]);

  // Column definitions for DataTable
  const columns: ColumnDef<Product>[] = [
    {
      key: 'sku',
      header: 'SKU Code',
      accessorKey: 'sku',
      sortable: true,
      className: 'font-mono font-bold text-slate-900',
    },
    {
      key: 'name',
      header: 'Product Name',
      accessorKey: 'name',
      sortable: true,
      className: 'font-medium text-slate-800',
    },
    {
      key: 'category',
      header: 'Category',
      cell: (product) => (
        <span className="text-xs text-slate-600">
          {product.category?.name || 'Unassigned'}
        </span>
      ),
    },
    {
      key: 'selling_price',
      header: 'Selling Price',
      accessorKey: 'selling_price',
      sortable: true,
      cell: (product) => (
        <span className="font-mono font-semibold text-slate-900">
          ${parseFloat(product.selling_price).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (product) => (
        <Badge variant={product.is_active ? 'emerald' : 'red'} dot>
          {product.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (product) => (
        <button
          type="button"
          onClick={() => setProductToArchive(product)}
          className="text-xs font-semibold text-red-600 hover:text-red-800 hover:underline transition-colors focus:outline-none"
        >
          Archive
        </button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="text-sm font-medium">Loading product catalog...</span>
      </div>
    );
  }

  if (isError) {
    const is401 = isAxiosError(error) && error.response?.status === 401;

    if (is401) {
      return (
        <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <LogIn className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-lg font-bold text-slate-900">Authentication Required</h2>
          <p className="mt-1 text-sm text-slate-600">
            The product catalog API is protected. Please sign in to view and manage products.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In to Continue</span>
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-700">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="mt-3 text-lg font-bold text-slate-900">Error Fetching Products</h2>
        <p className="mt-1 text-sm text-slate-600">
          {isAxiosError(error)
            ? error.response?.data?.message || error.message || 'Cannot connect to backend API server.'
            : 'An unexpected error occurred while loading products.'}
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Product Catalog</h1>
          <p className="mt-1 text-xs text-slate-500">
            Manage SKU master records, pricing, and active inventory status.
          </p>
        </div>
      </div>

      {/* Toolbar: Search, Filters & Actions */}
      <TableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Filter by SKU or name..."
        onClearFilters={() => setSearchTerm('')}
        actionsSlot={
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        }
      />

      {/* Data Table */}
      <DataTable<Product>
        data={filteredProducts}
        columns={columns}
        isLoading={isLoading}
        emptyTitle="No products found"
        emptyDescription={
          searchTerm
            ? `No catalog items matched "${searchTerm}". Try resetting your filter.`
            : 'Your product catalog is currently empty. Get started by creating your first product.'
        }
        emptyIcon={Package}
        emptyAction={
          searchTerm ? (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Clear search filter
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add First Product</span>
            </button>
          )
        }
      />

      {/* Add Product Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Product"
        description="Fill in the details below to register a new product in the catalog."
        size="lg"
      >
        <CreateProductForm
          onSuccess={() => setIsCreateModalOpen(false)}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!productToArchive}
        onClose={() => setProductToArchive(null)}
        onConfirm={handleConfirmArchive}
        title="Archive Product"
        description={
          <>
            Are you sure you want to archive{' '}
            <strong className="text-slate-900 font-semibold">{productToArchive?.name}</strong> (
            <code className="font-mono font-semibold text-slate-800">{productToArchive?.sku}</code>)?
            This product will be marked inactive and cannot be added to new orders.
          </>
        }
        confirmLabel="Archive Product"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
