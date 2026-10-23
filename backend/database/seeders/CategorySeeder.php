<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Category::insert([
            [
                'name' => 'Electronics',
                'description' => 'Gadgets and devices',
                'created_at' => now(),
                'updated_at' => now()
            ],[
                'name' => 'Office Supplies',
                'description' => 'Desks, chairs, and stationery',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);
    }
}
