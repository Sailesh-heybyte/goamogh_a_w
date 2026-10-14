import { customFetch } from "./api"


export const getWorkOrders = async (params = {}) => {
  const cleanParams = {}
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      cleanParams[key] = val
    }
  })
  const query = new URLSearchParams(cleanParams).toString()
  return customFetch(`/api/v1/work-orders?${query}`)
}


export const getWorkOrderDetails = async (woId) => {
  return customFetch(`/api/v1/work-orders/${woId}`)
}


export const createWorkOrder = async (woData) => {
  return customFetch("/api/v1/work-orders", {
    method: "POST",
    body: JSON.stringify(woData),
  })
}


export const updateWorkOrderStatus = async (woId, action, closeFields = {}) => {
  return customFetch(`/api/v1/work-orders/${woId}/status`, {
    method: "POST",
    body: JSON.stringify({ action, ...closeFields }),
  })
}

