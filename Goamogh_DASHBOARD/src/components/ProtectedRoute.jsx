import { Navigate } from "react-router-dom"
import PropTypes from "prop-types"
import useAuth from "@/hooks/useAuth"
import Spinner from "@/components/ui/Spinner"

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, sessionError, retrySession } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Spinner size="lg" />
      </div>
    )
  }

  if (sessionError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="bg-white border border-error-100 rounded-2xl p-8 text-center shadow-sm max-w-sm w-full">
          <p className="text-sm text-slate-700 mb-4">{sessionError}</p>
          <button
            type="button"
            onClick={retrySession}
            className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl px-4 py-2 text-xs font-bold"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
}

export default ProtectedRoute
