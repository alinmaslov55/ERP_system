import {
  LayoutDashboard,
  Package,
  FolderTree,
  Layers,
  ArrowLeftRight,
  Warehouse,
  Repeat,
  Building2,
  ShoppingBag,
  PackageCheck,
  Users,
  ShoppingCart,
  Truck,
  BarChart3,
  UserCog,
  History,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
  requiredRole?: 'admin' | 'manager' | 'warehouse_operator' | 'sales_operator';
  requiredPermission?: string;
}

export interface NavGroup {
  title: string;
  requiredRole?: 'admin' | 'manager' | 'warehouse_operator' | 'sales_operator';
  requiredPermission?: string;
  items: NavItem[];
}

export const navigationConfig: NavGroup[] = [
  {
    title: 'Overview',
    requiredPermission: 'dashboard.view',
    items: [
      {
        name: 'Dashboard',
        path: '/',
        icon: LayoutDashboard,
        requiredPermission: 'dashboard.view',
      },
    ],
  },
  {
    title: 'Inventory',
    items: [
      {
        name: 'Products',
        path: '/inventory/products',
        icon: Package,
        requiredPermission: 'products.view',
      },
      {
        name: 'Categories',
        path: '/inventory/categories',
        icon: FolderTree,
        requiredPermission: 'categories.manage',
      },
      {
        name: 'Stock Levels',
        path: '/inventory/stock-levels',
        icon: Layers,
        requiredPermission: 'inventory.view',
      },
      {
        name: 'Movements',
        path: '/inventory/movements',
        icon: ArrowLeftRight,
        requiredPermission: 'inventory.view',
      },
      {
        name: 'Warehouses',
        path: '/inventory/warehouses',
        icon: Warehouse,
        requiredPermission: 'warehouses.view',
      },
      {
        name: 'Transfers',
        path: '/inventory/transfers',
        icon: Repeat,
        requiredPermission: 'inventory.transfer',
      },
    ],
  },
  {
    title: 'Procurement',
    items: [
      {
        name: 'Suppliers',
        path: '/purchasing/suppliers',
        icon: Building2,
        requiredPermission: 'suppliers.view',
      },
      {
        name: 'Purchase Orders',
        path: '/purchasing/orders',
        icon: ShoppingBag,
        requiredPermission: 'po.view',
      },
      {
        name: 'Goods Receipts',
        path: '/purchasing/receipts',
        icon: PackageCheck,
        requiredPermission: 'po.receive',
      },
    ],
  },
  {
    title: 'Sales & Orders',
    items: [
      {
        name: 'Customers',
        path: '/sales/customers',
        icon: Users,
        requiredPermission: 'customers.view',
      },
      {
        name: 'Sales Orders',
        path: '/sales/orders',
        icon: ShoppingCart,
        requiredPermission: 'so.view',
      },
      {
        name: 'Shipments',
        path: '/sales/shipments',
        icon: Truck,
        requiredPermission: 'so.fulfill',
      },
    ],
  },
  {
    title: 'Analytics',
    items: [
      {
        name: 'Reports',
        path: '/reports',
        icon: BarChart3,
        requiredPermission: 'reports.view',
      },
    ],
  },
  {
    title: 'Administration',
    requiredPermission: 'users.manage',
    items: [
      {
        name: 'User Management',
        path: '/admin/users',
        icon: UserCog,
        requiredPermission: 'users.manage',
      },
      {
        name: 'Audit Logs',
        path: '/admin/audit-logs',
        icon: History,
        requiredPermission: 'audit.view',
      },
    ],
  },
];
