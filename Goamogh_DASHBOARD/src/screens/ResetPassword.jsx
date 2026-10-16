import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react"
import Spinner from "@/components/ui/Spinner"
import { verifyResetToken, resetPassword } from "@/api/auth"

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  const [status, setStatus] = useState("verifying")
  const [globalError, setGlobalError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus("invalid")
      return
    }

    let cancelled = false

    const verify = async () => {
      try {
        const res = await verifyResetToken(token)
        if (cancelled) return
        if (res.ok) {
          setStatus("valid")
        } else {
          setStatus("invalid")
        }
      } catch {
        if (!cancelled) {
          setStatus("invalid")
        }
      }
    }

    verify()

    return () => {
      cancelled = true
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGlobalError("")
    setErrors({})

    const newErrors = {}
    if (!newPassword) {
      newErrors.newPassword = "New password is required"
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters"
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required"
    } else if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const res = await resetPassword(token, newPassword, confirmPassword)
      const json = await res.json().catch(() => null)

      if (res.ok) {
        setStatus("success")
        setSuccessMessage(json?.message || "Password updated. You can now sign in.")
      } else {
        setGlobalError(json?.message || "Couldn't reset password. Try again.")
      }
    } catch {
      setGlobalError("Couldn't reset password. Try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-6 bg-slate-50 overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse pointer-events-none" />

      <div className="relative w-full max-w-md bg-white/80 backdrop-blur-md border border-slate-100 shadow-2xl rounded-2xl p-8 md:p-10 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center text-center">
          <img src="/brand/goamogh-golden.png" alt="Goamogh" className="h-9 w-auto object-contain mx-auto" />
          <p className="text-sm font-medium text-slate-500 mt-1">Set a new password</p>
        </div>

        {status === "verifying" && (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <Spinner size="lg" />
            <p className="text-sm font-semibold text-slate-600">Checking your link…</p>
          </div>
        )}

        {status === "invalid" && (
          <div className="mt-8 space-y-6 text-center">
            <div className="flex items-start gap-2.5 p-4 rounded-xl text-sm font-semibold border bg-error-50 border-error-100 text-error-800 text-left">
              <AlertCircle className="w-5 h-5 text-error-800 shrink-0 mt-0.5" />
              <p className="flex-1 leading-snug">This reset link is invalid or has expired.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="w-full px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95"
            >
              Request a new link
            </button>
          </div>
        )}

        {status === "success" && (
          <div className="mt-8 space-y-6 text-center">
            <div className="flex items-start gap-2.5 p-4 bg-success-50 border border-success-100 rounded-xl text-sm font-semibold text-success-700 text-left">
              <CheckCircle2 className="w-5 h-5 text-success-700 shrink-0 mt-0.5" />
              <p className="flex-1 leading-snug">{successMessage || "Password updated. You can now sign in."}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              className="w-full px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95"
            >
              Go to login
            </button>
          </div>
        )}

        {status === "valid" && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {globalError && (
              <div className="flex items-start gap-2.5 p-4 rounded-xl text-sm font-semibold animate-in fade-in duration-200 border bg-error-50 border-error-100 text-error-800">
                <AlertCircle className="w-5 h-5 text-error-800 shrink-0 mt-0.5" />
                <p className="flex-1 leading-snug">{globalError}</p>
              </div>
            )}

            <div className="flex flex-col">
              <label htmlFor="newPassword" className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: "" }))
                    if (globalError) setGlobalError("")
                  }}
                  disabled={isSubmitting}
                  placeholder="Enter new password..."
                  className="w-full pl-11 pr-11 py-3 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all bg-slate-50/50 focus:bg-white text-slate-800 font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  tabIndex="-1"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-lg hover:bg-slate-100 transition-colors"
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">At least 6 characters</p>
              {errors.newPassword && (
                <p className="text-xs font-semibold text-error-800 mt-1.5 flex items-center gap-1.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.newPassword}
                </p>
              )}
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="confirmPassword"
                className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }))
                    if (globalError) setGlobalError("")
                  }}
                  disabled={isSubmitting}
                  placeholder="Confirm new password..."
                  className="w-full pl-11 pr-11 py-3 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all bg-slate-50/50 focus:bg-white text-slate-800 font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  tabIndex="-1"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-lg hover:bg-slate-100 transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs font-semibold text-error-800 mt-1.5 flex items-center gap-1.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center justify-center gap-2.5 disabled:opacity-55 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" />
                  <span>Updating password...</span>
                </>
              ) : (
                <span>Reset Password</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
