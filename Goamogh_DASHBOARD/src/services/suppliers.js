import { customFetch } from "./api"


export const getSuppliers = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return customFetch(`/api/v1/suppliers?${query}`)
}


export const getSupplierDetails = async (supplierId) => {
  return customFetch(`/api/v1/suppliers/${supplierId}`)
}


export const createSupplier = async (supplierData) => {
  return customFetch("/api/v1/suppliers", {
    method: "POST",
    body: JSON.stringify(supplierData),
  })
}

export const updateSupplier = async (supplierId, supplierData) => {
  return customFetch(`/api/v1/suppliers/${supplierId}`, {
    method: "PUT",
    body: JSON.stringify(supplierData),
  })
}


export const deactivateSupplier = async (supplierId) => {
  return customFetch(`/api/v1/suppliers/${supplierId}`, {
    method: "DELETE",
  })
}

export const getPincodeDetails = async (pincode) => {
  return customFetch(`/api/v1/suppliers/pincode/${pincode}`)
}
