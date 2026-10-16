import { useState, useEffect, useCallback } from "react"
import { useNavigate, useSearchParams, useLocation } from "react-router-dom"
import {
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  FileText,
  Calculator,
  Check,
  Calendar,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Plus,
  X,
  ShieldAlert,
} from "lucide-react"
import {
  getPurchaseOrderDetails,
  createPurchaseEntry,
  authorizePurchaseEntry,
  getPurchaseEntryDetails,
  getPurchaseEntryFormData,
  previewPurchaseEntry,
} from "@/api/purchases"
import Spinner from "@/components/ui/Spinner"
import Modal from "@/components/ui/Modal"
import useConfirm from "@/hooks/useConfirm"

function parseErrorDetail(detail, defaultMsg) {
  if (!detail) return defaultMsg
  if (Array.isArray(detail)) {
    const messages = detail.map((d) => (typeof d === "string" ? d : d.msg || d.detail)).filter(Boolean)
    return messages.length > 0 ? messages.join(", ") : defaultMsg
  }
  return typeof detail === "string" ? detail : defaultMsg
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
  10: "Bihar",
  11: "Sikkim",
  12: "Arunachal Pradesh",
  13: "Nagaland",
  14: "Manipur",
  15: "Mizoram",
  16: "Tripura",
  17: "Meghalaya",
  18: "Assam",
  19: "West Bengal",
  20: "Jharkhand",
  21: "Odisha",
  22: "Chhattisgarh",
  23: "Madhya Pradesh",
  24: "Gujarat",
  26: "Dadra and Nagar Haveli and Daman and Diu",
  27: "Maharashtra",
  29: "Karnataka",
  30: "Goa",
  31: "Lakshadweep",
  32: "Kerala",
  33: "Tamil Nadu",
  34: "Puducherry",
  35: "Andaman and Nicobar Islands",
  36: "Telangana",
  37: "Andhra Pradesh",
  38: "Ladakh",
  97: "Other Territory",
  98: "Centre Jurisdiction",
}

