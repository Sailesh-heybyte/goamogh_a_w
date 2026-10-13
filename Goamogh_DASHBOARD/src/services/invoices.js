import { customFetch } from "./api"

export const getInvoices = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return customFetch(`/api/v1/sales/invoices?${query}`)
}

export const getInvoiceDetails = async (invoiceId) => {
  return customFetch(`/api/v1/sales/invoices/${invoiceId}`)
}

export const generateTaxInvoice = async (saleId) => {
  return customFetch(`/api/v1/sales/orders/${saleId}/generate-invoice`, {
    method: "POST",
  })
}
