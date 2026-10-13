import useAuth from "@/hooks/useAuth"
import { ShieldCheck, UserCheck } from "lucide-react"

function DashboardOverview() {
  const { user, isSuperAdmin } = useAuth()

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="text-center space-y-4 animate-in fade-in zoom-in-95 duration-300 flex flex-col items-center">
        
        {/* Dynamic Role Badge Pill */}
        {isSuperAdmin ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border bg-brand-50 text-brand-700 border-brand-200">
            <ShieldCheck className="w-4 h-4 mr-1.5 text-brand-600" />
            Super Admin Console
          </span>
        ) : (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border bg-slate-50 text-slate-600 border-slate-200">
            <UserCheck className="w-4 h-4 mr-1.5 text-slate-500" />
            Staff Console ({user?.role?.name || user?.role_name || user?.role || "Admin"})
          </span>
        )}

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Coming Soon</h2>
          <p className="text-sm font-medium text-slate-500 max-w-md">
            We are working hard to build this workspace section. Please check back later!
          </p>
        </div>
        
      </div>
    </div>
  )
}

export default DashboardOverview
