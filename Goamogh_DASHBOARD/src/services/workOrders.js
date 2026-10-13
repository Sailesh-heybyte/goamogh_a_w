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


export const startWorkOrder = async (woId) => {
  return customFetch(`/api/v1/work-orders/${woId}/start`, {
    method: "POST",
  })
}


export const closeWorkOrder = async (woId, closeData) => {
  return customFetch(`/api/v1/work-orders/${woId}/close`, {
    method: "POST",
    body: JSON.stringify(closeData),
  })
}

/**
 * Cancel a work order.
 * @param {string} woId
 * @returns {Promise<Response>}
 */
export const cancelWorkOrder = async (woId) => {
  return customFetch(`/api/v1/work-orders/${woId}/cancel`, {
    method: "POST",
  })
}


export const authorizeWorkOrder = async (woId) => {
  return customFetch(`/api/v1/work-orders/${woId}/authorize`, {
    method: "POST",
    body: JSON.stringify({}),
  })
}
