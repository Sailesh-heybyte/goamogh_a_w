import { customFetch } from "./api"


export const getCategories = async (activeOnly = true) => {
  return customFetch(`/api/v1/inventory/categories?active_only=${activeOnly}`)
}


export const getCategoryDetails = async (catId) => {
  return customFetch(`/api/v1/inventory/categories/${catId}`)
}


export const createCategory = async (categoryData) => {
  return customFetch("/api/v1/inventory/categories", {
    method: "POST",
    body: JSON.stringify(categoryData),
  })
}


export const updateCategory = async (catId, categoryData) => {
  return customFetch(`/api/v1/inventory/categories/${catId}`, {
    method: "PUT",
    body: JSON.stringify(categoryData),
  })
}
