import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Loader2 } from 'lucide-react';
import axios from '../../lib/axios';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import type { Category, CategoryFormData } from './types';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: Category | null;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
}) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const isEditing = Boolean(categoryToEdit);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; description?: string }>({});

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setDescription(categoryToEdit.description || '');
    } else {
      setName('');
      setDescription('');
    }
    setFieldErrors({});
  }, [categoryToEdit, isOpen]);

  const mutation = useMutation({
    mutationFn: async (payload: CategoryFormData) => {
      if (isEditing && categoryToEdit) {
        const res = await axios.put<{ data: Category }>(`/categories/${categoryToEdit.id}`, payload);
        return res.data;
      } else {
        const res = await axios.post<{ data: Category }>('/categories', payload);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(
        isEditing
          ? `Category "${name}" updated successfully.`
          : `Category "${name}" created successfully.`,
        isEditing ? 'Category Updated' : 'Category Created'
      );
      onClose();
    },
    onError: (err: unknown) => {
      if (isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(err)) {
        const serverErrors = err.response?.data?.errors;
        if (serverErrors) {
          setFieldErrors({
            name: serverErrors.name?.[0],
            description: serverErrors.description?.[0],
          });
        }
        toast.error(
          err.response?.data?.message || 'Failed to save category.',
          'Validation Error'
        );
      } else {
        toast.error('An unexpected error occurred.', 'Network Error');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    if (!name.trim()) {
      setFieldErrors({ name: 'Category name is required.' });
      return;
    }

    mutation.mutate({
      name: name.trim(),
      description: description.trim(),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Category: ${categoryToEdit?.name}` : 'Create New Category'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="category-name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Category Name *
          </label>
          <input
            id="category-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
            }}
            placeholder="e.g. Hardware, Packaging, Raw Materials"
            className={`w-full rounded-lg border p-2.5 text-xs text-slate-800 shadow-2xs focus:outline-none focus:ring-2 ${
              fieldErrors.name
                ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
            }`}
          />
          {fieldErrors.name && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="category-description" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Description
          </label>
          <textarea
            id="category-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional context regarding items grouped under this classification..."
            className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          {fieldErrors.description && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{isEditing ? 'Save Changes' : 'Create Category'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
