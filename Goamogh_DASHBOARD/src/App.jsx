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
import ForgotPassword from "@/screens/ForgotPassword"
import ResetPassword from "@/screens/ResetPassword"
import DashboardLayout from "@/components/layout/DashboardLayout"
import useAuth from "@/hooks/useAuth"

function DashboardRedirect() {
  const { hasPermission, isSuperAdmin, user } = useAuth()

  const isAdminLikeUser = Boolean(
    isSuperAdmin ||
      user?.is_admin ||
      user?.role?.name?.toLowerCase().includes("admin") ||
      user?.role_name?.toLowerCase().includes("admin") ||
      user?.role?.toString().toLowerCase().includes("admin")
  )

  const checkPerm = (perm) => isSuperAdmin || isAdminLikeUser || hasPermission(perm)

  if (checkPerm("catalog_manage")) return <Navigate to="/categories" replace />
  if (checkPerm("catalog_authorize")) return <Navigate to="/products" replace />
  if (checkPerm("certificate_manage")) return <Navigate to="/certificates" replace />
  if (checkPerm("price_view") || checkPerm("price_manage")) return <Navigate to="/pricing" replace />
  if (checkPerm("stock_manage")) return <Navigate to="/inventory-dashboard" replace />
  if (checkPerm("supplier_manage")) return <Navigate to="/suppliers" replace />
  if (checkPerm("work_order_manage")) return <Navigate to="/work-orders" replace />
  if (checkPerm("customer_manage")) return <Navigate to="/customers" replace />
  if (checkPerm("indent_manage")) return <Navigate to="/indents" replace />
  if (checkPerm("sales_manage")) return <Navigate to="/sales" replace />
  if (checkPerm("purchase_order_manage")) return <Navigate to="/purchase/orders" replace />
  if (checkPerm("goods_receipt_manage")) return <Navigate to="/purchase/entries" replace />
  if (checkPerm("all")) return <Navigate to="/staff" replace />

  return <Navigate to="/categories" replace />
}
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
const QualityCertificates = lazy(() => import("@/screens/QualityCertificates"))


const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardRedirect />,
      },
      {
        path: "staff",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permissions={["all"]}>
              <StaffManagement />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "roles",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permissions={["all"]}>
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
        path: "certificates",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permissions={["certificate_manage", "catalog_manage"]}>
              <QualityCertificates />
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
            <PermissionRoute permission="sales_manage">
              <Invoices />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "invoices/:id",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permission="sales_manage">
              <InvoiceDetails />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "feedback",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permission="sales_manage">
              <CustomerFeedback />
            </PermissionRoute>
          </Suspense>
        ),
      },
      {
        path: "enquiries",
        element: (
          <Suspense fallback={<Spinner />}>
            <PermissionRoute permission="customer_manage">
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
    element: <Navigate to="/" replace />,
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
