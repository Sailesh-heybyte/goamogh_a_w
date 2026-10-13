import { Navigate } from "react-router-dom"
import PropTypes from "prop-types"
import useAuth from "@/hooks/useAuth"

function PermissionRoute({ permission, permissions, children }) {
  const { hasPermission, isSuperAdmin } = useAuth()

  if (isSuperAdmin) {
    return children
  }

  if (Array.isArray(permissions) && permissions.length > 0) {
    const hasAny = permissions.some((perm) => hasPermission(perm))
    if (!hasAny) {
      return <Navigate to="/dashboard" replace />
    }
    return children
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

PermissionRoute.propTypes = {
  permission: PropTypes.string,
  permissions: PropTypes.arrayOf(PropTypes.string),
  children: PropTypes.node.isRequired,
}

export default PermissionRoute
