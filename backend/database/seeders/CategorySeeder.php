<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Category::firstOrCreate(
            ['name' => 'Electronics'],
            ['description' => 'Gadgets and devices']
        );

        Category::firstOrCreate(
            ['name' => 'Office Supplies'],
            ['description' => 'Desks, chairs, and stationery']
        );
    }
}
