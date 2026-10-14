import { customFetch } from "./api"






export const getPricingPanel = async () => {
  return customFetch("/api/v1/inventory/pricing-panel")
}




