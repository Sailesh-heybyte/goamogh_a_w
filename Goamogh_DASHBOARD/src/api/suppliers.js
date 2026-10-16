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

export const uploadSupplierKyc = async (file, documentType) => {
  const formData = new FormData()
  formData.append("file", file)
  if (documentType) formData.append("document_type", documentType)
  return customFetch("/api/v1/suppliers/upload-kyc", { method: "POST", body: formData })
}

export const getSupplierKycViewUrl = async (supplierId) =>
  customFetch(`/api/v1/suppliers/${supplierId}/kyc-document-url`)

export const verifySupplierKyc = async (supplierId, isVerified, remarks) =>
  customFetch(`/api/v1/suppliers/${supplierId}/verify-kyc`, {
    method: "PATCH",
    body: JSON.stringify({ is_verified: isVerified, remarks: remarks || null }),
  })
