import { lazy, Suspense } from "react"
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom"
import ErrorBoundary from "@/components/ErrorBoundary"
import { AuthProvider } from "@/context/AuthProvider"
import { ConfirmProvider } from "@/context/ConfirmProvider"
import { ToastProvider } from "@/context/ToastContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import PermissionRoute from "@/components/PermissionRoute"
import Spinner from "@/components/ui/Spinner"
import Login from "@/screens/Login"
import DashboardLayout from "@/components/layout/DashboardLayout"

const DashboardOverview = lazy(() => import("@/screens/DashboardOverview"))
const StaffManagement = lazy(() => import("@/screens/StaffManagement"))
const RoleManagement = lazy(() => import("@/screens/RoleManagement"))
const CategoryManagement = lazy(() => import("@/screens/CategoryManagement"))
const ProductCatalog = lazy(() => import("@/screens/ProductCatalog"))
const PricingPanel = lazy(() => import("@/screens/PricingPanel"))
const SupplierDirectory = lazy(() => import("@/screens/SupplierDirectory"))
const PurchaseOrders = lazy(() => import("@/screens/PurchaseOrders"))
const CreatePurchaseOrder = lazy(() => import("@/screens/CreatePurchaseOrder"))
const PurchaseEntries = lazy(() => import("@/screens/PurchaseEntries"))
const CreatePurchaseEntry = lazy(() => import("@/screens/CreatePurchaseEntry"))
const WorkOrders = lazy(() => import("@/screens/WorkOrders"))
const SystemSettings = lazy(() => import("@/screens/SystemSettings"))
const StockLedger = lazy(() => import("@/screens/StockLedger"))
const InventoryDashboard = lazy(() => import("@/screens/InventoryDashboard"))
const Customers = lazy(() => import("@/screens/Customers"))
const Indents = lazy(() => import("@/screens/Indents"))
const CreateIndent = lazy(() => import("@/screens/CreateIndent"))
const Sales = lazy(() => import("@/screens/Sales"))
const CreateSale = lazy(() => import("@/screens/CreateSale"))
const Invoices = lazy(() => import("@/screens/Invoices"))
const InvoiceDetails = lazy(() => import("@/screens/InvoiceDetails"))
const CustomerFeedback = lazy(() => import("@/screens/CustomerFeedback"))
const CustomerEnquiries = lazy(() => import("@/screens/CustomerEnquiries"))


const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "",
        element: (
          <Suspense fallback={<Spinner />}>
            <DashboardOverview />
          </Suspense>
        ),
      },
      {
        path: "staff",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permissions={["all", "staff_manage", "users_view"]}>
              <StaffManagement />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "roles",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permissions={["all", "role_manage"]}>
              <RoleManagement />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "categories",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permission="catalog_manage">
              <CategoryManagement />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "products",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permissions={["catalog_manage", "catalog_authorize"]}>
              <ProductCatalog />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "pricing",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permissions={["price_view", "price_manage"]}>
              <PricingPanel />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "suppliers",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permission="supplier_manage">
              <SupplierDirectory />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "purchase/orders",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permission="purchase_order_manage">
              <PurchaseOrders />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "purchase/orders/create",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permission="purchase_order_manage">
              <CreatePurchaseOrder />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "purchase/entries",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permission="goods_receipt_manage">
              <PurchaseEntries />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "purchase/entries/create",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permission="goods_receipt_manage">
              <CreatePurchaseEntry />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "work-orders",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permission="work_order_manage">
              <WorkOrders />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "inventory-dashboard",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permission="stock_manage">
              <InventoryDashboard />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "stock-ledger",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permission="stock_manage">
              <StockLedger />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "customers",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permission="customer_manage">
              <Customers />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "indents",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permission="indent_manage">
              <Indents />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "indents/create",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permission="indent_manage">
              <CreateIndent />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "indents/edit/:id",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permission="indent_manage">
              <CreateIndent />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "sales",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permission="sales_manage">
              <Sales />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "sales/create",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permission="sales_manage">
              <CreateSale />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "invoices",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permissions={["purchase_manage", "sales_manage"]}>
              <Invoices />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "invoices/:id",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permissions={["purchase_manage", "sales_manage"]}>
              <InvoiceDetails />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "feedback",
        element: (
          <Suspense fallback={<Spinner />}>
            <CustomerFeedback />
          </Suspense>
        ),
      },
      {
        path: "enquiries",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permissions={["users_view", "customer_manage"]}>
              <CustomerEnquiries />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "settings",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permission="all">
              <SystemSettings />
            </PermissionRoute>
          </Suspense>
        ),
      },
    ],
  },

  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
])

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
