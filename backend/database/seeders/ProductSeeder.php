<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Product;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Product::insert([
            [
                'category_id' => 1, // Electronics
                'sku' => 'LAP-001',
                'name' => 'Pro Laptop 15-inch',
                'description' => 'High-performance laptop',
                'unit' => 'piece',
                'cost_price' => 850.00,
                'selling_price' => 1200.00,
                'reorder_level' => 10,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],[
                'category_id' => 2, // Office Supplies
                'sku' => 'CHR-002',
                'name' => 'Ergonomic Mesh Chair',
                'description' => 'Office chair with lumbar support',
                'unit' => 'piece',
                'cost_price' => 60.00,
                'selling_price' => 150.00,
                'reorder_level' => 20,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }
}
