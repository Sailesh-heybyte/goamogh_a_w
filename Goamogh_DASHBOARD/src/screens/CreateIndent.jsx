import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  Save,
  Layers3,
  Calculator,
  MapPin
} from "lucide-react"
import { getIndentDetails, createIndent, updateIndent, previewIndent } from "@/api/indents"
import { searchCustomerByPhone } from "@/api/customers"
import { getPricingPanel } from "@/api/products"
import Spinner from "@/components/ui/Spinner"
import useConfirm from "@/hooks/useConfirm"
import { INDIAN_STATES } from "@/utils/indianStates"

function parseErrorDetail(detail, defaultMsg) {
  if (!detail) return defaultMsg
  if (Array.isArray(detail)) {
    const messages = detail.map((d) => d.msg).filter(Boolean)
    return messages.length > 0 ? messages.join(", ") : defaultMsg
  }
  return typeof detail === "string" ? detail : defaultMsg
}

function CreateIndent() {
  const confirm = useConfirm()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = !!id

  // Form State
  const [phone, setPhone] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerState, setCustomerState] = useState("")
  const [customerGstin, setCustomerGstin] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [isB2b, setIsB2b] = useState(false)
  const [addressId, setAddressId] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState([])
  const [showPreview, setShowPreview] = useState(false)

  // UI lists and loaders
  const [variantsList, setVariantsList] = useState([])
  const [customerAddresses, setCustomerAddresses] = useState([])
  const [isSearchingPhone, setIsSearchingPhone] = useState(false)
  const [phoneFoundMsg, setPhoneFoundMsg] = useState("")
  const [phoneErrorMsg, setPhoneErrorMsg] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [validationError, setValidationError] = useState("")

  // Preview State
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState("")
  const previewRequestIdRef = useRef(0)

  // Load sellable product variants
  const loadSellableVariants = useCallback(async () => {
    try {
      const res = await getPricingPanel()
      if (res.ok) {
        const json = await res.json()
        const flatList = []
        json.data?.forEach((prod) => {
          const variants = prod.variants || []
          variants.forEach((v) => {
            flatList.push({
              variant_id: v.variant_id,
              display_name: `${prod.product_name || prod.item_name} - ${v.size_label}`,
              mrp: v.mrp !== null && v.mrp !== undefined ? parseFloat(v.mrp) : null,
              b2c_price: v.b2c_price !== null && v.b2c_price !== undefined ? parseFloat(v.b2c_price) : null,
              b2b_price: v.b2b_price !== null && v.b2b_price !== undefined ? parseFloat(v.b2b_price) : null
            })
          })
        })
        setVariantsList(flatList)
      }
    } catch (err) {
      console.error("Error loading sellable variants:", err)
    }
  }, [])

  // Resolve customer by phone lookup
  const resolveCustomerPhone = useCallback(async (phoneVal) => {
    const cleanPhone = phoneVal.replace(/\D/g, "")
    if (!/^\d{10,15}$/.test(cleanPhone)) return

    setIsSearchingPhone(true)
    setPhoneFoundMsg("")
    setPhoneErrorMsg("")
    try {
      const res = await searchCustomerByPhone(cleanPhone)

      if (res.status === 404) {
        setPhoneErrorMsg("Customer not found. Complete profile details manually below.")
        setCustomerAddresses([])
        return
      }
      if (!res.ok) throw new Error()

      const json = await res.json()
      const data = json.data || {}
      const userObj = data.user || {}
      const addressList = data.addresses || []
      const defaultAddr = data.default_address || addressList.find((a) => a.is_default) || addressList[0]

      const fullName = `${userObj.first_name || ""} ${userObj.last_name || ""}`.trim()
      setCustomerName(fullName || "Walk-in Customer")
      setCustomerGstin(userObj.gstin || "")
      setCompanyName(userObj.company_name || "")
      setIsB2b(!!userObj.gstin)

      // Set address details ensuring default address is in addressList
      let finalAddresses = [...addressList]
      if (defaultAddr && !finalAddresses.some((a) => a.id === defaultAddr.id)) {
        finalAddresses.unshift(defaultAddr)
      }
      setCustomerAddresses(finalAddresses)

      if (defaultAddr) {
        setAddressId(defaultAddr.id)
        setCustomerState(defaultAddr.state ?? "")
      } else {
        setAddressId("")
        setCustomerState("")
      }

      setPhoneFoundMsg(`Customer: ${fullName || "Walk-in Customer"}`)
    } catch {
      setPhoneErrorMsg("Lookup error. Enter details manually.")
    } finally {
      setIsSearchingPhone(false)
    }
  }, [])

  // Debounced auto trigger lookup for 10-15 digits
  useEffect(() => {
    const handler = setTimeout(() => {
      if (phone.length >= 10 && phone.length <= 15) {
        resolveCustomerPhone(phone)
      } else {
        setPhoneFoundMsg("")
        setPhoneErrorMsg("")
      }
    }, 500)

    return () => clearTimeout(handler)
  }, [phone, resolveCustomerPhone])

  // Load Indent details in Edit mode
  const loadIndentData = useCallback(async () => {
    setIsLoading(true)
    setError("")
    try {
      const res = await getIndentDetails(id)
      if (!res.ok) {
        throw new Error(`Failed to load indent details (Status ${res.status})`)
      }
      const json = await res.json()
      const indent = json.data || {}

      if (indent.status !== "pending") {
        throw new Error("Only pending indents can be updated.")
      }

      setPhone(indent.customer_phone || "")
      setCustomerName(indent.customer_name || "")
      setCustomerState(indent.customer_state ?? "")
      setCustomerGstin(indent.customer_gstin || "")
      setCompanyName(indent.company_name || "")
      setIsB2b(indent.is_b2b || false)
      setAddressId(indent.address_id || "")
      setNotes(indent.notes || "")

      // Map items
      const mappedItems = (indent.items || []).map((itm) => ({
        variant_id: itm.variant_id,
        quantity: itm.quantity,
        rate: itm.rate,
        discount_percent: itm.discount_percent || 0
      }))
      setItems(mappedItems)

      // Retrieve customer addresses if user ID is known
      if (indent.user_id) {
        const addrRes = await searchCustomerByPhone(indent.customer_phone)
        if (addrRes.ok) {
          const addrJson = await addrRes.json()
          setCustomerAddresses(addrJson.data?.addresses || [])
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong loading indent details.")
    } finally {
      setIsLoading(false)
    }
  }, [id])

  // Initial loader
  useEffect(() => {
    loadSellableVariants()
    if (isEditMode) {
      loadIndentData()
    }
  }, [isEditMode, loadIndentData, loadSellableVariants])

  // Toggle B2B based on GSTIN input
  useEffect(() => {
    setIsB2b(!!customerGstin.trim())
  }, [customerGstin])

  useEffect(() => {
    setShowPreview(false)
  }, [items, isB2b, customerState])

  // Add empty item row
  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      { variant_id: "", quantity: 1, rate: "", discount_percent: "" }
    ])
  }

  // Delete item row
  const handleDeleteItemRow = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  // Update item field row
  const handleItemFieldChange = (idx, field, val) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === idx) {
          const updated = { ...item, [field]: val }

          // Auto-suggest B2B or B2C rate when variant is selected
          if (field === "variant_id") {
            const vObj = variantsList.find((v) => v.variant_id === val)
            if (vObj) {
              updated.rate = isB2b ? vObj.b2b_price || vObj.mrp : vObj.b2c_price || vObj.mrp
            }
          }
          return updated
        }
        return item
      })
    )
  }

  // Form validator and submitter
  const validateForm = () => {
    setValidationError("")
    setError("")

    if (!/^\d{10,15}$/.test(phone.trim())) {
      setValidationError("Phone number must be between 10 and 15 digits.")
      return false
    }

    if (items.length === 0) {
      setValidationError("Please add at least one variant line item.")
      return false
    }

    // Verify item fields
    for (let i = 0; i < items.length; i++) {
      const itm = items[i]
      if (!itm.variant_id) {
        setValidationError(`Line ${i + 1}: Select product variant.`)
        return false
      }
      const qty = parseFloat(itm.quantity)
      if (isNaN(qty) || qty <= 0) {
        setValidationError(`Line ${i + 1}: Quantity must be positive.`)
        return false
      }
      const rate = parseFloat(itm.rate)
      if (isNaN(rate) || rate < 0) {
        setValidationError(`Line ${i + 1}: Rate must be non-negative.`)
        return false
      }
      const disc = itm.discount_percent === "" ? 0 : parseFloat(itm.discount_percent)
      if (isNaN(disc) || disc < 0 || disc > 100) {
        setValidationError(`Line ${i + 1}: Discount must be between 0 and 100%.`)
        return false
      }
    }
    return true
  }

  const handlePreviewClick = () => {
    if (validateForm()) {
      setShowPreview(true)
    }
  }

  const buildPayload = useCallback(() => ({
    customer_phone: phone.trim(),
    customer_name: customerName.trim() || null,
    customer_state: customerState.trim() || null,
    customer_gstin: customerGstin.trim() || null,
    company_name: companyName.trim() || null,
    is_b2b: isB2b,
    address_id: addressId || null,
    notes: notes.trim() || null,
    items: items.map((itm) => ({
      variant_id: itm.variant_id,
      quantity: parseFloat(itm.quantity),
      rate: parseFloat(itm.rate),
      discount_percent: itm.discount_percent === "" ? 0 : parseFloat(itm.discount_percent)
    }))
  }), [phone, customerName, customerState, customerGstin, companyName, isB2b, addressId, notes, items])

  useEffect(() => {
    if (
      !items.length ||
      items.some(
        (itm) => !itm.variant_id || itm.quantity === "" || itm.rate === ""
      )
    ) {
      setPreview(null)
      setPreviewError("")
      setPreviewLoading(false)
      return
    }

    const reqId = ++previewRequestIdRef.current
    setPreviewLoading(true)

    const timer = setTimeout(async () => {
      try {
        const res = await previewIndent(buildPayload())
        if (reqId !== previewRequestIdRef.current) return
        if (!res.ok) {
          setPreviewError("Couldn't calculate totals")
          setPreview(null)
        } else {
          const json = await res.json()
          if (reqId !== previewRequestIdRef.current) return
          setPreview(json.data)
          setPreviewError("")
        }
      } catch {
        if (reqId !== previewRequestIdRef.current) return
        setPreviewError("Couldn't calculate totals")
        setPreview(null)
      } finally {
        if (reqId === previewRequestIdRef.current) {
          setPreviewLoading(false)
        }
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [items, customerState, customerGstin, buildPayload])

  // Form validator and submitter
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    const ok = await confirm({
      title: isEditMode ? `Update indent #${id}?` : `Create sales indent for ${customerName.trim() || phone.trim()}?`,
      message: isEditMode ? "This will update the existing sales indent." : "This will create a new sales indent order.",
      confirmLabel: isEditMode ? "Update indent" : "Create indent",
    })
    if (!ok) return

    setIsSaving(true)
    try {
      const payload = buildPayload()

      const res = isEditMode
        ? await updateIndent(id, payload)
        : await createIndent(payload)

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(parseErrorDetail(errJson.detail, "Failed to submit indent."))
      }

      alert(isEditMode ? "Indent updated successfully!" : "Indent recorded successfully!")
      navigate("/indents")
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center py-24"><Spinner size="lg" /></div>
    )
  }

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in fade-in duration-200">

      {/* Top Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
        <button
          onClick={() => navigate("/indents")}
          className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
        </button>
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
            <span>Sales & Accounts</span>
            <span>/</span>
            <span>Indents</span>
            <span>/</span>
            <span className="text-slate-800 font-bold">{isEditMode ? "Modify" : "Create"}</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers3 className="w-6 h-6 text-brand-600" />
            <span>{isEditMode ? "Modify Demand Indent" : "Onboard Customer Indent"}</span>
          </h2>
        </div>
      </div>

      {(error || validationError) && (
        <div className="p-4 bg-error-50 border border-error-100 rounded-2xl text-sm font-semibold text-error-800 flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-error-500 shrink-0 mt-0.5" />
          <p>{error || validationError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs font-semibold">
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider">Customer Lookup</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-600 mb-1">Customer Phone Number <span className="text-error-500">*</span></label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength="15"
                  disabled={isEditMode}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 10-15 digit number to auto-search..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  onBlur={() => {
                    if (phone.length >= 10 && phone.length <= 15) {
                      resolveCustomerPhone(phone)
                    }
                  }}
                />
                {isSearchingPhone && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2"><Spinner size="sm" /></span>
                )}
              </div>
              {phoneFoundMsg && <p className="text-[10px] text-emerald-700 mt-1 font-bold">{phoneFoundMsg}</p>}
              {phoneErrorMsg && <p className="text-[10px] text-error-800 mt-1 font-bold">{phoneErrorMsg}</p>}
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-600 mb-1">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-700 mb-1">GSTIN (Optional)</label>
              <input
                type="text"
                value={customerGstin}
                onChange={(e) => setCustomerGstin(e.target.value)}
                placeholder="B2B triggers auto B2B price"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none tabular-nums"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-700 mb-1">Company / Business Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-700 mb-1">Customer Classification</label>
              <div className="py-2.5 px-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800">
                {isB2b ? (
                  <span className="text-purple-700 font-extrabold uppercase text-[10px]">B2B Wholesale Partner</span>
                ) : (
                  <span className="text-slate-500 font-extrabold uppercase text-[10px]">B2C Retail Customer</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-700 mb-1">Shipping Address / Destination</label>
              <select
                value={addressId}
                onChange={(e) => {
                  setAddressId(e.target.value)
                  const matched = customerAddresses.find((a) => a.id === e.target.value)
                  if (matched) setCustomerState(matched.state ?? "")
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none bg-white"
              >
                <option value="">Select Shipping Destination...</option>
                {customerAddresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.address_line_1}, {addr.city} ({addr.state}) {addr.is_default && "[DEFAULT]"}
                  </option>
                ))}
              </select>
              {(() => {
                const selectedAddr = customerAddresses.find((a) => a.id === addressId)
                if (!selectedAddr) return null
                return (
                  <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] space-y-0.5 text-slate-700">
                    <div className="flex items-center gap-1 font-bold text-slate-900">
                      <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                      <span>Autofetched Delivery Address</span>
                      {selectedAddr.is_default && (
                        <span className="ml-1 px-1.5 py-0.2 text-[9px] font-extrabold bg-brand-100 text-brand-700 rounded uppercase">Default</span>
                      )}
                    </div>
                    <p className="font-semibold text-slate-800">
                      {[selectedAddr.address_line_1, selectedAddr.address_line_2].filter(Boolean).join(", ")}
                    </p>
                    <p className="text-slate-600 font-medium">
                      {[selectedAddr.city, selectedAddr.state, selectedAddr.postal_code].filter(Boolean).join(", ")}
                    </p>
                  </div>
                )
              })()}
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-700 mb-1">Place of Supply (State)</label>
              <select
                value={customerState}
                onChange={(e) => setCustomerState(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none bg-white"
              >
                <option value="">Auto (from customer address)</option>
                {customerState && !INDIAN_STATES.includes(customerState) && (
                  <option value={customerState}>{customerState}</option>
                )}
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-700 mb-1">Additional Delivery Notes</label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Indicate target delivery dates, custom branding requests, etc..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
            ></textarea>
          </div>
        </div>

        {/* ITEMS GRID */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Indent Specifications</h3>
            <button
              type="button"
              onClick={handleAddItemRow}
              className="px-3.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          {items.length === 0 ? (
            <p className="text-center text-slate-400 font-bold py-8">No variants added yet. Click "Add Item" above.</p>
          ) : (
            <div className="space-y-4">
              {items.map((item, idx) => {
                const lineTotalVal = preview?.items?.[idx]?.line_total

                return (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 p-3.5 border border-slate-100 rounded-xl bg-slate-50/40 relative">

                    {/* Product selection */}
                    <div className="sm:col-span-4 flex flex-col">
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Product Variant</label>
                      <select
                        required
                        value={item.variant_id}
                        onChange={(e) => handleItemFieldChange(idx, "variant_id", e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        <option value="">Select Variant...</option>
                        {variantsList.map((v) => (
                          <option key={v.variant_id} value={v.variant_id}>
                            {v.display_name} (MRP: {v.mrp !== null && v.mrp !== undefined ? `₹${v.mrp}` : 'Not Set'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-2 flex flex-col">
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Quantity</label>
                      <input
                        type="number"
                        step="0.0001"
                        min="0.0001"
                        required
                        value={item.quantity}
                        onChange={(e) => handleItemFieldChange(idx, "quantity", e.target.value)}
                        className="px-2 py-1.5 border border-slate-200 rounded-lg text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>

                    {/* Rate */}
                    <div className="sm:col-span-2 flex flex-col">
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Rate (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={item.rate}
                        onChange={(e) => handleItemFieldChange(idx, "rate", e.target.value)}
                        placeholder="0.00"
                        className="px-2 py-1.5 border border-slate-200 rounded-lg text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>

                    {/* Discount */}
                    <div className="sm:col-span-2 flex flex-col">
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Discount %</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        required
                        value={item.discount_percent}
                        onChange={(e) => handleItemFieldChange(idx, "discount_percent", e.target.value)}
                        placeholder="0"
                        className="px-2 py-1.5 border border-slate-200 rounded-lg text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>

                    {/* Total */}
                    <div className="sm:col-span-1.5 flex flex-col justify-center text-right pr-6 min-h-[45px]">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Total</span>
                      <span className="tabular-nums font-bold text-slate-800">
                        {lineTotalVal != null ? `₹${Number(lineTotalVal).toFixed(2)}` : "—"}
                      </span>
                    </div>

                    {/* Trash action */}
                    <button
                      type="button"
                      onClick={() => handleDeleteItemRow(idx)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                  </div>
                )
              })}
            </div>
          )}
        </div>
        {!showPreview && (
          <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-4">
            <button
              type="button"
              onClick={() => navigate("/indents")}
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePreviewClick}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-md shadow-brand-500/10 active:scale-95"
            >
              <Calculator className="w-4 h-4" />
              <span>Preview Indent</span>
            </button>
          </div>
        )}

        {showPreview && (
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 space-y-4 w-full">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider">Indent Estimate</h3>

            {/* Items Preview Table */}
            <div className="border border-slate-100 rounded-xl overflow-hidden mb-4 bg-white shadow-sm w-full">
              <table className="w-full text-left border-collapse table-fixed text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-100/70 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-3 py-2 w-[50%] md:w-[35%] lg:w-[30%] xl:w-[28%]">Item</th>
                    <th className="px-3 py-2 text-right w-[22%] md:w-[15%] lg:w-[12%] xl:w-[12%]">Qty</th>
                    <th className="hidden md:table-cell px-3 py-2 text-right w-[16%] lg:w-[14%] xl:w-[14%]">Unit Price</th>
                    <th className="hidden xl:table-cell px-3 py-2 text-right w-[16%]">Gross</th>
                    <th className="hidden lg:table-cell px-3 py-2 text-center w-[12%] xl:w-[12%]">Discount</th>
                    <th className="px-3 py-2 text-right w-[28%] md:w-[18%] lg:w-[16%] xl:w-[18%]">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-semibold bg-white">
                  {items.map((item, idx) => {
                    const vObj = variantsList.find((v) => v.variant_id === item.variant_id)
                    const itemName = vObj ? vObj.display_name : "Unknown Item"
                    const pItem = preview?.items?.[idx]

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-bold text-slate-800">
                          <div className="truncate" title={itemName}>{itemName}</div>
                          <div className="md:hidden text-[10px] text-slate-400 font-normal truncate">
                            Rate: {item.rate != null && item.rate !== "" ? `₹${Number(item.rate).toFixed(2)}` : "—"}
                          </div>
                          <div className="lg:hidden text-[10px] text-slate-400 font-normal truncate">
                            {item.discount_percent !== "" && parseFloat(item.discount_percent) > 0 ? `Disc: ${item.discount_percent}%` : ""}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">{item.quantity}</td>
                        <td className="hidden md:table-cell px-3 py-2 text-right tabular-nums whitespace-nowrap">
                          {item.rate != null && item.rate !== "" ? `₹${Number(item.rate).toFixed(2)}` : "—"}
                        </td>
                        <td className="hidden xl:table-cell px-3 py-2 text-right tabular-nums whitespace-nowrap">
                          {pItem?.gross_amount != null ? `₹${Number(pItem.gross_amount).toFixed(2)}` : "—"}
                        </td>
                        <td className="hidden lg:table-cell px-3 py-2 text-center tabular-nums text-rose-700 whitespace-nowrap">
                          {item.discount_percent !== "" ? `${item.discount_percent}%` : "0%"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-bold text-slate-900 whitespace-nowrap">
                          {pItem?.line_total != null ? `₹${Number(pItem.line_total).toFixed(2)}` : "—"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Gross Subtotal</span>
                <p className="text-base font-extrabold text-slate-800 tabular-nums">
                  {preview?.total_gross_amount != null ? `₹${Number(preview.total_gross_amount).toFixed(2)}` : "—"}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Discount Allowed</span>
                <p className="text-base font-extrabold text-rose-700 tabular-nums">
                  {preview?.total_discount_amount != null ? `-₹${Number(preview.total_discount_amount).toFixed(2)}` : "—"}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">GST</span>
                <p className="text-base font-extrabold text-slate-800 tabular-nums">
                  {preview?.total_gst_amount != null ? `₹${Number(preview.total_gst_amount).toFixed(2)}` : "—"}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Grand Total</span>
                <p className="text-lg font-extrabold text-brand-700 tabular-nums">
                  {preview?.grand_total != null ? `₹${Number(preview.grand_total).toFixed(2)}` : "—"}
                </p>
              </div>
            </div>

            {previewError && (
              <p className="text-xs text-error-800 font-semibold">{previewError}</p>
            )}

            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-2">
              Note: Indents reserve variant stock levels immediately upon creation. Tax and invoice billing occur when the indent is confirmed.
            </p>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4 bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-2">
              <button
                type="button"
                onClick={() => navigate("/indents")}
                className="px-5 py-2.5 border border-slate-200 hover:bg-white text-slate-600 rounded-xl font-bold transition-colors text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || previewLoading || !preview}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/10 active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? <Spinner size="sm" /> : isEditMode ? "Save Modifications" : "Record Indent"}</span>
              </button>
            </div>
          </div>
        )}

      </form>
    </div>
  )
}

export default CreateIndent
