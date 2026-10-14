import { Clock, AlertTriangle, XCircle, CheckCircle2, Info, X } from "lucide-react"

export function Toast({ type = "error", title, message, onClose }) {
  const isRateLimit = type === "rate-limit" || type === "429"

  const typeConfig = {
    "rate-limit": {
      container: "bg-amber-500/10 border-amber-500/30 text-amber-900 shadow-amber-500/10",
      badge: "bg-amber-500/20 text-amber-800",
      icon: <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />,
      defaultTitle: "Rate Limit Exceeded (HTTP 429)",
    },
    "429": {
      container: "bg-amber-500/10 border-amber-500/30 text-amber-900 shadow-amber-500/10",
      badge: "bg-amber-500/20 text-amber-800",
      icon: <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />,
      defaultTitle: "Rate Limit Exceeded (HTTP 429)",
    },
    error: {
      container: "bg-rose-500/10 border-rose-500/30 text-rose-900 shadow-rose-500/10",
      badge: "bg-rose-500/20 text-rose-800",
      icon: <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
      defaultTitle: "Action Failed",
    },
    warning: {
      container: "bg-amber-500/10 border-amber-500/30 text-amber-900 shadow-amber-500/10",
      badge: "bg-amber-500/20 text-amber-800",
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
      defaultTitle: "Warning",
    },
    success: {
      container: "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 shadow-emerald-500/10",
      badge: "bg-emerald-500/20 text-emerald-800",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
      defaultTitle: "Success",
    },
    info: {
      container: "bg-blue-500/10 border-blue-500/30 text-blue-900 shadow-blue-500/10",
      badge: "bg-blue-500/20 text-blue-800",
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />,
      defaultTitle: "Notice",
    },
  }

  const config = typeConfig[type] || typeConfig.error

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg transition-all duration-300 max-w-md w-full animate-in fade-in slide-in-from-top-4 ${config.container}`}
    >
      {config.icon}
      <div className="flex-1 pr-6">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider">
            {title || config.defaultTitle}
          </h4>
          {isRateLimit && (
            <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${config.badge}`}>
              429
            </span>
          )}
        </div>
        <p className="text-sm font-medium mt-0.5 leading-relaxed opacity-90">
          {message}
        </p>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-700 transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export default Toast
