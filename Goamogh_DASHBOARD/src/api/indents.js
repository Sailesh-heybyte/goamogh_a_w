import { customFetch } from "./api"

export const createIndent = async (indentData) => {
  return customFetch("/api/v1/sales/indents", {
    method: "POST",
    body: JSON.stringify(indentData),
  })
}

export const updateIndentStatus = async (indentId, action) => {
  return customFetch(`/api/v1/sales/indents/${indentId}/status`, {
    method: "POST",
    body: JSON.stringify({ action }),
  })
}


export const getIndents = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return customFetch(`/api/v1/sales/indents?${query}`)
}

export const getIndentDetails = async (indentId) => {
  return customFetch(`/api/v1/sales/indents/${indentId}`)
}

export const updateIndent = async (indentId, indentData) => {
  return customFetch(`/api/v1/sales/indents/${indentId}`, {
    method: "PUT",
    body: JSON.stringify(indentData),
  })
}

export const previewIndent = async (payload) =>
  customFetch("/api/v1/sales/indents/preview", {
    method: "POST",
    body: JSON.stringify(payload),
  })

