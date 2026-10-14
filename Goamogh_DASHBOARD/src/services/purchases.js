import { customFetch } from "./api"


export const getPurchaseOrders = async (params = {}) => {
  const cleanParams = {}
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      cleanParams[key] = val
    }
  })
  const query = new URLSearchParams(cleanParams).toString()
  return customFetch(`/api/v1/purchase/purchase-orders?${query}`)
}


export const getPurchaseOrderDetails = async (poId) => {
  return customFetch(`/api/v1/purchase/purchase-orders/${poId}`)
}


export const createPurchaseOrder = async (poData) => {
  return customFetch("/api/v1/purchase/purchase-orders", {
    method: "POST",
    body: JSON.stringify(poData),
  })
}




export const updatePurchaseOrderStatus = async (poId, action) => {
  return customFetch(`/api/v1/purchase/purchase-orders/${poId}/status`, {
    method: "POST",
    body: JSON.stringify({ action }),
  })
}


export const updatePurchaseOrder = async (poId, poData) => {
  return customFetch(`/api/v1/purchase/purchase-orders/${poId}`, {
    method: "PUT",
    body: JSON.stringify(poData),
  })
}


export const getPurchaseEntries = async (params = {}) => {
  const cleanParams = {}
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      cleanParams[key] = val
    }
  })
  const query = new URLSearchParams(cleanParams).toString()
  return customFetch(`/api/v1/purchase/purchase-entries?${query}`)
}


export const createPurchaseEntry = async (peData) => {
  return customFetch("/api/v1/purchase/purchase-entries", {
    method: "POST",
    body: JSON.stringify(peData),
  })
}

export const previewPurchaseEntry = async (peData) => {
  return customFetch("/api/v1/purchase/purchase-entries/preview", {
    method: "POST",
    body: JSON.stringify(peData),
  })
}



export const authorizePurchaseEntry = async (peId, payload = {}) => {
  return customFetch(`/api/v1/purchase/purchase-entries/${peId}/authorize`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}




export const getPurchaseEntryDetails = async (peId) => {
  return customFetch(`/api/v1/purchase/purchase-entries/${peId}`)
}

export const getPurchaseEntryFormData = async () => {
  return customFetch("/api/v1/purchase/entry-form-data")
}

export const getPurchaseOrderFormData = async () => {
  return customFetch("/api/v1/purchase/order-form-data")
}
