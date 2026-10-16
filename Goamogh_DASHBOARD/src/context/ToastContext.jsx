import { createContext, useContext, useState, useCallback, useEffect } from "react"
import Toast from "@/components/ui/Toast"

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    ({ type = "error", title, message, duration = 5000 }) => {
      const id = Date.now() + Math.random().toString(36).substring(2, 9)
      const effectiveDuration = type === "rate-limit" || type === "429" ? Math.max(duration, 7000) : duration

      setToasts((prev) => [...prev, { id, type, title, message }])

      if (effectiveDuration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, effectiveDuration)
      }
      return id
    },
    [removeToast]
  )

  const showRateLimitToast = useCallback(
    (
      message = "Too many requests. Please wait 1 minute before requesting another code.",
      title = "Rate Limit Exceeded (HTTP 429)"
    ) => {
      return addToast({
        type: "rate-limit",
        title,
        message,
      })
    },
    [addToast]
  )

  const showErrorToast = useCallback(
    (message, title = "Error") => {
      return addToast({ type: "error", title, message })
    },
    [addToast]
  )

  const showSuccessToast = useCallback(
    (message, title = "Success") => {
      return addToast({ type: "success", title, message })
    },
    [addToast]
  )

  useEffect(() => {
    const handleGlobalRateLimit = (event) => {
      const msg = event.detail?.message || "Too many OTP requests. Please wait 1 minute before requesting another code."
      showRateLimitToast(msg)
    }

    window.addEventListener("api:rate-limit", handleGlobalRateLimit)
    return () => window.removeEventListener("api:rate-limit", handleGlobalRateLimit)
  }, [showRateLimitToast])

  return (
    <ToastContext.Provider value={{ addToast, removeToast, showRateLimitToast, showErrorToast, showSuccessToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full px-4 pointer-events-none">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <Toast type={t.type} title={t.title} message={t.message} onClose={() => removeToast(t.id)} />
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export default ToastContext
