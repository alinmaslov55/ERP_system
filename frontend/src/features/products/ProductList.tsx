import { useQuery } from "@tanstack/react-query";
import axios from "../../lib/axios";
import CreateProductForm from "./CreateProductForm";

interface Product {
    id: number;
    sku: string;
    name: string;
    selling_price: string;
    is_active: boolean;
};

export default function ProductList(){
    const { data: products, isLoading, isError } = useQuery<Product[]>({
        queryKey: ['products'],
        queryFn: async() => {
            const response = await axios.get('/products');
            return response.data.data;
        }
    });

    if(isLoading) return <div className="p-8">Loading Products...</div>;
    if(isError) return <div className="p-8 text-red-500">Error fetching products</div>

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <CreateProductForm/>
            <h1 className="text-2xl font-bold mb-6">Product Catalog</h1>
            <div className="overflow-x-auto bg-white rounded shadow">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-100 border-b">
                            <th className="p-4 font-semibold text-gray-600">SKU</th>
                            <th className="p-4 font-semibold text-gray-600">Name</th>
                            <th className="p-4 font-semibold text-gray-600">Price</th>
                            <th className="p-4 font-semibold text-gray-600">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products?.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-4 text-center text-gray-500">No products found.</td>
                            </tr>
                        ) : (
                            products?.map((product) => (
                                <tr key={product.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4">{product.sku}</td>
                                    <td className="p-4">{product.name}</td>
                                    <td className="p-4">${product.selling_price}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {product.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}