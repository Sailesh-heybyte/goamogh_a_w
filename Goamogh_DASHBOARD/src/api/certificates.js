import { customFetch } from "./api"

export const getCertificates = () => customFetch("/api/v1/certificates")

export const createCertificate = (formData) =>
  customFetch("/api/v1/certificates", { method: "POST", body: formData })

export const updateCertificate = (id, formData) =>
  customFetch(`/api/v1/certificates/${id}`, { method: "PUT", body: formData })

export const setCertificateStatus = (id, isPublished) =>
  customFetch(`/api/v1/certificates/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ is_published: isPublished }),
  })

export const deleteCertificate = (id) =>
  customFetch(`/api/v1/certificates/${id}`, { method: "DELETE" })
