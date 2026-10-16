import { useState, useEffect, useCallback } from "react"
import { useNavigate, useSearchParams, useLocation } from "react-router-dom"
import { Plus, Search, Eye, ArrowRight, AlertTriangle, Calendar, XCircle, Receipt, Sparkles } from "lucide-react"
import { getPurchaseEntries, getPurchaseOrders } from "@/api/purchases"
import Spinner from "@/components/ui/Spinner"
import Modal from "@/components/ui/Modal"

function PurchaseEntries() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const peId = searchParams.get("pe_id")
  const location = useLocation()
  const [authError, setAuthError] = useState(location.state?.authError || "")
  const [entries, setEntries] = useState([])
  const [receivableOrders, setReceivableOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const [searchQuery, setSearchQuery] = useState("")

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

  const handleOpenPOSelection = async () => {
    setIsSelectPOOpen(true)
    setIsLoadingPOs(true)
    try {
      const res = await getPurchaseOrders()
      if (!res.ok) throw new Error("Failed to load open purchase orders")
      const json = await res.json()
      setReceivableOrders((json.data || []).filter((po) => po.is_receivable === true))
    } catch (err) {
      alert(err.message || "Failed to load open purchase orders")
    } finally {
      setIsLoadingPOs(false)
    }
  }

  const handleSelectPO = (poId) => {
    setIsSelectPOOpen(false)
    navigate(`/purchase/entries/create?po_id=${poId}`)
  }

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

  const filteredEntries = entries.filter((entry) => {
    const searchLower = searchQuery.toLowerCase().trim()
    if (!searchLower) return true

    const peNumMatch = entry.pe_number?.toLowerCase().includes(searchLower)
    const invNumMatch = entry.invoice_number?.toLowerCase().includes(searchLower)
    const supplierName =
      entry.supplier_name ||
      entry.po?.supplier_name ||
      entry.supplier?.name ||
      entry.supplier?.contact_name ||
      entry.po?.supplier?.name ||
      entry.po?.supplier?.contact_name
    const supplierMatch = supplierName?.toLowerCase().includes(searchLower)
    const productMatch = entry.items?.some((item) => {
      const name = item.raw_material_id ? item.raw_material_name : item.product_name
      return name?.toLowerCase().includes(searchLower)
    })

    return peNumMatch || invNumMatch || supplierMatch || productMatch
  })

  const formatDate = (dateStr) => {
    if (!dateStr) return "—"
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Purchase Entries (GRN)</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Match received deliveries with invoice documentation, review CGST/SGST/IGST tax rates, and commit stock to
            warehouse balance.
          </p>
        </div>

        <button
          onClick={handleOpenPOSelection}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center gap-2 whitespace-nowrap self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Record Goods Receipt (GRN)</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
        <div className="relative w-full sm:flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by PE number, invoice number, or supplier..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 font-semibold shadow-sm flex flex-col items-center justify-center gap-3">
          <Receipt className="w-12 h-12 text-slate-300" />
          <p>No purchase entries / goods receipts found.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 shadow-md rounded-2xl overflow-hidden w-full">
          <div className="w-full">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="pl-4 pr-2 py-4 w-[42%] md:w-[28%] lg:w-[24%]">Product</th>
                  <th className="px-2 py-4 hidden md:table-cell md:w-[22%] lg:w-[20%]">Invoice Details</th>
                  <th className="px-2 py-4 text-right w-[26%] md:w-[20%] lg:w-[18%]">Tax & Grand Total</th>
                  <th className="px-2 py-4 w-[16%] md:w-[15%] lg:w-[14%]">
                    <span className="hidden md:inline">Status</span>
                  </th>
                  <th className="pl-2 pr-4 py-4 text-right w-[16%] md:w-[15%] lg:w-[24%]">
                    <span className="hidden md:inline">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-800">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="pl-4 pr-2 py-4 text-slate-800 font-bold uppercase tracking-wide text-xs min-w-0">
                      <div className="truncate" title={getProductNamesString(entry)}>
                        {getProductNamesString(entry)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal normal-case tracking-normal truncate md:hidden mt-0.5">
                        Inv: {entry.invoice_number} • {formatDate(entry.invoice_date || entry.created_at)}
                      </div>
                    </td>

                    <td className="px-2 py-4 min-w-0 hidden md:table-cell">
                      <div className="min-w-0">
                        <p className="text-slate-800 font-bold text-xs truncate" title={entry.invoice_number}>
                          {entry.invoice_number}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5 truncate">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{formatDate(entry.invoice_date || entry.created_at)}</span>
                        </p>
                      </div>
                    </td>

                    <td className="px-2 py-4 text-right whitespace-nowrap">
                      <div>
                        <p className="text-slate-800 font-bold tabular-nums">
                          {entry.total_amount != null
                            ? `₹${Number(entry.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                            : "—"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold tabular-nums">
                          {entry.total_tax != null
                            ? `Tax: ₹${Number(entry.total_tax).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                            : "—"}
                        </p>
                      </div>
                    </td>

                    <td className="px-2 py-4 whitespace-nowrap">
                      {entry.status === "authorized" ? (
                        <span
                          title="Authorized"
                          className="inline-flex items-center px-1.5 xl:px-2.5 py-0.5 rounded-full text-[10px] xl:text-xs font-bold border bg-success-50 text-success-700 border-success-100 whitespace-nowrap"
                        >
                          <span className="w-1.5 h-1.5 rounded-full md:mr-1.5 bg-success-500" aria-hidden="true" />
                          <span className="sr-only md:hidden">Authorized</span>
                          <span className="hidden md:inline">Authorized</span>
                        </span>
                      ) : (
                        <span
                          title="Draft (Pending)"
                          className="inline-flex items-center px-1.5 xl:px-2.5 py-0.5 rounded-full text-[10px] xl:text-xs font-bold border bg-slate-100 text-slate-700 border-slate-200 whitespace-nowrap"
                        >
                          <span className="w-1.5 h-1.5 rounded-full md:mr-1.5 bg-slate-500" aria-hidden="true" />
                          <span className="sr-only md:hidden">Draft (Pending)</span>
                          <span className="hidden md:inline">Draft (Pending)</span>
                        </span>
                      )}
                    </td>

                    <td className="pl-2 pr-4 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end items-center gap-1.5">
                        {entry.status === "draft" ? (
                          <button
                            onClick={() => navigate(`/purchase/entries/create?po_id=${entry.po_id}&pe_id=${entry.id}`)}
                            className="px-2.5 py-1.5 border border-brand-200 hover:border-brand-400 hover:bg-brand-50 rounded-xl text-[10px] font-bold text-brand-700 transition-all active:scale-95 flex items-center gap-1 shrink-0"
                            title="Complete Draft & Authorize"
                            aria-label="View/Authorize"
                          >
                            <span className="hidden md:inline">View/Authorize</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setViewingEntry(entry)}
                            className="p-1.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-800 transition-all active:scale-95 inline-flex items-center shrink-0"
                            title="View Summary details"
                            aria-label="View entry"
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

      {isSelectPOOpen && (
        <Modal onClose={() => setIsSelectPOOpen(false)}>
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-900 text-lg">Select Purchase Order</h3>
              <button
                onClick={() => setIsSelectPOOpen(false)}
                className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                Select an open purchase order (confirmed, sent, acknowledged or partially received) to record a goods
                receipt. Stock is only updated after this entry is authorized.
              </p>

              {isLoadingPOs ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="md" />
                </div>
              ) : receivableOrders.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-400 font-bold text-xs">
                  No open purchase orders found.
                  <br />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Authorize a PO in the Orders screen first.
                  </span>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                  {receivableOrders.map((po) => (
                    <button
                      key={po.id}
                      onClick={() => handleSelectPO(po.id)}
                      className="w-full px-4 py-3 hover:bg-brand-50/50 text-left transition-all flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-xs font-bold text-brand-700 tabular-nums group-hover:underline">
                          {po.po_number}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                          {po.supplier_name || po.supplier?.name || po.supplier?.contact_name || "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                          {po.items?.length || 0} items
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col-reverse sm:flex-row sm:justify-between items-stretch sm:items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setIsSelectPOOpen(false)
                  navigate("/purchase/entries/create")
                }}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm shadow-indigo-500/10 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Direct Purchase (No PO)</span>
              </button>
              <button
                onClick={() => setIsSelectPOOpen(false)}
                className="w-full sm:w-auto px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {viewingEntry && (
        <Modal onClose={() => setViewingEntry(null)}>
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Goods Receipt Summary (GRN)</h3>
                <p className="text-xs tabular-nums font-bold text-slate-400 mt-0.5">{viewingEntry.pe_number}</p>
              </div>
              <button
                onClick={() => setViewingEntry(null)}
                className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
              {authError && (
                <div className="p-4 bg-error-50 border border-error-100 rounded-xl text-xs font-semibold text-error-800 flex items-start gap-2.5 shrink-0 animate-in fade-in duration-200">
                  <AlertTriangle className="w-5 h-5 text-error-500 shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-error-800">Authorization Failed</p>
                    <p className="mt-0.5">{authError}</p>
                  </div>
                  <button
                    onClick={() => setAuthError("")}
                    className="text-error-500 hover:text-error-800 font-bold ml-auto text-sm"
                  >
                    &times;
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Supplier</span>
                  <span className="text-sm font-bold text-slate-800 uppercase mt-0.5 block">
                    {viewingEntry.supplier_name ?? "—"}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Invoice Number
                  </span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">{viewingEntry.invoice_number}</span>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Invoice Date</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
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
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border mt-1 bg-yellow-50 text-yellow-800 border-yellow-200">
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
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Place of Supply
                  </span>
                  <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                    {viewingEntry.ship_to_state || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Rounding Adjustment
                  </span>
                  <span className="text-sm tabular-nums font-bold text-slate-800 mt-0.5 block">
                    {viewingEntry.rounding_adjustment != null
                      ? `₹${Number(viewingEntry.rounding_adjustment).toFixed(2)}`
                      : "—"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                  Received Items
                </h4>
                <div className="w-full border border-slate-100 rounded-xl">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <th className="px-3 py-2.5 w-[55%] md:w-[30%] whitespace-normal leading-tight">Item Details</th>
                        <th className="px-2 py-2.5 text-right w-[20%] md:w-[12%] whitespace-normal leading-tight">
                          Qty Received
                        </th>
                        <th className="px-2 py-2.5 text-right hidden md:table-cell md:w-[13%] whitespace-normal leading-tight">
                          Unit Price
                        </th>
                        <th className="px-2 py-2.5 text-right hidden md:table-cell md:w-[15%] whitespace-normal leading-tight">
                          Taxable
                        </th>
                        <th className="px-2 py-2.5 text-right hidden md:table-cell md:w-[15%] whitespace-normal leading-tight">
                          GST
                        </th>
                        <th className="px-3 py-2.5 text-right w-[25%] md:w-[15%] whitespace-normal leading-tight">
                          Total Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                      {viewingEntry.items?.map((item) => {
                        const itemName = item.raw_material_id ? item.raw_material_name : item.product_name
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/20">
                            <td className="px-3 py-3 min-w-0">
                              <p className="font-bold text-slate-800 truncate" title={itemName || "Inventory Item"}>
                                {itemName || "Inventory Item"}
                              </p>
                              <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                                <span>HSN: {item.hsn_code || "—"}</span>
                                <span className="md:hidden">
                                  {" "}
                                  • Rate: {item.unit_price != null ? `₹${parseFloat(item.unit_price).toFixed(2)}` : "—"}
                                </span>
                              </div>
                            </td>
                            <td className="px-2 py-3 text-right tabular-nums text-slate-600 whitespace-nowrap">
                              <div
                                className="truncate"
                                title={
                                  item.quantity_received != null ? parseFloat(item.quantity_received).toFixed(2) : "—"
                                }
                              >
                                {item.quantity_received != null ? parseFloat(item.quantity_received).toFixed(2) : "—"}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-right tabular-nums text-slate-600 whitespace-nowrap hidden md:table-cell">
                              <div
                                className="truncate"
                                title={item.unit_price != null ? `₹${parseFloat(item.unit_price).toFixed(2)}` : "—"}
                              >
                                {item.unit_price != null ? `₹${parseFloat(item.unit_price).toFixed(2)}` : "—"}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-right tabular-nums text-slate-600 whitespace-nowrap hidden md:table-cell">
                              <div
                                className="truncate"
                                title={
                                  item.subtotal != null
                                    ? `₹${parseFloat(item.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                                    : "—"
                                }
                              >
                                {item.subtotal != null
                                  ? `₹${parseFloat(item.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                                  : "—"}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-right tabular-nums text-slate-600 whitespace-nowrap hidden md:table-cell">
                              {viewingEntry.is_interstate ? (
                                <>
                                  <div
                                    className="truncate"
                                    title={
                                      item.igst_amount != null
                                        ? `IGST ₹${parseFloat(item.igst_amount).toFixed(2)}`
                                        : "—"
                                    }
                                  >
                                    {item.igst_amount != null
                                      ? `IGST ₹${parseFloat(item.igst_amount).toFixed(2)}`
                                      : "—"}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate" title={`@ ${item.gst_percent}%`}>
                                    @ {item.gst_percent}%
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div
                                    className="truncate"
                                    title={
                                      item.cgst_amount != null
                                        ? `CGST ₹${parseFloat(item.cgst_amount).toFixed(2)}`
                                        : "—"
                                    }
                                  >
                                    {item.cgst_amount != null
                                      ? `CGST ₹${parseFloat(item.cgst_amount).toFixed(2)}`
                                      : "—"}
                                  </div>
                                  <div
                                    className="truncate"
                                    title={
                                      item.sgst_amount != null
                                        ? `SGST ₹${parseFloat(item.sgst_amount).toFixed(2)}`
                                        : "—"
                                    }
                                  >
                                    {item.sgst_amount != null
                                      ? `SGST ₹${parseFloat(item.sgst_amount).toFixed(2)}`
                                      : "—"}
                                  </div>
                                  <div
                                    className="text-[10px] text-slate-400 truncate"
                                    title={`@ ${item.gst_percent / 2}% each`}
                                  >
                                    @ {item.gst_percent / 2}% each
                                  </div>
                                </>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right tabular-nums font-bold text-slate-800 whitespace-nowrap">
                              <div
                                className="truncate"
                                title={
                                  item.total_amount != null
                                    ? `₹${parseFloat(item.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                                    : "—"
                                }
                              >
                                {item.total_amount != null
                                  ? `₹${parseFloat(item.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                                  : "—"}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 ml-auto max-w-sm space-y-3 shadow-inner">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
                  Grand Billing Summary
                </h4>

                <div className="space-y-1.5 text-xs font-semibold text-slate-600">
                  <div className="flex justify-between">
                    <span>Taxable Subtotal</span>
                    <span className="tabular-nums text-slate-800 font-bold">
                      {viewingEntry.taxable_subtotal != null
                        ? `₹${Number(viewingEntry.taxable_subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </span>
                  </div>

                  {viewingEntry.is_interstate ? (
                    <div className="flex justify-between">
                      <span>IGST Amount</span>
                      <span className="tabular-nums text-slate-800 font-bold">
                        {viewingEntry.igst_amount != null
                          ? `₹${Number(viewingEntry.igst_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                          : "—"}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>CGST Amount</span>
                        <span className="tabular-nums text-slate-800 font-bold">
                          {viewingEntry.cgst_amount != null
                            ? `₹${Number(viewingEntry.cgst_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                            : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST Amount</span>
                        <span className="tabular-nums text-slate-800 font-bold">
                          {viewingEntry.sgst_amount != null
                            ? `₹${Number(viewingEntry.sgst_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                            : "—"}
                        </span>
                      </div>
                    </>
                  )}

                  {parseFloat(viewingEntry.total_cess) > 0 && (
                    <div className="flex justify-between">
                      <span>Cess Amount</span>
                      <span className="tabular-nums text-slate-800 font-bold">
                        {viewingEntry.total_cess != null
                          ? `₹${parseFloat(viewingEntry.total_cess).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                          : "—"}
                      </span>
                    </div>
                  )}

                  {parseFloat(viewingEntry.others || 0) > 0 && (
                    <div className="flex justify-between">
                      <span>Shipping / Other Charges</span>
                      <span className="tabular-nums text-slate-800 font-bold">
                        {viewingEntry.others != null
                          ? `₹${parseFloat(viewingEntry.others).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                          : "—"}
                      </span>
                    </div>
                  )}

                  {parseFloat(viewingEntry.rounding_adjustment || 0) !== 0 && (
                    <div className="flex justify-between">
                      <span>Rounding Adjustment</span>
                      <span className="tabular-nums text-slate-800 font-bold">
                        {viewingEntry.rounding_adjustment != null
                          ? `₹${Number(viewingEntry.rounding_adjustment).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                          : "—"}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-slate-800">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                      <span>Grand Total</span>
                    </span>
                    <span className="tabular-nums text-brand-700">
                      {viewingEntry.total_amount != null
                        ? `₹${Number(viewingEntry.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 shrink-0">
              <button
                onClick={() => setViewingEntry(null)}
                className="w-full sm:w-auto px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-all active:scale-95"
              >
                Close Summary
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default PurchaseEntries
