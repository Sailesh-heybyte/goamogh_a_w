import { useState, useEffect, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  Save,
  Search,
  ChevronDown,
  Package,
  Wheat,
  LayoutGrid,
} from "lucide-react"
import {
  createPurchaseOrder,
  getPurchaseOrderDetails,
  updatePurchaseOrder,
  getPurchaseOrderFormData,
} from "@/api/purchases"
import Spinner from "@/components/ui/Spinner"
import useConfirm from "@/hooks/useConfirm"

function CreatePurchaseOrder() {
  const confirm = useConfirm()
  const navigate = useNavigate()

  const [searchParams] = useSearchParams()
  const poId = searchParams.get("po_id")

  const [suppliers, setSuppliers] = useState([])
  const [rawMaterials, setRawMaterials] = useState([])
  const [products, setProducts] = useState([])

  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10))
  const [endDate, setEndDate] = useState(
    new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().substring(0, 10)
  )
  const [paymentType, setPaymentType] = useState("bank transfer")
  const [orderedBy, setOrderedBy] = useState("Go Amogh (OPC) Pvt Ltd")
  const [shippedVia, setShippedVia] = useState("Rail / Road")
  const [fob, setFob] = useState("Buyer")
  const [terms, setTerms] = useState("Net 30")

  const [notes, setNotes] = useState("")
  const [items, setItems] = useState(() => [
    {
      id: "row-" + Date.now(),
      itemType: "raw_material",
      itemId: "",
      quantity: "",
      unitPrice: "",
      hsnCode: "",
    },
  ])

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [validationError, setValidationError] = useState("")

  const [supplierSearch, setSupplierSearch] = useState("")
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)
  const supplierDropdownRef = useRef(null)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError("")
      try {
        const formRes = await getPurchaseOrderFormData()
        if (!formRes.ok) throw new Error("Failed to load purchase order form data")
        const formJson = await formRes.json()
        const bundle = formJson.data

        setSuppliers(bundle.suppliers)
        setRawMaterials(bundle.raw_materials)
        setProducts(bundle.products)

        if (poId) {
          const poRes = await getPurchaseOrderDetails(poId)
          if (!poRes.ok) throw new Error("Failed to load matching Purchase Order details")
          const poJson = await poRes.json()
          const po = poJson.data

          if (po.status !== "draft") {
            throw new Error("Only draft purchase orders can be modified.")
          }

          setNotes(po.notes || "")
          setSelectedSupplier({
            id: po.supplier_id,
            name: po.supplier_name || po.supplier?.name || po.supplier?.contact_name || "",
          })
          setSupplierSearch(po.supplier_name || po.supplier?.name || po.supplier?.contact_name || "")
          if (po.start_date) setStartDate(po.start_date.split("T")[0])
          if (po.end_date) setEndDate(po.end_date.split("T")[0])
          if (po.payment_type) setPaymentType(po.payment_type)
          if (po.ordered_by) setOrderedBy(po.ordered_by)
          if (po.shipped_via) setShippedVia(po.shipped_via)
          if (po.fob) setFob(po.fob)
          if (po.terms) setTerms(po.terms)

          if (po.items && po.items.length > 0) {
            const mappedItems = po.items.map((item) => ({
              id: item.id || "row-" + Date.now() + Math.random(),
              itemType: item.raw_material_id ? "raw_material" : "product",
              itemId: item.raw_material_id || item.product_id || "",
              quantity: parseFloat(item.quantity).toString(),
              unitPrice: parseFloat(item.unit_price).toString(),
              hsnCode: item.hsn_code || "",
            }))
            setItems(mappedItems)
          }
        }
      } catch (err) {
        setError(err.message || "An error occurred while loading form dependencies.")
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [poId])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target)) {
        setShowSupplierDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleAddRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: "row-" + Date.now() + Math.random(),
        itemType: "raw_material",
        itemId: "",
        quantity: "",
        unitPrice: "",
        hsnCode: "",
      },
    ])
    setValidationError("")
  }

  const handleRemoveRow = (rowId) => {
    if (items.length === 1) {
      setValidationError("A purchase order must contain at least one item.")
      return
    }
    setItems((prev) => prev.filter((item) => item.id !== rowId))
    setValidationError("")
  }

  const handleRowChange = (rowId, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === rowId) {
          const updated = { ...item, [field]: value }
          if (field === "itemType") {
            updated.itemId = ""
            updated.hsnCode = ""
          } else if (field === "itemId") {
            const isRM = item.itemType === "raw_material"
            const selectedItemObj = isRM
              ? rawMaterials.find((rm) => rm.id === value)
              : products.find((p) => p.id === value)
            if (selectedItemObj && selectedItemObj.hsn_code) {
              updated.hsnCode = selectedItemObj.hsn_code
            }
          }
          return updated
        }
        return item
      })
    )
    setValidationError("")
  }

  const handleSupplierSelect = (supplier) => {
    setSelectedSupplier(supplier)
    setSupplierSearch(supplier.name || supplier.contact_name || "")
    setShowSupplierDropdown(false)
    setValidationError("")
  }

  const validateForm = () => {
    if (!selectedSupplier) {
      return "Supplier selection is required."
    }
    if (!startDate) {
      return "PO start date is required."
    }
    if (!endDate) {
      return "PO end date is required."
    }
    if (new Date(startDate) > new Date(endDate)) {
      return "PO start date cannot be after end date."
    }
    if (items.length === 0) {
      return "You must add at least one item row to the purchase order."
    }
    for (let i = 0; i < items.length; i++) {
      const row = items[i]
      if (!row.itemId) {
        return `Please select an item for row ${i + 1}.`
      }
      const qty = parseFloat(row.quantity)
      if (isNaN(qty) || qty <= 0) {
        return `Quantity for row ${i + 1} must be a number greater than 0.`
      }
      const price = parseFloat(row.unitPrice)
      if (isNaN(price) || price <= 0) {
        return `Unit price for row ${i + 1} must be a currency value greater than 0.`
      }
    }
    return ""
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setValidationError("")
    const validationMsg = validateForm()
    if (validationMsg) {
      setValidationError(validationMsg)
      return
    }

    const ok = await confirm({
      title: poId ? `Update Purchase Order?` : `Create Purchase Order for ${selectedSupplier.name}?`,
      message: poId
        ? "This will save your modifications to this purchase order."
        : "This will create a new draft purchase order for the selected supplier.",
      confirmLabel: poId ? "Update PO" : "Create PO",
    })
    if (!ok) return

    setIsSaving(true)
    try {
      const formattedItems = items.map((row) => {
        const isRM = row.itemType === "raw_material"

        const selectedItemObj = isRM
          ? rawMaterials.find((rm) => rm.id === row.itemId)
          : products.find((p) => p.id === row.itemId)

        const unitCode = selectedItemObj?.unit_code ?? ""

        return {
          raw_material_id: isRM ? row.itemId : null,
          product_id: isRM ? null : row.itemId,
          quantity: parseFloat(row.quantity),
          unit_code: unitCode,
          unit_price: parseFloat(row.unitPrice),
          hsn_code: (row.hsnCode || "").trim(),
        }
      })

      let res
      if (poId) {
        const payload = {
          start_date: `${startDate}T00:00:00Z`,
          end_date: `${endDate}T23:59:59Z`,
          payment_type: paymentType,
          notes: notes.trim() || null,
          items: formattedItems,
          ordered_by: orderedBy.trim() || null,
          shipped_via: shippedVia.trim() || null,
          fob: fob.trim() || null,
          terms: terms.trim() || null,
        }
        res = await updatePurchaseOrder(poId, payload)
      } else {
        const payload = {
          supplier_id: selectedSupplier.id,
          start_date: `${startDate}T00:00:00Z`,
          end_date: `${endDate}T23:59:59Z`,
          payment_type: paymentType,
          notes: notes.trim() || null,
          items: formattedItems,
          ordered_by: orderedBy.trim() || null,
          shipped_via: shippedVia.trim() || null,
          fob: fob.trim() || null,
          terms: terms.trim() || null,
        }
        res = await createPurchaseOrder(payload)
      }

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}))
        throw new Error(errorJson.message || `Failed to ${poId ? "update" : "create"} Purchase Order.`)
      }

      navigate("/purchase/orders")
    } catch (err) {
      setValidationError(err.message || "An error occurred while saving.")
    } finally {
      setIsSaving(false)
    }
  }

  const filteredSuppliers = suppliers.filter((s) => {
    const term = supplierSearch.toLowerCase()
    const nameMatch = s.name?.toLowerCase().includes(term)
    const contactMatch = s.contact_name?.toLowerCase().includes(term)
    const codeMatch = s.vendor_code?.toLowerCase().includes(term)
    return nameMatch || contactMatch || codeMatch
  })

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
        <h3 className="text-lg font-bold text-slate-900">Error Initializing Form</h3>
        <p className="text-sm font-semibold text-slate-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-md shadow-brand-500/10"
        >
          Reload Page
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/purchase/orders")}
          className="p-2 border border-slate-200 hover:border-slate-300 hover:bg-white rounded-xl text-slate-500 hover:text-slate-800 transition-all active:scale-95"
          title="Back to Purchase Orders"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {poId ? "Edit Purchase Order" : "Create Purchase Order"}
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            {poId
              ? "Modify draft purchase order notes and line item quantities."
              : "Create a new purchase order with raw material or finished product line items, which will be automatically sent to the supplier."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {validationError && (
          <div className="flex items-start gap-2.5 p-4 bg-error-50 border border-error-100 rounded-xl text-sm font-semibold text-error-800 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-error-500 shrink-0" />
            <p className="flex-1">{validationError}</p>
          </div>
        )}

        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col relative" ref={supplierDropdownRef}>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Supplier / Vendor <span className="text-error-500 font-bold">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                disabled={!!poId}
                placeholder={poId ? "" : "Type supplier name or code..."}
                value={supplierSearch}
                onChange={(e) => {
                  setSupplierSearch(e.target.value)
                  setSelectedSupplier(null)
                  setShowSupplierDropdown(true)
                }}
                onFocus={() => !poId && setShowSupplierDropdown(true)}
                className="w-full pl-10 pr-10 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
              />
              {!poId && (
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              )}
            </div>

            {showSupplierDropdown && (
              <div className="absolute top-[102%] left-0 w-full bg-white border border-slate-100 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-50 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                {filteredSuppliers.length === 0 ? (
                  <div className="px-4 py-3 text-slate-400 font-semibold text-xs text-center">
                    No active suppliers found.
                  </div>
                ) : (
                  filteredSuppliers.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSupplierSelect(s)}
                      className="w-full px-4 py-2.5 hover:bg-slate-50 text-left text-xs font-semibold text-slate-700 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{s.name || s.contact_name || "—"}</p>
                        <p className="text-[10px] text-slate-400 font-bold tabular-nums mt-0.5">{s.vendor_code}</p>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full tabular-nums font-bold">
                        {s.phone || "No Phone"}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Payment Terms <span className="text-error-500 font-bold">*</span>
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white transition-all font-semibold text-slate-700"
            >
              <option value="bank transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Ordered By</label>
            <input
              type="text"
              value={orderedBy}
              onChange={(e) => setOrderedBy(e.target.value)}
              placeholder="e.g., Go Amogh (OPC) Pvt Ltd"
              className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Shipped Via</label>
            <select
              value={shippedVia}
              onChange={(e) => setShippedVia(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all bg-white font-semibold text-slate-700"
            >
              {!["Rail / Road", "Air", "Sea"].includes(shippedVia) && shippedVia && (
                <option value={shippedVia}>{shippedVia}</option>
              )}
              <option value="Rail / Road">Rail / Road</option>
              <option value="Air">Air</option>
              <option value="Sea">Sea</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">F.O.B. Point</label>
            <select
              value={fob}
              onChange={(e) => setFob(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all bg-white font-semibold text-slate-700"
            >
              {!["Buyer", "Supplier", "Both (LS & DB)"].includes(fob) && fob && <option value={fob}>{fob}</option>}
              <option value="Buyer">Buyer</option>
              <option value="Supplier">Supplier</option>
              <option value="Both (LS & DB)">Both (LS & DB)</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Agreement Terms</label>
            <input
              type="text"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="e.g., Net 30"
              className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              PO Start Date <span className="text-error-500 font-bold">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              PO End Date <span className="text-error-500 font-bold">*</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700"
            />
          </div>

          <div className="flex flex-col md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Remarks & Shipping Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., Roast specification or delivery timeline notes..."
              className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700 resize-none min-h-[46px]"
            />
          </div>
        </div>

        <div className="bg-white border border-slate-100 shadow-md rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-slate-400" />
              <span>Purchase Order Items Grid</span>
            </h3>
            <button
              type="button"
              onClick={handleAddRow}
              className="px-3.5 py-1.5 border border-brand-200 hover:border-brand-400 hover:bg-brand-50 rounded-xl text-xs font-bold text-brand-700 transition-all active:scale-95 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Row</span>
            </button>
          </div>

          <div className="w-full">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="hidden md:table-cell px-3 py-3 w-[16%]">Item Type</th>
                  <th className="px-2 sm:px-3 py-3 w-[44%] md:w-[38%]">Select Inventory Item</th>
                  <th className="px-2 sm:px-3 py-3 w-[24%] md:w-[20%]">Quantity</th>
                  <th className="px-2 sm:px-3 py-3 w-[24%] md:w-[20%]">Unit Price (INR)</th>
                  <th className="px-1 sm:px-3 py-3 text-right w-[8%] md:w-[6%]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-800">
                {items.map((row) => {
                  const isRM = row.itemType === "raw_material"
                  const selectedOptions = isRM ? rawMaterials : products

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/20 align-top">
                      <td className="hidden md:table-cell px-3 py-3">
                        <select
                          value={row.itemType}
                          onChange={(e) => handleRowChange(row.id, "itemType", e.target.value)}
                          className="w-full px-2 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white transition-all font-semibold text-slate-700"
                        >
                          <option value="raw_material">Raw Material</option>
                          <option value="product">Finished Product</option>
                        </select>
                      </td>

                      <td className="px-2 sm:px-3 py-3">
                        <div className="md:hidden mb-1.5">
                          <select
                            value={row.itemType}
                            onChange={(e) => handleRowChange(row.id, "itemType", e.target.value)}
                            className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-semibold text-slate-700"
                          >
                            <option value="raw_material">Raw Material</option>
                            <option value="product">Finished Product</option>
                          </select>
                        </div>
                        <div className="relative">
                          {isRM ? (
                            <Wheat className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                          ) : (
                            <Package className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                          )}
                          <select
                            value={row.itemId}
                            onChange={(e) => handleRowChange(row.id, "itemId", e.target.value)}
                            className="w-full pl-8 pr-2 py-1.5 sm:py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white transition-all font-semibold text-slate-700 truncate"
                          >
                            <option value="">— Select {isRM ? "Raw Material" : "Finished Product"} —</option>
                            {selectedOptions.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.name} ({opt.hsn_code || "No HSN"} - {opt.unit_code})
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      <td className="px-2 sm:px-3 py-3">
                        <div className="relative">
                          <input
                            type="number"
                            step="0.0001"
                            placeholder="0.0000"
                            value={row.quantity}
                            onChange={(e) => handleRowChange(row.id, "quantity", e.target.value)}
                            className="w-full pl-2 pr-7 sm:pl-3 sm:pr-10 py-1.5 sm:py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] sm:text-[10px] font-bold text-slate-400">
                            {selectedOptions.find((opt) => opt.id === row.itemId)?.unit_code || "UNIT"}
                          </span>
                        </div>
                      </td>

                      <td className="px-2 sm:px-3 py-3">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold tabular-nums">
                            ₹
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={row.unitPrice}
                            onChange={(e) => handleRowChange(row.id, "unitPrice", e.target.value)}
                            className="w-full pl-5 pr-2 sm:pl-6 sm:pr-4 py-1.5 sm:py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700 text-right tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </td>

                      <td className="px-1 sm:px-3 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          className="p-1.5 sm:p-2 border border-transparent hover:border-error-100 hover:bg-error-50 rounded-xl text-slate-400 hover:text-error-800 transition-all active:scale-95 inline-flex items-center mt-0.5"
                          title="Remove Row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4">
          <button
            type="button"
            onClick={() => navigate("/purchase/orders")}
            disabled={isSaving}
            className="px-4 py-2.5 border border-slate-200 hover:border-slate-300 hover:bg-white rounded-xl text-sm font-semibold text-slate-600 transition-all active:scale-95 disabled:opacity-50 w-full sm:w-auto"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Spinner size="xs" />
                <span>Saving PO...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{poId ? "Update Draft Purchase Order" : "Save Draft Purchase Order"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreatePurchaseOrder
