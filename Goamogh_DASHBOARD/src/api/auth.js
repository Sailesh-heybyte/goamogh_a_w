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

export const forgotPassword = async (email) => customFetch("/api/v1/auth/forgot-password", { method: "POST", body: JSON.stringify({ email, redirect_url: `${window.location.origin}/reset-password` }) })
export const verifyResetToken = async (token) => customFetch(`/api/v1/auth/verify-reset-token?token=${encodeURIComponent(token)}`)
export const resetPassword = async (token, newPassword, confirmPassword) => customFetch("/api/v1/auth/reset-password", { method: "POST", body: JSON.stringify({ token, new_password: newPassword, confirm_new_password: confirmPassword }) })

