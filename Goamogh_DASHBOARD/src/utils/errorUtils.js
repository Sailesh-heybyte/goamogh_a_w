/**
 * Centralized Utility for Backend Error Handling & Unique Constraint Parsing
 * Converts FastAPI / Pydantic / DB unique constraint errors into friendly, field-specific error messages.
 */

export function parseBackendUniqueError(detail, defaultMsg = "An error occurred while processing your request.") {
  const result = {
    global: "",
    fieldErrors: {},
  }

  if (!detail) {
    result.global = defaultMsg
    return result
  }

  // Handle array of validation error objects (e.g. FastAPI / Pydantic)
  if (Array.isArray(detail)) {
    const globalMsgs = []
    detail.forEach((item) => {
      const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : null
      const msg = item.msg || defaultMsg
      if (field && typeof field === "string" && field !== "body") {
        result.fieldErrors[field] = formatFriendlyFieldError(field, msg)
      } else {
        globalMsgs.push(msg)
      }
    })
    if (globalMsgs.length > 0) {
      result.global = globalMsgs.join(", ")
    }
    return result
  }

  // Handle single string error response
  if (typeof detail === "string") {
    const lower = detail.toLowerCase()

    // 1. SPECIFIC FIELD MATCHES FIRST (Strict Priority Order)

    // Email
    if (lower.includes("email")) {
      result.fieldErrors.email = "This email address is already registered in the system."
      return result
    }

    // PAN
    if (lower.includes("pan")) {
      result.fieldErrors.pan = "This PAN number is already associated with another record."
      return result
    }

    // GSTIN / GST
    if (lower.includes("gstin") || lower.includes("gst")) {
      result.fieldErrors.gstin = "This GSTIN number is already registered in the system."
      return result
    }

    // Phone / Mobile
    if (lower.includes("phone") || lower.includes("mobile")) {
      result.fieldErrors.phone = "This phone number is already registered to another record."
      return result
    }

    // Vendor Code / Supplier Code
    if (lower.includes("vendor_code") || lower.includes("vendor code") || lower.includes("supplier code")) {
      result.fieldErrors.vendor_code = "Supplier Code already exists. Please enter a unique code."
      return result
    }

    // Employee ID
    if (lower.includes("employee_id") || lower.includes("employee id")) {
      result.fieldErrors.employee_id = "This Employee ID is already assigned to another staff member."
      return result
    }

    // Product Number / SKU
    if (lower.includes("product_number") || lower.includes("sku")) {
      result.fieldErrors.product_number = "Product SKU / Item code is already assigned to another item."
      return result
    }

    // HSN Code
    if (lower.includes("hsn")) {
      result.fieldErrors.hsn_code = "This HSN code is invalid or already registered."
      return result
    }

    // 2. NAME MATCHES (When error explicitly references name)
    if (
      lower.includes("supplier name") ||
      lower.includes("role name") ||
      lower.includes("product name") ||
      lower.includes("item name") ||
      (lower.includes("name") && lower.includes("already exists")) ||
      (lower.includes("name") && lower.includes("unique"))
    ) {
      result.fieldErrors.name = "A record with this name already exists. Please enter a unique name."
      return result
    }

    // 3. GENERIC / AMBIGUOUS SUPPLIER OR ENTITY CONSTRAINTS
    if (lower.includes("already exists") || lower.includes("duplicate key") || lower.includes("unique constraint")) {
      result.global = detail
      return result
    }

    // Default string global message
    result.global = detail
    return result
  }

  result.global = defaultMsg
  return result
}

function formatFriendlyFieldError(field, rawMsg) {
  const lower = rawMsg.toLowerCase()
  if (lower.includes("already exists") || lower.includes("unique")) {
    const formattedField = field.replace(/_/g, " ")
    return `This ${formattedField} is already registered in the system.`
  }
  return rawMsg
}

