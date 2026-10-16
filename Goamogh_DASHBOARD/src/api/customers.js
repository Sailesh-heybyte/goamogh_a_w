import { customFetch } from "./api"

export const getCustomers = async (params = {}) => {
  const cleanParams = {}
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      cleanParams[key] = val
    }
  })
  const query = new URLSearchParams(cleanParams).toString()
  return customFetch(query ? `/api/v1/sales/users?${query}` : "/api/v1/sales/users")
}

export const createCustomer = async (customerData) => {
  return customFetch("/api/v1/sales/users", {
    method: "POST",
    body: JSON.stringify(customerData),
  })
}

export const updateCustomer = async (userId, customerData) => {
  return customFetch(`/api/v1/sales/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(customerData),
  })
}

export const toggleCustomerStatus = async (userId, isActive) => {
  return customFetch(`/api/v1/sales/users/${userId}/status`, {
    method: "POST",
    body: JSON.stringify({ is_active: isActive }),
  })
}

export const getCustomerAddresses = async (userId) => {
  return customFetch(`/api/v1/sales/users/${userId}/addresses`)
}

export const addCustomerAddress = async (userId, addressData) => {
  return customFetch(`/api/v1/sales/users/${userId}/addresses`, {
    method: "POST",
    body: JSON.stringify(addressData),
  })
}

export const updateCustomerAddress = async (addressId, addressData) => {
  return customFetch(`/api/v1/auth/customers/addresses/${addressId}`, {
    method: "PUT",
    body: JSON.stringify(addressData),
  })
}

export const getCustomerOrders = async (userId, params = {}) => {
  const query = new URLSearchParams(params).toString()
  return customFetch(query ? `/api/v1/sales/users/${userId}/orders?${query}` : `/api/v1/sales/users/${userId}/orders`)
}

export const searchCustomerByPhone = async (phone) => {
  return customFetch(`/api/v1/sales/customers/search?phone=${encodeURIComponent(phone)}`)
}

export const deleteCustomerAddress = async (addressId) => {
  return customFetch(`/api/v1/auth/customers/addresses/${addressId}`, {
    method: "DELETE",
  })
}

export const getContactEnquiries = async (params = {}) => {
  const cleanParams = {}
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      cleanParams[key] = val
    }
  })
  const query = new URLSearchParams(cleanParams).toString()
  return customFetch(query ? `/api/v1/auth/contact/enquiries?${query}` : "/api/v1/auth/contact/enquiries")
}
