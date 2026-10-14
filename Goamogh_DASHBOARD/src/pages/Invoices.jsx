import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  FileText,
  Search,
  AlertCircle,
  Eye,
  ExternalLink
} from "lucide-react"
import { getInvoices } from "@/services/invoices"
import Spinner from "@/components/ui/Spinner"
import Pagination from "@/components/ui/Pagination"

function Invoices() {
  const navigate = useNavigate()

  // State Lists
  const [invoices, setInvoices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [skip, setSkip] = useState(0)
  const limit = 50
  const [total, setTotal] = useState(0)
  const latestRequestRef = useRef(0)

  const fetchInvoices = useCallback(async () => {
    const requestId = ++latestRequestRef.current
    setIsLoading(true)
    setError("")
    try {
      const params = { skip, limit }
      const res = await getInvoices(params)
      if (requestId !== latestRequestRef.current) return
      if (!res.ok) {
        throw new Error("Failed to load generated invoices.")
      }
      const json = await res.json()
      if (requestId !== latestRequestRef.current) return
      setInvoices(json.data || [])
      setTotal(json.meta.total)
    } catch (err) {
      if (requestId !== latestRequestRef.current) return
      setError(err.message || "An error occurred.")
    } finally {
      if (requestId === latestRequestRef.current) {
        setIsLoading(false)
      }
    }
  }, [skip, limit])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const formatShortDate = (isoString) => {
    if (!isoString) return "—"
    return new Date(isoString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    })
  }

  // Filter list by customer name/phone/invoice number in memory
  const getFilteredInvoices = () => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return invoices
    return invoices.filter((inv) => {
      const sale = inv.sale_details || {}
      return (
        (inv.invoice_number || "").toLowerCase().includes(q) ||
        (sale.sale_number || "").toLowerCase().includes(q) ||
        (sale.customer_name || "").toLowerCase().includes(q) ||
        (sale.customer_phone || "").includes(q)
      )
    })
  }

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in fade-in duration-200">

      {/* Top Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
            <span>Sales & Accounts</span>
            <span>/</span>
            <span className="text-slate-800 font-bold">Tax Invoices</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-600" />
            <span>Tax Invoices Registry</span>
          </h2>
        </div>
      </div>

      {/* Toolbar filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
        <div className="relative w-full sm:flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice #, sale #, or customer name/phone..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error-50 border border-error-100 rounded-2xl text-sm font-semibold text-error-800 flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-error-500 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Main Listing Table */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center min-h-[300px]"><Spinner size="lg" /></div>
      ) : getFilteredInvoices().length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-slate-400 font-bold">No generated tax invoices found.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden w-full">
          <div className="w-full">
            <table className="w-full text-left border-collapse table-fixed text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-2 md:px-3.5 py-3.5 w-[42%] md:w-[28%] lg:w-[22%]">Invoice & Order #</th>
                  <th className="px-3 py-3.5 hidden md:table-cell md:w-[26%] lg:w-[22%]">Customer & Type</th>
                  <th className="px-3 py-3.5 text-right w-[24%] md:w-[18%] lg:w-[16%]">Date & Value</th>
                  <th className="px-3 py-3.5 hidden lg:table-cell lg:w-[14%] text-center">Payment Status</th>
                  <th className="px-3 py-3.5 w-[18%] md:w-[14%] lg:w-[12%] text-center"><span className="hidden md:inline">Status</span></th>
                  <th className="pl-2 pr-5 py-3.5 w-[16%] md:w-[14%] lg:w-[14%] text-right"><span className="hidden md:inline">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {getFilteredInvoices().map((inv) => {
                  const sale = inv.sale_details || {}
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Column 1: Invoice # & Sale Order # */}
                      <td className="px-2 md:px-3.5 py-3 min-w-0">
                        <div className="flex flex-col items-start gap-0.5 min-w-0">
                          <span className="tabular-nums text-brand-700 font-bold text-xs truncate" title={inv.invoice_number}>{inv.invoice_number}</span>
                          {sale.sale_number && (
                            <button
                              onClick={() => navigate(`/dashboard/sales?search=${sale.sale_number}`)}
                              className="hover:underline flex items-center gap-1 text-[11px] tabular-nums text-slate-500 hover:text-brand-700 truncate"
                              title={sale.sale_number}
                            >
                              <span className="truncate">{sale.sale_number}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                            </button>
                          )}
                          <div className="text-[10px] text-slate-500 font-normal truncate md:hidden mt-0.5" title={sale.customer_name || ""}>
                            {sale.customer_name || "Walk-in"}{sale.sale_type ? ` • ${sale.sale_type}` : ""}
                          </div>
                          <div className="text-[10px] text-slate-400 tabular-nums lg:hidden">
                            Pay: {inv.payment_status || "—"}
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Customer Name & Sale Type */}
                      <td className="px-3 py-3 min-w-0 hidden md:table-cell">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs truncate" title={sale.customer_name || "Walk-in Customer"}>
                            {sale.customer_name || "Walk-in Customer"}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {sale.sale_type === "retail" && (
                              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 font-semibold text-[10px]">Retail</span>
                            )}
                            {sale.sale_type === "wholesale" && (
                              <span className="text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200/60 font-semibold text-[10px]">Wholesale</span>
                            )}
                            {sale.sale_type === "indent_conversion" && (
                              <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60 font-semibold text-[10px]">Indent Conv</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Date & Amount */}
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <p className="tabular-nums font-extrabold text-slate-900 text-xs">₹{parseFloat(inv.total_amount || 0).toFixed(2)}</p>
                        <p className="text-[11px] tabular-nums text-slate-400 mt-0.5">{formatShortDate(inv.invoice_date || inv.created_at)}</p>
                      </td>

                      {/* Column 4: Payment Status */}
                      <td className="px-3 py-3 text-center whitespace-nowrap hidden lg:table-cell">
                        {inv.payment_status === "unpaid" && (
                          <span className="text-slate-500 bg-slate-50 px-1.5 md:px-2.5 py-0.5 rounded border border-slate-200 font-semibold text-[10px] md:text-xs whitespace-nowrap">Unpaid</span>
                        )}
                        {inv.payment_status === "partial" && (
                          <span className="text-amber-700 bg-amber-50 px-1.5 md:px-2.5 py-0.5 rounded border border-amber-200 font-semibold text-[10px] md:text-xs whitespace-nowrap">Partial</span>
                        )}
                        {inv.payment_status === "paid" && (
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 md:px-2.5 py-0.5 rounded border border-emerald-200 font-semibold text-[10px] md:text-xs whitespace-nowrap">Paid</span>
                        )}
                      </td>

                      {/* Column 5: Status */}
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        {inv.status === "generated" && (
                          <span title="Generated" className="inline-flex items-center text-blue-700 bg-blue-50 px-1.5 xl:px-2.5 py-0.5 rounded border border-blue-200 font-semibold text-[10px] xl:text-xs whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-current md:hidden" aria-hidden="true" />
                            <span className="sr-only md:hidden">Generated</span>
                            <span className="hidden md:inline">Generated</span>
                          </span>
                        )}
                        {inv.status === "paid" && (
                          <span title="Paid" className="inline-flex items-center text-emerald-700 bg-emerald-50 px-1.5 xl:px-2.5 py-0.5 rounded border border-emerald-200 font-semibold text-[10px] xl:text-xs whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-current md:hidden" aria-hidden="true" />
                            <span className="sr-only md:hidden">Paid</span>
                            <span className="hidden md:inline">Paid</span>
                          </span>
                        )}
                        {inv.status === "cancelled" && (
                          <span title="Cancelled" className="inline-flex items-center text-rose-700 bg-rose-50 px-1.5 xl:px-2.5 py-0.5 rounded border border-rose-200 font-semibold text-[10px] xl:text-xs whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-current md:hidden" aria-hidden="true" />
                            <span className="sr-only md:hidden">Cancelled</span>
                            <span className="hidden md:inline">Cancelled</span>
                          </span>
                        )}
                      </td>

                      {/* Column 6: Actions */}
                      <td className="pl-2 pr-5 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/dashboard/invoices/${inv.id}`)}
                          className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-semibold border border-brand-200/60 transition-all inline-flex items-center gap-1 active:scale-95 shadow-2xs"
                          aria-label="View invoice"
                        >
                          <Eye className="w-3 h-3" />
                          <span className="hidden md:inline">View</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination skip={skip} limit={limit} total={total} onChange={setSkip} />
        </div>
      )}

    </div>
  )
}

export default Invoices
