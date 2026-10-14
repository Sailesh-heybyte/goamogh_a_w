import { customFetch } from "./api"

/**
 * Fetch the list of access control roles.
 * @returns {Promise<Response>}
 */
export const getRoles = async () => {
  return customFetch("/api/v1/auth/roles")
}

/**
 * Create a new custom role.
 * @param {Object} roleData - { name, description, permissions }
 * @returns {Promise<Response>}
 */
export const createRole = async (roleData) => {
  return customFetch("/api/v1/auth/roles", {
    method: "POST",
    body: JSON.stringify(roleData),
  })
}

/**
 * Update an existing custom role.
 * @param {string} roleId
 * @param {Object} roleData - { name, description, permissions, is_active }
 * @returns {Promise<Response>}
 */
export const updateRole = async (roleId, roleData) => {
  return customFetch(`/api/v1/auth/roles/${roleId}`, {
    method: "PUT",
    body: JSON.stringify(roleData),
  })
}

/**
 * Fetch list of all system permissions.
 * @returns {Promise<Response>}
 */
export const getPermissions = async () => {
  return customFetch("/api/v1/auth/permissions")
}

