import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Mail, AlertCircle, CheckCircle2 } from "lucide-react"
import Spinner from "@/components/ui/Spinner"
import { forgotPassword } from "@/api/auth"

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [fieldError, setFieldError] = useState("")
  const [globalError, setGlobalError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGlobalError("")
    setFieldError("")

    const trimmed = email.trim()
    if (!trimmed) {
      setFieldError("Email address is required")
      return
    } else if (!/\S+@\S+\.\S+/.test(trimmed)) {
      setFieldError("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    try {
      const res = await forgotPassword(trimmed)
      const json = await res.json().catch(() => null)

      if (res.ok) {
        setIsSubmitted(true)
        setSuccessMessage(json?.message || "If an account exists for this email, a reset link has been sent.")
      } else {
        setGlobalError(json?.message || "Couldn't send reset link. Try again.")
      }
    } catch {
      setGlobalError("Couldn't send reset link. Try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-6 bg-slate-50 overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse pointer-events-none" />

      <div className="relative w-full max-w-md bg-white/80 backdrop-blur-md border border-slate-100 shadow-2xl rounded-2xl p-8 md:p-10 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center text-center">
          <img src="/brand/goamogh-golden.png" alt="Goamogh" className="h-9 w-auto object-contain mx-auto" />
          <p className="text-sm font-medium text-slate-500 mt-1">Reset your administrator password</p>
        </div>

        {isSubmitted ? (
          <div className="mt-8 space-y-6">
            <div className="flex items-start gap-2.5 p-4 bg-success-50 border border-success-100 rounded-xl text-sm font-semibold text-success-700 animate-in fade-in duration-200">
              <CheckCircle2 className="w-5 h-5 text-success-700 shrink-0 mt-0.5" />
              <p className="flex-1 leading-snug">{successMessage}</p>
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-colors"
              >
                Back to login
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {globalError && (
              <div className="flex items-start gap-2.5 p-4 rounded-xl text-sm font-semibold animate-in fade-in duration-200 border bg-error-50 border-error-100 text-error-800">
                <AlertCircle className="w-5 h-5 text-error-800 shrink-0 mt-0.5" />
                <p className="flex-1 leading-snug">{globalError}</p>
              </div>
            )}

            <div className="flex flex-col">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (fieldError) setFieldError("")
                    if (globalError) setGlobalError("")
                  }}
                  disabled={isLoading}
                  placeholder="Enter email..."
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all bg-slate-50/50 focus:bg-white text-slate-800 font-semibold"
                />
              </div>
              {fieldError && (
                <p className="text-xs font-semibold text-error-800 mt-1.5 flex items-center gap-1.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center justify-center gap-2.5 disabled:opacity-55 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" />
                  <span>Sending...</span>
                </>
              ) : (
                <span>Send reset link</span>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-colors"
              >
                Back to login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
