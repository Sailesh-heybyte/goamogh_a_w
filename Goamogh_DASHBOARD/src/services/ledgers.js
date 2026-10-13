import { customFetch } from "./api"


export const getRawMaterialLedger = async (materialId, params = {}) => {
  const query = new URLSearchParams(params).toString()
  return customFetch(`/api/v1/ledgers/raw-materials/${materialId}?${query}`)
}


export const getProductLedger = async (productId, params = {}) => {
  const query = new URLSearchParams(params).toString()
  return customFetch(`/api/v1/ledgers/products/${productId}?${query}`)
}


export const adjustRawMaterialStock = async (materialId, payload) => {
  return customFetch(`/api/v1/ledgers/raw-materials/${materialId}/adjust`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}


export const adjustProductStock = async (productId, payload) => {
  return customFetch(`/api/v1/ledgers/products/${productId}/adjust`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}


export const logRawMaterialDamage = async (materialId, payload) => {
  return customFetch(`/api/v1/ledgers/raw-materials/${materialId}/damage`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}


export const logProductDamage = async (productId, payload) => {
  return customFetch(`/api/v1/ledgers/products/${productId}/damage`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export const getStockSummary = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return customFetch(`/api/v1/inventory/stock-summary?${query}`)
}

export const getInventoryDashboard = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return customFetch(`/api/v1/inventory/dashboard?${query}`)
}

export const getItemBatchComposition = async (itemId) => {
  return customFetch(`/api/v1/inventory/items/${itemId}/batch-composition`)
}