function CreatePurchaseEntry() {
  const confirm = useConfirm()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const poId = searchParams.get("po_id")
  const peId = searchParams.get("pe_id")

  const [poDetails, setPoDetails] = useState(null)
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().substring(0, 10))
  const [others, setOthers] = useState("")
  const [shipToState, setShipToState] = useState("Andhra Pradesh")
  const [roundingAdjustment, setRoundingAdjustment] = useState("")
  const [warnings, setWarnings] = useState([])
  const [items, setItems] = useState([])

  const [suppliers, setSuppliers] = useState([])
  const [productsList, setProductsList] = useState([])
  const [rawMaterialsList, setRawMaterialsList] = useState([])
  const [selectedSupplierId, setSelectedSupplierId] = useState("")

  const [isLoading, setIsLoading] = useState(true)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showAuthorizeConfirmModal, setShowAuthorizeConfirmModal] = useState(false)
  const [error, setError] = useState("")
  const [validationError, setValidationError] = useState("")
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [overrideReason, setOverrideReason] = useState("")
  const [overrideError, setOverrideError] = useState("")
  const [isOverriding, setIsOverriding] = useState(false)

  const [createdPeId, setCreatedPeId] = useState(null)
  const [previewData, setPreviewData] = useState(null)

  const location = useLocation()
  const [authError, setAuthError] = useState("")

  useEffect(() => {
    if (location.state?.authError) {
      const errorMsg = location.state.authError
      const timer = setTimeout(() => {
        setAuthError(errorMsg)
      }, 0)
      navigate(location.search, { replace: true, state: {} })
      return () => clearTimeout(timer)
    }
  }, [location.state, location.search, navigate])

  const loadPOAndEntryData = useCallback(async () => {
    setIsLoading(true)
    setError("")
    try {
      const formRes = await getPurchaseEntryFormData()
      if (!formRes.ok) throw new Error("Failed to load purchase entry form data")
      const formJson = await formRes.json()
      const bundle = formJson.data

      setSuppliers(bundle.suppliers)
      setProductsList(bundle.products)
      setRawMaterialsList(bundle.raw_materials)

      if (poId) {
        const poRes = await getPurchaseOrderDetails(poId)
        if (!poRes.ok) throw new Error("Failed to load matching Purchase Order details")
        const poJson = await poRes.json()
        const po = poJson.data
        setPoDetails(po)
        setSelectedSupplierId(po.supplier_id || "")

        const poItems = po.items || []
        let initialItems = poItems.map((item) => ({
          id: item.id,
          raw_material_id: item.raw_material_id,
          product_id: item.product_id,
          name: item.raw_material_id
            ? item.raw_material_name || item.raw_material?.name
            : item.product_name || item.product?.name,
          unit_code: item.unit_code,
          po_quantity: item.quantity,
          remaining_quantity: item.remaining_quantity,
          po_unit_price: item.unit_price,
          min_quantity: item.min_quantity,
          max_quantity: item.max_quantity,
          min_unit_price: item.min_unit_price,
          max_unit_price: item.max_unit_price,
          quantity_received: item.remaining_quantity.toString(),
          unit_price: item.unit_price.toString(),
          gst_percent: item.gst_percent !== undefined && item.gst_percent !== null ? item.gst_percent.toString() : "",
          gst_amount: item.gst_amount !== undefined && item.gst_amount !== null ? item.gst_amount.toString() : "",
          batch_number: "",
          batch_date: new Date().toISOString().substring(0, 10),
          expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().substring(0, 10),
        }))

        if (peId) {
          const peRes = await getPurchaseEntryDetails(peId)
          if (!peRes.ok) throw new Error("Failed to load draft purchase entry")
          const existingPe = (await peRes.json()).data

          if (existingPe) {
            setCreatedPeId(existingPe.id)
            setInvoiceNumber(existingPe.invoice_number || "")
            if (existingPe.others !== undefined) setOthers(existingPe.others.toString())
            if (existingPe.rounding_adjustment !== undefined && existingPe.rounding_adjustment !== null) {
              setRoundingAdjustment(existingPe.rounding_adjustment.toString())
            }
            if (existingPe.ship_to_state) setShipToState(existingPe.ship_to_state)
            if (existingPe.invoice_date) {
              setInvoiceDate(existingPe.invoice_date.substring(0, 10))
            }

            initialItems = initialItems.map((poItem) => {
              const peItem = existingPe.items?.find(
                (pi) =>
                  (poItem.raw_material_id && pi.raw_material_id === poItem.raw_material_id) ||
                  (poItem.product_id && pi.product_id === poItem.product_id)
              )
              if (peItem) {
                return {
                  ...poItem,
                  quantity_received: peItem.quantity_received.toString(),
                  unit_price: peItem.unit_price.toString(),
                  gst_percent:
                    peItem.gst_percent !== undefined && peItem.gst_percent !== null
                      ? peItem.gst_percent.toString()
                      : poItem.gst_percent || "",
                  gst_amount:
                    peItem.gst_amount !== undefined && peItem.gst_amount !== null
                      ? peItem.gst_amount.toString()
                      : poItem.gst_amount || "",
                  batch_number: peItem.batch_number || "",
                  batch_date: peItem.batch_date
                    ? peItem.batch_date.substring(0, 10)
                    : new Date().toISOString().substring(0, 10),
                  expiry_date: peItem.expiry_date
                    ? peItem.expiry_date.substring(0, 10)
                    : new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().substring(0, 10),
                }
              }
              return poItem
            })
            setPreviewData(existingPe)
          }
        }
        setItems(initialItems)
      } else {
        if (peId) {
          const peRes = await getPurchaseEntryDetails(peId)
          if (!peRes.ok) throw new Error("Failed to load draft purchase entry")
          const existingPe = (await peRes.json()).data

          if (existingPe) {
            setCreatedPeId(existingPe.id)
            setSelectedSupplierId(existingPe.supplier_id || "")
            setInvoiceNumber(existingPe.invoice_number || "")
            if (existingPe.others !== undefined) setOthers(existingPe.others.toString())
            if (existingPe.rounding_adjustment !== undefined && existingPe.rounding_adjustment !== null) {
              setRoundingAdjustment(existingPe.rounding_adjustment.toString())
            }
            if (existingPe.ship_to_state) setShipToState(existingPe.ship_to_state)
            if (existingPe.invoice_date) {
              setInvoiceDate(existingPe.invoice_date.substring(0, 10))
            }

            const mappedItems = (existingPe.items || []).map((peItem, index) => {
              const isRM = !!peItem.raw_material_id
              const itemName = isRM
                ? peItem.raw_material_name || peItem.raw_material?.name || "Raw Material"
                : peItem.product_name || peItem.product?.name || "Finished Product"

              return {
                id: `direct-${index}-${Date.now()}`,
                raw_material_id: peItem.raw_material_id,
                product_id: peItem.product_id,
                name: itemName,
                unit_code: peItem.unit_code,
                po_quantity: null,
                po_unit_price: null,
                quantity_received: peItem.quantity_received.toString(),
                unit_price: peItem.unit_price.toString(),
                gst_percent:
                  peItem.gst_percent !== undefined && peItem.gst_percent !== null ? peItem.gst_percent.toString() : "",
                gst_amount:
                  peItem.gst_amount !== undefined && peItem.gst_amount !== null ? peItem.gst_amount.toString() : "",
                batch_number: peItem.batch_number || "",
                batch_date: peItem.batch_date
                  ? peItem.batch_date.substring(0, 10)
                  : new Date().toISOString().substring(0, 10),
                expiry_date: peItem.expiry_date
                  ? peItem.expiry_date.substring(0, 10)
                  : new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().substring(0, 10),
                _type: isRM ? "raw_material" : "product",
              }
            })
            setItems(mappedItems)
            setPreviewData(existingPe)
          }
        } else {
          setItems([])
        }
      }
    } catch (err) {
      setError(err.message || "An error occurred while preparing form data.")
    } finally {
      setIsLoading(false)
    }
  }, [poId, peId])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPOAndEntryData()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadPOAndEntryData])

  const handleItemChange = (itemId, field, value) => {
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)))
    setValidationError("")
    if (previewData) {
      setPreviewData(null)
    }
    setWarnings([])
  }

  const handleAddDirectItem = () => {
    const newItem = {
      id: `direct-new-${Date.now()}-${Math.random()}`,
      raw_material_id: "",
      product_id: "",
      name: "",
      unit_code: "",
      po_quantity: null,
      po_unit_price: null,
      quantity_received: "",
      unit_price: "",
      gst_percent: "",
      gst_amount: "",
      batch_number: "",
      batch_date: new Date().toISOString().substring(0, 10),
      expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().substring(0, 10),
      _type: "raw_material",
    }
    setItems((prev) => [...prev, newItem])
    if (previewData) setPreviewData(null)
    setWarnings([])
  }

  const handleRemoveDirectItem = (itemId) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId))
    if (previewData) setPreviewData(null)
    setWarnings([])
  }

  const handleItemTypeChange = (itemId, newType) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        return {
          ...item,
          _type: newType,
          raw_material_id: null,
          product_id: null,
          name: "",
          unit_code: "",
          gst_percent: "",
          gst_amount: "",
        }
      })
    )
    if (previewData) setPreviewData(null)
    setWarnings([])
  }

  const handleDirectItemSelect = (itemId, type, selectedId) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item

        if (type === "raw_material") {
          const rm = rawMaterialsList.find((r) => r.id === selectedId)
          return {
            ...item,
            raw_material_id: selectedId,
            product_id: null,
            name: rm ? rm.name : "",
            unit_code: rm ? rm.unit_code : "",
            gst_percent: rm
              ? rm.gst_percent !== undefined && rm.gst_percent !== null
                ? rm.gst_percent.toString()
                : ""
              : "",
            gst_amount: "",
          }
        } else {
          const prod = productsList.find((p) => p.id === selectedId)
          return {
            ...item,
            raw_material_id: null,
            product_id: selectedId,
            name: prod ? prod.name : "",
            unit_code: prod ? prod.unit_code : "",
            gst_percent: prod
              ? prod.gst_percent !== undefined && prod.gst_percent !== null
                ? prod.gst_percent.toString()
                : ""
              : "",
            gst_amount: "",
          }
        }
      })
    )
    if (previewData) setPreviewData(null)
    setWarnings([])
  }

  const validateForm = (isPreview = false) => {
    if (!poId && !selectedSupplierId) {
      return "Supplier selection is required for Direct Purchase receipts."
    }
    if (!isPreview && !invoiceNumber.trim()) {
      return "Supplier Invoice Number is required."
    }
    if (items.length === 0) {
      return "No items to receive. Please add at least one item row."
    }
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!poId && !item.raw_material_id && !item.product_id) {
        return `Please select a product or raw material for Item #${i + 1}.`
      }
      const displayName = item.name || `Item #${i + 1}`
      const qty = parseFloat(item.quantity_received)
      if (isNaN(qty) || qty < 0) {
        return `Received quantity for "${displayName}" must be 0 or more.`
      }
      const price = parseFloat(item.unit_price)
      if (isNaN(price) || price < 0) {
        return `Unit price for "${displayName}" must be a positive number.`
      }
      if (!item.batch_date) {
        return `Batch date is required for "${displayName}".`
      }
      if (!item.expiry_date) {
        return `Expiry date is required for "${displayName}".`
      }
      if (new Date(item.batch_date) > new Date(item.expiry_date)) {
        return `Batch date cannot be after expiry date for "${displayName}".`
      }
    }
    return ""
  }

  const handlePreviewTax = async (e) => {
    e.preventDefault()
    setValidationError("")

    if (poDetails?.status === "cancelled") {
      setValidationError("This Purchase Order is cancelled. Deliveries cannot be logged.")
      return
    }

    const validationMsg = validateForm(true)
    if (validationMsg) {
      setValidationError(validationMsg)
      return
    }

    setIsSavingDraft(true)
    try {
      const formattedItems = items.map((item) => ({
        raw_material_id: item.raw_material_id || null,
        product_id: item.product_id || null,
        quantity_received: parseFloat(item.quantity_received) || 0,
        unit_price: parseFloat(item.unit_price) || 0,
        gst_percent: item.gst_percent ? parseFloat(item.gst_percent) : null,
        gst_amount: item.gst_amount ? parseFloat(item.gst_amount) : null,
        batch_number: (item.batch_number || "").trim() || "",
        batch_date: item.batch_date ? `${item.batch_date}T12:00:00Z` : new Date().toISOString(),
        expiry_date: item.expiry_date ? `${item.expiry_date}T12:00:00Z` : new Date().toISOString(),
      }))

      const payload = {
        po_id: poId || null,
        supplier_id: poId ? null : selectedSupplierId,
        invoice_number: null,
        invoice_date: null,
        others: parseFloat(others) || 0,
        rounding_adjustment: parseFloat(roundingAdjustment) || 0,
        ship_to_state: shipToState,
        items: formattedItems,
      }

      const res = await previewPurchaseEntry(payload)
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}))
        throw new Error(errorJson.message || "Failed to calculate tax preview.")
      }

      const json = await res.json()
      const previewResponse = json.data || json

      setWarnings(previewResponse.warnings || [])

      const peIdForPreview = createdPeId && createdPeId !== "client-preview" ? createdPeId : "client-preview"

      const apiPreview = {
        ...previewResponse,
        id: peIdForPreview,
        status: "draft",
        po_id: poId || null,
        supplier_id: poId ? null : selectedSupplierId,
        invoice_number: invoiceNumber.trim(),
        invoice_date: invoiceDate ? new Date(invoiceDate + "T12:00:00Z").toISOString() : null,
        others: parseFloat(others) || 0,
      }

      if (!createdPeId || createdPeId === "client-preview") {
        setCreatedPeId("client-preview")
      }
      setPreviewData(apiPreview)
    } catch (err) {
      setValidationError(err.message || "Something went wrong previewing tax details.")
    } finally {
      setIsSavingDraft(false)
    }
  }

  const submitDraftToBackend = async () => {
    if (createdPeId && createdPeId !== "client-preview") {
      return createdPeId
    }

    const formattedItems = items.map((item) => ({
      raw_material_id: item.raw_material_id || null,
      product_id: item.product_id || null,
      quantity_received: parseFloat(item.quantity_received),
      unit_price: parseFloat(item.unit_price),
      gst_percent: item.gst_percent ? parseFloat(item.gst_percent) : null,
      gst_amount: item.gst_amount ? parseFloat(item.gst_amount) : null,
      batch_number: (item.batch_number || "").trim(),
      batch_date: `${item.batch_date}T12:00:00Z`,
      expiry_date: `${item.expiry_date}T12:00:00Z`,
    }))

    const isoInvoiceDate = new Date(invoiceDate + "T12:00:00Z").toISOString()

    const payload = {
      po_id: poId || null,
      supplier_id: poId ? null : selectedSupplierId,
      invoice_number: invoiceNumber.trim(),
      invoice_date: isoInvoiceDate,
      others: parseFloat(others) || 0,
      rounding_adjustment: parseFloat(roundingAdjustment) || 0,
      ship_to_state: shipToState,
      items: formattedItems,
    }

    const res = await createPurchaseEntry(payload)
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}))
      throw new Error(errorJson.message || "Failed to save draft purchase entry.")
    }

    const json = await res.json()
    if (json.data?.warnings) {
      setWarnings(json.data.warnings || [])
    } else if (json.warnings) {
      setWarnings(json.warnings || [])
    }
    setCreatedPeId(json.data.id)
    return json.data.id
  }

  const handleSaveAsDraft = async () => {
    setValidationError("")
    if (!invoiceNumber.trim()) {
      setValidationError("Supplier Invoice Number is required to save draft.")
      return
    }

    const ok = await confirm({
      title: `Save draft for invoice ${invoiceNumber.trim()}?`,
      message: "This will save the purchase entry as draft without committing to stock.",
      confirmLabel: "Save Draft",
    })
    if (!ok) return

    setIsSavingDraft(true)
    try {
      await submitDraftToBackend()
      navigate("/purchase/orders")
    } catch (err) {
      setValidationError(err.message || "Failed to save draft.")
    } finally {
      setIsSavingDraft(false)
    }
  }
  const handleAuthorizeAndCommit = async () => {
    setShowAuthorizeConfirmModal(false)
    setValidationError("")
    setAuthError("")
    if (!invoiceNumber.trim()) {
      setValidationError("Supplier Invoice Number is required to authorize.")
      return
    }
    setIsAuthorizing(true)
    let draftPeId
    try {
      draftPeId = await submitDraftToBackend()
    } catch (err) {
      setValidationError(err.message || "Failed to save draft purchase entry.")
      setIsAuthorizing(false)
      return
    }

    try {
      const res = await authorizePurchaseEntry(draftPeId, {})
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}))
        const errorMsg = parseErrorDetail(errorJson.detail, errorJson.message || "Failed to authorize purchase entry.")
        throw new Error(errorMsg)
      }
      setShowSuccessModal(true)
    } catch (err) {
      const errorMessage = err.message || "Authorization failed."
      const redirectUrl = `/purchase/entries/create?${poId ? `po_id=${poId}&` : ""}pe_id=${draftPeId}`
      navigate(redirectUrl, {
        replace: true,
        state: { authError: errorMessage },
      })
    } finally {
      setIsAuthorizing(false)
    }
  }

  const handleSuccessConfirm = () => {
    setShowSuccessModal(false)
    navigate("/purchase/orders")
  }

  const handleOverrideSubmit = async (e) => {
    e.preventDefault()
    if (!overrideReason.trim()) {
      setOverrideError("Please provide an override authorization reason.")
      return
    }

    const ok = await confirm({
      title: "Force authorize purchase entry?",
      message:
        "This will bypass tolerance thresholds, commit goods to warehouse stock, and record an audit justification.",
      confirmLabel: "Force Authorize",
      tone: "danger",
    })
    if (!ok) return

    setIsOverriding(true)
    setOverrideError("")
    const targetId = peId || createdPeId

    try {
      const res = await authorizePurchaseEntry(targetId, {
        is_force_authorized: true,
        authorization_reason: overrideReason.trim(),
      })
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}))
        const errorMsg = parseErrorDetail(errorJson.detail, errorJson.message || "Failed to authorize purchase entry.")
        throw new Error(errorMsg)
      }
      setShowOverrideModal(false)
      setAuthError("")
      setShowSuccessModal(true)
    } catch (err) {
      setOverrideError(err.message || "Override authorization failed.")
    } finally {
      setIsOverriding(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-12 h-12 text-error-500 animate-bounce" />
        <h3 className="text-lg font-bold text-slate-900">Failed to Record Receipt</h3>
        <p className="text-sm font-semibold text-slate-500">{error}</p>
        <button
          onClick={() => navigate("/purchase/orders")}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-md shadow-brand-500/10"
        >
          Return to Orders
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(peId ? "/purchase/entries" : "/purchase/orders")}
          className="p-2 border border-slate-200 hover:border-slate-300 hover:bg-white rounded-xl text-slate-500 hover:text-slate-800 transition-all active:scale-95"
          title="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Record Goods Receipt (GRN)</h2>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Match invoice specs and confirm physical items arrival in stock catalog.
          </p>
        </div>
      </div>

      {authError && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3.5 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm font-semibold text-amber-950 animate-in slide-in-from-top-2 duration-200 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-extrabold text-amber-950">Authorization Alert</h4>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">{authError}</p>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-0 shrink-0">
            {(authError.toLowerCase().includes("tolerance") ||
              authError.toLowerCase().includes("exceed") ||
              authError.toLowerCase().includes("deviation")) && (
              <button
                onClick={() => {
                  setOverrideReason("")
                  setOverrideError("")
                  setShowOverrideModal(true)
                }}
                className="text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-1.5 rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Force Authorize</span>
              </button>
            )}
            <button
              onClick={() => setAuthError("")}
              className="text-xs font-bold text-amber-600 hover:text-amber-800 transition-all hover:bg-amber-100/50 px-2.5 py-1.5 rounded-xl"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {poDetails ? (
        <div className="bg-slate-100/60 border border-slate-200/50 rounded-2xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-700">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Ref Purchase Order
            </span>
            <span className="text-sm font-bold text-brand-700 tabular-nums mt-1 block">{poDetails.po_number}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Supplier</span>
            <span className="text-sm font-bold text-slate-800 uppercase mt-1 block">
              {poDetails.supplier_name || poDetails.supplier?.name}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">PO Date</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">
              {new Date(poDetails.created_at).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total PO Items</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">
              {poDetails.items?.length || 0} items ordered
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
              Select Supplier <span className="text-error-500 font-bold">*</span>
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => {
                setSelectedSupplierId(e.target.value)
                if (previewData) setPreviewData(null)
              }}
              disabled={!!createdPeId}
              className="w-full max-w-md px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white transition-all font-semibold text-slate-700 disabled:bg-slate-50 disabled:cursor-not-allowed"
            >
              <option value="">Choose Supplier...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.contact_name || "—"}
                </option>
              ))}
            </select>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-xs font-semibold text-indigo-800 self-start md:self-center">
            <span>Direct Purchase Mode</span>
            <p className="text-[10px] text-indigo-600 mt-0.5">
              Logging inventory receipt without linking a prior Purchase Order.
            </p>
          </div>
        </div>
      )}

      {poDetails?.status === "cancelled" && (
        <div className="flex items-start gap-2.5 p-4 bg-error-50 border border-error-100 rounded-xl text-sm font-semibold text-error-800 animate-in fade-in duration-200">
          <XCircle className="w-5 h-5 text-error-500 shrink-0" />
          <p className="flex-1">
            This Purchase Order is cancelled. Deliveries cannot be logged, modified, or authorized for cancelled POs.
          </p>
        </div>
      )}

      {validationError && (
        <div className="flex items-start gap-2.5 p-4 bg-error-50 border border-error-100 rounded-xl text-sm font-semibold text-error-800 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-error-500 shrink-0" />
          <p className="flex-1">{validationError}</p>
        </div>
      )}

      {warnings && warnings.length > 0 && (
        <div className="flex flex-col gap-2 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-semibold text-amber-900 animate-in slide-in-from-top-2 duration-200 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <h4 className="font-extrabold text-amber-950 text-sm">Discrepancy Warnings & Tax Mismatches</h4>
          </div>
          <ul className="list-disc pl-5 space-y-1 mt-1 text-[11px] text-amber-800">
            {warnings.map((warn, wIdx) => (
              <li key={wIdx} className="font-medium">
                {warn}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handlePreviewTax} className="space-y-6">
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Supplier Invoice Number <span className="text-error-500 font-bold">*</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                disabled={poDetails?.status === "cancelled"}
                value={invoiceNumber}
                onChange={(e) => {
                  setInvoiceNumber(e.target.value)
                  if (previewData) setPreviewData(null)
                  setWarnings([])
                }}
                placeholder="E.g., INV/2026/089"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700 disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Invoice Date</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="date"
                disabled={poDetails?.status === "cancelled"}
                value={invoiceDate}
                onChange={(e) => {
                  setInvoiceDate(e.target.value)
                  if (previewData) setPreviewData(null)
                  setWarnings([])
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700 disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Others / Shipping Charges (INR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold tabular-nums">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                disabled={poDetails?.status === "cancelled"}
                value={others}
                onChange={(e) => {
                  setOthers(e.target.value)
                  if (previewData) setPreviewData(null)
                  setWarnings([])
                }}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700 disabled:bg-slate-50 disabled:cursor-not-allowed tabular-nums"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Place of Supply (Ship To State) <span className="text-error-500 font-bold">*</span>
            </label>
            <select
              value={shipToState}
              disabled={poDetails?.status === "cancelled"}
              onChange={(e) => {
                setShipToState(e.target.value)
                if (previewData) setPreviewData(null)
                setWarnings([])
              }}
              className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white transition-all font-semibold text-slate-700 disabled:bg-slate-50 disabled:cursor-not-allowed"
            >
              {Object.values(GSTIN_STATE_MAP).map((stateName) => (
                <option key={stateName} value={stateName}>
                  {stateName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white border border-slate-100 shadow-md rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm tracking-tight border-b border-slate-100 pb-3 flex items-center gap-1.5">
            <ClipboardCheck className="w-4 h-4 text-slate-400" />
            <span>Match Arriving Quantities</span>
          </h3>

          <div className="divide-y divide-slate-100">
            {items.map((row, index) => {
              const qtyRecv = parseFloat(row.quantity_received) || 0
              const uPrice = parseFloat(row.unit_price) || 0
              const isRM = !!row.raw_material_id

              const isQtyWarning =
                poDetails && row.min_quantity != null ? qtyRecv < row.min_quantity || qtyRecv > row.max_quantity : false
              const isPriceWarning =
                poDetails && row.min_unit_price != null
                  ? uPrice < row.min_unit_price || uPrice > row.max_unit_price
                  : false

              const poQty = parseFloat(row.po_quantity) || 0
              const poPrice = parseFloat(row.po_unit_price) || 0

              return (
                <div key={row.id} className="py-4">
                  <div className="flex flex-wrap gap-3 items-start justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {poDetails ? (
                        <>
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${isRM ? "bg-amber-400" : "bg-blue-400"}`}
                          />
                          <div className="min-w-0">
                            <p
                              className="font-bold text-slate-900 leading-snug truncate"
                              title={row.name || "Unknown Item"}
                            >
                              {row.name || "Unknown Item"}
                            </p>
                            <p className="text-[9px] text-slate-400 font-bold mt-0.5 truncate">
                              Type: {isRM ? "Raw Material" : "Finished Product"}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col gap-2 min-w-0">
                          <div className="flex gap-2.5 flex-wrap">
                            <label className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 cursor-pointer">
                              <input
                                type="radio"
                                name={`item-type-${row.id}`}
                                value="raw_material"
                                checked={row._type !== "product"}
                                onChange={() => handleItemTypeChange(row.id, "raw_material")}
                                className="text-brand-600 focus:ring-brand-500 w-3 h-3"
                              />
                              <span>Raw</span>
                            </label>
                            <label className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 cursor-pointer">
                              <input
                                type="radio"
                                name={`item-type-${row.id}`}
                                value="product"
                                checked={row._type === "product"}
                                onChange={() => handleItemTypeChange(row.id, "product")}
                                className="text-brand-600 focus:ring-brand-500 w-3 h-3"
                              />
                              <span>Finished</span>
                            </label>
                          </div>

                          {row._type !== "product" ? (
                            <select
                              value={row.raw_material_id || ""}
                              onChange={(e) => handleDirectItemSelect(row.id, "raw_material", e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-200 hover:border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-semibold text-slate-700 truncate"
                            >
                              <option value="">Select Raw Material...</option>
                              {rawMaterialsList.map((rm) => (
                                <option key={rm.id} value={rm.id}>
                                  {rm.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <select
                              value={row.product_id || ""}
                              onChange={(e) => handleDirectItemSelect(row.id, "product", e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-200 hover:border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-semibold text-slate-700 truncate"
                            >
                              <option value="">Select Finished Product...</option>
                              {productsList.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </div>

                    {poDetails && (
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-500">
                          Ordered {poQty.toFixed(2)} {row.unit_code} @ ₹{poPrice.toFixed(2)}
                        </span>
                        {row.min_quantity != null && (
                          <span className="text-[11px] text-slate-400">
                            Allowed {row.min_quantity} – {row.max_quantity} {row.unit_code}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold tabular-nums text-slate-900">
                          {previewData?.items?.[index]?.subtotal != null
                            ? `₹${Number(previewData.items[index].subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                            : "—"}
                        </span>
                        {!poDetails && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDirectItem(row.id)}
                            className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-xl transition-all active:scale-90"
                            title="Remove Item Row"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {isQtyWarning ? (
                        <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-700">
                          Qty outside limit
                        </span>
                      ) : isPriceWarning ? (
                        <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-700">
                          Price differs
                        </span>
                      ) : poDetails ? (
                        <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                          Matches PO
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
                    <div className="flex flex-col min-w-0">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Qty Received
                      </label>
                      <div className="relative w-full min-w-0">
                        <input
                          type="number"
                          step="0.0001"
                          disabled={poDetails?.status === "cancelled"}
                          value={row.quantity_received}
                          onChange={(e) => handleItemChange(row.id, "quantity_received", e.target.value)}
                          className={`w-full pl-2.5 pr-9 py-1.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            isQtyWarning
                              ? "border-error-100 bg-error-50/20 font-bold"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 select-none">
                          {row.unit_code}
                        </span>
                      </div>
                      {qtyRecv > 0 && isQtyWarning && (
                        <p className="text-[9px] text-error-800 font-bold mt-1 text-right animate-pulse">
                          ⚠️ Outside tolerance
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Unit Price
                      </label>
                      <div className="relative w-full min-w-0">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold tabular-nums">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          disabled={poDetails?.status === "cancelled"}
                          value={row.unit_price}
                          onChange={(e) => handleItemChange(row.id, "unit_price", e.target.value)}
                          className={`w-full pl-5 pr-2 py-1.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700 text-right tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            isPriceWarning
                              ? "border-error-100 bg-error-50/20 font-bold"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        />
                      </div>
                      {uPrice > 0 && isPriceWarning && (
                        <p className="text-[9px] text-error-800 font-bold mt-1 text-right animate-pulse">
                          ⚠️ Outside tolerance
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        GST %
                      </label>
                      <div className="relative w-full min-w-0">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          disabled={poDetails?.status === "cancelled"}
                          value={row.gst_percent}
                          onChange={(e) => handleItemChange(row.id, "gst_percent", e.target.value)}
                          placeholder="GST %"
                          className="w-full pl-2 pr-5 py-1.5 border border-slate-200 hover:border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 select-none">
                          %
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        GST Amt
                      </label>
                      <div className="relative w-full min-w-0">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold tabular-nums">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          disabled={poDetails?.status === "cancelled"}
                          value={row.gst_amount}
                          onChange={(e) => handleItemChange(row.id, "gst_amount", e.target.value)}
                          placeholder="Auto"
                          className="w-full pl-5 pr-2 py-1.5 border border-slate-200 hover:border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700 text-right tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Batch Date
                      </label>
                      <div className="w-full min-w-0">
                        <input
                          type="date"
                          disabled={poDetails?.status === "cancelled"}
                          value={row.batch_date}
                          onChange={(e) => handleItemChange(row.id, "batch_date", e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 hover:border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Expiry Date
                      </label>
                      <div className="w-full min-w-0">
                        <input
                          type="date"
                          disabled={poDetails?.status === "cancelled"}
                          value={row.expiry_date}
                          onChange={(e) => handleItemChange(row.id, "expiry_date", e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 hover:border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="border-t border-slate-100 pt-4 mt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">{items.length} items</span>
              {!poDetails && (
                <button
                  type="button"
                  onClick={handleAddDirectItem}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 bg-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-500" />
                  <span>Add Item Row</span>
                </button>
              )}
            </div>

            {!previewData && (
              <button
                type="submit"
                disabled={isSavingDraft || poDetails?.status === "cancelled"}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                {isSavingDraft ? (
                  <>
                    <Spinner size="xs" />
                    <span>Saving draft entry...</span>
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4" />
                    <span>Preview Tax & Totals</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>

      {previewData && (
        <div className="bg-white border border-slate-100 shadow-xl rounded-2xl p-6 space-y-6 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex justify-start">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 w-full max-w-md space-y-3 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
                Tax Summary Details
              </h4>

              <div className="space-y-1.5 text-xs font-semibold text-slate-600">
                <div className="flex justify-between">
                  <span>Taxable Subtotal</span>
                  <span className="tabular-nums text-slate-800 font-bold">
                    {previewData.taxable_subtotal != null
                      ? `₹${Number(previewData.taxable_subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                      : "—"}
                  </span>
                </div>

                {previewData.is_interstate ? (
                  <div className="flex justify-between">
                    <span>IGST Amount</span>
                    <span className="tabular-nums text-slate-800 font-bold">
                      {previewData.igst_amount != null
                        ? `₹${Number(previewData.igst_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>CGST Amount</span>
                      <span className="tabular-nums text-slate-800 font-bold">
                        {previewData.cgst_amount != null
                          ? `₹${Number(previewData.cgst_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST Amount</span>
                      <span className="tabular-nums text-slate-800 font-bold">
                        {previewData.sgst_amount != null
                          ? `₹${Number(previewData.sgst_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                          : "—"}
                      </span>
                    </div>
                  </>
                )}

                {parseFloat(previewData.total_cess || previewData.cess_amount || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Cess Amount</span>
                    <span className="tabular-nums text-slate-800 font-bold">
                      {(previewData.total_cess ?? previewData.cess_amount) != null
                        ? `₹${Number(previewData.total_cess ?? previewData.cess_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </span>
                  </div>
                )}

                {parseFloat(previewData.others || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Shipping / Other Charges</span>
                    <span className="tabular-nums text-slate-800 font-bold">
                      {previewData.others != null
                        ? `₹${Number(previewData.others).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </span>
                  </div>
                )}

                {parseFloat(previewData.rounding_adjustment || 0) !== 0 && (
                  <div className="flex justify-between">
                    <span>Rounding Adjustment</span>
                    <span className="tabular-nums text-slate-800 font-bold">
                      {previewData.rounding_adjustment != null
                        ? `₹${Number(previewData.rounding_adjustment).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </span>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-slate-800">
                  <span>Grand Total</span>
                  <span className="tabular-nums text-brand-700 text-base">
                    {previewData.total_amount != null
                      ? `₹${Number(previewData.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100 pt-4 bg-slate-50/50 p-4 -m-6 rounded-b-2xl mt-4">
            <button
              onClick={() => setPreviewData(null)}
              disabled={isAuthorizing}
              className="px-4 py-2.5 border border-slate-200 hover:border-slate-300 hover:bg-white rounded-xl text-xs font-bold text-slate-600 transition-all active:scale-95 w-full sm:w-auto"
            >
              Re-edit Quantities
            </button>

            {previewData.status === "draft" && (
              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={handleSaveAsDraft}
                  disabled={isSavingDraft || isAuthorizing || poDetails?.status === "cancelled"}
                  className="px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 w-full sm:w-auto"
                >
                  {isSavingDraft ? <Spinner size="xs" /> : null}
                  <span>Save Draft Only</span>
                </button>
                <button
                  onClick={() => setShowAuthorizeConfirmModal(true)}
                  disabled={isSavingDraft || isAuthorizing || poDetails?.status === "cancelled"}
                  className="px-5 py-2.5 bg-success-500 hover:bg-success-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-success-500/10 active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 w-full sm:w-auto"
                >
                  {isAuthorizing ? (
                    <>
                      <Spinner size="xs" />
                      <span>Committing Stock...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Authorize & Commit to Stock</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showSuccessModal && (
        <Modal onClose={handleSuccessConfirm} zIndex="z-[100]">
          <div className="bg-white border border-slate-100 shadow-2xl rounded-3xl w-full max-w-sm max-h-[90vh] flex flex-col overflow-hidden p-8 text-center items-center space-y-5">
            <div className="w-16 h-16 bg-success-50 text-success-500 rounded-full flex items-center justify-center border-2 border-success-100 animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-success-500" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Stock Authorized Successfully!</h3>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                The Goods Receipt Note (GRN) has been locked. Received items have been successfully committed and added
                to warehouse balances.
              </p>
            </div>

            <button
              onClick={handleSuccessConfirm}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold transition-all active:scale-95 shadow-md shadow-brand-500/10"
            >
              Back to Dashboard
            </button>
          </div>
        </Modal>
      )}

      {showOverrideModal && (
        <Modal
          onClose={() => {
            setShowOverrideModal(false)
            setOverrideReason("")
            setOverrideError("")
          }}
          zIndex="z-[100]"
        >
          <div className="bg-white border border-slate-100 shadow-2xl rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-100 p-6 pb-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Authorization Gated Override</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Manager Bypass Protocol</p>
              </div>
            </div>

            <form onSubmit={handleOverrideSubmit} className="p-6 pt-3 space-y-4 overflow-y-auto flex-1 flex flex-col">
              <div className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-2xl text-xs font-semibold text-amber-900 leading-relaxed">
                ⚠️ <strong>Tolerance Limits Exceeded:</strong> The received quantities/prices in this Goods Receipt
                exceed the 5% threshold compared to the original PO. To proceed, a manager must explicitly
                force-authorize this entry and record an audit justification.
              </div>

              {overrideError && (
                <div className="p-3 bg-error-50 border border-error-100 text-error-800 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-error-500 shrink-0" />
                  <span>{overrideError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Authorization Override Reason <span className="text-error-500 font-bold">*</span>
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Approved by Warehouse Manager. Received excess items due to vendor promotion."
                  className="w-full px-3.5 py-2.5 border border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none transition-all resize-none min-h-[80px]"
                  maxLength={255}
                  required
                />
                <span className="text-[10px] text-slate-400 font-bold tracking-wide text-right block mt-0.5">
                  {255 - overrideReason.length} characters remaining
                </span>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowOverrideModal(false)
                    setOverrideReason("")
                    setOverrideError("")
                  }}
                  disabled={isOverriding}
                  className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isOverriding || !overrideReason.trim()}
                  className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold transition-all active:scale-95 shadow-md shadow-amber-500/10 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isOverriding ? (
                    <>
                      <Spinner size="xs" />
                      <span>Overriding...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Force Authorize</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {showAuthorizeConfirmModal && (
        <Modal onClose={() => setShowAuthorizeConfirmModal(false)} zIndex="z-[60]">
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <ShieldAlert className="w-4.5 h-4.5 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Confirm Stock Authorization</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthorizeConfirmModal(false)}
                disabled={isAuthorizing}
                className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3 overflow-y-auto">
              <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                Are you sure you want to authorize and commit this Purchase Entry to warehouse stock?
              </p>
              <p className="text-xs text-slate-500 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                This will finalize inventory receipts, update batch numbers, and log ledger transactions across the
                warehouse.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 bg-slate-50/50 shrink-0">
              <button
                type="button"
                onClick={() => setShowAuthorizeConfirmModal(false)}
                disabled={isAuthorizing}
                className="border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 transition-all bg-white disabled:opacity-50 w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAuthorizeAndCommit}
                disabled={isAuthorizing}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
              >
                {isAuthorizing ? <Spinner size="sm" /> : null}
                <span>{isAuthorizing ? "Committing..." : "Confirm & Commit Stock"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default CreatePurchaseEntry
