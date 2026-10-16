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

export default DashboardOverview
