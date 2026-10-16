import { customFetch } from "./api"

export const getContactEnquiries = async () => {
  const res = await customFetch("/api/v1/auth/contact/enquiries")
  if (!res.ok) {
    throw new Error("Unable to load customer enquiries.")
  }
  const data = await res.json()
  if (data && data.success && Array.isArray(data.data)) {
    return data.data
  }
  if (Array.isArray(data)) {
    return data
  }
  return []
}
