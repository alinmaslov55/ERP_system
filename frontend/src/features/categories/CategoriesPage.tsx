import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Layers,
} from 'lucide-react';
import axios from '../../lib/axios';
import { DataTable, type ColumnDef } from '../../components/data-table/DataTable';
import { TableToolbar } from '../../components/data-table/TableToolbar';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { Can } from '../auth/Can';
import { CategoryFormModal } from './CategoryFormModal';
import type { Category } from './types';

export const CategoriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Fetch all categories
  const {
    data: categories = [],
    isLoading,
    refetch,
  } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await axios.get<{ data: Category[] }>('/categories');
      return res.data.data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(
        `Category "${categoryToDelete?.name}" has been deleted.`,
        'Category Deleted'
      );
      setCategoryToDelete(null);
    },
    onError: (err: unknown) => {
      if (isAxiosError<{ message?: string }>(err)) {
        toast.error(
          err.response?.data?.message || 'Failed to delete category.',
          'Delete Blocked'
        );
      } else {
        toast.error('Failed to delete category.', 'Error');
      }
    },
  });

  const handleOpenCreate = () => {
    setCategoryToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setCategoryToEdit(category);
    setIsModalOpen(true);
  };

  // Filter categories by search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const term = searchTerm.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.description && c.description.toLowerCase().includes(term))
    );
  }, [categories, searchTerm]);

  // Column definitions
  const columns = useMemo<ColumnDef<Category>[]>(
    () => [
      {
        key: 'name',
        header: 'Category Name',
        sortable: true,
        cell: (row) => (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <FolderTree className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-slate-900 text-sm block">
                {row.name}
              </span>
              <span className="text-[11px] text-slate-400">ID #{row.id}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'description',
        header: 'Description',
        cell: (row) => (
          <span className="text-xs text-slate-600 line-clamp-2">
            {row.description || <span className="text-slate-400 italic">No description</span>}
          </span>
        ),
      },
      {
        key: 'products_count',
        header: 'Linked Products',
        sortable: true,
        cell: (row) => {
          const count = row.products_count ?? 0;
          return (
            <Badge variant={count > 0 ? 'emerald' : 'slate'} size="sm">
              <Layers className="h-3 w-3 mr-1 inline" />
              {count} {count === 1 ? 'product' : 'products'}
            </Badge>
          );
        },
      },
      {
        key: 'created_at',
        header: 'Created Date',
        sortable: true,
        cell: (row) => {
          if (!row.created_at) return <span className="text-slate-400 text-xs">—</span>;
          const date = new Date(row.created_at);
          return (
            <span className="text-xs text-slate-600">
              {date.toLocaleDateString()}
            </span>
          );
        },
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        cell: (row) => {
          const hasLinkedProducts = (row.products_count ?? 0) > 0;

          return (
            <div className="flex items-center justify-end gap-1.5">
              <Can permission="categories.manage">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(row)}
                  className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title={`Edit ${row.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>

                <div className="relative group">
                  <button
                    type="button"
                    disabled={hasLinkedProducts}
                    onClick={() => setCategoryToDelete(row)}
                    className={`p-1.5 rounded-md transition-colors ${
                      hasLinkedProducts
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-slate-600 hover:text-red-600 hover:bg-red-50'
                    }`}
                    title={
                      hasLinkedProducts
                        ? `Cannot delete "${row.name}" with ${row.products_count} linked products.`
                        : `Delete ${row.name}`
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {hasLinkedProducts && (
                    <span className="pointer-events-none absolute bottom-full right-0 mb-1.5 hidden w-48 rounded bg-slate-800 px-2 py-1 text-[11px] text-white shadow-lg group-hover:block z-10 text-center">
                      Cannot delete category with linked products.
                    </span>
                  )}
                </div>
              </Can>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Categories Management
            </h1>
            <Badge variant="blue" size="sm">
              {categories.length} total
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Classify and organize catalog items with linked product dependency enforcement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>

          <Can permission="categories.manage">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Category</span>
            </button>
          </Can>
        </div>
      </div>

      {/* Toolbar */}
      <TableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Filter categories by name or description..."
        onClearFilters={() => setSearchTerm('')}
      />

      {/* Categories Table */}
      <DataTable<Category>
        data={filteredCategories}
        columns={columns}
        isLoading={isLoading}
        emptyTitle="No categories found"
        emptyDescription={
          searchTerm
            ? 'No categories match your search keywords.'
            : 'Get started by creating your first product category.'
        }
        emptyIcon={FolderTree}
        emptyAction={
          !searchTerm && (
            <Can permission="categories.manage">
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Category</span>
              </button>
            </Can>
          )
        }
      />

      {/* Create / Edit Modal */}
      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categoryToEdit={categoryToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={() => {
          if (categoryToDelete) {
            deleteMutation.mutate(categoryToDelete.id);
          }
        }}
        isLoading={deleteMutation.isPending}
        title={`Delete Category "${categoryToDelete?.name}"?`}
        description={
          <div className="space-y-2 text-xs text-slate-600">
            <p>
              Are you sure you want to permanently remove the category{' '}
              <span className="font-semibold text-slate-900">{categoryToDelete?.name}</span>?
            </p>
            <p className="text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
              This action cannot be undone. Only categories with zero associated products can be removed.
            </p>
          </div>
        }
        confirmLabel="Delete Category"
        variant="danger"
      />
    </div>
  );
};

export default CategoriesPage;
