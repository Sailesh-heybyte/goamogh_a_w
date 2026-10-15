import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Plus, Edit2, Trash2, ShieldAlert, X, Truck, Search, Phone, Mail, MapPin, FileSpreadsheet, AlertTriangle, Building, ShieldCheck, Landmark, BookOpen, FileText } from "lucide-react"
import { getSuppliers, createSupplier, updateSupplier, deactivateSupplier, getSupplierDetails, getPincodeDetails, uploadSupplierKyc, getSupplierKycViewUrl, verifySupplierKyc } from "@/api/suppliers"
import Spinner from "@/components/ui/Spinner"
import { parseBackendUniqueError } from "@/utils/errorUtils"
import Modal from "@/components/ui/Modal"
import useConfirm from "@/hooks/useConfirm"
import { useToast } from "@/context/ToastContext"

const KYC_DOCUMENT_TYPES = {
  pan: "PAN Card",
  aadhaar: "Aadhaar",
  gst_certificate: "GST Certificate",
  trade_license: "Trade License",
  fssai: "FSSAI License",
  cancelled_cheque: "Cancelled Cheque",
  other: "Other",
}

const GSTIN_STATE_MAP = {
  "01": "Jammu & Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
  "97": "Other Territory",
  "98": "Centre Jurisdiction"
}

const VALID_GSTIN_STATE_CODES = new Set(Object.keys(GSTIN_STATE_MAP))

const getGSTINStateName = (gstinVal) => {
  if (!gstinVal || gstinVal.trim().length < 2) return "Awaiting State Code..."
  const stateCode = gstinVal.trim().substring(0, 2)
  if (!/^\d{2}$/.test(stateCode)) return "Invalid State Code (First 2 characters must be numbers)"
  return GSTIN_STATE_MAP[stateCode] || "Unknown State Code"
}

function parseErrorDetail(detail, defaultMsg) {
  if (!detail) return defaultMsg
  if (Array.isArray(detail)) {
    const messages = detail.map((d) => d.msg).filter(Boolean)
    return messages.length > 0 ? messages.join(", ") : defaultMsg
  }
  return typeof detail === "string" ? detail : defaultMsg
}

