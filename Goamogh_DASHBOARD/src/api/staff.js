import { customFetch } from "./api"

/**
 * Fetch list of onboarded staff members.
 * @param {number} skip
 * @param {number} limit
 * @returns {Promise<Response>}
 */
export const getStaff = async () => {
  return customFetch("/api/v1/auth/staff")
}

/**
 * Register/Onboard a new staff member.
 * @param {Object} staffData - { email, password, first_name, last_name, phone, role_id }
 * @returns {Promise<Response>}
 */
export const onboardStaff = async (staffData) => {
  return customFetch("/api/v1/auth/staff", {
    method: "POST",
    body: JSON.stringify(staffData),
  })
}

/**
 * Update staff details.
 * @param {string} staffId
 * @param {Object} staffData - { first_name, last_name, phone, role_id, password, is_active }
 * @returns {Promise<Response>}
 */
export const updateStaff = async (staffId, staffData) => {
  return customFetch(`/api/v1/auth/staff/${staffId}`, {
    method: "PUT",
    body: JSON.stringify(staffData),
  })
}

/**
 * Activate staff member account.
 * @param {string} staffId
 * @returns {Promise<Response>}
 */
export const activateStaff = async (staffId) => {
  return customFetch(`/api/v1/auth/staff/${staffId}/activate`, {
    method: "PATCH",
  })
}

/**
 * Deactivate staff member account.
 * @param {string} staffId
 * @returns {Promise<Response>}
 */
export const deactivateStaff = async (staffId) => {
  return customFetch(`/api/v1/auth/staff/${staffId}/deactivate`, {
    method: "PATCH",
  })
}

