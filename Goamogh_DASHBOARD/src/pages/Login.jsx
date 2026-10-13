import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import useAuth from "@/hooks/useAuth"
import Spinner from "@/components/ui/Spinner"

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const { login, isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true })
    }
  }, [isAuthenticated, isAuthLoading, navigate])

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev)
  }

  const validate = () => {
    const newErrors = {}

    if (!email) {
      newErrors.email = "Email address is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!password) {
      newErrors.password = "Password is required"
    }

    return newErrors;

  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSuccessMessage("")

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsLoading(true)
    try {
      await login(email, password)
      setSuccessMessage("Authentication successful! Redirecting...")
      setTimeout(() => {
        navigate("/dashboard", { replace: true })
      }, 800)
    } catch (err) {
      setErrors({
        global: err.message || "Failed to authenticate. Please check your credentials.",
        isRateLimit: err.isRateLimit || err.status === 429,
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-6 bg-slate-50 overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse pointer-events-none" />

      {/* Main card */}
      <div className="relative w-full max-w-md bg-white/80 backdrop-blur-md border border-slate-100 shadow-2xl rounded-2xl p-8 md:p-10 animate-in fade-in zoom-in-95 duration-300">

        {/* Logo and Header */}
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Goamogh</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Sign in to access your dashboard</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">

          {/* Global Alert Notification */}
          {errors.global && (
            <div
              className={`flex items-start gap-2.5 p-4 rounded-xl text-sm font-semibold animate-in fade-in duration-200 border ${
                errors.isRateLimit
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-900"
                  : "bg-error-50 border-error-100 text-error-800"
              }`}
            >
              {errors.isRateLimit ? (
                <Clock className="w-5 h-5 text-amber-600 shrink-0 animate-pulse mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-error-800 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                {errors.isRateLimit && (
                  <span className="inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-800 rounded-full mb-1">
                    Rate Limit (HTTP 429)
                  </span>
                )}
                <p className="leading-snug">{errors.global}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 p-4 bg-success-50 border border-success-100 rounded-xl text-sm font-semibold text-success-700 animate-in fade-in duration-200">
              <CheckCircle2 className="w-5 h-5 text-success-700 shrink-0" />
              <p className="flex-1">{successMessage}</p>
            </div>
          )}

          {/* Email field */}
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
                  if (errors.email) setErrors((prev) => ({ ...prev, email: "" }))
                }}
                disabled={isLoading}
                placeholder="Enter email..."
                className="w-full pl-11 pr-4 py-3 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all bg-slate-50/50 focus:bg-white text-slate-800 font-semibold"
              />
            </div>
            {errors.email && (
              <p className="text-xs font-semibold text-error-800 mt-1.5 flex items-center gap-1.5 animate-in fade-in duration-200">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Password field */}
          <div className="flex flex-col">
            <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) setErrors((prev) => ({ ...prev, password: "" }))
                }}
                disabled={isLoading}
                placeholder="Enter password..."
                className="w-full pl-11 pr-11 py-3 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all bg-slate-50/50 focus:bg-white text-slate-800 font-semibold"
              />
              <button
                type="button"
                onClick={handleTogglePassword}
                tabIndex="-1"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs font-semibold text-error-800 mt-1.5 flex items-center gap-1.5 animate-in fade-in duration-200">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.password}
              </p>
            )}
          </div>

          {/* Auxiliary Options */}
          <div className="flex items-center justify-between mt-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded-lg border-slate-200 text-brand-600 focus:ring-brand-500 focus:ring-2 focus:ring-offset-2 transition-all cursor-pointer"
              />
              Remember me
            </label>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-colors"
            >
              Forgot password?
            </a>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center justify-center gap-2.5 disabled:opacity-55 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Spinner size="sm" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  )
}

export default Login
