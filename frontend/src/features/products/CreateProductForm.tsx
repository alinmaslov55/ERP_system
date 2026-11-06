import React from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import axios from '../../lib/axios';
import { isAxiosError } from 'axios';
import { useToast } from '../../components/ui/Toast';
import { Loader2 } from 'lucide-react';

interface ProductFormData {
  category_id: number;
  sku: string;
  name: string;
  selling_price: number;
  is_active: boolean;
}

interface CreateProductFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CreateProductForm: React.FC<CreateProductFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    defaultValues: {
      category_id: 1,
      is_active: true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (newProduct: ProductFormData) => {
      const response = await axios.post('/products', newProduct);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      reset();
      toast.success('Product created successfully!', 'Catalog Updated');
      onSuccess?.();
    },
    onError: (error: unknown) => {
      if (isAxiosError<{ message?: string }>(error)) {
        toast.error(error.response?.data?.message || 'Error creating product', 'Submission Error');
      } else {
        toast.error('Error creating product. Please try again.', 'Network Error');
      }
    },
  });

  const onSubmit = (data: ProductFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Category
          </label>
          <select
            {...register('category_id')}
            className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="1">Electronics</option>
            <option value="2">Office Supplies</option>
          </select>
        </div>

        {/* SKU Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            SKU Code *
          </label>
          <input
            {...register('sku', { required: 'SKU is required' })}
            placeholder="e.g. LAP-002"
            className="w-full rounded-lg border border-slate-200 bg-white p-2.5 font-mono text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
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
            className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          {errors.name && (
            <span className="text-[11px] font-medium text-red-500 mt-1 block">
              {errors.name.message}
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
            {...register('selling_price', {
              required: 'Valid price is required',
              min: { value: 0, message: 'Price cannot be negative' },
            })}
            placeholder="0.00"
            className="w-full rounded-lg border border-slate-200 bg-white p-2.5 font-mono text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          {errors.selling_price && (
            <span className="text-[11px] font-medium text-red-500 mt-1 block">
              {errors.selling_price.message}
            </span>
          )}
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-2 pt-6">
          <input
            id="is_active"
            type="checkbox"
            {...register('is_active')}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="is_active" className="text-xs font-medium text-slate-700 cursor-pointer">
            Mark product as active immediately
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={mutation.isPending}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors focus:outline-none disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <span>{mutation.isPending ? 'Saving Product...' : 'Save Product'}</span>
        </button>
      </div>
    </form>
  );
};

export default CreateProductForm;
