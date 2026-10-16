import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Layers3, Search, Plus, AlertCircle } from "lucide-react"
import { getIndents, updateIndentStatus } from "@/api/indents"
import useAuth from "@/hooks/useAuth"
import Spinner from "@/components/ui/Spinner"
import Pagination from "@/components/ui/Pagination"
import Modal from "@/components/ui/Modal"
import useConfirm from "@/hooks/useConfirm"

function parseErrorDetail(detail, defaultMsg) {
  if (!detail) return defaultMsg
  if (Array.isArray(detail)) {
    const messages = detail.map((d) => d.msg).filter(Boolean)
    return messages.length > 0 ? messages.join(", ") : defaultMsg
  }
  return typeof detail === "string" ? detail : defaultMsg
}

function Indents() {
  const confirm = useConfirm()
  const navigate = useNavigate()
  const { isSuperAdmin, hasPermission } = useAuth()

  const [indents, setIndents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const [statusFilter, setStatusFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [skip, setSkip] = useState(0)
  const limit = 50
  const latestRequestRef = useRef(0)

  const [selectedIndent, setSelectedIndent] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const hasIndentManagePermission = isSuperAdmin || hasPermission("indent_manage")

  const fetchIndents = useCallback(async () => {
    const requestId = ++latestRequestRef.current
    setIsLoading(true)
    setError("")
    try {
      const res = await getIndents()
      if (requestId !== latestRequestRef.current) return
      if (!res.ok) {
        throw new Error("Failed to load customer indents.")
      }
      const json = await res.json()
      if (requestId !== latestRequestRef.current) return
      setIndents(json.data || [])
    } catch (err) {
      if (requestId !== latestRequestRef.current) return
      setError(err.message || "An error occurred.")
    } finally {
      if (requestId === latestRequestRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchIndents()
  }, [fetchIndents])

  useEffect(() => {
    setSkip(0)
  }, [searchQuery, statusFilter])

  const handleConfirmIndent = async (indent) => {
    const ok = await confirm({
      title: `Confirm Indent ${indent.indent_number}?`,
      message: `Are you sure you want to confirm Indent ${indent.indent_number}? This will convert the entire indent into a sale.`,
      confirmLabel: "Confirm Indent",
    })
    if (!ok) return

    setActionLoading(true)
    try {
      const res = await updateIndentStatus(indent.id, "confirm")
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(parseErrorDetail(errJson.detail, "Confirmation failed."))
      }
      alert("Indent confirmed and successfully converted to Direct Sale!")
      fetchIndents()
      setIsDetailOpen(false)
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelIndent = async (indent) => {
    const ok = await confirm({
      title: `Cancel Indent ${indent.indent_number}?`,
      message: `Are you sure you want to cancel Indent ${indent.indent_number}?`,
      confirmLabel: "Cancel Indent",
      tone: "danger",
    })
    if (!ok) return

    setActionLoading(true)
    try {
      const res = await updateIndentStatus(indent.id, "cancel")
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(parseErrorDetail(errJson.detail, "Cancellation failed."))
      }
      alert("Indent cancelled successfully.")
      fetchIndents()
      setIsDetailOpen(false)
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const formatShortDate = (isoString) => {
    if (!isoString) return "—"
    return new Date(isoString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const filteredIndents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return indents.filter((ind) => {
      if (statusFilter && ind.status !== statusFilter) return false
      if (!q) return true
      return (
        (ind.customer_name || "").toLowerCase().includes(q) ||
        (ind.customer_phone || "").includes(q) ||
        (ind.indent_number || "").toLowerCase().includes(q)
      )
    })
  }, [indents, statusFilter, searchQuery])
  const pageRows = filteredIndents.slice(skip, skip + limit)

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
            <span>Sales & Accounts</span>
            <span>/</span>
            <span className="text-slate-800">Indents</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers3 className="w-6 h-6 text-brand-600" />
            <span>Customer Demand Indents</span>
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Manage pre-orders, lock variant stocks to reserve inventory, and reconcile partial order fulfillment.
          </p>
        </div>

        {hasIndentManagePermission && (
          <button
            onClick={() => navigate("/indents/create")}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-brand-500/10 active:scale-95 whitespace-nowrap self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Indent</span>
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
        <div className="relative w-full sm:flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone, or indent number..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setSkip(0)
          }}
          className="px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-semibold text-slate-700 w-full sm:w-auto sm:min-w-[160px]"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-error-50 border border-error-100 rounded-2xl text-sm font-semibold text-error-800 flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-error-500 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <Spinner size="lg" />
        </div>
      ) : filteredIndents.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-slate-400 font-bold">No indents found matching parameters.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden w-full">
          <div className="w-full">
            <table className="w-full text-left border-collapse table-fixed text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-3.5 py-3.5 w-[48%] md:w-[36%] lg:w-[30%]">Indent No & Customer</th>
                  <th className="px-3 py-3.5 hidden md:table-cell md:w-[16%] lg:w-[14%] text-center">Items</th>
                  <th className="px-3 py-3.5 hidden lg:table-cell lg:w-[16%]">Created Date</th>
                  <th className="px-3 py-3.5 w-[24%] md:w-[18%] lg:w-[14%] text-center">
                    <span className="hidden md:inline">Status</span>
                  </th>
                  <th className="px-3 py-3.5 w-[28%] md:w-[30%] lg:w-[26%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {pageRows.map((ind) => (
                  <tr key={ind.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-3.5 py-3 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="tabular-nums text-brand-700 font-bold text-xs truncate"
                            title={ind.indent_number}
                          >
                            {ind.indent_number}
                          </span>
                          {ind.is_b2b ? (
                            <span className="text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-purple-200/60">
                              B2B
                            </span>
                          ) : (
                            <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-200/50">
                              B2C
                            </span>
                          )}
                        </div>
                        <p
                          className="font-semibold text-slate-900 text-xs truncate mt-0.5"
                          title={ind.customer_name || "—"}
                        >
                          {ind.customer_name || "—"}
                        </p>
                        {ind.customer_phone && (
                          <p className="text-[11px] tabular-nums text-slate-500 truncate" title={ind.customer_phone}>
                            {ind.customer_phone}
                          </p>
                        )}
                        <div className="text-[10px] text-slate-400 truncate md:hidden mt-0.5">
                          {ind.items?.length || 0} items • {formatShortDate(ind.created_at)}
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3 text-center whitespace-nowrap hidden md:table-cell">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
                        {ind.items?.length || 0} items
                      </span>
                    </td>

                    <td className="px-3 py-3 text-slate-500 tabular-nums text-[11px] whitespace-nowrap hidden lg:table-cell">
                      {formatShortDate(ind.created_at)}
                    </td>

                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      {ind.status === "pending" && (
                        <span
                          title="Pending"
                          className="inline-flex items-center px-1.5 xl:px-2.5 py-0.5 rounded-full text-[10px] xl:text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 whitespace-nowrap"
                        >
                          <span className="w-1.5 h-1.5 rounded-full md:mr-1 bg-amber-500 shrink-0" aria-hidden="true" />
                          <span className="sr-only md:hidden">Pending</span>
                          <span className="hidden md:inline">Pending</span>
                        </span>
                      )}
                      {ind.status === "confirmed" && (
                        <span
                          title="Confirmed"
                          className="inline-flex items-center px-1.5 xl:px-2.5 py-0.5 rounded-full text-[10px] xl:text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 whitespace-nowrap"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full md:mr-1 bg-emerald-500 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="sr-only md:hidden">Confirmed</span>
                          <span className="hidden md:inline">Confirmed</span>
                        </span>
                      )}
                      {ind.status === "cancelled" && (
                        <span
                          title="Cancelled"
                          className="inline-flex items-center px-1.5 xl:px-2.5 py-0.5 rounded-full text-[10px] xl:text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 whitespace-nowrap"
                        >
                          <span className="w-1.5 h-1.5 rounded-full md:mr-1 bg-rose-500 shrink-0" aria-hidden="true" />
                          <span className="sr-only md:hidden">Cancelled</span>
                          <span className="hidden md:inline">Cancelled</span>
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedIndent(ind)
                            setIsDetailOpen(true)
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200/80 transition-all active:scale-95 shadow-2xs"
                        >
                          View
                        </button>

                        {ind.status === "pending" && hasIndentManagePermission && (
                          <>
                            <button
                              disabled={actionLoading}
                              onClick={() => handleConfirmIndent(ind)}
                              className="disabled:opacity-50 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all active:scale-95 shadow-2xs"
                            >
                              Confirm
                            </button>
                            <button
                              disabled={actionLoading}
                              onClick={() => handleCancelIndent(ind)}
                              className="disabled:opacity-50 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-lg text-xs font-semibold transition-all active:scale-95"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination skip={skip} limit={limit} total={filteredIndents.length} onChange={setSkip} />
        </div>
      )}

      {isDetailOpen && selectedIndent && (
        <Modal onClose={() => setIsDetailOpen(false)}>
          <div className="bg-white border border-slate-100 rounded-2xl max-w-2xl w-full shadow-2xl p-6 relative flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers3 className="w-5 h-5 text-brand-600" />
                  <span>Indent Details: {selectedIndent.indent_number}</span>
                </h3>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 my-4 space-y-5 text-xs font-semibold">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Customer</span>
                  <span
                    className="text-slate-800 font-bold block mt-0.5 truncate"
                    title={selectedIndent.customer_name || "—"}
                  >
                    {selectedIndent.customer_name || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Phone</span>
                  <span
                    className="text-slate-800 font-bold block mt-0.5 tabular-nums"
                    title={selectedIndent.customer_phone || ""}
                  >
                    {selectedIndent.customer_phone}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    GSTIN / Company
                  </span>
                  <span
                    className="text-slate-800 font-bold block mt-0.5 tabular-nums truncate"
                    title={`${selectedIndent.customer_gstin || "—"} ${selectedIndent.company_name && `(${selectedIndent.company_name})`}`}
                  >
                    {selectedIndent.customer_gstin || "—"}{" "}
                    {selectedIndent.company_name && `(${selectedIndent.company_name})`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Current Status
                  </span>
                  <span className="text-slate-800 font-bold block mt-0.5 uppercase text-[10px]">
                    {selectedIndent.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Ordered Product Variants</h4>
                <div className="w-full border border-slate-100 rounded-xl">
                  <table className="w-full text-left border-collapse table-fixed text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="px-3 py-2.5 w-[48%] md:w-[38%] lg:w-[34%]">Variant Code / Specs</th>
                        <th className="px-2 py-2.5 text-right w-[24%] md:w-[16%] lg:w-[14%]">Qty</th>
                        <th className="px-2 py-2.5 text-right hidden md:table-cell md:w-[18%] lg:w-[16%]">Rate</th>
                        <th className="px-2 py-2.5 text-right hidden lg:table-cell lg:w-[16%]">Discount %</th>
                        <th className="px-3 py-2.5 text-right w-[28%] md:w-[28%] lg:w-[20%]">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {selectedIndent.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2.5 min-w-0">
                            <p className="font-bold text-slate-800 truncate" title={item.variant_display_name}>
                              {item.variant_display_name}
                            </p>
                            <div className="text-[10px] text-slate-400 tabular-nums truncate md:hidden">
                              Rate: ₹{parseFloat(item.rate).toFixed(2)}
                            </div>
                          </td>
                          <td className="px-2 py-2.5 text-right tabular-nums text-slate-900 whitespace-nowrap">
                            {item.quantity}
                          </td>
                          <td className="px-2 py-2.5 text-right tabular-nums text-slate-500 whitespace-nowrap hidden md:table-cell">
                            ₹{parseFloat(item.rate).toFixed(2)}
                          </td>
                          <td className="px-2 py-2.5 text-right tabular-nums text-slate-500 whitespace-nowrap hidden lg:table-cell">
                            {parseFloat(item.discount_percent || 0).toFixed(2)}%
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-slate-900 font-bold whitespace-nowrap">
                            {item.line_total != null ? `₹${parseFloat(item.line_total).toFixed(2)}` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedIndent.notes && (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase block font-bold mb-0.5">Admin Order Notes</span>
                  <p className="text-slate-700 text-xs">{selectedIndent.notes}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-between items-stretch sm:items-center gap-2 border-t border-slate-100 pt-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close View
              </button>

              {selectedIndent.status === "pending" && hasIndentManagePermission && (
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleCancelIndent(selectedIndent)}
                    className="w-full sm:w-auto disabled:opacity-50 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl font-bold transition-all cursor-pointer"
                  >
                    Cancel Indent
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleConfirmIndent(selectedIndent)}
                    className="w-full sm:w-auto disabled:opacity-50 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all cursor-pointer"
                  >
                    Confirm & Convert Sale
                  </button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Indents
