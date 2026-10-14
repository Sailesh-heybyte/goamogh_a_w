import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  Save,
  ShoppingCart,
  Calculator,
  User,
  MapPin,
  Package
} from "lucide-react"
import { createDirectSale } from "@/services/sales"
import { searchCustomerByPhone } from "@/services/customers"
import { getItems } from "@/services/items"
import { getPricingPanel } from "@/services/products"
import Spinner from "@/components/ui/Spinner"
import useConfirm from "@/hooks/useConfirm"

function parseErrorDetail(detail, defaultMsg) {
  if (!detail) return defaultMsg
  if (Array.isArray(detail)) {
    const messages = detail.map((d) => d.msg).filter(Boolean)
    return messages.length > 0 ? messages.join(", ") : defaultMsg
  }
  return typeof detail === "string" ? detail : defaultMsg
}

function CreateSale() {
  const confirm = useConfirm()
  const navigate = useNavigate()

  // Sale Type: "retail" | "wholesale"
  const [saleType, setSaleType] = useState("retail")

  // Customer Profile Form Fields
  const [phone, setPhone] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerState, setCustomerState] = useState("Andhra Pradesh")
  const [customerGstin, setCustomerGstin] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [billType, setBillType] = useState("cash") // "cash" | "credit"
  const [addressId, setAddressId] = useState("")
  const [notes, setNotes] = useState("")

  // Item Lines
  // Array of { variant_id, quantity, rate, discount_percent }
  const [items, setItems] = useState([])
  const [showPreview, setShowPreview] = useState(false)

  // Selection Lookups
  const [variantsList, setVariantsList] = useState([])
  const [customerAddresses, setCustomerAddresses] = useState([])

  // Lookup & UI Loaders
  const [isSearchingPhone, setIsSearchingPhone] = useState(false)
  const [phoneFoundMsg, setPhoneFoundMsg] = useState("")
  const [phoneErrorMsg, setPhoneErrorMsg] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [validationError, setValidationError] = useState("")

  // Load catalog items and pricing panels to compile rich lookup catalog
  const loadCatalog = useCallback(async () => {
    try {
      const [itemsRes, pricingRes] = await Promise.all([
        getItems({ is_sellable: true, active_only: true }),
        getPricingPanel()
      ])

      let itemsData = []
      if (itemsRes.ok) {
        const json = await itemsRes.json()
        itemsData = json.data || []
      }

      let pricingData = []
      if (pricingRes.ok) {
        const json = await pricingRes.json()
        pricingData = json.data || []
      }

      const itemsMap = {}
      itemsData.forEach((itm) => {
        itemsMap[itm.id] = {
          gst_percent: parseFloat(itm.gst_percent || 0) || 5,
          cess_percent: parseFloat(itm.cess_percent || 0) || 0,
          hsn_code: itm.hsn_code || ""
        }
      })

      const flatVariants = []
      pricingData.forEach((prod) => {
        const itemId = prod.product_id || prod.item_id
        const itemMeta = itemsMap[itemId] || { gst_percent: 5, cess_percent: 0, hsn_code: "" }

        const variants = prod.variants || []
        variants.forEach((v) => {
          flatVariants.push({
            variant_id: v.variant_id,
            display_name: `${prod.product_name || prod.item_name} - ${v.weight_grams}g`,
            mrp: v.mrp !== null && v.mrp !== undefined ? parseFloat(v.mrp) : null,
            b2c_price: v.b2c_price !== null && v.b2c_price !== undefined ? parseFloat(v.b2c_price) : null,
            b2b_price: v.b2b_price !== null && v.b2b_price !== undefined ? parseFloat(v.b2b_price) : null,
            gst_percent: itemMeta.gst_percent,
            cess_percent: itemMeta.cess_percent,
            hsn_code: itemMeta.hsn_code
          })
        })
      })

      setVariantsList(flatVariants)
    } catch (err) {
      console.error("Failed to load variants list:", err)
    }
  }, [])

  useEffect(() => {
    loadCatalog()
  }, [loadCatalog])

  // Phone search lookup
  const resolveCustomerPhone = useCallback(async (phoneVal) => {
    const cleanPhone = phoneVal.replace(/\D/g, "")
    if (!/^\d{10,15}$/.test(cleanPhone)) return

    setIsSearchingPhone(true)
    setPhoneFoundMsg("")
    setPhoneErrorMsg("")
    try {
      const res = await searchCustomerByPhone(cleanPhone)

      if (res.status === 404) {
        setPhoneErrorMsg("Customer not found. Enter details manually.")
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

      if (userObj.gstin) {
        setSaleType("wholesale")
      }

      // Consolidate addresses list ensuring default address is included
      let finalAddresses = [...addressList]
      if (defaultAddr && !finalAddresses.some((a) => a.id === defaultAddr.id)) {
        finalAddresses.unshift(defaultAddr)
      }
      setCustomerAddresses(finalAddresses)

      if (defaultAddr) {
        setAddressId(defaultAddr.id)
        setCustomerState(defaultAddr.state || "Andhra Pradesh")
      } else {
        setAddressId("")
        setCustomerState("Andhra Pradesh")
      }

      setPhoneFoundMsg(`Customer: ${fullName || "Walk-in Customer"}`)
    } catch {
      setPhoneErrorMsg("Lookup error. Complete fields manually.")
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

  // Trigger price update suggestions when sale type flips (Retail B2C / Wholesale B2B)
  useEffect(() => {
    setItems((prev) =>
      prev.map((item) => {
        if (!item.variant_id) return item
        const vObj = variantsList.find((v) => v.variant_id === item.variant_id)
        if (vObj) {
          return {
            ...item,
            rate: saleType === "wholesale" ? vObj.b2b_price : vObj.b2c_price
          }
        }
        return item
      })
    )
  }, [saleType, variantsList])

  useEffect(() => {
    setShowPreview(false)
  }, [items, saleType, customerState])

  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      { variant_id: "", quantity: 1, rate: "", discount_percent: 0 }
    ])
  }

  const handleDeleteItemRow = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleItemFieldChange = (idx, field, val) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === idx) {
          const updated = { ...item, [field]: val }

          // Auto price suggestions
          if (field === "variant_id") {
            const vObj = variantsList.find((v) => v.variant_id === val)
            if (vObj) {
              updated.rate = saleType === "wholesale" ? vObj.b2b_price : vObj.b2c_price
            }
          }
          return updated
        }
        return item
      })
    )
  }

  // Calculate live dynamic breakdown
  const calculateTotals = () => {
    let subtotal = 0
    let totalDiscount = 0
    let totalTaxable = 0
    let totalGst = 0
    let totalCgst = 0
    let totalSgst = 0
    let totalIgst = 0

    const isInterstate = customerState.trim().toLowerCase() !== "Andhra Pradesh"

    items.forEach((item) => {
      const qty = parseFloat(item.quantity) || 0
      const rate = parseFloat(item.rate) || 0
      const disc = parseFloat(item.discount_percent) || 0

      const vObj = variantsList.find((v) => v.variant_id === item.variant_id) || { gst_percent: 5 }
      const lineGstPct = parseFloat(vObj.gst_percent || 0)

      const lineGross = qty * rate
      const lineDisc = lineGross * (disc / 100)
      const lineTaxable = lineGross - lineDisc
      const lineGst = lineTaxable * (lineGstPct / 100)

      subtotal += lineGross
      totalDiscount += lineDisc
      totalTaxable += lineTaxable
      totalGst += lineGst

      if (isInterstate) {
        totalIgst += lineGst
      } else {
        totalCgst += lineGst / 2
        totalSgst += lineGst / 2
      }
    })

    return {
      subtotal,
      totalDiscount,
      totalTaxable,
      totalGst,
      totalCgst,
      totalSgst,
      totalIgst,
      grandTotal: totalTaxable + totalGst
    }
  }

  const {
    subtotal,
    totalDiscount,
    totalGst,
    totalCgst,
    totalSgst,
    totalIgst,
    grandTotal
  } = calculateTotals()

  const validateForm = () => {
    setValidationError("")
    setError("")

    if (!/^\d{10,15}$/.test(phone.trim())) {
      setValidationError("Phone number must be between 10 and 15 digits.")
      return false
    }

    if (saleType === "wholesale" && !customerGstin.trim()) {
      setValidationError("GSTIN is required for wholesale sales.")
      return false
    }

    if (items.length === 0) {
      setValidationError("Add at least one item line to create sale.")
      return false
    }

    // Line items validators
    for (let i = 0; i < items.length; i++) {
      const itm = items[i]
      if (!itm.variant_id) {
        setValidationError(`Line ${i + 1}: Select variant.`)
        return false
      }
      if (parseFloat(itm.quantity) <= 0) {
        setValidationError(`Line ${i + 1}: Quantity must be greater than 0.`)
        return false
      }
      if (parseFloat(itm.rate) < 0) {
        setValidationError(`Line ${i + 1}: Price rate must be non-negative.`)
        return false
      }
      if (parseFloat(itm.discount_percent) < 0 || parseFloat(itm.discount_percent) > 100) {
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

  // Form submitter
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    const ok = await confirm({
      title: `Record direct ${saleType} sale for ${customerName.trim() || phone.trim()}?`,
      message: `Total amount: ₹${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}. This will create a new direct sale entry.`,
      confirmLabel: "Record Sale",
    })
    if (!ok) return

    setIsSaving(true)
    try {
      const payload = {
        sale_type: saleType,
        customer_phone: phone.trim(),
        customer_name: customerName.trim() || null,
        customer_state: customerState.trim() || null,
        customer_gstin: customerGstin.trim() || null,
        company_name: companyName.trim() || null,
        is_b2b: !!customerGstin.trim(),
        bill_type: billType,
        address_id: addressId || null,
        notes: notes.trim() || null,
        items: items.map((itm) => ({
          variant_id: itm.variant_id,
          quantity: parseFloat(itm.quantity),
          rate: parseFloat(itm.rate),
          discount_percent: parseFloat(itm.discount_percent)
        }))
      }

      const res = await createDirectSale(payload)
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(parseErrorDetail(errJson.detail, "Failed to record direct sale."))
      }

      alert("Draft direct sale recorded successfully! It will proceed through confirmation, dispatch, and delivery notifications as the order lifecycle advances.")
      navigate("/dashboard/sales")
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in fade-in duration-200">

      {/* Top Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
        <button
          onClick={() => navigate("/dashboard/sales")}
          className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
        </button>
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
            <span>Sales & Accounts</span>
            <span>/</span>
            <span>Sales</span>
            <span>/</span>
            <span className="text-slate-800 font-bold">New Direct Sale</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-brand-600" />
            <span>Onboard Direct Sales Invoice</span>
          </h2>
        </div>
      </div>

      {(error || validationError) && (
        <div className="p-4 bg-error-50 border border-error-100 rounded-2xl text-sm font-semibold text-error-800 flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-error-500 shrink-0 mt-0.5" />
          <p>{error || validationError}</p>
        </div>
      )}

      {/* Sale Mode Selector */}
      <div className="flex items-center gap-6 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sale Invoice Classification:</span>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="radio"
              name="saleType"
              value="retail"
              checked={saleType === "retail"}
              onChange={() => setSaleType("retail")}
              className="w-4 h-4 text-brand-600 focus:ring-brand-500"
            />
            <span>Retail Order (B2C Pricing)</span>
          </label>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="radio"
              name="saleType"
              value="wholesale"
              checked={saleType === "wholesale"}
              onChange={() => setSaleType("wholesale")}
              className="w-4 h-4 text-brand-600 focus:ring-brand-500"
            />
            <span>Wholesale Order (B2B Pricing)</span>
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs font-semibold">

        {/* Customer section */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4.5 h-4.5 text-slate-400" />
            <span>Customer Identification</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-700 mb-1">Customer Phone Number <span className="text-error-500">*</span></label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength="15"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 10-15 digits to query registered profiles..."
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
              <label className="text-xs font-bold text-slate-700 mb-1">Customer Billing Name</label>
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
              <label className="text-xs font-bold text-slate-700 mb-1">
                GSTIN Tax ID {saleType === "wholesale" && <span className="text-error-500">*</span>}
              </label>
              <input
                type="text"
                value={customerGstin}
                onChange={(e) => setCustomerGstin(e.target.value)}
                placeholder="Required for wholesale invoices"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none tabular-nums"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-700 mb-1">Company / Trading Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-700 mb-1">Bill Type / Credit Status</label>
              <select
                value={billType}
                onChange={(e) => setBillType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none bg-white text-slate-800"
              >
                <option value="cash">Cash (Immediate Payment)</option>
                <option value="credit">Credit / Account Terms</option>
              </select>
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
                  if (matched) setCustomerState(matched.state || "Andhra Pradesh")
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none bg-white"
              >
                <option value="">Select Delivery Destination...</option>
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
              <input
                type="text"
                value={customerState}
                onChange={(e) => setCustomerState(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-700 mb-1">Order Memo Notes</label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Log dispatch identifiers, manual checks or special terms..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
            ></textarea>
          </div>
        </div>

        {/* Line items Section */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4.5 h-4.5 text-slate-400" />
              <span>Invoice Items</span>
            </h3>
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
            <p className="text-center text-slate-400 font-bold py-8">No variant items added. Click "Add Item" above.</p>
          ) : (
            <div className="space-y-4">
              {items.map((item, idx) => {
                const lineGross = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)
                const lineDisc = lineGross * ((parseFloat(item.discount_percent) || 0) / 100)
                const lineTaxable = lineGross - lineDisc

                const vObj = variantsList.find((v) => v.variant_id === item.variant_id) || { gst_percent: 5 }
                const lineGstVal = lineTaxable * (parseFloat(vObj.gst_percent || 0) / 100)
                const lineTot = lineTaxable + lineGstVal

                return (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 p-3.5 border border-slate-100 rounded-xl bg-slate-50/40 relative">

                    {/* Product selector */}
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
                        className="px-2 py-1.5 border border-slate-200 rounded-lg text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>

                    {/* Discount percent */}
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
                        className="px-2 py-1.5 border border-slate-200 rounded-lg text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>

                    {/* Total */}
                    <div className="sm:col-span-1.5 flex flex-col justify-center text-right pr-6 min-h-[45px]">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Line Total</span>
                      <span className="tabular-nums font-bold text-slate-800">₹{lineTot.toFixed(2)}</span>
                    </div>

                    {/* Delete row button */}
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
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4">
            <button
              type="button"
              onClick={() => navigate("/dashboard/sales")}
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-colors w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePreviewClick}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/10 active:scale-95 w-full sm:w-auto"
            >
              <Calculator className="w-4 h-4" />
              <span>Preview Invoice</span>
            </button>
          </div>
        )}

        {showPreview && (
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 space-y-4 w-full">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider flex items-center gap-1">
              <Calculator className="w-4 h-4 text-slate-400" />
              <span>Invoice Summary</span>
            </h3>

            {/* Items Preview Table */}
            <div className="border border-slate-100 rounded-xl mb-4 bg-white shadow-sm w-full">
              <table className="w-full text-left border-collapse table-fixed text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-100/70 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-3 py-2 w-[50%] md:w-[35%] lg:w-[28%] xl:w-[28%]">Item</th>
                    <th className="px-3 py-2 text-right w-[22%] md:w-[15%] lg:w-[12%] xl:w-[10%]">Qty</th>
                    <th className="hidden md:table-cell px-3 py-2 text-right w-[16%] lg:w-[14%] xl:w-[14%]">Unit Price</th>
                    <th className="hidden xl:table-cell px-3 py-2 text-right w-[14%]">Gross</th>
                    <th className="hidden lg:table-cell px-3 py-2 text-center w-[10%]">Discount</th>
                    <th className="hidden lg:table-cell px-3 py-2 text-center w-[10%]">GST %</th>
                    <th className="px-3 py-2 text-right w-[28%] md:w-[18%] lg:w-[16%] xl:w-[14%]">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-semibold bg-white">
                  {items.map((item, idx) => {
                    const vObj = variantsList.find((v) => v.variant_id === item.variant_id)
                    const itemName = vObj ? vObj.display_name : "Unknown Item"
                    const qty = parseFloat(item.quantity) || 0
                    const rate = parseFloat(item.rate) || 0
                    const discPct = parseFloat(item.discount_percent) || 0
                    
                    const lineGross = qty * rate
                    const lineDisc = lineGross * (discPct / 100)
                    const lineTaxable = lineGross - lineDisc
                    const gstPct = vObj ? parseFloat(vObj.gst_percent || 0) : 5
                    const lineGst = lineTaxable * (gstPct / 100)
                    const lineTotal = lineTaxable + lineGst

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-bold text-slate-800">
                          <div className="truncate" title={itemName}>{itemName}</div>
                          <div className="md:hidden text-[10px] text-slate-400 font-normal truncate">
                            Rate: ₹{rate.toFixed(2)}
                          </div>
                          <div className="lg:hidden text-[10px] text-slate-400 font-normal truncate">
                            {discPct > 0 ? `Disc: ${discPct}% • ` : ""}GST: {gstPct}%
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">{qty}</td>
                        <td className="hidden md:table-cell px-3 py-2 text-right tabular-nums whitespace-nowrap">₹{rate.toFixed(2)}</td>
                        <td className="hidden xl:table-cell px-3 py-2 text-right tabular-nums whitespace-nowrap">₹{lineGross.toFixed(2)}</td>
                        <td className="hidden lg:table-cell px-3 py-2 text-center tabular-nums text-rose-700 whitespace-nowrap">{discPct}%</td>
                        <td className="hidden lg:table-cell px-3 py-2 text-center tabular-nums whitespace-nowrap">{gstPct}%</td>
                        <td className="px-3 py-2 text-right tabular-nums font-bold text-slate-900 whitespace-nowrap">₹{lineTotal.toFixed(2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Gross Subtotal</span>
                <p className="text-base font-extrabold text-slate-800 tabular-nums">₹{subtotal.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Allowed Discount</span>
                <p className="text-base font-extrabold text-rose-700 tabular-nums">-₹{totalDiscount.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">GST Tax Amount</span>
                <p className="text-base font-extrabold text-slate-800 tabular-nums">₹{totalGst.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Grand Invoice Value</span>
                <p className="text-lg font-extrabold text-brand-700 tabular-nums">₹{grandTotal.toFixed(2)}</p>
              </div>
            </div>

            {(totalCgst > 0 || totalSgst > 0 || totalIgst > 0) && (
              <div className="flex flex-wrap gap-4 sm:gap-6 text-[11px] font-bold text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                {totalCgst > 0 && <span>CGST: <span className="tabular-nums font-extrabold text-slate-800">₹{totalCgst.toFixed(2)}</span></span>}
                {totalSgst > 0 && <span>SGST: <span className="tabular-nums font-extrabold text-slate-800">₹{totalSgst.toFixed(2)}</span></span>}
                {totalIgst > 0 && <span>IGST: <span className="tabular-nums font-extrabold text-slate-800">₹{totalIgst.toFixed(2)}</span></span>}
              </div>
            )}

            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-2">
              Note: Direct sales are created in **draft** status. Varied stock levels deduction occurs only upon manual order confirmation.
            </p>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-slate-100 pt-4 bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-2">
              <button
                type="button"
                onClick={() => navigate("/dashboard/sales")}
                className="px-5 py-2.5 border border-slate-200 hover:bg-white text-slate-600 rounded-xl font-bold transition-colors w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/10 active:scale-95 disabled:opacity-50 w-full sm:w-auto"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? <Spinner size="sm" /> : "Save Sales Invoice"}</span>
              </button>
            </div>
          </div>
        )}

      </form>
    </div>
  )
}

export default CreateSale
