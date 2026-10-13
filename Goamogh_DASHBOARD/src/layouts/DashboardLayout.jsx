import { Outlet } from "react-router-dom"
import useAuth from "@/hooks/useAuth"
import Sidebar from "@/layouts/Sidebar"
import { LogOut } from "lucide-react"

function DashboardLayout() {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Sidebar - Strict 280px Width */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header - strict h-16 (64px) */}
        <header className="h-16 sticky top-0 z-20 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Goamogh-Dashboard</h1>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 transition-colors active:scale-95"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </header>

        {/* Content Outlet - strict padding p-4 md:p-6 */}
        <main className="p-4 md:p-6 flex-1 flex flex-col max-w-full w-full mx-auto">
          <Outlet />
        </main>

      </div>
    </div>
  )
}

export default DashboardLayout
