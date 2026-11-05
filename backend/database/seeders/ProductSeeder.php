<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $electronics = Category::where('name', 'Electronics')->first();
        $officeSupplies = Category::where('name', 'Office Supplies')->first();

        Product::firstOrCreate(
            ['sku' => 'LAP-001'],
            [
                'category_id' => $electronics?->id ?? 1,
                'name' => 'Pro Laptop 15-inch',
                'description' => 'High-performance laptop',
                'unit' => 'piece',
                'cost_price' => 850.00,
                'selling_price' => 1200.00,
                'reorder_level' => 10,
                'is_active' => true,
            ]
        );

        Product::firstOrCreate(
            ['sku' => 'CHR-002'],
            [
                'category_id' => $officeSupplies?->id ?? 2,
                'name' => 'Ergonomic Mesh Chair',
                'description' => 'Office chair with lumbar support',
                'unit' => 'piece',
                'cost_price' => 60.00,
                'selling_price' => 150.00,
                'reorder_level' => 20,
                'is_active' => true,
            ]
        );
    }
}
