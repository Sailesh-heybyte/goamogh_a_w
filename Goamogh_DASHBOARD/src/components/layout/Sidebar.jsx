import { useState, useEffect, useRef } from "react"
import { NavLink } from "react-router-dom"
import useAuth from "@/hooks/useAuth"
import {
  LayoutDashboard,
  Users,
  UserCog,
  Shield,
  Layers,
  Package,
  IndianRupee,
  Truck,
  ShoppingCart,
  Settings,
  ClipboardList,
  Layers3,
  ReceiptText,
  Star,
  Inbox,
  X,
  FileCheck2,
  Factory,
  PackageCheck,
  History,
  MoreVertical,
  LogOut,
} from "lucide-react"

function Sidebar({ isOpen, onClose }) {
  const { user, isSuperAdmin, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!isMenuOpen) return

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false)
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isMenuOpen])

  // Dynamic navigation links based on permissions
  const hasPermission = (permissionName) => {
    if (!user) return false

    if (isSuperAdmin) return true

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

  const sections = [
    {
      title: "Sales",
      items: [
        { name: "Sales", to: "/sales", icon: ShoppingCart, show: hasPermission("sales_manage") },
        { name: "Indents", to: "/indents", icon: Layers3, show: hasPermission("indent_manage") },
        { name: "Invoices", to: "/invoices", icon: ReceiptText, show: hasPermission("sales_manage") },
      ],
    },
    {
      title: "Purchases",
      items: [
        { name: "Purchase Orders", to: "/purchase/orders", icon: ClipboardList, show: hasPermission("purchase_order_manage") },
        { name: "Purchase Entries", to: "/purchase/entries", icon: PackageCheck, show: hasPermission("goods_receipt_manage") },
        { name: "Suppliers", to: "/suppliers", icon: Truck, show: hasPermission("supplier_manage") },
      ],
    },
    {
      title: "Production & Stock",
      items: [
        { name: "Work Orders", to: "/work-orders", icon: Factory, show: hasPermission("work_order_manage") },
        { name: "Inventory Dashboard", to: "/inventory-dashboard", icon: LayoutDashboard, show: hasPermission("stock_manage") },
        { name: "Stock Ledger", to: "/stock-ledger", icon: History, show: hasPermission("stock_manage") },
      ],
    },
    {
      title: "Customers",
      items: [
        { name: "Customers", to: "/customers", icon: Users, show: hasPermission("customer_manage") },
        { name: "Enquiries", to: "/enquiries", icon: Inbox, show: hasPermission("customer_manage") },
        { name: "Feedback", to: "/feedback", icon: Star, show: hasPermission("sales_manage") },
      ],
    },
    {
      title: "Catalog",
      items: [
        { name: "Item Catalog", to: "/products", icon: Package, show: hasPermission("catalog_manage") || hasPermission("catalog_authorize") },
        { name: "Categories", to: "/categories", icon: Layers, show: hasPermission("catalog_manage") },
        { name: "Pricing", to: "/pricing", icon: IndianRupee, show: hasPermission("price_view") || hasPermission("price_manage") },
        { name: "Certificates", to: "/certificates", icon: FileCheck2, show: hasPermission("certificate_manage") || hasPermission("catalog_manage") },
      ],
    },
    {
      title: "Admin",
      items: [
        { name: "Staff", to: "/staff", icon: UserCog, show: isSuperAdmin || hasPermission("all") },
        { name: "Roles", to: "/roles", icon: Shield, show: isSuperAdmin || hasPermission("all") },
        { name: "Settings", to: "/settings", icon: Settings, show: isSuperAdmin || hasPermission("all") },
      ],
    },
  ]
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.show),
    }))
    .filter((section) => section.items.length > 0)

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
          {sections.map((section, idx) => (
            <div key={section.title || idx} className="space-y-1">
              {section.title && (
                <p className="px-4 pt-5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    onClick={onClose}
                    end={item.to === "/"}
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
            </div>
          ))}
        </nav>
      </div>

      {/* Dynamic Profile Widget */}
      <div className="p-4 border-t border-slate-100 shrink-0">
        <div ref={menuRef} className="relative bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-700 text-sm border border-brand-200 shrink-0">
              {user?.first_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="min-w-0 truncate">
              <p className="text-sm font-bold text-slate-800 truncate">
                {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.email || "Admin User"}
              </p>
              <p className="text-xs font-bold text-slate-400 capitalize">
                {user?.role_name === "super_admin" ? "Super Admin" : (user?.role_name ?? "—")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsMenuOpen((o) => !o)}
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              className="ml-auto shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          {isMenuOpen && (
            <div
              role="menu"
              className="absolute bottom-full right-0 mb-2 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsMenuOpen(false)
                  logout()
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
