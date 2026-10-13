import { customFetch } from "./api"

export const createIndent = async (indentData) => {
  return customFetch("/api/v1/sales/indents", {
    method: "POST",
    body: JSON.stringify(indentData),
  })
}

export const confirmIndent = async (indentId) => {
  return customFetch(`/api/v1/sales/indents/${indentId}/confirm`, {
    method: "POST",
  })
}



export const cancelIndent = async (indentId) => {
  return customFetch(`/api/v1/sales/indents/${indentId}/cancel`, {
    method: "POST",
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
