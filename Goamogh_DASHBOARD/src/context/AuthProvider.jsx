import { useState, useEffect, useCallback, useMemo } from "react"
import PropTypes from "prop-types"
import { AuthContext } from "./AuthContext"
import { getProfile, loginUser, logoutUser } from "@/api/auth"
import { getRoles } from "@/api/roles"

const isSuperAdminRole = (userData) => {
  if (!userData) return false
  const roleStr = (userData.role?.name || userData.role_name || userData.role || "")
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "_")
  return roleStr.includes("super")
}

const fetchUserPermissions = async (userData) => {
  if (!userData) return []
  if (userData.permissions && userData.permissions.length > 0) {
    return userData.permissions
  }
  if (isSuperAdminRole(userData)) {
    return ["all"]
  }
  try {
    const rolesRes = await getRoles()
    if (rolesRes.ok) {
      const rolesJson = await rolesRes.json()
      const foundRole = (rolesJson.data || []).find(
        (role) => role.name === userData.role_name
      )
      if (foundRole) {
        return foundRole.permissions || []
      }
    }
  } catch (err) {
    console.warn("Failed to fetch user permissions from roles:", err)
  }
  return []
}

export const hasPermission = (user, permissionName) => {
  if (!user) return false
  // 1. Super Admin bypass
  const roleName = user.role?.name || user.role || user.role_name
  if (typeof roleName === 'string' && roleName.toLowerCase().replace(/\s+/g, '_').includes('super')) {
    return true
  }
  // 2. Extract permissions from user or user.role
  const perms = user.permissions || user.role?.permissions
  if (!perms) return false
  // 3. Handle Object permissions (e.g. { all: true, sales_manage: true })
  if (typeof perms === 'object' && !Array.isArray(perms)) {
    return perms.all === true || perms[permissionName] === true
  }
  // 4. Handle Array permissions (e.g. ["all", "sales_manage"])
  if (Array.isArray(perms)) {
    return perms.includes('all') || perms.includes(permissionName)
  }
  return false
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem("access_token")
      if (!token) {
        setUser(null)
        setIsLoading(false)
        return
      }

      try {
        const res = await getProfile()
        if (res.ok) {
          const json = await res.json()
          const userData = json.data
          if (userData) {
            const permissions = await fetchUserPermissions(userData)
            userData.permissions = permissions
          }
          setUser(userData)
        } else {
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")
          setUser(null)
        }
      } catch {
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    verifySession()
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await loginUser(email, password)

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      const msg = errJson.detail || errJson.message || (res.status === 429 ? "Too many requests. Please wait 1 minute before trying again." : "Invalid email or password")
      const err = new Error(msg)
      err.status = res.status
      err.isRateLimit = res.status === 429
      throw err
    }

    const json = await res.json()
    if (json.success && json.data) {
      localStorage.setItem("access_token", json.data.access_token)
      localStorage.setItem("refresh_token", json.data.refresh_token)
      const userData = json.data.admin || json.data
      const permissions = await fetchUserPermissions(userData)
      userData.permissions = permissions
      setUser(userData)
    }
    return json
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutUser()
    } catch (err) {
      console.error("Logout request failed:", err)
    } finally {
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      setUser(null)
      window.location.href = "/login"
    }
  }, [])

  const authContextValue = useMemo(() => ({
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    isSuperAdmin: isSuperAdminRole(user),
    hasPermission: (perm) => hasPermission(user, perm),
  }), [user, isLoading, login, logout])

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  )
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

