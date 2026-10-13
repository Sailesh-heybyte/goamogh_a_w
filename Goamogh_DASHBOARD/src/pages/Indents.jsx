import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  Layers3,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Info,
  Clock,
  ExternalLink,
  Edit
} from "lucide-react"
import { getIndents, confirmIndent, cancelIndent } from "@/services/indents"
import useAuth from "@/hooks/useAuth"
import Spinner from "@/components/ui/Spinner"

function parseErrorDetail(detail, defaultMsg) {
  if (!detail) return defaultMsg
  if (Array.isArray(detail)) {
    const messages = detail.map((d) => d.msg).filter(Boolean)
    return messages.length > 0 ? messages.join(", ") : defaultMsg
  }
  return typeof detail === "string" ? detail : defaultMsg
}

function Indents() {
  const navigate = useNavigate()
  const { user, isSuperAdmin, hasPermission } = useAuth()

  // State Lists
  const [indents, setIndents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Filter States
  const [statusFilter, setStatusFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [skip, setSkip] = useState(0)
  const [limit, setLimit] = useState(50)

  // Details & Action Modal States
  const [selectedIndent, setSelectedIndent] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState("")

  const hasIndentManagePermission = isSuperAdmin || hasPermission("indent_manage")


  const fetchIndents = useCallback(async () => {
    setIsLoading(true)
    setError("")
    try {
      const params = { skip, limit }
      if (statusFilter) params.status = statusFilter
      const res = await getIndents(params)
      if (!res.ok) {
        throw new Error("Failed to load customer indents.")
      }
      const json = await res.json()
      setIndents(json.data || [])
    } catch (err) {
      setError(err.message || "An error occurred.")
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, skip, limit])

  useEffect(() => {
    fetchIndents()
  }, [fetchIndents])

  // Handle Confirm (Converts to Sale 100%)
  const handleConfirmIndent = async (indent) => {
    if (!window.confirm(`Are you sure you want to confirm Indent ${indent.indent_number}? This will convert the entire indent into a sale.`)) return
    setActionLoading(true)
    setActionError("")
    try {
      const res = await confirmIndent(indent.id)
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

  // Handle Cancel (Returns reserved stock to bulk stock_qty)
  const handleCancelIndent = async (indent) => {
    if (!window.confirm(`Are you sure you want to cancel Indent ${indent.indent_number}? All reserved quantities will be returned to stock.`)) return
    setActionLoading(true)
    setActionError("")
    try {
      const res = await cancelIndent(indent.id)
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
      year: "numeric"
    })
  }

  // Filter list by customer name/phone in memory
  const getFilteredIndents = () => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return indents
    return indents.filter(
      (ind) =>
        (ind.customer_name || "").toLowerCase().includes(q) ||
        (ind.customer_phone || "").includes(q) ||
        (ind.indent_number || "").toLowerCase().includes(q)
    )
  }

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header Block */}
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
          <p className="text-sm font-medium text-slate-550 mt-1">
            Manage pre-orders, lock variant stocks to reserve inventory, and reconcile partial order fulfillment.
          </p>
        </div>

        {hasIndentManagePermission && (
          <button
            onClick={() => navigate("/dashboard/indents/create")}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-brand-500/10 active:scale-95 self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Create Indent</span>
          </button>
        )}
      </div>

      {/* Toolbar filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 border border-slate-150 rounded-2xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone, or indent number..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-350 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-slate-200 hover:border-slate-350 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-semibold text-slate-700 w-full sm:w-44"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-error-50 border border-error-200 rounded-2xl text-sm font-semibold text-error-800 flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-error-600 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Main Listing Table */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center min-h-[300px]"><Spinner size="lg" /></div>
      ) : getFilteredIndents().length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-slate-400 font-bold">No indents found matching parameters.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden w-full">
          <div className="w-full overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-3.5 py-3.5 w-[30%]">Indent No & Customer</th>
                  <th className="px-3 py-3.5 w-[14%] text-center">Items</th>
                  <th className="px-3 py-3.5 w-[16%]">Created Date</th>
                  <th className="px-3 py-3.5 w-[14%] text-center">Status</th>
                  <th className="px-3 py-3.5 w-[26%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {getFilteredIndents().map((ind) => (
                  <tr key={ind.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Column 1: Indent # & Customer Name */}
                    <td className="px-3.5 py-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-brand-700 font-bold text-xs">{ind.indent_number}</span>
                          {ind.is_b2b ? (
                            <span className="text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-purple-200/60">B2B</span>
                          ) : (
                            <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-200/50">B2C</span>
                          )}
                        </div>
                        <p className="font-semibold text-slate-900 text-xs truncate mt-0.5" title={ind.customer_name || "—"}>
                          {ind.customer_name || "—"}
                        </p>
                        {ind.customer_phone && <p className="text-[11px] font-mono text-slate-500">{ind.customer_phone}</p>}
                      </div>
                    </td>

                    {/* Column 2: Items count pill */}
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
                        {ind.items?.length || 0} items
                      </span>
                    </td>

                    {/* Column 3: Created Date */}
                    <td className="px-3 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {formatShortDate(ind.created_at)}
                    </td>

                    {/* Column 4: Status Badge */}
                    <td className="px-3 py-3 text-center">
                      {ind.status === "pending" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
                          <span className="w-1 h-1 rounded-full mr-1 bg-amber-500 shrink-0" />
                          Pending
                        </span>
                      )}
                      {ind.status === "confirmed" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          <span className="w-1 h-1 rounded-full mr-1 bg-emerald-500 shrink-0" />
                          Confirmed
                        </span>
                      )}
                      {ind.status === "cancelled" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                          <span className="w-1 h-1 rounded-full mr-1 bg-rose-500 shrink-0" />
                          Cancelled
                        </span>
                      )}
                    </td>

                    {/* Column 5: Actions */}
                    <td className="px-3 py-3 text-right">
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
                              onClick={() => handleConfirmIndent(ind)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all active:scale-95 shadow-2xs"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleCancelIndent(ind)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-lg text-xs font-semibold transition-all active:scale-95"
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
        </div>
      )}

      {/* MODAL 1: INDENT DETAIL DIALOG */}
      {isDetailOpen && selectedIndent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-center p-4 items-center animate-in fade-in duration-200">
          <div className="bg-white border border-slate-150 rounded-2xl max-w-2xl w-full shadow-2xl p-6 relative flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers3 className="w-5 h-5 text-brand-600" />
                  <span>Indent Details: {selectedIndent.indent_number}</span>
                </h3>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 my-4 space-y-5 text-xs font-semibold">
              
              {/* Customer details banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Customer</span>
                  <span className="text-slate-800 font-bold block mt-0.5">{selectedIndent.customer_name || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Phone</span>
                  <span className="text-slate-800 font-bold block mt-0.5">{selectedIndent.customer_phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">GSTIN / Company</span>
                  <span className="text-slate-850 font-bold block mt-0.5 font-mono">{selectedIndent.customer_gstin || "—"} {selectedIndent.company_name && `(${selectedIndent.company_name})`}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Current Status</span>
                  <span className="text-slate-800 font-bold block mt-0.5 uppercase text-[10px]">{selectedIndent.status}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Ordered Product Variants</h4>
                <div className="border border-slate-150 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="px-4 py-2.5">Variant Code / Specs</th>
                        <th className="px-4 py-2.5 text-right w-[80px]">Qty</th>
                        <th className="px-4 py-2.5 text-right w-[100px]">Rate</th>
                        <th className="px-4 py-2.5 text-right w-[100px]">Discount %</th>
                        <th className="px-4 py-2.5 text-right w-[120px]">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {selectedIndent.items?.map((item) => {
                        const subtotal = item.quantity * item.rate
                        const discount = subtotal * ((item.discount_percent || 0) / 100)
                        const total = subtotal - discount
                        return (
                          <tr key={item.id}>
                            <td className="px-4 py-2.5 font-bold text-slate-800">{item.variant_display_name}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-slate-900">{item.quantity}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-slate-500">₹{parseFloat(item.rate).toFixed(2)}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-slate-500">{parseFloat(item.discount_percent || 0).toFixed(2)}%</td>
                            <td className="px-4 py-2.5 text-right font-mono text-slate-900 font-bold">₹{total.toFixed(2)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedIndent.notes && (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase block font-bold mb-0.5">Admin Order Notes</span>
                  <p className="text-slate-655 text-xs">{selectedIndent.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-between border-t border-slate-100 pt-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                Close View
              </button>

              {selectedIndent.status === "pending" && hasIndentManagePermission && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCancelIndent(selectedIndent)}
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-250 text-rose-700 rounded-xl font-bold transition-all"
                  >
                    Cancel Indent
                  </button>
                  <button
                    onClick={() => handleConfirmIndent(selectedIndent)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all"
                  >
                    Confirm & Convert Sale
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

export default Indents
