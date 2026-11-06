import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { isAxiosError } from "axios";
import { AlertCircle, LogIn, RefreshCw, Loader2 } from "lucide-react";
import axios from "../../lib/axios";
import CreateProductForm from "./CreateProductForm";

interface Product {
    id: number;
    sku: string;
    name: string;
    selling_price: string;
    is_active: boolean;
}

export default function ProductList(){
    const { data: products, isLoading, isError, error, refetch } = useQuery<Product[]>({
        queryKey: ['products'],
        queryFn: async() => {
            const response = await axios.get('/products');
            return response.data.data;
        }
    });

    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await axios.delete(`/products/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
        onError: () => {
            alert('Failed to archive product.');
        }
    });

    const handleArchive = (id: number) => {
        if (window.confirm('Are you sure you want to archive this product?')) {
            deleteMutation.mutate(id);
        }
    };

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
            <CreateProductForm />
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold text-slate-900">Product Catalog</h1>
                    <span className="text-xs font-medium text-slate-500">
                        Total: {products?.length ?? 0} item{(products?.length ?? 0) === 1 ? '' : 's'}
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                                <th className="p-3.5">SKU</th>
                                <th className="p-3.5">Name</th>
                                <th className="p-3.5">Price</th>
                                <th className="p-3.5">Status</th>
                                <th className="p-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {products?.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-slate-500">
                                        No products found in catalog.
                                    </td>
                                </tr>
                            ) : (
                                products?.map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-50/75 transition-colors">
                                        <td className="p-3.5 font-mono font-medium text-slate-900">{product.sku}</td>
                                        <td className="p-3.5 text-slate-800">{product.name}</td>
                                        <td className="p-3.5 font-semibold text-slate-900">${product.selling_price}</td>
                                        <td className="p-3.5">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                    product.is_active
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                        : 'bg-red-50 text-red-700 border border-red-100'
                                                }`}
                                            >
                                                {product.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="p-3.5 text-right">
                                            <button 
                                                onClick={() => handleArchive(product.id)}
                                                disabled={deleteMutation.isPending}
                                                className="text-red-600 hover:text-red-800 text-xs font-semibold disabled:opacity-50 transition-colors"
                                            >
                                                Archive
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
