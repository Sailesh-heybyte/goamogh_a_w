import { customFetch } from "./api"


export const getCustomerFeedbacks = async (params = {}) => {
  const cleanParams = {}
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      cleanParams[key] = val
    }
  })
  const query = new URLSearchParams(cleanParams).toString()

  const res = await customFetch(query ? `/api/v1/sales/feedbacks?${query}` : "/api/v1/sales/feedbacks")
  if (res.ok) {
    const data = await res.json()
    return Array.isArray(data) ? data : (data.data || data.items || [])
  }

  throw new Error("Unable to load customer feedback.")
}
