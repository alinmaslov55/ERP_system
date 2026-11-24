import React, { useEffect } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { isAxiosError } from 'axios';
import { Loader2 } from 'lucide-react';
import axios from '../../lib/axios';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import type { Category } from '../categories/types';
import type { Product, ProductFormData, ProductUnit } from './types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

const PRODUCT_UNITS: { value: ProductUnit; label: string }[] = [
  { value: 'piece', label: 'Piece (pc)' },
  { value: 'box', label: 'Box' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'liter', label: 'Liter (L)' },
  { value: 'meter', label: 'Meter (m)' },
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const isEditing = Boolean(productToEdit);

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await axios.get<{ data: Category[] }>('/categories');
      return res.data.data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ProductFormData>({
    defaultValues: {
      category_id: categories[0]?.id || 1,
      sku: '',
      name: '',
      description: '',
      unit: 'piece',
      cost_price: 0,
      selling_price: 0,
      reorder_level: 0,
      is_active: true,
    },
  });

  // Reset form values when modal opens or productToEdit changes
  useEffect(() => {
    if (!isOpen) return;

    if (productToEdit) {
      reset({
        category_id: productToEdit.category_id || productToEdit.category?.id || (categories[0]?.id ?? 1),
        sku: productToEdit.sku,
        name: productToEdit.name,
        description: productToEdit.description || '',
        unit: (productToEdit.unit as ProductUnit) || 'piece',
        cost_price: Number(productToEdit.cost_price) || 0,
        selling_price: Number(productToEdit.selling_price) || 0,
        reorder_level: Number(productToEdit.reorder_level) || 0,
        is_active: Boolean(productToEdit.is_active),
      });
    } else {
      reset({
        category_id: categories[0]?.id || 1,
        sku: '',
        name: '',
        description: '',
        unit: 'piece',
        cost_price: 0,
        selling_price: 0,
        reorder_level: 0,
        is_active: true,
      });
    }
  }, [isOpen, productToEdit, categories, reset]);

  const mutation = useMutation({
    mutationFn: async (payload: ProductFormData) => {
      if (isEditing && productToEdit) {
        const res = await axios.patch<{ data: Product }>(`/products/${productToEdit.id}`, payload);
        return res.data;
      } else {
        const res = await axios.post<{ data: Product }>('/products', payload);
        return res.data;
      }
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      if (productToEdit) {
        queryClient.invalidateQueries({ queryKey: ['product', String(productToEdit.id)] });
        queryClient.invalidateQueries({ queryKey: ['product', productToEdit.id] });
      }
      toast.success(
        isEditing
          ? `Product "${res.data.name}" updated successfully.`
          : `Product "${res.data.name}" added to catalog.`,
        isEditing ? 'Product Updated' : 'Catalog Updated'
      );
      onClose();
    },
    onError: (error: unknown) => {
      if (isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(error)) {
        const serverErrors = error.response?.data?.errors;
        if (serverErrors) {
          (Object.keys(serverErrors) as (keyof ProductFormData)[]).forEach((field) => {
            const msg = serverErrors[field]?.[0];
            if (msg) {
              setError(field, { type: 'server', message: msg });
            }
          });
        }
        toast.error(
          error.response?.data?.message || 'Please check the highlighted form fields.',
          'Validation Error'
        );
      } else {
        toast.error('Unexpected network error while saving product.', 'Error');
      }
    },
  });

  const onSubmit = (data: ProductFormData) => {
    mutation.mutate({
      ...data,
      category_id: Number(data.category_id),
      cost_price: Number(data.cost_price),
      selling_price: Number(data.selling_price),
      reorder_level: Number(data.reorder_level),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Product: ${productToEdit?.sku}` : 'Add New Product'}
      description={
        isEditing
          ? 'Update product specifications, pricing, and inventory reorder thresholds.'
          : 'Fill in the details below to register a new product in the catalog.'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Category *
            </label>
            <select
              {...register('category_id', {
                required: 'Category is required',
                valueAsNumber: true,
              })}
              disabled={isLoadingCategories}
              className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
            >
              {categories.length === 0 ? (
                <option value="">
                  {isLoadingCategories ? 'Loading categories...' : 'No categories available'}
                </option>
              ) : (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))
              )}
            </select>
            {errors.category_id && (
              <span className="text-[11px] font-medium text-red-500 mt-1 block">
                {errors.category_id.message}
              </span>
            )}
          </div>

          {/* SKU Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              SKU Code *
            </label>
            <input
              {...register('sku', { required: 'SKU is required' })}
              placeholder="e.g. LAP-002"
              className={`w-full rounded-lg border p-2.5 font-mono text-xs text-slate-800 shadow-2xs focus:outline-none focus:ring-2 ${
                errors.sku
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                  : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
              }`}
            />
            {errors.sku && (
              <span className="text-[11px] font-medium text-red-500 mt-1 block">
                {errors.sku.message}
              </span>
            )}
          </div>

          {/* Name Input */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Product Name *
            </label>
            <input
              {...register('name', { required: 'Product name is required' })}
              placeholder="e.g. Wireless Ergonomic Mouse"
              className={`w-full rounded-lg border p-2.5 text-xs text-slate-800 shadow-2xs focus:outline-none focus:ring-2 ${
                errors.name
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                  : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
              }`}
            />
            {errors.name && (
              <span className="text-[11px] font-medium text-red-500 mt-1 block">
                {errors.name.message}
              </span>
            )}
          </div>

          {/* Unit Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Unit of Measure *
            </label>
            <select
              {...register('unit', { required: 'Unit is required' })}
              className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {PRODUCT_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
            {errors.unit && (
              <span className="text-[11px] font-medium text-red-500 mt-1 block">
                {errors.unit.message}
              </span>
            )}
          </div>

          {/* Reorder Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reorder Level Threshold *
            </label>
            <input
              type="number"
              min="0"
              step="1"
              {...register('reorder_level', {
                required: 'Reorder level is required',
                min: { value: 0, message: 'Cannot be negative' },
                valueAsNumber: true,
              })}
              className="w-full rounded-lg border border-slate-200 bg-white p-2.5 font-mono text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            {errors.reorder_level && (
              <span className="text-[11px] font-medium text-red-500 mt-1 block">
                {errors.reorder_level.message}
              </span>
            )}
          </div>

          {/* Cost Price */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Cost Price ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register('cost_price', {
                required: 'Cost price is required',
                min: { value: 0, message: 'Cannot be negative' },
                valueAsNumber: true,
              })}
              className="w-full rounded-lg border border-slate-200 bg-white p-2.5 font-mono text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            {errors.cost_price && (
              <span className="text-[11px] font-medium text-red-500 mt-1 block">
                {errors.cost_price.message}
              </span>
            )}
          </div>

          {/* Selling Price */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Selling Price ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register('selling_price', {
                required: 'Selling price is required',
                min: { value: 0, message: 'Cannot be negative' },
                valueAsNumber: true,
              })}
              className="w-full rounded-lg border border-slate-200 bg-white p-2.5 font-mono text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            {errors.selling_price && (
              <span className="text-[11px] font-medium text-red-500 mt-1 block">
                {errors.selling_price.message}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={3}
              {...register('description')}
              placeholder="Optional product specifications, dimensions, or notes..."
              className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            {errors.description && (
              <span className="text-[11px] font-medium text-red-500 mt-1 block">
                {errors.description.message}
              </span>
            )}
          </div>

          {/* Active Toggle */}
          <div className="md:col-span-2 flex items-center gap-2 pt-1">
            <input
              id="product_is_active"
              type="checkbox"
              {...register('is_active')}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="product_is_active" className="text-xs font-medium text-slate-700 cursor-pointer">
              Active catalog item (available for purchasing and sales orders)
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors focus:outline-none disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{isEditing ? 'Save Changes' : 'Create Product'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
