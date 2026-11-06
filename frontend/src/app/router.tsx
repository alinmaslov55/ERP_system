import { createBrowserRouter } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import DashboardPage from '../features/dashboard/DashboardPage';
import ProductList from '../features/products/ProductList';
import LoginPage from '../features/auth/LoginPage';
import PlaceholderPage from '../components/common/PlaceholderPage';
import NotFoundPage from '../components/common/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      // Inventory Module
      {
        path: 'inventory/products',
        element: <ProductList />,
      },
      {
        path: 'inventory/products/:id',
        element: (
          <PlaceholderPage
            code="PRD-003"
            title="Product Detail"
            category="Inventory"
            description="Detailed product attributes, barcodes, suppliers, and stock allocation across warehouses."
          />
        ),
      },
      {
        path: 'inventory/categories',
        element: (
          <PlaceholderPage
            code="PRD-002"
            title="Categories Management"
            category="Inventory"
            description="Manage hierarchy and groupings for catalog SKU classification."
          />
        ),
      },
      {
        path: 'inventory/stock-levels',
        element: (
          <PlaceholderPage
            code="INV-004"
            title="Stock Levels"
            category="Inventory"
            description="Monitor on-hand, reserved, and available stock quantities with reorder thresholds."
          />
        ),
      },
      {
        path: 'inventory/movements',
        element: (
          <PlaceholderPage
            code="INV-004"
            title="Stock Movement Ledger"
            category="Inventory"
            description="Immutable audit ledger tracking every receipt, issue, adjustment, and transfer."
          />
        ),
      },
      {
        path: 'inventory/warehouses',
        element: (
          <PlaceholderPage
            code="WHS-002"
            title="Warehouse Locations"
            category="Inventory"
            description="Configure physical warehouses, zones, and active storage facilities."
          />
        ),
      },
      {
        path: 'inventory/warehouses/:id',
        element: (
          <PlaceholderPage
            code="WHS-003"
            title="Warehouse Detail"
            category="Inventory"
            description="Warehouse capacity, localized stock balances, and facility settings."
          />
        ),
      },
      {
        path: 'inventory/transfers',
        element: (
          <PlaceholderPage
            code="INV-006"
            title="Inter-Warehouse Stock Transfers"
            category="Inventory"
            description="Initiate and complete stock movements between active warehouses."
          />
        ),
      },

      // Procurement Module
      {
        path: 'purchasing/suppliers',
        element: (
          <PlaceholderPage
            code="PUR-001"
            title="Supplier Directory"
            category="Procurement"
            description="Manage vendor profiles, contact details, payment terms, and lead times."
          />
        ),
      },
      {
        path: 'purchasing/orders',
        element: (
          <PlaceholderPage
            code="PUR-002"
            title="Purchase Orders"
            category="Procurement"
            description="Draft, submit, and manage purchase orders issued to suppliers."
          />
        ),
      },
      {
        path: 'purchasing/orders/new',
        element: (
          <PlaceholderPage
            code="PUR-002"
            title="Create Purchase Order"
            category="Procurement"
            description="Multi-line purchase order builder with real-time cost computation."
          />
        ),
      },
      {
        path: 'purchasing/orders/:id',
        element: (
          <PlaceholderPage
            code="PUR-005"
            title="Purchase Order Detail"
            category="Procurement"
            description="Status timeline, line-item fulfillment, and goods receipt tracking."
          />
        ),
      },
      {
        path: 'purchasing/receipts',
        element: (
          <PlaceholderPage
            code="PUR-004"
            title="Goods Receipts"
            category="Procurement"
            description="Process incoming supplier deliveries and post stock receipts to warehouses."
          />
        ),
      },

      // Sales Module
      {
        path: 'sales/customers',
        element: (
          <PlaceholderPage
            code="SAL-001"
            title="Customer Directory"
            category="Sales"
            description="Manage customer accounts, billing addresses, and order history."
          />
        ),
      },
      {
        path: 'sales/orders',
        element: (
          <PlaceholderPage
            code="SAL-002"
            title="Sales Orders"
            category="Sales"
            description="Customer sales orders, stock reservation, and fulfillment pipelines."
          />
        ),
      },
      {
        path: 'sales/orders/new',
        element: (
          <PlaceholderPage
            code="SAL-002"
            title="Create Sales Order"
            category="Sales"
            description="Draft customer sales orders with instant stock availability checks."
          />
        ),
      },
      {
        path: 'sales/orders/:id',
        element: (
          <PlaceholderPage
            code="SAL-004"
            title="Sales Order Detail"
            category="Sales"
            description="Order lifecycle view, reserved items, packing slip, and invoice."
          />
        ),
      },
      {
        path: 'sales/shipments',
        element: (
          <PlaceholderPage
            code="SAL-004"
            title="Order Shipments"
            category="Sales"
            description="Generate packing slips and deduct fulfilled inventory balances."
          />
        ),
      },

      // Analytics Module
      {
        path: 'reports',
        element: (
          <PlaceholderPage
            code="RPT-001"
            title="Operational Reports & Analytics"
            category="Analytics"
            description="Inventory valuation, sales velocity, supplier performance, and CSV exports."
          />
        ),
      },

      // Administration Module
      {
        path: 'admin/users',
        element: (
          <PlaceholderPage
            code="AUT-005"
            title="User Administration"
            category="Administration"
            description="User accounts, active role assignments, and permission overrides."
          />
        ),
      },
      {
        path: 'admin/audit-logs',
        element: (
          <PlaceholderPage
            code="AUD-003"
            title="Audit Trail Explorer"
            category="Administration"
            description="System-wide audit trail with actor attribution and state transition logs."
          />
        ),
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;

