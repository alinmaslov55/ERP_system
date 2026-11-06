<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Define all 24 canonical granular permissions
        $permissions = [
            // Dashboard
            ['slug' => 'dashboard.view', 'name' => 'View Dashboard', 'module' => 'dashboard'],

            // Products & Categories
            ['slug' => 'products.view', 'name' => 'View Products', 'module' => 'products'],
            ['slug' => 'products.manage', 'name' => 'Manage Products', 'module' => 'products'],
            ['slug' => 'categories.manage', 'name' => 'Manage Categories', 'module' => 'categories'],

            // Warehouses
            ['slug' => 'warehouses.view', 'name' => 'View Warehouses', 'module' => 'warehouses'],
            ['slug' => 'warehouses.manage', 'name' => 'Manage Warehouses', 'module' => 'warehouses'],

            // Inventory & Stock
            ['slug' => 'inventory.view', 'name' => 'View Inventory', 'module' => 'inventory'],
            ['slug' => 'inventory.adjust', 'name' => 'Adjust Stock', 'module' => 'inventory'],
            ['slug' => 'inventory.transfer', 'name' => 'Transfer Stock', 'module' => 'inventory'],

            // Suppliers & Purchasing
            ['slug' => 'suppliers.view', 'name' => 'View Suppliers', 'module' => 'suppliers'],
            ['slug' => 'suppliers.manage', 'name' => 'Manage Suppliers', 'module' => 'suppliers'],
            ['slug' => 'po.view', 'name' => 'View Purchase Orders', 'module' => 'purchasing'],
            ['slug' => 'po.manage', 'name' => 'Manage Purchase Orders', 'module' => 'purchasing'],
            ['slug' => 'po.receive', 'name' => 'Receive Goods', 'module' => 'purchasing'],

            // Customers & Sales
            ['slug' => 'customers.view', 'name' => 'View Customers', 'module' => 'sales'],
            ['slug' => 'customers.manage', 'name' => 'Manage Customers', 'module' => 'sales'],
            ['slug' => 'so.view', 'name' => 'View Sales Orders', 'module' => 'sales'],
            ['slug' => 'so.manage', 'name' => 'Manage Sales Orders', 'module' => 'sales'],
            ['slug' => 'so.fulfill', 'name' => 'Fulfill Sales Orders', 'module' => 'sales'],
            ['slug' => 'payments.manage', 'name' => 'Manage Payments', 'module' => 'sales'],

            // Reports & Analytics
            ['slug' => 'reports.view', 'name' => 'View Reports', 'module' => 'reports'],
            ['slug' => 'reports.export', 'name' => 'Export Reports', 'module' => 'reports'],

            // Administration & Audit
            ['slug' => 'users.manage', 'name' => 'Manage Users', 'module' => 'users'],
            ['slug' => 'audit.view', 'name' => 'View Audit Logs', 'module' => 'audit'],
        ];

        $permissionModels = [];
        foreach ($permissions as $perm) {
            $permissionModels[$perm['slug']] = Permission::firstOrCreate(
                ['slug' => $perm['slug']],
                ['name' => $perm['name'], 'module' => $perm['module']]
            );
        }

        // 2. Define the 4 canonical roles
        $roles = [
            'admin' => [
                'name' => 'Administrator',
                'description' => 'Unrestricted administrative access to all modules and system settings.',
                'permissions' => array_keys($permissionModels), // All 24 permissions
            ],
            'manager' => [
                'name' => 'Operations Manager',
                'description' => 'Full operational control over catalog, inventory, purchasing, sales, and analytics.',
                'permissions' => array_filter(array_keys($permissionModels), fn ($p) => $p !== 'users.manage'),
            ],
            'warehouse_operator' => [
                'name' => 'Warehouse Operator',
                'description' => 'Stock receipts, adjustments, transfers, and shipment fulfillments.',
                'permissions' => [
                    'dashboard.view',
                    'products.view',
                    'warehouses.view',
                    'inventory.view',
                    'inventory.adjust',
                    'inventory.transfer',
                    'po.view',
                    'po.receive',
                    'so.view',
                    'so.fulfill',
                    'reports.view',
                ],
            ],
            'sales_operator' => [
                'name' => 'Sales Operator',
                'description' => 'Customer management, sales orders, reservations, and customer payments.',
                'permissions' => [
                    'dashboard.view',
                    'products.view',
                    'inventory.view',
                    'customers.view',
                    'customers.manage',
                    'so.view',
                    'so.manage',
                    'payments.manage',
                    'reports.view',
                ],
            ],
        ];

        foreach ($roles as $slug => $roleData) {
            $role = Role::firstOrCreate(
                ['slug' => $slug],
                [
                    'name' => $roleData['name'],
                    'description' => $roleData['description'],
                ]
            );

            // Sync permissions for this role
            $permissionIds = collect($roleData['permissions'])
                ->map(fn ($pSlug) => $permissionModels[$pSlug]->id ?? null)
                ->filter()
                ->all();

            $role->permissions()->sync($permissionIds);
        }

        // 3. Attach 'admin' role to default system administrator
        $adminUser = User::where('email', 'admin@stockpilot.io')->first();
        if ($adminUser) {
            $adminUser->assignRole('admin');
        }
    }
}

