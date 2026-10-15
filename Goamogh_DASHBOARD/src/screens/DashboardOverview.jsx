import { Navigate } from "react-router-dom"
import useAuth from "@/hooks/useAuth"

function DashboardOverview() {
  const { hasPermission, isSuperAdmin, user } = useAuth()

  const isAdminLikeUser = Boolean(
    isSuperAdmin ||
      user?.is_admin ||
      user?.role?.name?.toLowerCase().includes("admin") ||
      user?.role_name?.toLowerCase().includes("admin") ||
      user?.role?.toString().toLowerCase().includes("admin")
  )

  const checkPerm = (perm) => isSuperAdmin || isAdminLikeUser || hasPermission(perm)

  if (checkPerm("catalog_manage")) return <Navigate to="/dashboard/categories" replace />
  if (checkPerm("catalog_authorize")) return <Navigate to="/dashboard/products" replace />
  if (checkPerm("certificate_manage")) return <Navigate to="/dashboard/certificates" replace />
  if (checkPerm("price_view") || checkPerm("price_manage")) return <Navigate to="/dashboard/pricing" replace />
  if (checkPerm("stock_manage")) return <Navigate to="/dashboard/inventory-dashboard" replace />
  if (checkPerm("supplier_manage")) return <Navigate to="/dashboard/suppliers" replace />
  if (checkPerm("work_order_manage")) return <Navigate to="/dashboard/work-orders" replace />
  if (checkPerm("customer_manage")) return <Navigate to="/dashboard/customers" replace />
  if (checkPerm("indent_manage")) return <Navigate to="/dashboard/indents" replace />
  if (checkPerm("sales_manage")) return <Navigate to="/dashboard/sales" replace />
  if (checkPerm("purchase_order_manage")) return <Navigate to="/dashboard/purchase/orders" replace />
  if (checkPerm("goods_receipt_manage")) return <Navigate to="/dashboard/purchase/entries" replace />
  if (checkPerm("all")) return <Navigate to="/dashboard/staff" replace />

  return <Navigate to="/dashboard/categories" replace />
}

export default DashboardOverview
