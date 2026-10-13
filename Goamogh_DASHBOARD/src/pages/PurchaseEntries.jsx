import { useState, useEffect, useCallback } from "react"
import { useNavigate, useSearchParams, useLocation } from "react-router-dom"
import { 
  Plus, 
  Search, 
  Eye, 
  ArrowRight,
  FileText, 
  AlertTriangle, 
  Calendar,
  XCircle,
  Receipt,
  CheckCircle,
  ShoppingBag,
  Sparkles
} from "lucide-react"
import { getPurchaseEntries, getPurchaseOrders } from "@/services/purchases"
import Spinner from "@/components/ui/Spinner"

function PurchaseEntries() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const peId = searchParams.get("pe_id")
  const location = useLocation()
  const [authError, setAuthError] = useState(location.state?.authError || "")
  const [entries, setEntries] = useState([])
  const [confirmedOrders, setConfirmedOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("")

  // Modal States
  const [isSelectPOOpen, setIsSelectPOOpen] = useState(false)
  const [isLoadingPOs, setIsLoadingPOs] = useState(false)
  const [viewingEntry, setViewingEntry] = useState(null)

  const fetchEntries = useCallback(async () => {
    setIsLoading(true)
    setError("")
    try {
      const res = await getPurchaseEntries()
      if (!res.ok) throw new Error("Failed to load purchase entries list")
      const json = await res.json()
      setEntries(json.data || [])
    } catch (err) {
      setError(err.message || "An error occurred while fetching purchase entries.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  useEffect(() => {
    if (peId && entries.length > 0) {
      const entry = entries.find((e) => e.id === peId)
      if (entry) {
        setViewingEntry(entry)
      }
    }
  }, [peId, entries])

  // Open modal and load active confirmed POs
  const handleOpenPOSelection = async () => {
    setIsSelectPOOpen(true)
    setIsLoadingPOs(true)
    try {
      const res = await getPurchaseOrders({ status: "confirmed" })
      if (!res.ok) throw new Error("Failed to load confirmed purchase orders")
      const json = await res.json()
      setConfirmedOrders(json.data || [])
    } catch (err) {
      alert(err.message || "Failed to load confirmed POs.")
    } finally {
      setIsLoadingPOs(false)
    }
  }

  // Handle PO selection and redirect
  const handleSelectPO = (poId) => {
    setIsSelectPOOpen(false)
    navigate(`/dashboard/purchase/entries/create?po_id=${poId}`)
  }

  // Helper to format comma-separated product/item names
  const getProductNamesString = (entry) => {
    if (!entry.items || entry.items.length === 0) return "—"
    const names = entry.items
      .map((item) => {
        return item.raw_material_id
          ? item.raw_material_name || item.raw_material?.name
          : item.product_name || item.product?.name
      })
      .filter(Boolean)
    if (names.length === 0) return "—"
    return names.join(", ")
  }

  // Client-side filtering
  const filteredEntries = entries.filter((entry) => {
    const searchLower = searchQuery.toLowerCase().trim()
    if (!searchLower) return true
    
    const peNumMatch = entry.pe_number?.toLowerCase().includes(searchLower)
    const invNumMatch = entry.invoice_number?.toLowerCase().includes(searchLower)
    const supplierName = entry.supplier_name || entry.po?.supplier_name || entry.supplier?.name || entry.supplier?.contact_name || entry.po?.supplier?.name || entry.po?.supplier?.contact_name
    const supplierMatch = supplierName?.toLowerCase().includes(searchLower)
    const productMatch = entry.items?.some((item) => {
      const name = item.raw_material_id ? item.raw_material_name : item.product_name
      return name?.toLowerCase().includes(searchLower)
    })

    return peNumMatch || invNumMatch || supplierMatch || productMatch
  })

  // Format Helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "—"
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    })
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
        <AlertTriangle className="w-12 h-12 text-error-500 animate-bounce" />
        <h3 className="text-lg font-bold text-slate-900">Error Loading Goods Receipts</h3>
        <p className="text-sm font-semibold text-slate-500">{error}</p>
        <button
          onClick={fetchEntries}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-md shadow-brand-500/10"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Purchase Entries (GRN)</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Match received deliveries with invoice documentation, review CGST/SGST/IGST tax rates, and commit stock to warehouse balance.
          </p>
        </div>

        <button
          onClick={() => navigate("/dashboard/purchase/entries/create")}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center gap-2 self-start md:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Record Goods Receipt (GRN)</span>
        </button>
      </div>

      {/* Search Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by PE number, invoice number, or supplier..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-350 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Table grid */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-450 font-semibold shadow-sm flex flex-col items-center justify-center gap-3">
          <Receipt className="w-12 h-12 text-slate-300" />
          <p>No purchase entries / goods receipts found.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 shadow-md rounded-2xl overflow-hidden">
          <div className="w-full">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="pl-4 pr-2 py-4 w-[24%]">Product</th>
                  <th className="px-2 py-4 w-[20%]">Invoice Details</th>
                  <th className="px-2 py-4 text-right w-[20%]">Tax & Grand Total</th>
                  <th className="px-2 py-4 w-[16%]">Status</th>
                  <th className="pl-2 pr-4 py-4 text-right w-[20%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-800">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Product Name(s) */}
                    <td className="pl-4 pr-2 py-4 text-slate-800 font-bold uppercase tracking-wide text-xs whitespace-nowrap truncate" title={getProductNamesString(entry)}>
                      {getProductNamesString(entry)}
                    </td>

                    {/* Invoice Info */}
                    <td className="px-2 py-4 whitespace-nowrap truncate">
                      <div>
                        <p className="text-slate-800 font-bold text-xs">{entry.invoice_number}</p>
                        <p className="text-[10px] text-slate-450 font-bold flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDate(entry.invoice_date || entry.created_at)}
                        </p>
                      </div>
                    </td>

                    {/* Total & Tax */}
                    <td className="px-2 py-4 text-right whitespace-nowrap">
                      <div>
                        <p className="text-slate-850 font-bold font-mono">
                          ₹{(entry.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold font-mono">
                          Tax: ₹{(entry.total_tax || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-2 py-4 whitespace-nowrap">
                      {entry.status === "authorized" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-success-50 text-success-700 border-success-100">
                          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-success-500" />
                          Authorized
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-slate-100 text-slate-700 border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-slate-500" />
                          Draft (Pending)
                        </span>
                      )}
                    </td>

                    {/* Row action tools */}
                    <td className="pl-2 pr-4 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end items-center gap-1.5">
                        {entry.status === "draft" ? (
                          <button
                            onClick={() => navigate(`/dashboard/purchase/entries/create?po_id=${entry.po_id}&pe_id=${entry.id}`)}
                            className="px-2.5 py-1.5 border border-brand-200 hover:border-brand-400 hover:bg-brand-50 rounded-xl text-[10px] font-bold text-brand-700 transition-all active:scale-95 flex items-center gap-1 shrink-0"
                            title="Complete Draft & Authorize"
                          >
                            <span>View/Authorize</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setViewingEntry(entry)}
                            className="p-1.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-800 transition-all active:scale-95 inline-flex items-center shrink-0"
                            title="View Summary details"
                          >
                            <Eye className="w-3.5 h-3.5" />
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

      {/* MODAL: Select Confirmed PO to Record Receipt */}
      {isSelectPOOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">Select Confirmed Purchase Order</h3>
              <button
                onClick={() => setIsSelectPOOpen(false)}
                className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg text-slate-400 hover:text-slate-650 transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                Select from the list of confirmed purchase orders below to record a goods receipt. Raw material or finished product stock will only be updated after authorizing this entry.
              </p>

              {isLoadingPOs ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="md" />
                </div>
              ) : confirmedOrders.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-450 font-bold text-xs">
                  No active confirmed purchase orders found.<br />
                  <span className="text-[10px] text-slate-400 mt-1 block">Please confirm a PO in the Orders screen first.</span>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-150 rounded-2xl overflow-hidden bg-white shadow-sm">
                  {confirmedOrders.map((po) => (
                    <button
                      key={po.id}
                      onClick={() => handleSelectPO(po.id)}
                      className="w-full px-4 py-3 hover:bg-brand-50/50 text-left transition-all flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-xs font-bold text-brand-700 font-mono group-hover:underline">{po.po_number}</p>
                        <p className="text-[10px] text-slate-450 font-bold uppercase mt-0.5">{po.supplier_name || po.supplier?.name || po.supplier?.contact_name || "—"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                          {po.items?.length || 0} items
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-350 group-hover:text-brand-650 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <button
                onClick={() => {
                  setIsSelectPOOpen(false)
                  navigate("/dashboard/purchase/entries/create")
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm shadow-indigo-500/10 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Direct Purchase (No PO)</span>
              </button>
              <button
                onClick={() => setIsSelectPOOpen(false)}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-650 transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: View Entry Tax and Details Summary */}
      {viewingEntry && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Goods Receipt Summary (GRN)</h3>
                <p className="text-xs font-mono font-bold text-slate-450 mt-0.5">{viewingEntry.pe_number}</p>
              </div>
              <button
                onClick={() => setViewingEntry(null)}
                className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg text-slate-400 hover:text-slate-650 transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {authError && (
                <div className="p-4 bg-error-50 border border-error-200 rounded-xl text-xs font-semibold text-error-800 flex items-start gap-2.5 shrink-0 animate-in fade-in duration-200">
                  <AlertTriangle className="w-5 h-5 text-error-600 shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-error-900">Authorization Failed</p>
                    <p className="mt-0.5">{authError}</p>
                  </div>
                  <button onClick={() => setAuthError("")} className="text-error-500 hover:text-error-750 font-bold ml-auto text-sm">&times;</button>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Supplier</span>
                  <span className="text-sm font-bold text-slate-800 uppercase mt-0.5 block">
                    {viewingEntry.supplier_name || viewingEntry.po?.supplier_name || viewingEntry.supplier?.name || viewingEntry.supplier?.contact_name || viewingEntry.po?.supplier?.name || viewingEntry.po?.supplier?.contact_name || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Invoice Number</span>
                  <span className="text-sm font-bold text-slate-855 mt-0.5 block">
                    {viewingEntry.invoice_number}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Invoice Date</span>
                  <span className="text-sm font-bold text-slate-855 mt-0.5 block">
                    {formatDate(viewingEntry.invoice_date)}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Status</span>
                  {viewingEntry.status === "authorized" ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border mt-1 bg-success-50 text-success-700 border-success-100">
                      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-success-500" />
                      Authorized & Committed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border mt-1 bg-yellow-50 text-yellow-800 border-yellow-250">
                      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-yellow-500" />
                      Draft (Pending)
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Taxation Mode</span>
                  <span className="text-xs font-bold text-slate-600 mt-1 block">
                    {viewingEntry.is_interstate ? "Inter-State (IGST)" : "Local (CGST + SGST)"}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Place of Supply</span>
                  <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                    {viewingEntry.ship_to_state || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Rounding Adjustment</span>
                  <span className="text-sm font-mono font-bold text-slate-800 mt-0.5 block">
                    ₹{(viewingEntry.rounding_adjustment || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">Received Items</h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <th className="px-4 py-2.5">Item Details</th>
                        <th className="px-4 py-2.5 text-right">Qty Received</th>
                        <th className="px-4 py-2.5 text-right">Unit Price</th>
                        <th className="px-4 py-2.5 text-right">Subtotal</th>
                        <th className="px-4 py-2.5 text-right">GST Split</th>
                        <th className="px-4 py-2.5 text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                      {viewingEntry.items?.map((item) => {
                        const itemName = item.raw_material_id ? item.raw_material_name : item.product_name
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/20">
                            <td className="px-4 py-3">
                              <p className="font-bold text-slate-800">{itemName || "Inventory Item"}</p>
                              <p className="text-[9px] text-slate-400 mt-0.5">HSN: {item.hsn_code || "—"}</p>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-slate-600">
                              {parseFloat(item.quantity_received).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-slate-650">
                              ₹{(parseFloat(item.unit_price) || 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-slate-650">
                              ₹{(parseFloat(item.subtotal) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-slate-450">
                              {viewingEntry.is_interstate ? (
                                `IGST: ₹${(parseFloat(item.igst_amount) || 0).toFixed(2)} (${item.gst_percent}%)`
                              ) : (
                                `CGST: ₹${(parseFloat(item.cgst_amount) || 0).toFixed(2)} / SGST: ₹${(parseFloat(item.sgst_amount) || 0).toFixed(2)} (${item.gst_percent / 2}%)`
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                              ₹{(parseFloat(item.total_amount) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Billing Summary Card */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 ml-auto max-w-sm space-y-3 shadow-inner">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-550 border-b border-slate-150 pb-1.5">Grand Billing Summary</h4>
                
                <div className="space-y-1.5 text-xs font-semibold text-slate-600">
                  <div className="flex justify-between">
                    <span>Taxable Subtotal</span>
                    <span className="font-mono text-slate-800 font-bold">
                      ₹{((viewingEntry.total_amount || 0) - (viewingEntry.total_tax || 0) - (parseFloat(viewingEntry.total_cess) || 0) - (parseFloat(viewingEntry.others) || 0) - (parseFloat(viewingEntry.rounding_adjustment) || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {viewingEntry.is_interstate ? (
                    <div className="flex justify-between">
                      <span>IGST Amount</span>
                      <span className="font-mono text-slate-800 font-bold">
                        ₹{(viewingEntry.total_tax || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>CGST Amount</span>
                        <span className="font-mono text-slate-800 font-bold">
                          ₹{((viewingEntry.total_tax || 0) / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST Amount</span>
                        <span className="font-mono text-slate-800 font-bold">
                          ₹{((viewingEntry.total_tax || 0) / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  )}

                  {parseFloat(viewingEntry.total_cess) > 0 && (
                    <div className="flex justify-between">
                      <span>Cess Amount</span>
                      <span className="font-mono text-slate-800 font-bold">
                        ₹{parseFloat(viewingEntry.total_cess).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  {parseFloat(viewingEntry.others || 0) > 0 && (
                    <div className="flex justify-between">
                      <span>Shipping / Other Charges</span>
                      <span className="font-mono text-slate-800 font-bold">
                        ₹{parseFloat(viewingEntry.others).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  {parseFloat(viewingEntry.rounding_adjustment || 0) !== 0 && (
                    <div className="flex justify-between">
                      <span>Rounding Adjustment</span>
                      <span className="font-mono text-slate-800 font-bold">
                        ₹{(viewingEntry.rounding_adjustment || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-slate-800">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-brand-650" />
                      <span>Grand Total</span>
                    </span>
                    <span className="font-mono text-brand-700">
                      ₹{(viewingEntry.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setViewingEntry(null)}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-55 rounded-xl text-xs font-bold text-slate-650 transition-all active:scale-95"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PurchaseEntries
