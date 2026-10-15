import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import useAuth from "@/hooks/useAuth"
import { LayoutDashboard, Users, Shield, Layers, Package, IndianRupee, Truck, ShoppingCart, ChevronDown, ChevronRight, Settings, ClipboardList, Layers3, FileText, Star, Inbox, X, FileCheck2 } from "lucide-react"

function Sidebar({ isOpen, onClose }) {
  const { user, isSuperAdmin } = useAuth()
  const location = useLocation()

  const isAdminLikeUser = Boolean(
    isSuperAdmin ||
      user?.is_admin ||
      user?.role?.name?.toLowerCase().includes("admin") ||
      user?.role_name?.toLowerCase().includes("admin") ||
      user?.role?.toString().toLowerCase().includes("admin")
  )

  // Dynamic navigation links based on permissions
  const hasPermission = (permissionName) => {
    if (!user) return false

    if (isSuperAdmin || isAdminLikeUser) return true

    const perms = user.permissions || user.role?.permissions
    if (!perms) return false

    if (typeof perms === "object" && !Array.isArray(perms)) {
      return perms.all === true || perms[permissionName] === true
    }

    if (Array.isArray(perms)) {
      return perms.includes("all") || perms.includes(permissionName)
    }

    return false
  }

  const catalogItems = [
    { name: "Categories", to: "/dashboard/categories", icon: Layers, show: hasPermission("catalog_manage") || isAdminLikeUser },
    { name: "Item Catalog", to: "/dashboard/products", icon: Package, show: hasPermission("catalog_manage") || hasPermission("catalog_authorize") || isAdminLikeUser },
    { name: "Certificates", to: "/dashboard/certificates", icon: FileCheck2, show: hasPermission("certificate_manage") || hasPermission("catalog_manage") || isAdminLikeUser },
    { name: "Pricing", to: "/dashboard/pricing", icon: IndianRupee, show: hasPermission("price_view") || hasPermission("price_manage") || isAdminLikeUser },
    { name: "Inventory Dashboard", to: "/dashboard/inventory-dashboard", icon: LayoutDashboard, show: hasPermission("stock_manage") || isAdminLikeUser },
    { name: "Stock Ledger", to: "/dashboard/stock-ledger", icon: ClipboardList, show: hasPermission("stock_manage") || isAdminLikeUser },
    { name: "Suppliers", to: "/dashboard/suppliers", icon: Truck, show: hasPermission("supplier_manage") || isAdminLikeUser },
    { name: "Work Orders", to: "/dashboard/work-orders", icon: ClipboardList, show: hasPermission("work_order_manage") || isAdminLikeUser },
    { name: "Customers", to: "/dashboard/customers", icon: Users, show: hasPermission("customer_manage") || isAdminLikeUser },
    { name: "Customer Enquiries", to: "/dashboard/enquiries", icon: Inbox, show: hasPermission("customer_manage") || isAdminLikeUser },
    { name: "Customer Feedback", to: "/dashboard/feedback", icon: Star, show: hasPermission("sales_manage") || isAdminLikeUser },
    { name: "Indents", to: "/dashboard/indents", icon: Layers3, show: hasPermission("indent_manage") || isAdminLikeUser },
    { name: "Sales", to: "/dashboard/sales", icon: ShoppingCart, show: hasPermission("sales_manage") || isAdminLikeUser },
    { name: "Invoices", to: "/dashboard/invoices", icon: FileText, show: hasPermission("sales_manage") || isAdminLikeUser },
  ].filter(item => item.show)

  const showPurchases = hasPermission("purchase_order_manage") || hasPermission("goods_receipt_manage") || isAdminLikeUser
  const showPO = hasPermission("purchase_order_manage") || isAdminLikeUser
  const showPE = hasPermission("goods_receipt_manage") || isAdminLikeUser

  const adminItems = [
    (isSuperAdmin || isAdminLikeUser || hasPermission("all")) && { name: "Staff", to: "/dashboard/staff", icon: Users },
    (isSuperAdmin || isAdminLikeUser || hasPermission("all")) && { name: "Roles", to: "/dashboard/roles", icon: Shield },
    (isSuperAdmin || isAdminLikeUser || hasPermission("all")) && { name: "Settings", to: "/dashboard/settings", icon: Settings },
  ].filter(Boolean)


  const [isPurchasesOpen, setIsPurchasesOpen] = useState(
    location.pathname.startsWith("/dashboard/purchase")
  )

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-[280px] h-dvh bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-200 ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shrink-0`}>
      {/* Branding header block */}
      <div className="h-16 flex items-center px-6 lg:px-8 border-b border-slate-100 gap-3 shrink-0">
        <img src="/brand/goamogh-golden.png" alt="Goamogh" className="h-7 w-auto object-contain" />
        <button type="button" onClick={onClose} className="lg:hidden ml-auto p-2 -mr-2 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Close menu">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Nav Link list */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-1">
          {catalogItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.name}
                to={item.to}
                onClick={onClose}
                end={item.to === "/dashboard"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive
                    ? "bg-brand-50 text-brand-700 font-bold"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            )
          })}

          {/* Purchases Collapsible Dropdown */}
          {showPurchases && (
            <div className="space-y-1">
              <button
                onClick={() => setIsPurchasesOpen(!isPurchasesOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all text-slate-500 hover:text-slate-900 hover:bg-slate-50 ${location.pathname.startsWith("/dashboard/purchase") ? "text-slate-800 font-bold" : ""
                  }`}
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 shrink-0" />
                  <span>Purchases</span>
                </div>
                {isPurchasesOpen ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {isPurchasesOpen && (
                <div className="pl-4 space-y-1 mt-1 border-l border-slate-100 ml-6 animate-in slide-in-from-top-1 duration-150">
                  {showPO && (
                    <NavLink
                      to="/dashboard/purchase/orders"
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive
                          ? "bg-brand-50 text-brand-700 font-bold"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`
                      }
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                      <span>Purchase Orders</span>
                    </NavLink>
                  )}
                  {showPE && (
                    <NavLink
                      to="/dashboard/purchase/entries"
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive
                          ? "bg-brand-50 text-brand-700 font-bold"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`
                      }
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                      <span>Purchase Entries</span>
                    </NavLink>
                  )}
                </div>
              )}
            </div>
          )}

          {adminItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.name}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive
                    ? "bg-brand-50 text-brand-700 font-bold"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Dynamic Profile Widget */}
      <div className="p-4 border-t border-slate-100 shrink-0">
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-700 text-sm border border-brand-200 shrink-0">
              {user?.first_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="truncate">
              <p className="text-sm font-bold text-slate-800 truncate">
                {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.email || "Admin User"}
              </p>
              <p className="text-xs font-bold text-slate-400 capitalize">
                {(user?.role === "super_admin" || user?.role_name === "super_admin" || user?.role?.name === "super_admin") ? "Super Admin" : (user?.role?.name || user?.role_name || user?.role || "Staff")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
