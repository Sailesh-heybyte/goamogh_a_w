import { customFetch } from "./api"

export const getStaff = async () => {
  return customFetch("/api/v1/auth/staff")
}

export const onboardStaff = async (staffData) => {
  return customFetch("/api/v1/auth/staff", {
    method: "POST",
    body: JSON.stringify(staffData),
  })
}

export const updateStaff = async (staffId, staffData) => {
  return customFetch(`/api/v1/auth/staff/${staffId}`, {
    method: "PUT",
    body: JSON.stringify(staffData),
  })
}

export const activateStaff = async (staffId) => {
  return customFetch(`/api/v1/auth/staff/${staffId}/activate`, {
    method: "PATCH",
  })
}

export const deactivateStaff = async (staffId) => {
  return customFetch(`/api/v1/auth/staff/${staffId}/deactivate`, {
    method: "PATCH",
  })
}
