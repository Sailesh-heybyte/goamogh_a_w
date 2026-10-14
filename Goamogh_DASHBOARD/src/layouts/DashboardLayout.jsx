import { useState, useEffect } from "react"
import { Outlet } from "react-router-dom"
import useAuth from "@/hooks/useAuth"
import Sidebar from "@/layouts/Sidebar"
import { LogOut, Menu } from "lucide-react"

function DashboardLayout() {
  const { logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isSidebarOpen) return
    const onKey = (e) => { if (e.key === "Escape") setIsSidebarOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isSidebarOpen])

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Sidebar - Strict 280px Width */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      {isSidebarOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setIsSidebarOpen(false)} aria-hidden="true" />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header - strict h-16 (64px) */}
        <header className="h-16 sticky top-0 z-20 bg-white border-b border-slate-200/80 px-4 md:px-8 gap-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button type="button" onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors" aria-label="Open menu">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base md:text-lg font-bold text-slate-900 truncate">Goamogh-Dashboard</h1>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 transition-colors active:scale-95"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
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
