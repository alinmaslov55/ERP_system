<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@stockpilot.io'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password123'),
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        $this->call([
            RolePermissionSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,
        ]);
    }
}
