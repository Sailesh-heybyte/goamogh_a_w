import { customFetch } from "./api"


export const getSettings = async () => {
  return customFetch("/api/v1/purchase/settings")
}


export const updateSetting = async (key, value) => {
  return customFetch(`/api/v1/purchase/settings/${key}`, {
    method: "PUT",
    body: JSON.stringify({ value }),
  })
}

