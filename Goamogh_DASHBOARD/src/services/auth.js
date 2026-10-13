import { customFetch } from "./api"

/**
 * Fetch the authenticated administrator's profile.
 * @returns {Promise<Response>}
 */
export const getProfile = async () => {
  return customFetch("/api/v1/auth/profile")
}

/**
 * Perform administrator login.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Response>}
 */
export const loginUser = async (email, password) => {
  return customFetch("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

/**
 * Perform administrator logout.
 * @returns {Promise<Response>}
 */
export const logoutUser = async () => {
  return customFetch("/api/v1/auth/logout", {
    method: "POST",
  })
}
