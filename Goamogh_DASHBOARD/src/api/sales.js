import { customFetch } from "./api"

export const getSales = async (params = {}) => {
  const cleanParams = {}
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      cleanParams[key] = val
    }
  })
  const query = new URLSearchParams(cleanParams).toString()
  return customFetch(`/api/v1/sales/direct?${query}`)
}

export const getSaleDetails = async (saleId) => {
  return customFetch(`/api/v1/sales/direct/${saleId}`)
}

export const createDirectSale = async (saleData) => {
  return customFetch("/api/v1/sales/direct", {
    method: "POST",
    body: JSON.stringify(saleData),
  })
}

export const updateSalesOrderStatus = async (saleId, action) => {
  return customFetch(`/api/v1/sales/orders/${saleId}/status`, {
    method: "POST",
    body: JSON.stringify({ action }),
  })
}

export const previewDirectSale = async (payload) =>
  customFetch("/api/v1/sales/direct/preview", {
    method: "POST",
    body: JSON.stringify(payload),
  })
