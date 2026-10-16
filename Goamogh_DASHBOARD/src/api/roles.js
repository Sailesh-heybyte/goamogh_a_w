import { customFetch } from "./api"

export const getRoles = async () => {
  return customFetch("/api/v1/auth/roles")
}

export const createRole = async (roleData) => {
  return customFetch("/api/v1/auth/roles", {
    method: "POST",
    body: JSON.stringify(roleData),
  })
}

export const updateRole = async (roleId, roleData) => {
  return customFetch(`/api/v1/auth/roles/${roleId}`, {
    method: "PUT",
    body: JSON.stringify(roleData),
  })
}

export const getPermissions = async () => {
  return customFetch("/api/v1/auth/permissions")
}
