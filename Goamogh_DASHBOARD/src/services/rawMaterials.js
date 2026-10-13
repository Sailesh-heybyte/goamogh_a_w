import { customFetch } from "./api"


export const getRawMaterials = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return customFetch(`/api/v1/inventory/raw-materials?${query}`)
}


