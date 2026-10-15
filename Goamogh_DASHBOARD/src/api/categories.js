import { customFetch } from "./api"


export const getCategories = async (activeOnly = true) => {
  return customFetch(`/api/v1/inventory/categories${activeOnly ? "" : "?active_only=false"}`)
}

const categoriesCache = {}

export const getCategoriesCached = (activeOnly = true) => {
  const key = activeOnly ? "active" : "all"
  if (!categoriesCache[key]) {
    categoriesCache[key] = getCategories(activeOnly)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load categories")
        const json = await res.json()
        return json.data
      })
      .catch((err) => {
        delete categoriesCache[key]
        throw err
      })
  }
  return categoriesCache[key]
}

export const clearCategoriesCache = () => {
  delete categoriesCache.active
  delete categoriesCache.all
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
