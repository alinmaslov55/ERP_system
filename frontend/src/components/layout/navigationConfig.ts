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
}

export interface NavGroup {
  title: string;
  requiredRole?: 'admin' | 'manager' | 'warehouse_operator' | 'sales_operator';
  items: NavItem[];
}

export const navigationConfig: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        name: 'Dashboard',
        path: '/',
        icon: LayoutDashboard,
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
      },
      {
        name: 'Categories',
        path: '/inventory/categories',
        icon: FolderTree,
      },
      {
        name: 'Stock Levels',
        path: '/inventory/stock-levels',
        icon: Layers,
      },
      {
        name: 'Movements',
        path: '/inventory/movements',
        icon: ArrowLeftRight,
      },
      {
        name: 'Warehouses',
        path: '/inventory/warehouses',
        icon: Warehouse,
      },
      {
        name: 'Transfers',
        path: '/inventory/transfers',
        icon: Repeat,
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
      },
      {
        name: 'Purchase Orders',
        path: '/purchasing/orders',
        icon: ShoppingBag,
      },
      {
        name: 'Goods Receipts',
        path: '/purchasing/receipts',
        icon: PackageCheck,
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
      },
      {
        name: 'Sales Orders',
        path: '/sales/orders',
        icon: ShoppingCart,
      },
      {
        name: 'Shipments',
        path: '/sales/shipments',
        icon: Truck,
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
      },
    ],
  },
  {
    title: 'Administration',
    requiredRole: 'admin',
    items: [
      {
        name: 'User Management',
        path: '/admin/users',
        icon: UserCog,
        requiredRole: 'admin',
      },
      {
        name: 'Audit Logs',
        path: '/admin/audit-logs',
        icon: History,
        requiredRole: 'admin',
      },
    ],
  },
];

