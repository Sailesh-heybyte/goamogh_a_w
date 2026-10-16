import { customFetch } from "./api"

export const getItems = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return customFetch(`/api/v1/inventory/items?${query}`)
}

export const getItemDetails = async (itemId) => {
  return customFetch(`/api/v1/inventory/items/${itemId}`)
}

export const createItem = async (itemData) => {
  return customFetch("/api/v1/inventory/items", {
    method: "POST",
    body: JSON.stringify(itemData),
  })
}

export const updateItem = async (itemId, itemData) => {
  return customFetch(`/api/v1/inventory/items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(itemData),
  })
}

export const authorizeItem = async (itemId) => {
  return customFetch(`/api/v1/inventory/items/${itemId}/authorize`, {
    method: "POST",
  })
}

export const addItemVariant = async (itemId, variantData) => {
  return customFetch(`/api/v1/inventory/items/${itemId}/variants`, {
    method: "POST",
    body: JSON.stringify(variantData),
  })
}

export const updateItemVariant = async (variantId, variantData) => {
  return customFetch(`/api/v1/inventory/variants/${variantId}`, {
    method: "PUT",
    body: JSON.stringify(variantData),
  })
}

export const updateItemPrices = async (itemId, pricingData) => {
  return customFetch(`/api/v1/inventory/items/${itemId}/prices`, {
    method: "POST",
    body: JSON.stringify(pricingData),
  })
}

export const getSizeUnits = async () => customFetch("/api/v1/inventory/size-units")

export const uploadCatalogImage = async (file, kind) => {
  const formData = new FormData()
  formData.append("file", file)
  if (kind) formData.append("kind", kind)
  return customFetch("/api/v1/inventory/upload-image", { method: "POST", body: formData })
}
