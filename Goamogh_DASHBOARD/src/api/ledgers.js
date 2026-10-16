import { customFetch } from "./api"

export const getItemLedger = async (itemType, itemId, params = {}) => {
  const ledgerType = itemType === "raw_material" ? "raw-materials" : "products"
  const query = new URLSearchParams(params).toString()
  return customFetch(
    query ? `/api/v1/ledgers/${ledgerType}/${itemId}?${query}` : `/api/v1/ledgers/${ledgerType}/${itemId}`
  )
}

export const getStockSummary = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return customFetch(`/api/v1/inventory/stock-summary?${query}`)
}

export const getInventoryDashboard = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return customFetch(`/api/v1/inventory/dashboard?${query}`)
}
