import { useState, useEffect } from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "@/components/layout/Sidebar"
import { Menu } from "lucide-react"

function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isSidebarOpen) return
    const onKey = (e) => {
      if (e.key === "Escape") setIsSidebarOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isSidebarOpen])

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden h-14 sticky top-0 z-20 bg-white border-b border-slate-200/80 px-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img src="/brand/goamogh-golden.png" alt="Goamogh" className="h-6 w-auto object-contain" />
        </header>

        <main className="p-4 md:p-6 flex-1 flex flex-col max-w-full w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
