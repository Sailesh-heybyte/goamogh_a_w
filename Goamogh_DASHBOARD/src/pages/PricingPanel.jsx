import { useState, useEffect } from "react"
import { Search, ShieldAlert, CheckCircle2, AlertTriangle, Check, Pencil, X } from "lucide-react"
import { getPricingPanel } from "@/services/products"
import { updateItemPrices } from "@/services/items"
import Spinner from "@/components/ui/Spinner"

function parseErrorDetail(detail, defaultMsg) {
  if (!detail) return defaultMsg
  if (Array.isArray(detail)) {
    const messages = detail.map((d) => d.msg).filter(Boolean)
    return messages.length > 0 ? messages.join(", ") : defaultMsg
  }
  return typeof detail === "string" ? detail : defaultMsg
}

function PricingPanel() {
  const [pricingList, setPricingList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("")

  // Modal control states
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Local state for modified inputs: { [variantId]: { mrp, b2c_price, b2b_price } }
  const [draftPrices, setDraftPrices] = useState({})
  // Editing states by product ID: { [productId]: boolean }
  const [editingProducts, setEditingProducts] = useState({})
  // Saving states by product ID: { [productId]: boolean }
  const [savingProducts, setSavingProducts] = useState({})
  // Error states by product ID: { [productId]: string }
  const [productErrors, setProductErrors] = useState({})
  // Success banners by product ID: { [productId]: string }
  const [productSuccesses, setProductSuccesses] = useState({})

  const fetchPricingData = async () => {
    setIsLoading(true)
    setError("")
    try {
      const res = await getPricingPanel()
      if (!res.ok) {
        throw new Error("Failed to load pricing panel grid data")
      }
      const json = await res.json()
      const data = json.data || []
      setPricingList(data)

      // Initialize draft states and edit toggles
      const drafts = {}
      const editingState = {}
      data.forEach((prod) => {
        let hasMissingPrices = false
        const variants = prod.variants || []

        variants.forEach((v) => {
          drafts[v.variant_id] = {
            mrp: v.mrp !== null && v.mrp !== undefined ? v.mrp.toString() : "",
            b2c_price: v.b2c_price !== null && v.b2c_price !== undefined ? v.b2c_price.toString() : "",
            b2b_price: v.b2b_price !== null && v.b2b_price !== undefined ? v.b2b_price.toString() : "",
          }

          if (v.mrp === null || v.b2c_price === null || v.b2b_price === null) {
            hasMissingPrices = true
          }
        })

        // If any variant has null/empty values, open it in Edit mode so user can set them.
        editingState[prod.product_id] = hasMissingPrices || variants.length === 0
      })

      setDraftPrices(drafts)
      setEditingProducts(editingState)
    } catch (err) {
      setError(err.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPricingData()
  }, [])

  const handlePriceChange = (variantId, field, value) => {
    setDraftPrices((prev) => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        [field]: value,
      },
    }))
  }

  const handleCancelEdit = (productId, variants) => {
    setEditingProducts((prev) => ({ ...prev, [productId]: false }))
    setProductErrors((prev) => ({ ...prev, [productId]: "" }))

    // Revert draft values to actual product values
    setDraftPrices((prev) => {
      const reverted = { ...prev }
      variants.forEach((v) => {
        const originalProd = pricingList.find((p) => p.product_id === productId)
        const originalVar = (originalProd?.variants || []).find((ov) => ov.variant_id === v.variant_id)

        reverted[v.variant_id] = {
          mrp: originalVar?.mrp !== null && originalVar?.mrp !== undefined ? originalVar.mrp.toString() : "",
          b2c_price: originalVar?.b2c_price !== null && originalVar?.b2c_price !== undefined ? originalVar.b2c_price.toString() : "",
          b2b_price: originalVar?.b2b_price !== null && originalVar?.b2b_price !== undefined ? originalVar.b2b_price.toString() : "",
        }
      })
      return reverted
    })
  }

  const handleSavePrices = async (productId, variants) => {
    setProductErrors((prev) => ({ ...prev, [productId]: "" }))
    setProductSuccesses((prev) => ({ ...prev, [productId]: "" }))

    // 1. Gather prices and perform client-side validations
    const pricesPayload = []
    let hasValidationError = false
    let validationMsg = ""

    for (const v of variants) {
      const draft = draftPrices[v.variant_id] || { mrp: "", b2c_price: "", b2b_price: "" }

      const mrpNum = parseFloat(draft.mrp)
      const b2cNum = parseFloat(draft.b2c_price)
      const b2bNum = parseFloat(draft.b2b_price)

      if (isNaN(mrpNum) || mrpNum <= 0) {
        hasValidationError = true
        validationMsg = `MRP for ${formatWeight(v.weight_grams)} variant must be a positive number.`
        break
      }
      if (isNaN(b2cNum) || b2cNum <= 0) {
        hasValidationError = true
        validationMsg = `B2C price for ${formatWeight(v.weight_grams)} variant must be a positive number.`
        break
      }
      if (isNaN(b2bNum) || b2bNum <= 0) {
        hasValidationError = true
        validationMsg = `B2B price for ${formatWeight(v.weight_grams)} variant must be a positive number.`
        break
      }
      if (b2cNum > mrpNum) {
        hasValidationError = true
        validationMsg = `B2C price cannot exceed MRP for the ${formatWeight(v.weight_grams)} variant.`
        break
      }
      if (b2bNum > mrpNum) {
        hasValidationError = true
        validationMsg = `B2B price cannot exceed MRP for the ${formatWeight(v.weight_grams)} variant.`
        break
      }

      pricesPayload.push({
        variant_id: v.variant_id,
        mrp: mrpNum.toFixed(2),
        b2c_price: b2cNum.toFixed(2),
        b2b_price: b2bNum.toFixed(2),
      })
    }

    if (hasValidationError) {
      setProductErrors((prev) => ({ ...prev, [productId]: validationMsg }))
      return
    }

    // 2. Trigger request
    setSavingProducts((prev) => ({ ...prev, [productId]: true }))
    try {
      const res = await updateItemPrices(productId, { prices: pricesPayload })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(parseErrorDetail(json.detail, "Failed to update prices"))
      }

      // Update the local pricingList so master directory reflects the update
      setPricingList((prev) =>
        prev.map((prod) => {
          if (prod.product_id === productId) {
            return {
              ...prod,
              variants: prod.variants.map((v) => {
                const draft = pricesPayload.find((p) => p.variant_id === v.variant_id)
                return {
                  ...v,
                  mrp: parseFloat(draft.mrp),
                  b2c_price: parseFloat(draft.b2c_price),
                  b2b_price: parseFloat(draft.b2b_price),
                }
              }),
            }
          }
          return prod
        })
      )

      setProductSuccesses((prev) => ({ ...prev, [productId]: "Saved successfully!" }))
      setEditingProducts((prev) => ({ ...prev, [productId]: false }))

      // Auto clear success indicator
      setTimeout(() => {
        setProductSuccesses((prev) => ({ ...prev, [productId]: "" }))
      }, 3000)
    } catch (err) {
      setProductErrors((prev) => ({ ...prev, [productId]: err.message }))
    } finally {
      setSavingProducts((prev) => ({ ...prev, [productId]: false }))
    }
  }

  const formatWeight = (grams) => {
    if (grams >= 1000) {
      return `${grams / 1000} KG`
    }
    return `${grams} GM`
  }



  const filteredPricingList = pricingList.filter((item) => {
    const term = searchQuery.toLowerCase().trim()
    const matchesSearch = !term || (
      item.product_name.toLowerCase().includes(term) ||
      (item.product_number && item.product_number.toLowerCase().includes(term))
    )
    const matchesType = !selectedTypeFilter || item.item_type === selectedTypeFilter
    return matchesSearch && matchesType
  })

  // Selected product logic for the popup modal
  const selectedProduct = pricingList.find((p) => p.product_id === selectedProductId)
  const isSelectedProductEditing = selectedProductId ? !!editingProducts[selectedProductId] : false
  const isSelectedProductSaving = selectedProductId ? !!savingProducts[selectedProductId] : false
  const selectedProductError = selectedProductId ? productErrors[selectedProductId] || "" : ""
  const selectedProductSuccess = selectedProductId ? productSuccesses[selectedProductId] || "" : ""

  const handleOpenModal = (product) => {
    setSelectedProductId(product.product_id)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedProductId(null)
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
        <ShieldAlert className="w-12 h-12 text-error-500 animate-bounce" />
        <h3 className="text-lg font-bold text-slate-900">Error Loading Pricing Grid</h3>
        <p className="text-sm font-semibold text-slate-500">{error}</p>
        <button
          onClick={fetchPricingData}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-md shadow-brand-500/10"
        >
          Retry Load
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in fade-in duration-200 font-sans">

      {/* Title Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Pricing Panel</h2>
        </div>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Maintain product prices.
        </p>
      </div>

      {/* Toolbar Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 border border-slate-150 rounded-2xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search catalog products by name or code..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white text-slate-700 font-semibold transition-all"
          >
            <option value="">All Item Types</option>
            <option value="finished_good">Finished Products</option>
            <option value="raw_material">Raw Materials</option>
          </select>
        </div>
      </div>

      {/* Main Full-Width Table Directory */}
      <div className="bg-white border border-slate-150/80 shadow-lg rounded-2xl overflow-hidden w-full">
        <div className="w-full overflow-hidden">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-450 text-[10px] font-extrabold uppercase tracking-wider">
                <th className="px-6 py-4 w-[20%]">Product Code</th>
                <th className="px-6 py-4 w-[68%]">Product Name</th>
                <th className="px-6 py-4 w-[12%] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-xs font-semibold text-slate-800">
              {filteredPricingList.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-12 text-slate-400 font-bold bg-slate-50/10">
                    No matching products found in database.
                  </td>
                </tr>
              ) : (
                filteredPricingList.map((item) => {
                  return (
                    <tr
                      key={item.product_id}
                      onClick={() => handleOpenModal(item)}
                      className="cursor-pointer hover:bg-slate-50/50 transition-colors group"
                    >
                      {/* Product Code */}
                      <td className="px-6 py-4 font-mono text-[10px] font-extrabold text-brand-700">
                        {item.product_number || "PROD"}
                      </td>

                      {/* Product Name */}
                      <td className="px-6 py-4 uppercase tracking-wide text-slate-900 font-bold">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{item.product_name}</span>
                          {item.item_type === "finished_good" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-50 text-blue-750 border border-blue-100 whitespace-nowrap uppercase tracking-wider">
                              Finished Product
                            </span>
                          ) : item.item_type === "raw_material" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-755 border border-emerald-100 whitespace-nowrap uppercase tracking-wider">
                              Raw Material
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="px-3 py-1.5 border border-slate-200 group-hover:border-brand-500 hover:bg-brand-50 group-hover:text-brand-700 text-slate-500 rounded-lg text-[10px] font-bold transition-all active:scale-95 bg-white shadow-sm"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pricing Popup Modal Overlay */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-150 max-w-xl w-full shadow-2xl p-6 flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] font-extrabold text-brand-700 bg-brand-50 border border-brand-100/60 px-2 py-0.5 rounded uppercase tracking-wider">
                    {selectedProduct.product_number || "PROD"}
                  </span>
                  {selectedProduct.item_type === "finished_good" ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-50 text-blue-750 border border-blue-100 whitespace-nowrap uppercase tracking-wider">
                      Finished Product
                    </span>
                  ) : selectedProduct.item_type === "raw_material" ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-755 border border-emerald-100 whitespace-nowrap uppercase tracking-wider">
                      Raw Material
                    </span>
                  ) : null}
                </div>
                <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-sm mt-2 leading-relaxed">
                  {selectedProduct.product_name}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={isSelectedProductSaving}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning or Success Notices */}
            {selectedProductError && (
              <div className="flex items-start gap-2 p-3 bg-error-50 border border-error-100 rounded-xl text-[10px] font-bold text-error-800 animate-in slide-in-from-top-1">
                <AlertTriangle className="w-3.5 h-3.5 text-error-500 shrink-0 mt-0.5" />
                <p className="flex-1 leading-normal">{selectedProductError}</p>
              </div>
            )}

            {selectedProductSuccess && (
              <div className="flex items-center gap-1.5 p-3 bg-success-50 border border-success-100 rounded-xl text-[10px] font-bold text-success-800 animate-in slide-in-from-top-1">
                <CheckCircle2 className="w-4 h-4 text-success-500 shrink-0" />
                <p>{selectedProductSuccess}</p>
              </div>
            )}

            {/* Cost Reference (Read-only) */}
            {selectedProduct.cost_reference && (
              <div className="space-y-2 border border-slate-100 bg-slate-50/50 p-4 rounded-xl text-[10px] max-h-[160px] overflow-y-auto">
                <h4 className="font-extrabold uppercase tracking-wider text-slate-500">
                  Cost Reference (Informational Only)
                </h4>
                
                {/* Work Orders */}
                {selectedProduct.cost_reference.work_orders && selectedProduct.cost_reference.work_orders.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-bold text-slate-700 text-[9px]">From Production:</p>
                    {selectedProduct.cost_reference.work_orders.map((wo) => (
                      <div key={wo.work_order_number} className="p-2 bg-white border border-slate-100 rounded-lg text-[9px] text-slate-550 leading-relaxed">
                        <span className="font-bold text-brand-700">{wo.work_order_number}</span> | Output: <span className="font-bold text-slate-800">{wo.output_qty} kg</span> | Cost/Unit: <span className="font-bold text-slate-850">₹{wo.cost_per_unit?.toFixed(2)}</span>
                        <div className="mt-1 flex gap-2 flex-wrap text-[8px] text-slate-450">
                          <span>Material: ₹{(wo.material_cost || wo.costing?.material_cost || 0).toFixed(2)}</span>
                          <span>Machinery: ₹{(wo.machinery_cost || wo.costing?.machinery_cost || 0).toFixed(2)}</span>
                          <span>Worker: ₹{(wo.worker_cost || wo.costing?.worker_cost || 0).toFixed(2)}</span>
                          <span>Other: ₹{(wo.other_cost || wo.costing?.other_cost || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Purchase Entries */}
                {selectedProduct.cost_reference.purchase_entries && selectedProduct.cost_reference.purchase_entries.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <p className="font-bold text-slate-700 text-[9px]">From Purchases:</p>
                    {selectedProduct.cost_reference.purchase_entries.map((pe) => (
                      <div key={pe.batch_number} className="p-2 bg-white border border-slate-100 rounded-lg text-[9px] text-slate-550">
                        Batch: <span className="font-bold text-slate-800">{pe.batch_number}</span> | Qty: <span className="font-bold text-slate-800">{pe.quantity_received}</span> | Price/Unit: <span className="font-bold text-slate-850">₹{pe.unit_price?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {(!selectedProduct.cost_reference.work_orders?.length && !selectedProduct.cost_reference.purchase_entries?.length) && (
                  <p className="text-slate-400 font-semibold italic text-[9px]">No production or purchase cost history available.</p>
                )}
              </div>
            )}

            {/* Variants Grid Table inside Modal */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Pack Sizes & Pricing
                </h4>
              </div>

              <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/20">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-150 bg-slate-50/70 text-slate-450 text-[9px] font-extrabold uppercase tracking-wider">
                      <th className="px-4 py-2.5 text-left w-[25%]">Size</th>
                      <th className="px-4 py-2.5 text-right w-[25%]">MRP (₹)</th>
                      <th className="px-4 py-2.5 text-right w-[25%]">B2C Retail (₹)</th>
                      <th className="px-4 py-2.5 text-right w-[25%]">B2B Wholesale (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {(selectedProduct.variants || []).map((v) => {
                      const draft = draftPrices[v.variant_id] || { mrp: "", b2c_price: "", b2b_price: "" }
                      const mrpVal = parseFloat(draft.mrp)
                      const b2cVal = parseFloat(draft.b2c_price)
                      const showWarning = !isNaN(mrpVal) && !isNaN(b2cVal) && b2cVal > mrpVal

                      return (
                        <tr key={v.variant_id} className="hover:bg-slate-50/30">
                          {/* Weight format */}
                          <td className="px-4 py-3.5 text-slate-800 font-bold">
                            {formatWeight(v.weight_grams)}
                          </td>

                          {/* MRP */}
                          <td className="px-4 py-3.5 text-right">
                            {!isSelectedProductEditing ? (
                              <span className="text-slate-800 font-bold">
                                {draft.mrp ? `₹${parseFloat(draft.mrp).toFixed(2)}` : "—"}
                              </span>
                            ) : (
                              <div className="relative inline-block max-w-[90px]">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={draft.mrp}
                                  onChange={(e) => handlePriceChange(v.variant_id, "mrp", e.target.value)}
                                  placeholder="0.00"
                                  disabled={isSelectedProductSaving}
                                  className="w-full px-2.5 py-1 border border-slate-200 focus:border-brand-500 rounded-lg text-right text-xs focus:outline-none transition-all font-semibold text-slate-700 bg-white"
                                />
                              </div>
                            )}
                          </td>

                          {/* B2C Selling Rate */}
                          <td className="px-4 py-3.5 text-right">
                            {!isSelectedProductEditing ? (
                              <span className="text-slate-800 font-bold">
                                {draft.b2c_price ? `₹${parseFloat(draft.b2c_price).toFixed(2)}` : "—"}
                              </span>
                            ) : (
                              <div className="inline-block max-w-[90px]">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={draft.b2c_price}
                                  onChange={(e) => handlePriceChange(v.variant_id, "b2c_price", e.target.value)}
                                  placeholder="0.00"
                                  disabled={isSelectedProductSaving}
                                  className={`w-full px-2.5 py-1 border rounded-lg text-right text-xs focus:outline-none transition-all font-semibold text-slate-700 bg-white ${showWarning ? "border-error-300 focus:border-error-500 focus:ring-1 focus:ring-error-100" : "border-slate-200 focus:border-brand-500"
                                    }`}
                                />
                                {showWarning && (
                                  <p className="text-[8px] font-extrabold text-error-800 mt-0.5">
                                    &gt; MRP
                                  </p>
                                )}
                              </div>
                            )}
                          </td>

                          {/* B2B Wholesale Rate */}
                          <td className="px-4 py-3.5 text-right">
                            {!isSelectedProductEditing ? (
                              <span className="text-slate-800 font-bold">
                                {draft.b2b_price ? `₹${parseFloat(draft.b2b_price).toFixed(2)}` : "—"}
                              </span>
                            ) : (
                              <div className="relative inline-block max-w-[90px]">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={draft.b2b_price}
                                  onChange={(e) => handlePriceChange(v.variant_id, "b2b_price", e.target.value)}
                                  placeholder="0.00"
                                  disabled={isSelectedProductSaving}
                                  className="w-full px-2.5 py-1 border border-slate-200 focus:border-brand-500 rounded-lg text-right text-xs focus:outline-none transition-all font-semibold text-slate-700 bg-white"
                                />
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              {!isSelectedProductEditing ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCloseModal()}
                    className="px-4 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all active:scale-95 bg-white"
                  >
                    Close
                  </button>

                  <button
                    onClick={() =>
                      setEditingProducts((prev) => ({ ...prev, [selectedProduct.product_id]: true }))
                    }
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Rates</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full justify-between">
                  <button
                    onClick={() => handleCancelEdit(selectedProduct.product_id, selectedProduct.variants)}
                    disabled={isSelectedProductSaving}
                    className="px-3.5 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-550 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 bg-white"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>

                  <button
                    onClick={() => handleSavePrices(selectedProduct.product_id, selectedProduct.variants)}
                    disabled={isSelectedProductSaving}
                    className="px-4 py-2 bg-success-500 hover:bg-success-700 disabled:bg-success-400 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-success-500/10 flex items-center gap-1.5"
                  >
                    {isSelectedProductSaving ? <Spinner size="xs" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Save Prices</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default PricingPanel
