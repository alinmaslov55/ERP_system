import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import axios from "../../lib/axios";

interface ProductFormData{
    category_id: number;
    sku: string;
    name: string;
    selling_price: number;
    is_active: boolean;
};

export default function CreateProductForm(){
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormData>({
        defaultValues: {
            category_id: 1,
            is_active: true
        }
    });

    const mutation = useMutation({
        mutationFn: async (newProduct: ProductFormData) => {
            const response = await axios.post('/products', newProduct);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            reset();
            alert('Product created successfully!');
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'Error creating product');
        }
    });

    const onSubmit = (data: ProductFormData) => {
        mutation.mutate(data);
    };

    return (
        <div className="p-6 mb-8 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-4">Add New Product</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Category Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <select {...register('category_id')} className="mt-1 block w-full p-2 border border-gray-300 rounded">
                            <option value="1">Electronics</option>
                            <option value="2">Office Supplies</option>
                        </select>
                    </div>

                    {/* SKU Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">SKU</label>
                        <input {...register('sku', { required: true })} className="mt-1 block w-full p-2 border border-gray-300 rounded" placeholder="e.g. MOUSE-001" />
                        {errors.sku && <span className="text-red-500 text-sm">SKU is required</span>}
                    </div>

                    {/* Name Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Product Name</label>
                        <input {...register('name', { required: true })} className="mt-1 block w-full p-2 border border-gray-300 rounded" placeholder="e.g. Wireless Mouse" />
                        {errors.name && <span className="text-red-500 text-sm">Name is required</span>}
                    </div>

                    {/* Price Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Selling Price ($)</label>
                        <input type="number" step="0.01" {...register('selling_price', { required: true, min: 0 })} className="mt-1 block w-full p-2 border border-gray-300 rounded" placeholder="0.00" />
                        {errors.selling_price && <span className="text-red-500 text-sm">Valid price is required</span>}
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={mutation.isPending}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {mutation.isPending ? 'Saving...' : 'Save Product'}
                </button>
            </form>
        </div>
    );
}