function SupplierDirectory() {
  const confirm = useConfirm()
  const [suppliersList, setSuppliersList] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showActiveOnly, setShowActiveOnly] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const { showSuccessToast } = useToast()

  const [isKycUploadingCreate, setIsKycUploadingCreate] = useState(false)
  const [isKycUploadingEdit, setIsKycUploadingEdit] = useState(false)
  const [kycErrorCreate, setKycErrorCreate] = useState("")
  const [kycErrorEdit, setKycErrorEdit] = useState("")
  const [kycRemarks, setKycRemarks] = useState("")
  const [kycRemarksError, setKycRemarksError] = useState("")
  const [isKycVerifying, setIsKycVerifying] = useState(false)

  const kycUploadReqRefCreate = useRef(0)
  const kycUploadReqRefEdit = useRef(0)

  // Address copying state
  const [createSameAsBilling, setCreateSameAsBilling] = useState(false)
  const [editSameAsBilling, setEditSameAsBilling] = useState(false)

  // Onboard form state
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    contact_name: "",
    phone: "",
    alternative_phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    pan: "",
    aadhaar_last_four: "",
    business_type: "",
    supplier_type: "business",
    notes: "",
    bank_account_number: "",
    bank_name: "",
    bank_ifsc_code: "",
    bank_branch_name: "",
    bank_account_holder_name: "",
    tan_no: "",
    iec: "",
    msme: "",
    fssai: "",
    cin: "",
    billing_address: "",
    shipping_address: "",
    kyc_document_type: "",
    kyc_document_number: "",
    kyc_document_url: "",
    kyc_document_name: "",
    contact_persons: [
      { name: "", email: "", mobile: "", desk_number: "", location: "" },
      { name: "", email: "", mobile: "", desk_number: "", location: "" }
    ],
  })
  const [createErrors, setCreateErrors] = useState({})

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    contact_name: "",
    phone: "",
    alternative_phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    pan: "",
    aadhaar_last_four: "",
    business_type: "",
    supplier_type: "business",
    notes: "",
    bank_account_number: "",
    bank_name: "",
    bank_ifsc_code: "",
    bank_branch_name: "",
    bank_account_holder_name: "",
    is_active: true,
    tan_no: "",
    iec: "",
    msme: "",
    fssai: "",
    cin: "",
    billing_address: "",
    shipping_address: "",
    kyc_document_type: "",
    kyc_document_number: "",
    kyc_document_url: "",
    kyc_document_name: "",
    contact_persons: [
      { name: "", email: "", mobile: "", desk_number: "", location: "" },
      { name: "", email: "", mobile: "", desk_number: "", location: "" }
    ],
  })
  const [editErrors, setEditErrors] = useState({})

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true)
    setError("")
    try {
      const res = await getSuppliers()
      if (!res.ok) {
        throw new Error("Failed to load supplier directory")
      }
      const json = await res.json()
      setSuppliersList(json.data || [])
    } catch (err) {
      setError(err.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuppliers()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchSuppliers])

  const [isPincodeLoadingCreate, setIsPincodeLoadingCreate] = useState(false)
  const [pincodeErrorCreate, setPincodeErrorCreate] = useState("")
  const [isPincodeLoadingEdit, setIsPincodeLoadingEdit] = useState(false)
  const [pincodeErrorEdit, setPincodeErrorEdit] = useState("")

  // Pincode auto-lookup hook for Create Form
  useEffect(() => {
    const pincode = createForm.pincode ? createForm.pincode.trim() : ""
    if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      setPincodeErrorCreate("")
      return
    }

    const controller = new AbortController()
    setIsPincodeLoadingCreate(true)
    setPincodeErrorCreate("")

    const timer = setTimeout(async () => {
      try {
        const resObj = await getPincodeDetails(pincode)
        if (!resObj.ok) {
          if (resObj.status === 404) {
            setPincodeErrorCreate("Pincode not found")
          } else {
            setPincodeErrorCreate("Error looking up pincode")
          }
        } else {
          const json = await resObj.json()
          const dataObj = json.data
          if (dataObj && (dataObj.city || dataObj.state)) {
            setCreateForm((prev) => ({
              ...prev,
              city: dataObj.city || prev.city,
              state: dataObj.state || prev.state,
            }))
          } else {
            setPincodeErrorCreate("Pincode not found")
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setPincodeErrorCreate("Error looking up pincode")
        }
      } finally {
        setIsPincodeLoadingCreate(false)
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [createForm.pincode])

  // Pincode auto-lookup hook for Edit Form
  useEffect(() => {
    const pincode = editForm.pincode ? editForm.pincode.trim() : ""
    if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      setPincodeErrorEdit("")
      return
    }

    const controller = new AbortController()
    setIsPincodeLoadingEdit(true)
    setPincodeErrorEdit("")

    const timer = setTimeout(async () => {
      try {
        const resObj = await getPincodeDetails(pincode)
        if (!resObj.ok) {
          if (resObj.status === 404) {
            setPincodeErrorEdit("Pincode not found")
          } else {
            setPincodeErrorEdit("Error looking up pincode")
          }
        } else {
          const json = await resObj.json()
          const dataObj = json.data
          if (dataObj && (dataObj.city || dataObj.state)) {
            setEditForm((prev) => ({
              ...prev,
              city: dataObj.city || prev.city,
              state: dataObj.state || prev.state,
            }))
          } else {
            setPincodeErrorEdit("Pincode not found")
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setPincodeErrorEdit("Error looking up pincode")
        }
      } finally {
        setIsPincodeLoadingEdit(false)
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [editForm.pincode])

  // GSTIN & Phone validations
  const validateGSTIN = (val) => {
    if (!val) return true
    const cleanGst = val.toUpperCase().trim()
    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    if (!regex.test(cleanGst)) return false
    const stateCode = cleanGst.substring(0, 2)
    return VALID_GSTIN_STATE_CODES.has(stateCode)
  }

  const validatePhone = (val) => {
    if (!val) return true
    const regex = /^\+?[1-9]\d{1,10}$/
    if (!regex.test(val)) return false
    const digitCount = val.replace(/\D/g, "").length
    return digitCount >= 10
  }

  const validateTAN = (val) => {
    if (!val) return true
    return /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/i.test(val.trim())
  }

  const validateIEC = (val) => {
    if (!val) return true
    return /^\d{10}$/.test(val.trim())
  }

  const validateFSSAI = (val) => {
    if (!val) return true
    return /^\d{14}$/.test(val.trim())
  }

  const validateCIN = (val) => {
    if (!val) return true
    return /^[U|L][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/i.test(val.trim())
  }

  const handleCreateSameAsBillingToggle = (checked) => {
    setCreateSameAsBilling(checked)
    if (checked) {
      setCreateForm((prev) => ({
        ...prev,
        shipping_address: prev.billing_address,
      }))
    }
  }

  // Handle nested contact_persons changes
  const handleContactPersonChange = (index, field, value, isEdit) => {
    if (isEdit) {
      setEditForm((prev) => {
        const updatedPersons = [...(prev.contact_persons || [
          { name: "", email: "", mobile: "", desk_number: "", location: "" },
          { name: "", email: "", mobile: "", desk_number: "", location: "" }
        ])]
        updatedPersons[index] = { ...updatedPersons[index], [field]: value }
        return { ...prev, contact_persons: updatedPersons }
      })
      setEditErrors((errs) => {
        const newErrs = { ...errs }
        if (index === 0 && field === "name") {
          if (!value || value.length < 2 || value.length > 150) {
            newErrs.contact_persons = "First contact person name must be between 2 and 150 characters long"
          } else {
            delete newErrs.contact_persons
          }
        }
        return newErrs
      })
    } else {
      setCreateForm((prev) => {
        const updatedPersons = [...(prev.contact_persons || [
          { name: "", email: "", mobile: "", desk_number: "", location: "" },
          { name: "", email: "", mobile: "", desk_number: "", location: "" }
        ])]
        updatedPersons[index] = { ...updatedPersons[index], [field]: value }
        return { ...prev, contact_persons: updatedPersons }
      })
      setCreateErrors((errs) => {
        const newErrs = { ...errs }
        if (index === 0 && field === "name") {
          if (!value || value.length < 2 || value.length > 150) {
            newErrs.contact_persons = "First contact person name must be between 2 and 150 characters long"
          } else {
            delete newErrs.contact_persons
          }
        }
        return newErrs
      })
    }
  }

  const handleEditSameAsBillingToggle = (checked) => {
    setEditSameAsBilling(checked)
    if (checked) {
      setEditForm((prev) => ({
        ...prev,
        shipping_address: prev.billing_address,
      }))
    }
  }

  // Real-time validation handlers
  const handleCreateChange = (field, value) => {
    setCreateForm((prev) => {
      const updated = { ...prev, [field]: value }
      if (field === "billing_address" && createSameAsBilling) {
        updated.shipping_address = value
      }
      setCreateErrors((errs) => {
        const newErrs = { ...errs }



        if (field === "name") {
          if (value && (value.length < 2 || value.length > 150)) {
            newErrs.name = "Business name must be between 2 and 150 characters long"
          } else {
            delete newErrs.name
          }
        }

        if (field === "contact_name") {
          if (!value || value.length < 2 || value.length > 150) {
            newErrs.contact_name = "Contact person name must be between 2 and 150 characters long"
          } else {
            delete newErrs.contact_name
          }
        }

        if (field === "email") {
          if (prev.supplier_type === "business" && !value) {
            newErrs.email = "Email is required"
          } else if (value && !/\S+@\S+\.\S+/.test(value)) {
            newErrs.email = "Please enter a valid email address"
          } else {
            delete newErrs.email
          }
        }

        if (field === "phone") {
          if (value && !validatePhone(value)) {
            newErrs.phone = "Phone number must be at least 10 digits"
          } else {
            delete newErrs.phone
          }
        }

        if (field === "alternative_phone") {
          if (value && !validatePhone(value)) {
            newErrs.alternative_phone = "Phone number must be at least 10 digits"
          } else {
            delete newErrs.alternative_phone
          }
        }

        if (field === "gstin") {
          if (prev.supplier_type === "business" && !value) {
            newErrs.gstin = "GSTIN is required for business suppliers"
          } else if (value && !validateGSTIN(value)) {
            newErrs.gstin = "Must be a valid 15-character Indian GSTIN with correct state code"
          } else {
            delete newErrs.gstin
          }
        }

        if (field === "pan") {
          const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
          if (value && !panRegex.test(value.toUpperCase().trim())) {
            newErrs.pan = "Must match Indian PAN format (e.g. ABCDE1234F)"
          } else {
            delete newErrs.pan
          }
        }

        if (field === "pincode") {
          if (value && !/^\d{6}$/.test(value)) {
            newErrs.pincode = "Pincode must be exactly 6 digits"
          } else {
            delete newErrs.pincode
          }
        }

        if (field === "aadhaar_last_four") {
          if (value && !/^\d{4}$/.test(value)) {
            newErrs.aadhaar_last_four = "Aadhaar must be exactly 4 digits"
          } else {
            delete newErrs.aadhaar_last_four
          }
        }

        if (field === "bank_ifsc_code") {
          const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
          if (value && !ifscRegex.test(value.toUpperCase().trim())) {
            newErrs.bank_ifsc_code = "IFSC code format is invalid (e.g., SBIN0001234)"
          } else {
            delete newErrs.bank_ifsc_code
          }
        }

        if (field === "tan_no") {
          if (value && !validateTAN(value)) {
            newErrs.tan_no = "TAN must match Indian TAN format (e.g. HYDA12345B)"
          } else {
            delete newErrs.tan_no
          }
        }

        if (field === "iec") {
          if (value && !validateIEC(value)) {
            newErrs.iec = "IEC must be exactly 10 digits"
          } else {
            delete newErrs.iec
          }
        }

        if (field === "fssai") {
          if (value && !validateFSSAI(value)) {
            newErrs.fssai = "FSSAI registration number must be exactly 14 digits"
          } else {
            delete newErrs.fssai
          }
        }

        if (field === "cin") {
          if (prev.supplier_type === "business" && !value) {
            newErrs.cin = "CIN is required for business suppliers"
          } else if (value && !validateCIN(value)) {
            newErrs.cin = "CIN must match Indian CIN format (21 chars)"
          } else {
            delete newErrs.cin
          }
        }

        if (field === "supplier_type") {
          if (value === "individual") {
            delete newErrs.gstin
            delete newErrs.cin
          }
        }



        if (field === "address" && value.length > 500) {
          newErrs.address = "Address must not exceed 500 characters"
        } else if (field === "address") {
          delete newErrs.address
        }

        if (field === "notes" && value.length > 1000) {
          newErrs.notes = "Notes must not exceed 1000 characters"
        } else if (field === "notes") {
          delete newErrs.notes
        }

        return newErrs
      })
      return updated
    })
  }

  const handleEditChange = (field, value) => {
    setEditForm((prev) => {
      const updated = { ...prev, [field]: value }
      if (field === "billing_address" && editSameAsBilling) {
        updated.shipping_address = value
      }
      setEditErrors((errs) => {
        const newErrs = { ...errs }

        if (field === "name") {
          if (value && (value.length < 2 || value.length > 150)) {
            newErrs.name = "Business name must be between 2 and 150 characters long"
          } else {
            delete newErrs.name
          }
        }

        if (field === "contact_name") {
          if (!value || value.length < 2 || value.length > 150) {
            newErrs.contact_name = "Contact person name must be between 2 and 150 characters long"
          } else {
            delete newErrs.contact_name
          }
        }

        if (field === "email") {
          if (prev.supplier_type === "business" && !value) {
            newErrs.email = "Email is required"
          } else if (value && !/\S+@\S+\.\S+/.test(value)) {
            newErrs.email = "Please enter a valid email address"
          } else {
            delete newErrs.email
          }
        }

        if (field === "phone") {
          if (value && !validatePhone(value)) {
            newErrs.phone = "Phone number must be at least 10 digits"
          } else {
            delete newErrs.phone
          }
        }

        if (field === "alternative_phone") {
          if (value && !validatePhone(value)) {
            newErrs.alternative_phone = "Phone number must be at least 10 digits"
          } else {
            delete newErrs.alternative_phone
          }
        }

        if (field === "gstin") {
          if (prev.supplier_type === "business" && !value) {
            newErrs.gstin = "GSTIN is required for business suppliers"
          } else if (value && !validateGSTIN(value)) {
            newErrs.gstin = "Must be a valid 15-character Indian GSTIN with correct state code"
          } else {
            delete newErrs.gstin
          }
        }

        if (field === "pan") {
          const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
          if (value && !panRegex.test(value.toUpperCase().trim())) {
            newErrs.pan = "Must match Indian PAN format (e.g. ABCDE1234F)"
          } else {
            delete newErrs.pan
          }
        }

        if (field === "pincode") {
          if (value && !/^\d{6}$/.test(value)) {
            newErrs.pincode = "Pincode must be exactly 6 digits"
          } else {
            delete newErrs.pincode
          }
        }

        if (field === "aadhaar_last_four") {
          if (value && !/^\d{4}$/.test(value)) {
            newErrs.aadhaar_last_four = "Aadhaar must be exactly 4 digits"
          } else {
            delete newErrs.aadhaar_last_four
          }
        }

        if (field === "bank_ifsc_code") {
          const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
          if (value && !ifscRegex.test(value.toUpperCase().trim())) {
            newErrs.bank_ifsc_code = "IFSC code format is invalid (e.g., SBIN0001234)"
          } else {
            delete newErrs.bank_ifsc_code
          }
        }

        if (field === "tan_no") {
          if (value && !validateTAN(value)) {
            newErrs.tan_no = "TAN must match Indian TAN format (e.g. HYDA12345B)"
          } else {
            delete newErrs.tan_no
          }
        }

        if (field === "iec") {
          if (value && !validateIEC(value)) {
            newErrs.iec = "IEC must be exactly 10 digits"
          } else {
            delete newErrs.iec
          }
        }

        if (field === "fssai") {
          if (value && !validateFSSAI(value)) {
            newErrs.fssai = "FSSAI registration number must be exactly 14 digits"
          } else {
            delete newErrs.fssai
          }
        }

        if (field === "cin") {
          if (prev.supplier_type === "business" && !value) {
            newErrs.cin = "CIN is required for business suppliers"
          } else if (value && !validateCIN(value)) {
            newErrs.cin = "CIN must match Indian CIN format (21 chars)"
          } else {
            delete newErrs.cin
          }
        }

        if (field === "supplier_type") {
          if (value === "individual") {
            delete newErrs.gstin
            delete newErrs.cin
          }
        }



        if (field === "address" && value.length > 500) {
          newErrs.address = "Address must not exceed 500 characters"
        } else if (field === "address") {
          delete newErrs.address
        }

        if (field === "notes" && value.length > 1000) {
          newErrs.notes = "Notes must not exceed 1000 characters"
        } else if (field === "notes") {
          delete newErrs.notes
        }

        return newErrs
      })
      return updated
    })
  }

  // Submission validation
  const validateForm = (form) => {
    const errs = {}


    if (form.name && (form.name.length < 2 || form.name.length > 150)) {
      errs.name = "Business name must be between 2 and 150 characters long"
    }

    const firstContactName = form.contact_persons?.[0]?.name || ""
    if (!firstContactName || firstContactName.length < 2 || firstContactName.length > 150) {
      errs.contact_persons = "First contact person name must be between 2 and 150 characters long"
    }

    if (form.supplier_type === "business") {
      if (!form.email) {
        errs.email = "Email is required"
      } else if (!/\S+@\S+\.\S+/.test(form.email)) {
        errs.email = "Please enter a valid email address"
      }
    } else {
      if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
        errs.email = "Please enter a valid email address"
      }
    }

    if (form.phone && !validatePhone(form.phone)) {
      errs.phone = "Phone number must be at least 10 digits"
    }

    if (form.alternative_phone && !validatePhone(form.alternative_phone)) {
      errs.alternative_phone = "Phone number must be at least 10 digits"
    }

    if (form.supplier_type === "individual") {
      if (!form.aadhaar_last_four) {
        errs.aadhaar_last_four = "Aadhaar last 4 digits are required for individual type"
      } else if (!/^\d{4}$/.test(form.aadhaar_last_four)) {
        errs.aadhaar_last_four = "Aadhaar must be exactly 4 digits"
      }
    }

    if (form.pincode) {
      if (!/^\d{6}$/.test(form.pincode)) {
        errs.pincode = "Pincode must be exactly 6 digits"
      }
    }

    if (form.pan) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
      if (!panRegex.test(form.pan.toUpperCase().trim())) {
        errs.pan = "Must match Indian PAN format (e.g. ABCDE1234F)"
      }
    }

    if (form.supplier_type === "business") {
      if (!form.gstin) {
        errs.gstin = "GSTIN is required for business suppliers"
      } else if (!validateGSTIN(form.gstin)) {
        errs.gstin = "Must be a valid 15-character Indian GSTIN with correct state code"
      }
    } else {
      if (form.gstin && !validateGSTIN(form.gstin)) {
        errs.gstin = "Must be a valid 15-character Indian GSTIN with correct state code"
      }
    }

    if (form.bank_ifsc_code) {
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
      if (!ifscRegex.test(form.bank_ifsc_code.toUpperCase().trim())) {
        errs.bank_ifsc_code = "IFSC code format is invalid (e.g., SBIN0001234)"
      }
    }

    if (form.supplier_type === "business") {
      if (!form.cin) {
        errs.cin = "CIN is required for business suppliers"
      } else if (!validateCIN(form.cin)) {
        errs.cin = "CIN must match Indian CIN format (21 chars)"
      }

      if (form.tan_no && !validateTAN(form.tan_no)) {
        errs.tan_no = "TAN must match Indian TAN format (e.g. HYDA12345B)"
      }

      if (form.iec && !validateIEC(form.iec)) {
        errs.iec = "IEC must be exactly 10 digits"
      }
    } else {
      if (form.cin && !validateCIN(form.cin)) {
        errs.cin = "CIN must match Indian CIN format (21 chars)"
      }
    }

    if (form.fssai && !validateFSSAI(form.fssai)) {
      errs.fssai = "FSSAI registration number must be exactly 14 digits"
    }



    if (form.address && form.address.length > 500) {
      errs.address = "Address must not exceed 500 characters"
    }

    if (form.notes && form.notes.length > 1000) {
      errs.notes = "Notes must not exceed 1000 characters"
    }

    return errs
  }

  const handleKycFileSelect = async (e, isEdit) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      if (isEdit) {
        setKycErrorEdit("File must be 5 MB or smaller")
      } else {
        setKycErrorCreate("File must be 5 MB or smaller")
      }
      return
    }

    const reqRef = isEdit ? kycUploadReqRefEdit : kycUploadReqRefCreate
    const reqId = ++reqRef.current

    if (isEdit) {
      setIsKycUploadingEdit(true)
      setKycErrorEdit("")
    } else {
      setIsKycUploadingCreate(true)
      setKycErrorCreate("")
    }

    const docType = isEdit ? editForm.kyc_document_type : createForm.kyc_document_type

    try {
      const res = await uploadSupplierKyc(file, docType || undefined)
      const json = await res.json().catch(() => ({}))

      if (reqId !== reqRef.current) return

      if (res.ok && json.data) {
        const data = json.data
        if (isEdit) {
          setEditForm((prev) => ({
            ...prev,
            kyc_document_url: data.kyc_document_url || "",
            kyc_document_name: data.kyc_document_name || "",
            kyc_document_type: data.kyc_document_type || prev.kyc_document_type || "",
          }))
        } else {
          setCreateForm((prev) => ({
            ...prev,
            kyc_document_url: data.kyc_document_url || "",
            kyc_document_name: data.kyc_document_name || "",
            kyc_document_type: data.kyc_document_type || prev.kyc_document_type || "",
          }))
        }
      } else {
        const msg = json.message || "Upload failed. Try again."
        if (isEdit) setKycErrorEdit(msg)
        else setKycErrorCreate(msg)
      }
    } catch {
      if (reqId === reqRef.current) {
        const msg = "Upload failed. Try again."
        if (isEdit) setKycErrorEdit(msg)
        else setKycErrorCreate(msg)
      }
    } finally {
      if (reqId === reqRef.current) {
        if (isEdit) setIsKycUploadingEdit(false)
        else setIsKycUploadingCreate(false)
      }
    }
  }

  const handleRemoveKyc = (isEdit) => {
    if (isEdit) {
      setEditForm((prev) => ({
        ...prev,
        kyc_document_type: "",
        kyc_document_number: "",
        kyc_document_url: "",
        kyc_document_name: "",
      }))
      setKycErrorEdit("")
    } else {
      setCreateForm((prev) => ({
        ...prev,
        kyc_document_type: "",
        kyc_document_number: "",
        kyc_document_url: "",
        kyc_document_name: "",
      }))
      setKycErrorCreate("")
    }
  }

  const handleViewKycDocument = async () => {
    if (!selectedSupplier?.id) return
    const win = window.open("about:blank", "_blank")
    setKycErrorEdit("")
    try {
      const res = await getSupplierKycViewUrl(selectedSupplier.id)
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.data?.url) {
        if (win) {
          win.opener = null
          win.location.href = json.data.url
        }
      } else {
        win?.close()
        setKycErrorEdit(res.status === 404 ? "No KYC document uploaded for this supplier." : (json.message || "Couldn't open document. Try again."))
      }
    } catch {
      win?.close()
      setKycErrorEdit("Couldn't open document. Try again.")
    }
  }

  const handleVerifyOrRejectKyc = async (isVerified) => {
    if (!selectedSupplier?.id) return
    setKycErrorEdit("")
    setKycRemarksError("")

    const remarksTrimmed = kycRemarks.trim()
    if (!isVerified && !remarksTrimmed) {
      setKycRemarksError("Add a reason to reject")
      return
    }

    setIsKycVerifying(true)
    try {
      const res = await verifySupplierKyc(selectedSupplier.id, isVerified, remarksTrimmed)
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.data) {
        setSelectedSupplier(json.data)
        setSuppliersList((prev) => prev.map((s) => (s.id === json.data.id ? json.data : s)))
        setKycRemarks("")
        showSuccessToast(isVerified ? "Supplier KYC marked as verified." : "Supplier KYC rejected.")
      } else {
        setKycErrorEdit(json.message || "Failed to update KYC status.")
      }
    } catch {
      setKycErrorEdit("Failed to update KYC status.")
    } finally {
      setIsKycVerifying(false)
    }
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setCreateErrors({})
    const errs = validateForm(createForm)
    if (Object.keys(errs).length > 0) {
      setCreateErrors(errs)
      return
    }

    const ok = await confirm({
      title: `Onboard supplier ${createForm.name || "this supplier"}?`,
      confirmLabel: "Onboard supplier",
    })
    if (!ok) return

    setIsSaving(true)
    try {
      const hasBankDetails =
        createForm.bank_account_number.trim() ||
        createForm.bank_name.trim() ||
        createForm.bank_ifsc_code.trim() ||
        createForm.bank_branch_name.trim() ||
        createForm.bank_account_holder_name.trim()

      const bank_details = hasBankDetails ? {
        account_number: createForm.bank_account_number.trim() || null,
        bank_name: createForm.bank_name.trim() || null,
        ifsc_code: createForm.bank_ifsc_code.trim().toUpperCase() || null,
        branch_name: createForm.bank_branch_name.trim() || null,
        account_holder_name: createForm.bank_account_holder_name.trim() || null,
      } : null

      const firstPerson = createForm.contact_persons?.[0]
      const secondPerson = createForm.contact_persons?.[1]

      const contactPersonsPayload = []
      if (firstPerson) {
        contactPersonsPayload.push({
          name: firstPerson.name.trim(),
          email: firstPerson.email.trim() || null,
          mobile: firstPerson.mobile.trim() || null,
          desk_number: firstPerson.desk_number.trim() || null,
          location: firstPerson.location.trim() || null,
        })
      }

      if (secondPerson) {
        const hasData = secondPerson.name.trim() || secondPerson.email.trim() || secondPerson.mobile.trim() || secondPerson.desk_number.trim() || secondPerson.location.trim()
        if (hasData) {
          contactPersonsPayload.push({
            name: secondPerson.name.trim() || null,
            email: secondPerson.email.trim() || null,
            mobile: secondPerson.mobile.trim() || null,
            desk_number: secondPerson.desk_number.trim() || null,
            location: secondPerson.location.trim() || null,
          })
        }
      }

      const payload = {
        name: createForm.name.trim() || null,
        email: createForm.email.trim() || null,
        contact_name: firstPerson?.name.trim() || null,
        phone: firstPerson?.mobile.trim() || createForm.phone.trim() || null,
        alternative_phone: secondPerson?.mobile.trim() || createForm.alternative_phone.trim() || null,
        address: createForm.address.trim() || null,
        city: createForm.city.trim() || null,
        state: createForm.state.trim() || null,
        pincode: createForm.pincode.trim() || null,
        gstin: createForm.gstin.trim().toUpperCase() || null,
        pan: createForm.pan.trim().toUpperCase() || null,
        aadhaar_last_four: createForm.supplier_type === "individual" ? createForm.aadhaar_last_four.trim() : null,
        business_type: createForm.business_type.trim() || null,
        supplier_type: createForm.supplier_type,
        notes: createForm.notes.trim() || null,
        bank_details: bank_details,
        tan_no: createForm.tan_no.trim() || null,
        iec: createForm.iec.trim() || null,
        msme: createForm.msme.trim() || null,
        fssai: createForm.fssai.trim() || null,
        cin: createForm.cin.trim() || null,
        billing_address: createForm.billing_address.trim() || null,
        shipping_address: createSameAsBilling ? (createForm.billing_address.trim() || null) : (createForm.shipping_address.trim() || null),
        kyc_document_type: createForm.kyc_document_type || null,
        kyc_document_number: createForm.kyc_document_number?.trim() || null,
        kyc_document_url: createForm.kyc_document_url || null,
        kyc_document_name: createForm.kyc_document_name || null,
        contact_persons: contactPersonsPayload
      }

      const res = await createSupplier(payload)

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        const parsed = parseBackendUniqueError(errJson.detail, "Failed to onboard supplier")
        if (Object.keys(parsed.fieldErrors).length > 0) {
          setCreateErrors((prev) => ({ ...prev, ...parsed.fieldErrors }))
        }
        if (parsed.global) {
          setCreateErrors((prev) => ({ ...prev, global: parsed.global }))
        }
        return
      }

      setIsCreateOpen(false)
      setCreateForm({
        name: "",
        email: "",
        contact_name: "",
        phone: "",
        alternative_phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        gstin: "",
        pan: "",
        aadhaar_last_four: "",
        business_type: "",
        supplier_type: "business",
        notes: "",
        bank_account_number: "",
        bank_name: "",
        bank_ifsc_code: "",
        bank_branch_name: "",
        bank_account_holder_name: "",
        tan_no: "",
        iec: "",
        msme: "",
        fssai: "",
        cin: "",
        billing_address: "",
        shipping_address: "",
        kyc_document_type: "",
        kyc_document_number: "",
        kyc_document_url: "",
        kyc_document_name: "",
        contact_persons: [
          { name: "", email: "", mobile: "", desk_number: "", location: "" },
          { name: "", email: "", mobile: "", desk_number: "", location: "" }
        ],
      })
      fetchSuppliers()
    } catch (err) {
      if (err.message !== "Validation failed") {
        setCreateErrors({ global: err.message })
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditOpen = async (supplier) => {
    setSelectedSupplier(supplier)
    setIsDetailLoading(true)
    setIsEditOpen(true)
    setEditErrors({})
    setKycRemarks("")
    setKycRemarksError("")
    setKycErrorEdit("")

    try {
      const res = await getSupplierDetails(supplier.id)
      if (!res.ok) {
        throw new Error("Failed to load supplier details")
      }
      const json = await res.json()
      const details = json.data
      const bank = details.bank_details || {}
      setSelectedSupplier(details)

      setEditForm({
        name: details.name || "",
        email: details.email || "",
        contact_name: details.contact_name || "",
        phone: details.phone || "",
        alternative_phone: details.alternative_phone || "",
        address: details.address || "",
        city: details.city || "",
        state: details.state || "",
        pincode: details.pincode || "",
        gstin: details.gstin || "",
        pan: details.pan || "",
        aadhaar_last_four: details.aadhaar_last_four || "",
        business_type: details.business_type || "",
        supplier_type: details.supplier_type || "business",
        notes: details.notes || "",
        bank_account_number: bank.account_number || "",
        bank_name: bank.bank_name || "",
        bank_ifsc_code: bank.ifsc_code || "",
        bank_branch_name: bank.branch_name || "",
        bank_account_holder_name: bank.account_holder_name || "",
        is_active: details.is_active,
        tan_no: details.tan_no || "",
        iec: details.iec || "",
        msme: details.msme || "",
        fssai: details.fssai || "",
        cin: details.cin || "",
        billing_address: details.billing_address || "",
        shipping_address: details.shipping_address || "",
        kyc_document_type: details.kyc_document_type || "",
        kyc_document_number: details.kyc_document_number || "",
        kyc_document_url: details.kyc_document_url || "",
        kyc_document_name: details.kyc_document_name || "",
        contact_persons: [
          {
            name: details.contact_persons?.[0]?.name || "",
            email: details.contact_persons?.[0]?.email || "",
            mobile: details.contact_persons?.[0]?.mobile || "",
            desk_number: details.contact_persons?.[0]?.desk_number || "",
            location: details.contact_persons?.[0]?.location || "",
          },
          {
            name: details.contact_persons?.[1]?.name || "",
            email: details.contact_persons?.[1]?.email || "",
            mobile: details.contact_persons?.[1]?.mobile || "",
            desk_number: details.contact_persons?.[1]?.desk_number || "",
            location: details.contact_persons?.[1]?.location || "",
          }
        ],
      })
      const hasAddresses = details.billing_address || details.shipping_address
      const isSame = hasAddresses && (details.billing_address === details.shipping_address)
      setEditSameAsBilling(!!isSame)
    } catch (err) {
      setEditErrors({ global: err.message })
    } finally {
      setIsDetailLoading(false)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setEditErrors({})
    const errs = validateForm(editForm)
    if (Object.keys(errs).length > 0) {
      setEditErrors(errs)
      return
    }

    const ok = await confirm({
      title: `Save changes for ${editForm.name || "this supplier"}?`,
      confirmLabel: "Save changes",
    })
    if (!ok) return

    setIsSaving(true)
    try {
      const hasBankDetails =
        editForm.bank_account_number.trim() ||
        editForm.bank_name.trim() ||
        editForm.bank_ifsc_code.trim() ||
        editForm.bank_branch_name.trim() ||
        editForm.bank_account_holder_name.trim()

      const bank_details = hasBankDetails ? {
        account_number: editForm.bank_account_number.trim() || null,
        bank_name: editForm.bank_name.trim() || null,
        ifsc_code: editForm.bank_ifsc_code.trim().toUpperCase() || null,
        branch_name: editForm.bank_branch_name.trim() || null,
        account_holder_name: editForm.bank_account_holder_name.trim() || null,
      } : null

      const firstPerson = editForm.contact_persons?.[0]
      const secondPerson = editForm.contact_persons?.[1]

      const contactPersonsPayload = []
      if (firstPerson) {
        contactPersonsPayload.push({
          name: firstPerson.name.trim(),
          email: firstPerson.email.trim() || null,
          mobile: firstPerson.mobile.trim() || null,
          desk_number: firstPerson.desk_number.trim() || null,
          location: firstPerson.location.trim() || null,
        })
      }

      if (secondPerson) {
        const hasData = secondPerson.name.trim() || secondPerson.email.trim() || secondPerson.mobile.trim() || secondPerson.desk_number.trim() || secondPerson.location.trim()
        if (hasData) {
          contactPersonsPayload.push({
            name: secondPerson.name.trim() || null,
            email: secondPerson.email.trim() || null,
            mobile: secondPerson.mobile.trim() || null,
            desk_number: secondPerson.desk_number.trim() || null,
            location: secondPerson.location.trim() || null,
          })
        }
      }

      const payload = {
        name: editForm.name.trim() || null,
        email: editForm.email.trim() || null,
        contact_name: firstPerson?.name.trim() || null,
        phone: firstPerson?.mobile.trim() || editForm.phone.trim() || null,
        alternative_phone: secondPerson?.mobile.trim() || editForm.alternative_phone.trim() || null,
        address: editForm.address.trim() || null,
        city: editForm.city.trim() || null,
        state: editForm.state.trim() || null,
        pincode: editForm.pincode.trim() || null,
        gstin: editForm.gstin.trim().toUpperCase() || null,
        pan: editForm.pan.trim().toUpperCase() || null,
        aadhaar_last_four: editForm.supplier_type === "individual" ? editForm.aadhaar_last_four.trim() : null,
        business_type: editForm.business_type.trim() || null,
        supplier_type: editForm.supplier_type,
        notes: editForm.notes.trim() || null,
        bank_details: bank_details,
        is_active: editForm.is_active,
        tan_no: editForm.tan_no.trim() || null,
        iec: editForm.iec.trim() || null,
        msme: editForm.msme.trim() || null,
        fssai: editForm.fssai.trim() || null,
        cin: editForm.cin.trim() || null,
        billing_address: editForm.billing_address.trim() || null,
        shipping_address: editSameAsBilling ? (editForm.billing_address.trim() || null) : (editForm.shipping_address.trim() || null),
        kyc_document_type: editForm.kyc_document_type || null,
        kyc_document_number: editForm.kyc_document_number?.trim() || null,
        kyc_document_url: editForm.kyc_document_url || null,
        kyc_document_name: editForm.kyc_document_name || null,
        contact_persons: contactPersonsPayload
      }

      const res = await updateSupplier(selectedSupplier.id, payload)

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        const parsed = parseBackendUniqueError(errJson.detail, "Failed to update supplier details")
        if (Object.keys(parsed.fieldErrors).length > 0) {
          setEditErrors((prev) => ({ ...prev, ...parsed.fieldErrors }))
        }
        if (parsed.global) {
          setEditErrors((prev) => ({ ...prev, global: parsed.global }))
        }
        return
      }

      setIsEditOpen(false)

      // Refresh selectedSupplier state so detail views update immediately
      try {
        const detailRes = await getSupplierDetails(selectedSupplier.id)
        if (detailRes.ok) {
          const detailJson = await detailRes.json()
          if (detailJson.data) {
            setSelectedSupplier(detailJson.data)
          }
        }
      } catch {
        // Fallback merge
        setSelectedSupplier((prev) => (prev ? { ...prev, ...payload } : prev))
      }

      fetchSuppliers()
    } catch (err) {
      if (err.message !== "Validation failed") {
        setEditErrors({ global: err.message })
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActiveStatus = async (checked) => {
    const action = checked ? "Activate" : "Deactivate"
    const ok = await confirm({
      title: `${action} supplier ${selectedSupplier?.name || "this supplier"}?`,
      confirmLabel: action,
      tone: !checked ? "danger" : undefined,
    })
    if (!ok) return

    setEditForm((prev) => ({ ...prev, is_active: checked }))

    try {
      const hasBankDetails =
        editForm.bank_account_number.trim() ||
        editForm.bank_name.trim() ||
        editForm.bank_ifsc_code.trim() ||
        editForm.bank_branch_name.trim() ||
        editForm.bank_account_holder_name.trim()

      const bank_details = hasBankDetails ? {
        account_number: editForm.bank_account_number.trim() || null,
        bank_name: editForm.bank_name.trim() || null,
        ifsc_code: editForm.bank_ifsc_code.trim().toUpperCase() || null,
        branch_name: editForm.bank_branch_name.trim() || null,
        account_holder_name: editForm.bank_account_holder_name.trim() || null,
      } : null

      const firstPerson = editForm.contact_persons?.[0]
      const secondPerson = editForm.contact_persons?.[1]

      const contactPersonsPayload = []
      if (firstPerson) {
        contactPersonsPayload.push({
          name: firstPerson.name.trim(),
          email: firstPerson.email.trim() || null,
          mobile: firstPerson.mobile.trim() || null,
          desk_number: firstPerson.desk_number.trim() || null,
          location: firstPerson.location.trim() || null,
        })
      }

      if (secondPerson) {
        const hasData = secondPerson.name.trim() || secondPerson.email.trim() || secondPerson.mobile.trim() || secondPerson.desk_number.trim() || secondPerson.location.trim()
        if (hasData) {
          contactPersonsPayload.push({
            name: secondPerson.name.trim() || null,
            email: secondPerson.email.trim() || null,
            mobile: secondPerson.mobile.trim() || null,
            desk_number: secondPerson.desk_number.trim() || null,
            location: secondPerson.location.trim() || null,
          })
        }
      }

      const payload = {
        name: editForm.name.trim() || null,
        email: editForm.email.trim(),
        contact_name: firstPerson?.name.trim() || null,
        phone: firstPerson?.mobile.trim() || editForm.phone.trim() || null,
        alternative_phone: secondPerson?.mobile.trim() || editForm.alternative_phone.trim() || null,
        address: editForm.address.trim() || null,
        city: editForm.city.trim() || null,
        state: editForm.state.trim() || null,
        pincode: editForm.pincode.trim() || null,
        gstin: editForm.gstin.trim().toUpperCase() || null,
        pan: editForm.pan.trim().toUpperCase() || null,
        aadhaar_last_four: editForm.supplier_type === "individual" ? editForm.aadhaar_last_four.trim() : null,
        business_type: editForm.business_type.trim() || null,
        supplier_type: editForm.supplier_type,
        notes: editForm.notes.trim() || null,
        bank_details: bank_details,
        is_active: checked,
        tan_no: editForm.tan_no.trim() || null,
        iec: editForm.iec.trim() || null,
        msme: editForm.msme.trim() || null,
        fssai: editForm.fssai.trim() || null,
        cin: editForm.cin.trim() || null,
        billing_address: editForm.billing_address.trim() || null,
        shipping_address: editSameAsBilling ? (editForm.billing_address.trim() || null) : (editForm.shipping_address.trim() || null),
        contact_persons: contactPersonsPayload
      }

      const res = await updateSupplier(selectedSupplier.id, payload)

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(parseErrorDetail(errJson.detail, "Failed to update status"))
      }

      fetchSuppliers()
    } catch (err) {
      alert(err.message || "Failed to update status")
    }
  }

  const handleDeleteOpen = (supplier) => {
    setSelectedSupplier(supplier)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    setIsSaving(true)
    try {
      const res = await deactivateSupplier(selectedSupplier.id)
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(parseErrorDetail(errJson.detail, "Failed to deactivate supplier"))
      }
      setIsDeleteOpen(false)
      fetchSuppliers()
    } catch (err) {
      alert(err.message || "Something went wrong")
    } finally {
      setIsSaving(false)
    }
  }

  const suppliers = useMemo(
    () => (showActiveOnly ? suppliersList.filter((s) => s.is_active === true) : suppliersList),
    [suppliersList, showActiveOnly]
  )

  // Client-side search filters
  const filteredSuppliers = useMemo(() => {
    const term = searchQuery.toLowerCase().trim()
    if (!term) return suppliers
    return suppliers.filter((vendor) => {
      const nameMatch = vendor.name?.toLowerCase().includes(term)
      const codeMatch = vendor.vendor_code?.toLowerCase().includes(term)
      const emailMatch = vendor.email?.toLowerCase().includes(term)
      const contactMatch = vendor.contact_name?.toLowerCase().includes(term)
      return nameMatch || codeMatch || emailMatch || contactMatch
    })
  }, [suppliers, searchQuery])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-4 animate-in fade-in duration-200">
        <ShieldAlert className="w-12 h-12 text-error-500 animate-bounce" />
        <h3 className="text-lg font-bold text-slate-900">Error Loading Suppliers</h3>
        <p className="text-sm font-semibold text-slate-500">{error}</p>
        <button
          onClick={fetchSuppliers}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-md shadow-brand-500/10"
        >
          Retry Fetching
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in fade-in duration-200">

      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Suppliers Directory</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Onboard and manage coffee bean importers, packaging supplies, and utility vendors.</p>
        </div>

        <button
          onClick={() => {
            setCreateForm({
              vendor_code: "",
              name: "",
              email: "",
              contact_name: "",
              phone: "",
              alternative_phone: "",
              address: "",
              city: "",
              state: "",
              pincode: "",
              gstin: "",
              pan: "",
              aadhaar_last_four: "",
              business_type: "",
              supplier_type: "business",
              price_tolerance_pct: "5.00",
              qty_tolerance_pct: "10.00",
              notes: "",
              bank_account_number: "",
              bank_name: "",
              bank_ifsc_code: "",
              bank_branch_name: "",
              bank_account_holder_name: "",
              tan_no: "",
              iec: "",
              msme: "",
              fssai: "",
              cin: "",
              billing_address: "",
              shipping_address: "",
            })
            setCreateErrors({})
            setCreateSameAsBilling(false)
            setIsCreateOpen(true)
          }}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center gap-2 whitespace-nowrap self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard Supplier</span>
        </button>
      </div>

      {/* Search and Filters toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
        <div className="relative w-full sm:flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suppliers by name, code, or email..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center select-none">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              className="w-4 h-4 rounded-lg border-slate-200 text-brand-600 focus:ring-brand-500 focus:ring-2 focus:ring-offset-2 transition-all cursor-pointer"
            />
            Show Active Only
          </label>
        </div>
      </div>

      {/* Directory Table */}
      {filteredSuppliers.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 font-semibold shadow-sm">
          No suppliers found in directory.
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden w-full">
          <div className="w-full">
            <table className="w-full text-left border-collapse table-fixed text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-3.5 py-3.5 w-[56%] md:w-[42%] lg:w-[32%]">Supplier & Code</th>
                  <th className="px-3.5 py-3.5 hidden md:table-cell md:w-[32%] lg:w-[28%]">Contact & Phone/Email</th>
                  <th className="px-3.5 py-3.5 hidden lg:table-cell lg:w-[16%]">GSTIN</th>
                  <th className="px-3.5 py-3.5 w-[22%] md:w-[13%] lg:w-[12%]">Status</th>
                  <th className="px-3.5 py-3.5 w-[22%] md:w-[13%] lg:w-[12%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredSuppliers.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Column 1: Supplier Name & Code */}
                    <td className="px-3.5 py-3 min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold shrink-0 border border-slate-200/60 shadow-2xs">
                          <Truck className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-slate-900 font-semibold text-xs leading-snug line-clamp-1 truncate" title={vendor.name || vendor.contact_name}>
                            {vendor.name || vendor.contact_name || "—"}
                          </p>
                          <span className="text-[10px] tabular-nums text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-0.5 font-medium border border-slate-200/50">
                            {vendor.vendor_code}
                          </span>
                          <div className="text-[10px] text-slate-400 truncate md:hidden mt-0.5" title={vendor.contact_name || vendor.phone || ""}>
                            {vendor.contact_name ? `${vendor.contact_name} ` : ""}{vendor.phone ? `• ${vendor.phone}` : ""}
                          </div>
                          {vendor.gstin && (
                            <div className="text-[10px] text-slate-400 truncate lg:hidden mt-0.5">
                              GST: {vendor.gstin}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Contact Person, Phone & Email */}
                    <td className="px-3.5 py-3 min-w-0 hidden md:table-cell">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-xs truncate" title={vendor.contact_name || "—"}>
                          {vendor.contact_name || "—"}
                        </p>
                        <div className="space-y-0.5 mt-0.5">
                          {vendor.email && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-500 truncate" title={vendor.email}>
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{vendor.email}</span>
                            </span>
                          )}
                          {vendor.phone && (
                            <span className="flex items-center gap-1 text-[11px] tabular-nums text-slate-500">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{vendor.phone}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Column 3: GSTIN */}
                    <td className="px-3 py-3 whitespace-nowrap hidden lg:table-cell">
                      <span
                        className="text-[11px] xl:text-xs tabular-nums font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block truncate max-w-full"
                        title={vendor.gstin || "—"}
                      >
                        {vendor.gstin || "—"}
                      </span>
                    </td>

                    {/* Column 4: Status Badge */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex flex-col items-start">
                        {vendor.is_active ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <span className="w-1 h-1 rounded-full mr-1 bg-emerald-500 shrink-0" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                            <span className="w-1 h-1 rounded-full mr-1 bg-rose-500 shrink-0" />
                            Inactive
                          </span>
                        )}
                        {vendor.kyc_verified ? (
                          <span className="inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold mt-1 bg-emerald-50 text-emerald-700">
                            KYC ✓
                          </span>
                        ) : vendor.kyc_document_url ? (
                          vendor.kyc_remarks ? (
                            <span className="inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold mt-1 bg-rose-50 text-rose-700">
                              KYC rejected
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold mt-1 bg-amber-50 text-amber-700">
                              KYC pending
                            </span>
                          )
                        ) : (
                          <span className="inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold mt-1 bg-slate-100 text-slate-500">
                            No KYC
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Column 5: Action Tools */}
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <div className="flex justify-end items-center gap-1.5">
                        <button
                          onClick={() => handleEditOpen(vendor)}
                          className="p-1.5 border border-slate-200 hover:border-brand-200 hover:bg-brand-50/60 rounded-lg text-slate-400 hover:text-brand-700 transition-all active:scale-95 inline-flex items-center"
                          title="Edit Supplier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {vendor.is_active && (
                          <button
                            onClick={() => handleDeleteOpen(vendor)}
                            className="p-1.5 border border-slate-200 hover:border-rose-300 hover:bg-rose-50/60 rounded-lg text-slate-400 hover:text-rose-700 transition-all active:scale-95 inline-flex items-center"
                            title="Deactivate Supplier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Onboard Supplier Modal Overlay */}
      {isCreateOpen && (
        <Modal onClose={() => setIsCreateOpen(false)}>
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <h3 className="font-bold text-slate-900 text-lg">Onboard Supplier</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 flex flex-col">
              {createErrors.global && (
                <div className="flex items-start gap-2.5 p-4 bg-error-50 border border-error-100 rounded-xl text-sm font-semibold text-error-800">
                  <ShieldAlert className="w-5 h-5 text-error-800 shrink-0" />
                  <p className="flex-1">{createErrors.global}</p>
                </div>
              )}

              {/* Section 1: Business Identity */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
                  <Building className="w-5 h-5 text-brand-600" />
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">1. Business Identity</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Supplier Type <span className="text-error-500 font-bold">*</span>
                    </label>
                    <select
                      value={createForm.supplier_type}
                      onChange={(e) => handleCreateChange("supplier_type", e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all bg-white font-semibold text-slate-700"
                    >
                      <option value="business">Business / Corporate</option>
                      <option value="individual">Individual / Farmer</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Business Type
                    </label>
                    <select
                      value={createForm.business_type}
                      onChange={(e) => handleCreateChange("business_type", e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all bg-white font-semibold text-slate-700"
                    >
                      <option value="">Select Business Type</option>
                      <option value="sole proprietorship">Sole Proprietorship</option>
                      <option value="partnership firm">Partnership Firm</option>
                      <option value="limited liability partnership">Limited Liability Partnership</option>
                      <option value="private limited company">Private Limited Company</option>
                      <option value="public limited company">Public Limited Company</option>
                      <option value="one person company">One Person Company</option>
                      <option value="government">Government</option>
                      <option value="individual">Individual</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Business/Vendor Name <span className="text-error-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <Truck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => handleCreateChange("name", e.target.value)}
                      placeholder="E.g., Mahindra Farms"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700"
                    />
                  </div>
                  {createErrors.name && <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.name}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      value={createForm.pan}
                      onChange={(e) => handleCreateChange("pan", e.target.value)}
                      placeholder="E.g., ABCDE1234F"
                      className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent uppercase transition-all font-semibold text-slate-700"
                    />
                    {createErrors.pan && <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.pan}</p>}
                  </div>

                  {createForm.supplier_type === "business" ? (
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        GSTIN Number <span className="text-error-500 font-bold">*</span>
                      </label>
                      <div className="relative">
                        <FileSpreadsheet className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          value={createForm.gstin}
                          onChange={(e) => handleCreateChange("gstin", e.target.value)}
                          placeholder="E.g., 37AAAAA0000A1Z1"
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent uppercase transition-all font-semibold text-slate-700"
                        />
                      </div>
                      {createErrors.gstin && <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.gstin}</p>}
                    </div>
                  ) : (
                    <div className="flex flex-col animate-in slide-in-from-top-2 duration-150">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Aadhaar Last 4 Digits <span className="text-error-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength="4"
                        value={createForm.aadhaar_last_four}
                        onChange={(e) => handleCreateChange("aadhaar_last_four", e.target.value)}
                        placeholder="E.g., 9876"
                        className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700"
                      />
                      {createErrors.aadhaar_last_four && <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.aadhaar_last_four}</p>}
                    </div>
                  )}
                </div>

                {createForm.supplier_type === "business" && createForm.gstin.trim() && (
                  <div className="flex flex-col animate-in fade-in duration-200">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Billing State</label>
                    <input
                      type="text"
                      readOnly
                      value={getGSTINStateName(createForm.gstin)}
                      className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm text-slate-500 font-bold cursor-not-allowed select-none"
                    />
                  </div>
                )}
              </div>

              {/* Section 2: Contact Information */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
                  <Mail className="w-5 h-5 text-brand-600" />
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">2. Contact Information</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Email Address {createForm.supplier_type === "business" && <span className="text-error-500 font-bold">*</span>}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="email"
                        value={createForm.email}
                        onChange={(e) => handleCreateChange("email", e.target.value)}
                        placeholder="info@globalcoffee.com"
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700"
                      />
                    </div>
                    {createErrors.email && <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.email}</p>}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        value={createForm.phone}
                        onChange={(e) => handleCreateChange("phone", e.target.value)}
                        placeholder="E.g., 9876543210"
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700"
                      />
                    </div>
                    {createErrors.phone && <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.phone}</p>}
                  </div>
                </div>

                {/* Contact Person 1 */}
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/40 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <span className="w-2 h-2 rounded-full bg-brand-500" />
                    <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Contact Person 1 (Primary - Mandatory)
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        Full Name <span className="text-error-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        value={createForm.contact_persons?.[0]?.name || ""}
                        onChange={(e) => handleContactPersonChange(0, "name", e.target.value, false)}
                        placeholder="Mohan Kumar"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold text-slate-700 bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Email Address</label>
                      <input
                        type="email"
                        value={createForm.contact_persons?.[0]?.email || ""}
                        onChange={(e) => handleContactPersonChange(0, "email", e.target.value, false)}
                        placeholder="mohan@vendor.com"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold text-slate-700 bg-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Mobile Number</label>
                      <input
                        type="text"
                        value={createForm.contact_persons?.[0]?.mobile || ""}
                        onChange={(e) => handleContactPersonChange(0, "mobile", e.target.value, false)}
                        placeholder="9876543210"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold text-slate-700 bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Desk Number</label>
                      <input
                        type="text"
                        value={createForm.contact_persons?.[0]?.desk_number || ""}
                        onChange={(e) => handleContactPersonChange(0, "desk_number", e.target.value, false)}
                        placeholder="080-1234567"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold text-slate-700 bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Location</label>
                      <input
                        type="text"
                        value={createForm.contact_persons?.[0]?.location || ""}
                        onChange={(e) => handleContactPersonChange(0, "location", e.target.value, false)}
                        placeholder="Kollam Branch"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold text-slate-700 bg-white"
                      />
                    </div>
                  </div>
                  {createErrors.contact_persons && (
                    <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.contact_persons}</p>
                  )}
                </div>

                {/* Contact Person 2 */}
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/40 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <h5 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                      Contact Person 2 (Secondary - Optional)
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Full Name</label>
                      <input
                        type="text"
                        value={createForm.contact_persons?.[1]?.name || ""}
                        onChange={(e) => handleContactPersonChange(1, "name", e.target.value, false)}
                        placeholder="Ramesh"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold text-slate-700 bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Email Address</label>
                      <input
                        type="email"
                        value={createForm.contact_persons?.[1]?.email || ""}
                        onChange={(e) => handleContactPersonChange(1, "email", e.target.value, false)}
                        placeholder="ramesh@vendor.com"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold text-slate-700 bg-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Mobile Number</label>
                      <input
                        type="text"
                        value={createForm.contact_persons?.[1]?.mobile || ""}
                        onChange={(e) => handleContactPersonChange(1, "mobile", e.target.value, false)}
                        placeholder="9876543211"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold text-slate-700 bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Desk Number</label>
                      <input
                        type="text"
                        value={createForm.contact_persons?.[1]?.desk_number || ""}
                        onChange={(e) => handleContactPersonChange(1, "desk_number", e.target.value, false)}
                        placeholder="080-7654321"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold text-slate-700 bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Location</label>
                      <input
                        type="text"
                        value={createForm.contact_persons?.[1]?.location || ""}
                        onChange={(e) => handleContactPersonChange(1, "location", e.target.value, false)}
                        placeholder="Head Office"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold text-slate-700 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Address Details */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
                  <MapPin className="w-5 h-5 text-brand-600" />
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">3. Address Details</h4>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">General / Registered Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                    <textarea
                      value={createForm.address}
                      onChange={(e) => handleCreateChange("address", e.target.value)}
                      placeholder="Enter general/registered address..."
                      rows="2"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none font-semibold text-slate-700"
                    />
                  </div>
                  {createErrors.address && <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.address}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Pincode</label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength="6"
                        value={createForm.pincode}
                        onChange={(e) => handleCreateChange("pincode", e.target.value)}
                        placeholder="522001"
                        className="w-full pr-10 px-4 py-2.5 border border-slate-200 hover:border-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700"
                      />
                      {isPincodeLoadingCreate && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                          <Spinner size="sm" />
                        </span>
                      )}
                    </div>
                    {pincodeErrorCreate && (
                      <p className="text-xs text-amber-600 font-semibold mt-1">{pincodeErrorCreate}</p>
                    )}
                    {createErrors.pincode && <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.pincode}</p>}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">City</label>
                    <input
                      type="text"
                      value={createForm.city}
                      onChange={(e) => handleCreateChange("city", e.target.value)}
                      placeholder="Guntur"
                      className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">State</label>
                    <input
                      type="text"
                      value={createForm.state}
                      onChange={(e) => handleCreateChange("state", e.target.value)}
                      placeholder="Andhra Pradesh"
                      className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Billing Address</label>
                    <textarea
                      value={createForm.billing_address}
                      onChange={(e) => handleCreateChange("billing_address", e.target.value)}
                      placeholder="Enter specific billing address..."
                      rows="2"
                      className="w-full px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none font-semibold text-slate-700"
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Shipping Address</label>
                      <label className="flex items-center gap-1.5 text-xs text-brand-600 font-bold cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={createSameAsBilling}
                          onChange={(e) => handleCreateSameAsBillingToggle(e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 focus:ring-2 focus:ring-offset-0 transition-all cursor-pointer"
                        />
                        Same as Billing
                      </label>
                    </div>
                    <textarea
                      value={createForm.shipping_address}
                      onChange={(e) => handleCreateChange("shipping_address", e.target.value)}
                      disabled={createSameAsBilling}
                      placeholder={createSameAsBilling ? "Same as Billing Address" : "Enter specific shipping address..."}
                      rows="2"
                      className={`w-full px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none font-semibold ${createSameAsBilling ? "bg-slate-50 text-slate-500 cursor-not-allowed border-dashed animate-in fade-in duration-200" : "text-slate-700"}`}
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Compliance Registrations */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
                  <ShieldCheck className="w-5 h-5 text-brand-600" />
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">4. Compliance Registrations (Optional)</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {createForm.supplier_type === "business" && (
                    <>
                      <div className="flex flex-col">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">TAN Number</label>
                        <input
                          type="text"
                          placeholder="e.g., ABCD12345E"
                          value={createForm.tan_no}
                          onChange={(e) => handleCreateChange("tan_no", e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white uppercase tabular-nums font-semibold text-slate-700"
                        />
                        {createErrors.tan_no && <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.tan_no}</p>}
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          CIN Number <span className="text-error-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., U12345AP2026PTC123456"
                          value={createForm.cin}
                          onChange={(e) => handleCreateChange("cin", e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white uppercase tabular-nums font-semibold text-slate-700"
                        />
                        {createErrors.cin && <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.cin}</p>}
                      </div>
                    </>
                  )}
                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">MSME Udyam No.</label>
                    <input
                      type="text"
                      placeholder="e.g., UDYAM-AP-01-12345"
                      value={createForm.msme}
                      onChange={(e) => handleCreateChange("msme", e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white uppercase tabular-nums font-semibold text-slate-700"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">FSSAI Licence No.</label>
                    <input
                      type="text"
                      placeholder="e.g., 12345678901234"
                      value={createForm.fssai}
                      onChange={(e) => handleCreateChange("fssai", e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white tabular-nums font-semibold text-slate-700"
                    />
                    {createErrors.fssai && <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.fssai}</p>}
                  </div>
                  {createForm.supplier_type === "business" && (
                    <div className="flex flex-col md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Import Export Code (IEC)</label>
                      <input
                        type="text"
                        placeholder="e.g., 1234567890"
                        value={createForm.iec}
                        onChange={(e) => handleCreateChange("iec", e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white tabular-nums font-semibold text-slate-700"
                      />
                      {createErrors.iec && <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.iec}</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 5: Bank Details */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
                  <Landmark className="w-5 h-5 text-brand-600" />
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">5. Bank Details (Optional)</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Account Holder Name</label>
                    <input
                      type="text"
                      value={createForm.bank_account_holder_name}
                      onChange={(e) => handleCreateChange("bank_account_holder_name", e.target.value)}
                      placeholder="Ramesh Mahindra"
                      className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-semibold text-slate-700"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Bank Name</label>
                    <input
                      type="text"
                      value={createForm.bank_name}
                      onChange={(e) => handleCreateChange("bank_name", e.target.value)}
                      placeholder="State Bank of India"
                      className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-semibold text-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Account Number</label>
                    <input
                      type="text"
                      value={createForm.bank_account_number}
                      onChange={(e) => handleCreateChange("bank_account_number", e.target.value)}
                      placeholder="1234567890"
                      className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white tabular-nums font-semibold text-slate-700"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">IFSC Code</label>
                    <input
                      type="text"
                      value={createForm.bank_ifsc_code}
                      onChange={(e) => handleCreateChange("bank_ifsc_code", e.target.value)}
                      placeholder="SBIN0001234"
                      className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white uppercase tabular-nums font-semibold text-slate-700"
                    />
                    {createErrors.bank_ifsc_code && <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.bank_ifsc_code}</p>}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Branch Name</label>
                    <input
                      type="text"
                      value={createForm.bank_branch_name}
                      onChange={(e) => handleCreateChange("bank_branch_name", e.target.value)}
                      placeholder="Guntur Main"
                      className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-semibold text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* KYC Document Section */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
                  <ShieldCheck className="w-5 h-5 text-brand-600" />
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">KYC Document (optional)</h4>
                </div>

                {kycErrorCreate && (
                  <div className="p-3 rounded-xl bg-error-50 border border-error-100 text-error-800 text-xs font-semibold">
                    {kycErrorCreate}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Document Type */}
                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Document Type
                    </label>
                    <select
                      value={createForm.kyc_document_type}
                      onChange={(e) => handleCreateChange("kyc_document_type", e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-semibold text-slate-700"
                    >
                      <option value="">Select document type</option>
                      {Object.entries(KYC_DOCUMENT_TYPES).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Document Number */}
                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Document Number
                    </label>
                    <input
                      type="text"
                      value={createForm.kyc_document_number}
                      onChange={(e) => handleCreateChange("kyc_document_number", e.target.value)}
                      placeholder={createForm.kyc_document_type === "aadhaar" ? "Last 4 digits" : "e.g. ABCDE1234F"}
                      maxLength={createForm.kyc_document_type === "aadhaar" ? 4 : undefined}
                      className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white uppercase font-semibold text-slate-700"
                    />
                    {createForm.kyc_document_type === "aadhaar" && (
                      <p className="text-[11px] text-slate-400 mt-1 font-medium leading-tight">
                        Enter only the last 4 digits. Upload a masked Aadhaar (first 8 digits hidden) as per UIDAI guidelines.
                      </p>
                    )}
                  </div>
                </div>

                {/* Document File Upload */}
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Document File (.pdf, .jpg, .jpeg, .png, max 5 MB)
                  </label>

                  {createForm.kyc_document_url ? (
                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-brand-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-700 truncate">
                          {createForm.kyc_document_name || "KYC Document"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveKyc(false)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-all ${isKycUploadingCreate ? "opacity-50 pointer-events-none" : ""}`}>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleKycFileSelect(e, false)}
                          disabled={isKycUploadingCreate}
                          className="sr-only"
                        />
                        {isKycUploadingCreate ? (
                          <>
                            <Spinner size="xs" />
                            <span>Uploading…</span>
                          </>
                        ) : (
                          <span>Choose File</span>
                        )}
                      </label>
                      {isKycUploadingCreate && (
                        <span className="text-xs font-semibold text-slate-500 animate-pulse">Uploading…</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 6: Additional Notes */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
                  <BookOpen className="w-5 h-5 text-brand-600" />
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">6. Additional Notes</h4>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Notes</label>
                  <textarea
                    value={createForm.notes}
                    onChange={(e) => handleCreateChange("notes", e.target.value)}
                    placeholder="Payment cycles, lead times, or contract agreements..."
                    rows="2"
                    className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none font-semibold text-slate-700"
                  />
                  {createErrors.notes && <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.notes}</p>}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-100 mt-6 bg-white -mx-6 -mb-6 p-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="border border-slate-200 hover:border-slate-400 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 transition-all w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isKycUploadingCreate}
                  className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
                >
                  {isSaving ? <Spinner size="sm" /> : null}
                  <span>Onboard Supplier</span>
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Edit Supplier Modal Overlay */}
      {isEditOpen && (
        <Modal onClose={() => setIsEditOpen(false)}>
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <h3 className="font-bold text-slate-900 text-lg">Edit Supplier Details</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isDetailLoading ? (
              <div className="py-12 flex justify-center items-center">
                <Spinner size="lg" />
              </div>
            ) : (
              <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 flex flex-col">
                {editErrors.global && (
                  <div className="flex items-start gap-2.5 p-4 bg-error-50 border border-error-100 rounded-xl text-sm font-semibold text-error-800">
                    <ShieldAlert className="w-5 h-5 text-error-800 shrink-0" />
                    <p className="flex-1">{editErrors.global}</p>
                  </div>
                )}

                {/* Section 1: Business Identity */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
                    <Building className="w-5 h-5 text-brand-600" />
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">1. Business Identity</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Vendor Code</label>
                      <input
                        type="text"
                        disabled
                        value={selectedSupplier ? selectedSupplier.vendor_code : ""}
                        className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm text-slate-500 tabular-nums font-semibold select-none"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Supplier Type <span className="text-error-500 font-bold">*</span>
                      </label>
                      <select
                        value={editForm.supplier_type}
                        onChange={(e) => handleEditChange("supplier_type", e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all bg-white font-semibold text-slate-700"
                      >
                        <option value="business">Business / Corporate</option>
                        <option value="individual">Individual / Farmer</option>
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Business Type
                      </label>
                      <select
                        value={editForm.business_type}
                        onChange={(e) => handleEditChange("business_type", e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all bg-white font-semibold text-slate-700"
                      >
                        <option value="">Select Business Type</option>
                        <option value="sole proprietorship">Sole Proprietorship</option>
                        <option value="partnership firm">Partnership Firm</option>
                        <option value="limited liability partnership">Limited Liability Partnership</option>
                        <option value="private limited company">Private Limited Company</option>
                        <option value="public limited company">Public Limited Company</option>
                        <option value="one person company">One Person Company</option>
                        <option value="government">Government</option>
                        <option value="individual">Individual</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Business Name <span className="text-error-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <Truck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => handleEditChange("name", e.target.value)}
                        placeholder="E.g., Global Coffee Traders"
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700"
                      />
                    </div>
                    {editErrors.name && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.name}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        PAN Number
                      </label>
                      <input
                        type="text"
                        value={editForm.pan}
                        onChange={(e) => handleEditChange("pan", e.target.value)}
                        placeholder="E.g., ABCDE1234F"
                        className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent uppercase transition-all font-semibold text-slate-700"
                      />
                      {editErrors.pan && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.pan}</p>}
                    </div>

                    {editForm.supplier_type === "business" ? (
                      <div className="flex flex-col">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          GSTIN Number <span className="text-error-500 font-bold">*</span>
                        </label>
                        <div className="relative">
                          <FileSpreadsheet className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <input
                            type="text"
                            value={editForm.gstin}
                            onChange={(e) => handleEditChange("gstin", e.target.value)}
                            placeholder="E.g., 37AAAAA0000A1Z1"
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent uppercase transition-all font-semibold text-slate-700"
                          />
                        </div>
                        {editErrors.gstin && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.gstin}</p>}
                      </div>
                    ) : (
                      <div className="flex flex-col animate-in slide-in-from-top-2 duration-150">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Aadhaar Last 4 Digits <span className="text-error-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength="4"
                          value={editForm.aadhaar_last_four}
                          onChange={(e) => handleEditChange("aadhaar_last_four", e.target.value)}
                          placeholder="E.g., 9876"
                          className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700"
                        />
                        {editErrors.aadhaar_last_four && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.aadhaar_last_four}</p>}
                      </div>
                    )}
                  </div>

                  {editForm.supplier_type === "business" && editForm.gstin.trim() && (
                    <div className="flex flex-col animate-in fade-in duration-200">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Billing State</label>
                      <input
                        type="text"
                        readOnly
                        value={getGSTINStateName(editForm.gstin)}
                        className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm text-slate-500 font-bold cursor-not-allowed select-none"
                      />
                    </div>
                  )}
                </div>

                {/* Section 2: Contact Information */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
                    <Mail className="w-5 h-5 text-brand-600" />
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">2. Contact Information</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Email Address {editForm.supplier_type === "business" && <span className="text-error-500 font-bold">*</span>}
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => handleEditChange("email", e.target.value)}
                          placeholder="info@globalcoffee.com"
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700"
                        />
                      </div>
                      {editErrors.email && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.email}</p>}
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          value={editForm.phone}
                          onChange={(e) => handleEditChange("phone", e.target.value)}
                          placeholder="E.g., +919876543210"
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700"
                        />
                      </div>
                      {editErrors.phone && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.phone}</p>}
                    </div>
                  </div>

                  {/* Contact Person 1 */}
                  <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/40 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <span className="w-2 h-2 rounded-full bg-brand-500" />
                      <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                        Contact Person 1 (Primary - Mandatory)
                      </h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                          Full Name <span className="text-error-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          value={editForm.contact_persons?.[0]?.name || ""}
                          onChange={(e) => handleContactPersonChange(0, "name", e.target.value, true)}
                          placeholder="Mohan Kumar"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold text-slate-700 bg-white"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Email Address</label>
                        <input
                          type="email"
                          value={editForm.contact_persons?.[0]?.email || ""}
                          onChange={(e) => handleContactPersonChange(0, "email", e.target.value, true)}
                          placeholder="mohan@vendor.com"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold text-slate-700 bg-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Mobile Number</label>
                        <input
                          type="text"
                          value={editForm.contact_persons?.[0]?.mobile || ""}
                          onChange={(e) => handleContactPersonChange(0, "mobile", e.target.value, true)}
                          placeholder="9876543210"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold text-slate-700 bg-white"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Desk Number</label>
                        <input
                          type="text"
                          value={editForm.contact_persons?.[0]?.desk_number || ""}
                          onChange={(e) => handleContactPersonChange(0, "desk_number", e.target.value, true)}
                          placeholder="080-1234567"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold text-slate-700 bg-white"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Location</label>
                        <input
                          type="text"
                          value={editForm.contact_persons?.[0]?.location || ""}
                          onChange={(e) => handleContactPersonChange(0, "location", e.target.value, true)}
                          placeholder="Kollam Branch"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold text-slate-700 bg-white"
                        />
                      </div>
                    </div>
                    {editErrors.contact_persons && (
                      <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.contact_persons}</p>
                    )}
                  </div>

                  {/* Contact Person 2 */}
                  <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/40 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      <h5 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                        Contact Person 2 (Secondary - Optional)
                      </h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Full Name</label>
                        <input
                          type="text"
                          value={editForm.contact_persons?.[1]?.name || ""}
                          onChange={(e) => handleContactPersonChange(1, "name", e.target.value, true)}
                          placeholder="Ramesh"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold text-slate-700 bg-white"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Email Address</label>
                        <input
                          type="email"
                          value={editForm.contact_persons?.[1]?.email || ""}
                          onChange={(e) => handleContactPersonChange(1, "email", e.target.value, true)}
                          placeholder="ramesh@vendor.com"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold text-slate-700 bg-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Mobile Number</label>
                        <input
                          type="text"
                          value={editForm.contact_persons?.[1]?.mobile || ""}
                          onChange={(e) => handleContactPersonChange(1, "mobile", e.target.value, true)}
                          placeholder="9876543211"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold text-slate-700 bg-white"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Desk Number</label>
                        <input
                          type="text"
                          value={editForm.contact_persons?.[1]?.desk_number || ""}
                          onChange={(e) => handleContactPersonChange(1, "desk_number", e.target.value, true)}
                          placeholder="080-7654321"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold text-slate-700 bg-white"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">Location</label>
                        <input
                          type="text"
                          value={editForm.contact_persons?.[1]?.location || ""}
                          onChange={(e) => handleContactPersonChange(1, "location", e.target.value, true)}
                          placeholder="Head Office"
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold text-slate-700 bg-white"
                        />
                      </div>
                    </div>
                  </div></div>

                {/* Section 3: Address Details */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
                    <MapPin className="w-5 h-5 text-brand-600" />
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">3. Address Details</h4>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">General / Registered Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                      <textarea
                        value={editForm.address}
                        onChange={(e) => handleEditChange("address", e.target.value)}
                        placeholder="Enter general/registered address..."
                        rows="2"
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none font-semibold text-slate-700"
                      />
                    </div>
                    {editErrors.address && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.address}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Pincode</label>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength="6"
                          value={editForm.pincode}
                          onChange={(e) => handleEditChange("pincode", e.target.value)}
                          placeholder="522001"
                          className="w-full pr-10 px-4 py-2.5 border border-slate-200 hover:border-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700"
                        />
                        {isPincodeLoadingEdit && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                            <Spinner size="sm" />
                          </span>
                        )}
                      </div>
                      {pincodeErrorEdit && (
                        <p className="text-xs text-amber-600 font-semibold mt-1">{pincodeErrorEdit}</p>
                      )}
                      {editErrors.pincode && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.pincode}</p>}
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">City</label>
                      <input
                        type="text"
                        value={editForm.city}
                        onChange={(e) => handleEditChange("city", e.target.value)}
                        placeholder="Guntur"
                        className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">State</label>
                      <input
                        type="text"
                        value={editForm.state}
                        onChange={(e) => handleEditChange("state", e.target.value)}
                        placeholder="Andhra Pradesh"
                        className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Billing Address</label>
                      <textarea
                        value={editForm.billing_address}
                        onChange={(e) => handleEditChange("billing_address", e.target.value)}
                        placeholder="Enter specific billing address..."
                        rows="2"
                        className="w-full px-4 py-2 border border-slate-200 hover:border-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none font-semibold text-slate-700"
                      />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Shipping Address</label>
                        <label className="flex items-center gap-1.5 text-xs text-brand-600 font-bold cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={editSameAsBilling}
                            onChange={(e) => handleEditSameAsBillingToggle(e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 focus:ring-2 focus:ring-offset-0 transition-all cursor-pointer"
                          />
                          Same as Billing
                        </label>
                      </div>
                      <textarea
                        value={editForm.shipping_address}
                        onChange={(e) => handleEditChange("shipping_address", e.target.value)}
                        disabled={editSameAsBilling}
                        placeholder={editSameAsBilling ? "Same as Billing Address" : "Enter specific shipping address..."}
                        rows="2"
                        className={`w-full px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none font-semibold ${editSameAsBilling ? "bg-slate-50 text-slate-500 cursor-not-allowed border-dashed animate-in fade-in duration-200" : "text-slate-700"}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Compliance Registrations */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
                    <ShieldCheck className="w-5 h-5 text-brand-600" />
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">4. Compliance Registrations (Optional)</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {editForm.supplier_type === "business" && (
                      <>
                        <div className="flex flex-col">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">TAN Number</label>
                          <input
                            type="text"
                            placeholder="e.g., ABCD12345E"
                            value={editForm.tan_no}
                            onChange={(e) => handleEditChange("tan_no", e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white uppercase tabular-nums font-semibold text-slate-700"
                          />
                          {editErrors.tan_no && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.tan_no}</p>}
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            CIN Number <span className="text-error-500 font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., U12345AP2026PTC123456"
                            value={editForm.cin}
                            onChange={(e) => handleEditChange("cin", e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white uppercase tabular-nums font-semibold text-slate-700"
                          />
                          {editErrors.cin && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.cin}</p>}
                        </div>
                      </>
                    )}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">MSME Udyam No.</label>
                      <input
                        type="text"
                        placeholder="e.g., UDYAM-AP-01-12345"
                        value={editForm.msme}
                        onChange={(e) => handleEditChange("msme", e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white uppercase tabular-nums font-semibold text-slate-700"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">FSSAI Licence No.</label>
                      <input
                        type="text"
                        placeholder="e.g., 12345678901234"
                        value={editForm.fssai}
                        onChange={(e) => handleEditChange("fssai", e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white tabular-nums font-semibold text-slate-700"
                      />
                      {editErrors.fssai && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.fssai}</p>}
                    </div>
                    {editForm.supplier_type === "business" && (
                      <div className="flex flex-col md:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Import Export Code (IEC)</label>
                        <input
                          type="text"
                          placeholder="e.g., 1234567890"
                          value={editForm.iec}
                          onChange={(e) => handleEditChange("iec", e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white tabular-nums font-semibold text-slate-700"
                        />
                        {editErrors.iec && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.iec}</p>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 5: Bank Details */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
                    <Landmark className="w-5 h-5 text-brand-600" />
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">5. Bank Details (Optional)</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Account Holder Name</label>
                      <input
                        type="text"
                        value={editForm.bank_account_holder_name}
                        onChange={(e) => handleEditChange("bank_account_holder_name", e.target.value)}
                        placeholder="Ramesh Mahindra"
                        className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-semibold text-slate-700"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Bank Name</label>
                      <input
                        type="text"
                        value={editForm.bank_name}
                        onChange={(e) => handleEditChange("bank_name", e.target.value)}
                        placeholder="State Bank of India"
                        className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-semibold text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Account Number</label>
                      <input
                        type="text"
                        value={editForm.bank_account_number}
                        onChange={(e) => handleEditChange("bank_account_number", e.target.value)}
                        placeholder="1234567890"
                        className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white tabular-nums font-semibold text-slate-700"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">IFSC Code</label>
                      <input
                        type="text"
                        value={editForm.bank_ifsc_code}
                        onChange={(e) => handleEditChange("bank_ifsc_code", e.target.value)}
                        placeholder="SBIN0001234"
                        className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white uppercase tabular-nums font-semibold text-slate-700"
                      />
                      {editErrors.bank_ifsc_code && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.bank_ifsc_code}</p>}
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Branch Name</label>
                      <input
                        type="text"
                        value={editForm.bank_branch_name}
                        onChange={(e) => handleEditChange("bank_branch_name", e.target.value)}
                        placeholder="Guntur Main"
                        className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-semibold text-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* KYC Document Section */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-brand-600" />
                      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">KYC Document (optional)</h4>
                    </div>
                    {selectedSupplier?.kyc_document_url && (
                      <div className="flex flex-col items-end">
                        {selectedSupplier.kyc_verified ? (
                          <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                            Verified
                          </span>
                        ) : selectedSupplier.kyc_remarks ? (
                          <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold bg-rose-50 text-rose-700">
                            Rejected
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-700">
                            Pending verification
                          </span>
                        )}
                        {selectedSupplier.kyc_remarks && (
                          <p className="text-xs text-slate-500 mt-1">
                            Remarks: {selectedSupplier.kyc_remarks}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {kycErrorEdit && (
                    <div className="p-3 rounded-xl bg-error-50 border border-error-100 text-error-800 text-xs font-semibold">
                      {kycErrorEdit}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Document Type */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Document Type
                      </label>
                      <select
                        value={editForm.kyc_document_type}
                        onChange={(e) => handleEditChange("kyc_document_type", e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-semibold text-slate-700"
                      >
                        <option value="">Select document type</option>
                        {Object.entries(KYC_DOCUMENT_TYPES).map(([val, label]) => (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Document Number */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Document Number
                      </label>
                      <input
                        type="text"
                        value={editForm.kyc_document_number}
                        onChange={(e) => handleEditChange("kyc_document_number", e.target.value)}
                        placeholder={editForm.kyc_document_type === "aadhaar" ? "Last 4 digits" : "e.g. ABCDE1234F"}
                        maxLength={editForm.kyc_document_type === "aadhaar" ? 4 : undefined}
                        className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white uppercase font-semibold text-slate-700"
                      />
                      {editForm.kyc_document_type === "aadhaar" && (
                        <p className="text-[11px] text-slate-400 mt-1 font-medium leading-tight">
                          Enter only the last 4 digits. Upload a masked Aadhaar (first 8 digits hidden) as per UIDAI guidelines.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Document File Upload */}
                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Document File (.pdf, .jpg, .jpeg, .png, max 5 MB)
                    </label>

                    {editForm.kyc_document_url ? (
                      <div className="flex flex-wrap items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-brand-600 shrink-0" />
                          <span className="text-xs font-bold text-slate-700 truncate">
                            {editForm.kyc_document_name || "KYC Document"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedSupplier?.kyc_document_url && (
                            <button
                              type="button"
                              onClick={handleViewKycDocument}
                              className="text-xs font-bold text-brand-600 hover:text-brand-700 px-2.5 py-1 rounded-lg hover:bg-brand-50 transition-colors"
                            >
                              View document
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveKyc(true)}
                            className="text-xs font-bold text-rose-600 hover:text-rose-700 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-all ${isKycUploadingEdit ? "opacity-50 pointer-events-none" : ""}`}>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleKycFileSelect(e, true)}
                            disabled={isKycUploadingEdit}
                            className="sr-only"
                          />
                          {isKycUploadingEdit ? (
                            <>
                              <Spinner size="xs" />
                              <span>Uploading…</span>
                            </>
                          ) : (
                            <span>Choose File</span>
                          )}
                        </label>
                        {isKycUploadingEdit && (
                          <span className="text-xs font-semibold text-slate-500 animate-pulse">Uploading…</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Verification Actions (when selectedSupplier.kyc_document_url exists) */}
                  {selectedSupplier?.kyc_document_url && (
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex flex-col">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Verification Remarks
                        </label>
                        <input
                          type="text"
                          value={kycRemarks}
                          onChange={(e) => {
                            setKycRemarks(e.target.value)
                            if (kycRemarksError) setKycRemarksError("")
                          }}
                          placeholder="Optional note for verify; required for reject..."
                          className="w-full px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-semibold text-slate-700"
                        />
                        {kycRemarksError && (
                          <p className="text-xs text-error-800 font-semibold mt-1">{kycRemarksError}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!selectedSupplier.kyc_verified && (
                          <button
                            type="button"
                            disabled={isKycVerifying}
                            onClick={() => handleVerifyOrRejectKyc(true)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {isKycVerifying && <Spinner size="xs" />}
                            <span>Mark as verified</span>
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={isKycVerifying}
                          onClick={() => handleVerifyOrRejectKyc(false)}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isKycVerifying && <Spinner size="xs" />}
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 font-medium">
                    Changing the document or number resets verification.
                  </p>
                </div>

                {/* Section 6: Additional Notes */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
                    <BookOpen className="w-5 h-5 text-brand-600" />
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">6. Additional Notes</h4>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Notes</label>
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => handleEditChange("notes", e.target.value)}
                      placeholder="Payment cycles, lead times, or contract agreements..."
                      rows="2"
                      className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none font-semibold text-slate-700"
                    />
                    {editErrors.notes && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.notes}</p>}
                  </div>
                </div>

                {/* Active Status Switch - Immediate trigger */}
                <div className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800">Active Status</span>
                    <span className="text-xs text-slate-500 mt-0.5">Toggle to activate or deactivate this supplier</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editForm.is_active}
                      onChange={(e) => handleToggleActiveStatus(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-100 mt-6 bg-white -mx-6 -mb-6 p-6 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="border border-slate-200 hover:border-slate-400 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 transition-all w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || isKycUploadingEdit}
                    className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
                  >
                    {isSaving ? <Spinner size="sm" /> : null}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </Modal>
      )}

      {/* Deactivate/Delete Warning Confirmation Dialog */}
      {isDeleteOpen && (
        <Modal onClose={() => setIsDeleteOpen(false)}>
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 flex flex-col items-center text-center flex-1 overflow-y-auto">
              <div className="w-12 h-12 bg-error-50 text-error-500 rounded-full flex items-center justify-center mb-4 shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Deactivate Supplier</h3>
              <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
                Are you sure you want to deactivate this supplier? They will no longer be available for new Purchase Orders.
              </p>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end w-full gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDeleteOpen(false)}
                  disabled={isSaving}
                  className="w-full sm:w-auto border border-slate-200 hover:border-slate-300 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isSaving}
                  className="w-full sm:w-auto bg-error-500 hover:bg-error-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-error-500/10 active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {isSaving ? <Spinner size="sm" /> : null}
                  <span>Confirm Deactivate</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default SupplierDirectory
