import { customFetch } from "./api"


export const getProducts = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return customFetch(`/api/v1/inventory/products?${query}`)
}




export const getPricingPanel = async () => {
  return customFetch("/api/v1/inventory/pricing-panel")
}




