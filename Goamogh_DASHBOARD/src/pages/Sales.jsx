import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  ShoppingCart,
  Search,
  Plus,
  AlertCircle,
  User,
  MapPin,
  Eye
} from "lucide-react"
import {
  getSales,
  getSaleDetails,
  updateSalesOrderStatus
} from "@/api/sales"
import { generateTaxInvoice } from "@/api/invoices"
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

function Sales() {
  const confirm = useConfirm()
  const navigate = useNavigate()
  const { isSuperAdmin, hasPermission } = useAuth()

  // State Lists
  const [sales, setSales] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Filter States
  const [saleTypeFilter, setSaleTypeFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [skip, setSkip] = useState(0)
  const limit = 50
  const [total, setTotal] = useState(0)
  const latestRequestRef = useRef(0)

  // Details Modal States
  const [selectedSale, setSelectedSale] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const hasSalesManagePermission = isSuperAdmin || hasPermission("sales_manage")

  const fetchSales = useCallback(async () => {
    const requestId = ++latestRequestRef.current
    setIsLoading(true)
    setError("")
    try {
      const params = { skip, limit }
      if (saleTypeFilter) params.sale_type = saleTypeFilter
      if (statusFilter) params.status = statusFilter
      const res = await getSales(params)
      if (requestId !== latestRequestRef.current) return
      if (!res.ok) {
        throw new Error("Failed to load sales list.")
      }
      const json = await res.json()
      if (requestId !== latestRequestRef.current) return
      setSales(json.data || [])
      setTotal(json.meta.total)
    } catch (err) {
      if (requestId !== latestRequestRef.current) return
      setError(err.message || "An error occurred.")
    } finally {
      if (requestId === latestRequestRef.current) {
        setIsLoading(false)
      }
    }
  }, [saleTypeFilter, statusFilter, skip, limit])

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

  // Open Details Modal and fetch fresh details
  const handleOpenDetails = async (sale) => {
    setSelectedSale(sale)
    setIsDetailOpen(true)
    try {
      const res = await getSaleDetails(sale.id)
      if (res.ok) {
        const json = await res.json()
        setSelectedSale(json.data || sale)
      }
    } catch (err) {
      console.error("Failed to load fresh sale details:", err)
    }
  }

  // Helper to get sale order number for dialog
  const getSaleOrderNumber = (saleId) => {
    if (selectedSale && selectedSale.id === saleId) return selectedSale.sale_number || saleId
    const found = sales.find((s) => s.id === saleId)
    return found?.sale_number || saleId
  }

  // Confirm order (from draft to confirmed status, triggers stock deduction)
  const handleConfirmOrder = async (saleId) => {
    const orderNum = getSaleOrderNumber(saleId)
    const ok = await confirm({
      title: `Confirm order ${orderNum}?`,
      message: "Confirm this order? This will immediately deduct variant stock levels.",
      confirmLabel: "Confirm order",
      tone: "danger"
    })
    if (!ok) return

    setActionLoading(true)
    try {
      const res = await updateSalesOrderStatus(saleId, "confirm")
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(parseErrorDetail(errJson.detail, "Confirmation failed."))
      }

      alert("Order confirmed successfully! SMS, Email, and WhatsApp confirmation notifications were sent.")
      fetchSales()
      setIsDetailOpen(false)
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // Dispatch order
  const handleDispatchOrder = async (saleId) => {
    const orderNum = getSaleOrderNumber(saleId)
    const ok = await confirm({
      title: `Dispatch order ${orderNum}?`,
      message: "Mark order as dispatched? Tax invoice will be generated automatically and attached to dispatch notifications.",
      confirmLabel: "Dispatch"
    })
    if (!ok) return

    setActionLoading(true)
    try {
      const res = await updateSalesOrderStatus(saleId, "dispatch")
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(parseErrorDetail(errJson.detail, "Dispatch failed."))
      }
      alert("Order successfully marked as Dispatched! Tax Invoice PDF generated and SMS, Email, and WhatsApp dispatch alerts were sent.")
      fetchSales()
      const freshRes = await getSaleDetails(saleId)
      if (freshRes.ok) {
        const freshJson = await freshRes.json()
        setSelectedSale(freshJson.data)
      } else {
        setIsDetailOpen(false)
      }
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // Deliver order
  const handleDeliverOrder = async (saleId) => {
    const orderNum = getSaleOrderNumber(saleId)
    const ok = await confirm({
      title: `Deliver order ${orderNum}?`,
      message: "Mark order as delivered?",
      confirmLabel: "Deliver"
    })
    if (!ok) return

    setActionLoading(true)
    try {
      const res = await updateSalesOrderStatus(saleId, "deliver")
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(parseErrorDetail(errJson.detail, "Delivery update failed."))
      }
      alert("Order successfully marked as Delivered! Delivery SMS, customer feedback request, and WhatsApp notifications were sent.")
      fetchSales()
      const freshRes = await getSaleDetails(saleId)
      if (freshRes.ok) {
        const freshJson = await freshRes.json()
        setSelectedSale(freshJson.data)
      } else {
        setIsDetailOpen(false)
      }
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // Mark failed delivery
  const handleFailDelivery = async (saleId) => {
    const orderNum = getSaleOrderNumber(saleId)
    const ok = await confirm({
      title: `Mark delivery failed for order ${orderNum}?`,
      message: "Mark order delivery as failed? Stock remains deducted and payment captured for manual intervention.",
      confirmLabel: "Mark failed",
      tone: "danger"
    })
    if (!ok) return

    setActionLoading(true)
    try {
      const res = await updateSalesOrderStatus(saleId, "fail-delivery")
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(parseErrorDetail(errJson.detail, "Failed delivery status update failed."))
      }
      alert("Order successfully marked as Failed Delivery.")
      fetchSales()
      setIsDetailOpen(false)
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const hasBillingPermission = isSuperAdmin || hasPermission("purchase_manage") || hasPermission("sales_manage")

  // Generate / View Tax Invoice (Idempotent)
  const handleGenerateInvoice = async (saleId) => {
    const orderNum = getSaleOrderNumber(saleId)
    const ok = await confirm({
      title: `Generate tax invoice for order ${orderNum}?`,
      message: "Are you sure you want to generate a formal GST tax invoice for this sales order?",
      confirmLabel: "Generate invoice"
    })
    if (!ok) return

    setActionLoading(true)
    try {
      const res = await generateTaxInvoice(saleId)
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(parseErrorDetail(errJson.detail, "Failed to process invoice request."))
      }
      const json = await res.json()
      const invData = json.data || {}
      if (json.message) {
        alert(json.message)
      }
      setIsDetailOpen(false)
      navigate(`/dashboard/invoices/${invData.id}`)
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

  // Filter lists in memory
  const getFilteredSales = () => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return sales
    return sales.filter(
      (s) =>
        (s.customer_name || "").toLowerCase().includes(q) ||
        (s.customer_phone || "").includes(q) ||
        (s.sale_number || "").toLowerCase().includes(q)
    )
  }

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in fade-in duration-200">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-brand-600" />
            <span>Sales</span>
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Unified 3-step order lifecycle: create draft sale, confirm order, dispatch, and deliver with automated notifications.
          </p>
        </div>

        {hasSalesManagePermission && (
          <button
            onClick={() => navigate("/dashboard/sales/create")}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-brand-500/10 active:scale-95 whitespace-nowrap self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Direct Sale</span>
          </button>
        )}
      </div>

      {/* Toolbar filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
        <div className="relative w-full sm:flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, phone, or invoice number..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select
            value={saleTypeFilter}
            onChange={(e) => {
              setSaleTypeFilter(e.target.value)
              setSkip(0)
            }}
            className="px-3.5 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-700 w-full sm:w-auto sm:min-w-[160px]"
          >
            <option value="">All Types</option>
            <option value="retail">Retail</option>
            <option value="wholesale">Wholesale</option>
            <option value="indent_conversion">Indent Conv.</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setSkip(0)
            }}
            className="px-3.5 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-700 w-full sm:w-auto sm:min-w-[160px]"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="dispatched">Dispatched</option>
            <option value="delivered">Delivered</option>
            <option value="failed_delivery">Failed</option>
          </select>
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
      ) : getFilteredSales().length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-slate-400 font-bold">No sales records found.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden w-full">
          <div className="w-full">
            <table className="w-full text-left border-collapse table-fixed text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-2 md:px-3.5 py-3.5 w-[44%] md:w-[28%] lg:w-[22%]">Sale No & Type</th>
                  <th className="px-2 md:px-3.5 py-3.5 hidden md:table-cell md:w-[26%] lg:w-[22%]">Customer & Phone</th>
                  <th className="px-2 md:px-3.5 py-3.5 w-[22%] md:w-[18%] lg:w-[18%]">Status & Payment</th>
                  <th className="px-2 md:px-3.5 py-3.5 text-right w-[20%] md:w-[16%] lg:w-[14%]">Total Amount</th>
                  <th className="px-2 md:px-3.5 py-3.5 hidden lg:table-cell lg:w-[12%]">Date</th>
                  <th className="pl-1 md:pl-2 pr-3 md:pr-5 py-3.5 w-[14%] md:w-[12%] lg:w-[12%] text-right"><span className="hidden md:inline">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {getFilteredSales().map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Column 1: Sale Order # & Type Badge */}
                    <td className="px-2 md:px-3.5 py-3 min-w-0">
                      <div className="flex flex-col items-start gap-1 min-w-0">
                        <span className="tabular-nums text-brand-700 font-bold text-xs truncate" title={sale.sale_number}>{sale.sale_number}</span>
                        <div className="flex flex-wrap items-center gap-1">
                          {sale.created_by === null && (
                            <span className="text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-sky-200/60">Web</span>
                          )}
                          {sale.sale_type === "retail" && (
                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-emerald-200/60">Retail</span>
                          )}
                          {sale.sale_type === "wholesale" && (
                            <span className="text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-purple-200/60">Wholesale</span>
                          )}
                          {sale.sale_type === "indent_conversion" && (
                            <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-blue-200/60">Indent Conv</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-normal truncate md:hidden mt-0.5" title={sale.customer_name || ""}>
                          {sale.customer_name || "Walk-in"}{sale.customer_phone ? ` • ${sale.customer_phone}` : ""}
                        </div>
                        <div className="text-[10px] text-slate-400 tabular-nums lg:hidden truncate">
                          {formatShortDate(sale.created_at)}
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Customer Name & Phone */}
                    <td className="px-2 md:px-3 py-3 min-w-0 hidden md:table-cell">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate" title={sale.customer_name || "Walk-in Customer"}>
                          {sale.customer_name || "Walk-in Customer"}
                        </p>
                        <p className="text-[11px] tabular-nums text-slate-500 mt-0.5 truncate">{sale.customer_phone || "—"}</p>
                      </div>
                    </td>

                    {/* Column 3: Status & Payment Badges */}
                    <td className="px-2 md:px-3 py-3 min-w-0">
                      <div className="flex flex-wrap items-center gap-1">
                        {sale.status === "draft" && (
                          <span className="text-slate-600 bg-slate-100 text-[10px] md:text-xs px-1.5 md:px-2.5 py-0.5 rounded font-semibold border border-slate-200 whitespace-nowrap">Draft</span>
                        )}
                        {sale.status === "confirmed" && (
                          <span className="text-blue-700 bg-blue-50 text-[10px] md:text-xs px-1.5 md:px-2.5 py-0.5 rounded font-semibold border border-blue-200/80 whitespace-nowrap">Confirmed</span>
                        )}
                        {sale.status === "dispatched" && (
                          <span className="text-amber-800 bg-amber-50 text-[10px] md:text-xs px-1.5 md:px-2.5 py-0.5 rounded font-semibold border border-amber-200/80 whitespace-nowrap">Dispatched</span>
                        )}
                        {sale.status === "delivered" && (
                          <span className="text-emerald-700 bg-emerald-50 text-[10px] md:text-xs px-1.5 md:px-2.5 py-0.5 rounded font-semibold border border-emerald-200/80 whitespace-nowrap">Delivered</span>
                        )}
                        {sale.status === "failed_delivery" && (
                          <span className="text-rose-700 bg-rose-50 text-[10px] md:text-xs px-1.5 md:px-2.5 py-0.5 rounded font-semibold border border-rose-200/80 whitespace-nowrap">Failed</span>
                        )}
                        {sale.status === "invoiced" && (
                          <span className="text-emerald-800 bg-emerald-100 text-[10px] md:text-xs px-1.5 md:px-2.5 py-0.5 rounded font-bold border border-emerald-300 whitespace-nowrap">Invoiced</span>
                        )}

                        {sale.payment_status === "unpaid" && (
                          <span className="text-slate-500 bg-slate-50 text-[10px] md:text-xs px-1.5 md:px-2.5 py-0.5 rounded font-medium border border-slate-200 whitespace-nowrap">Unpaid</span>
                        )}
                        {sale.payment_status === "pending" && (
                          <span className="text-amber-700 bg-amber-50 text-[10px] md:text-xs px-1.5 md:px-2.5 py-0.5 rounded font-medium border border-amber-200 whitespace-nowrap">Pending</span>
                        )}
                        {sale.payment_status === "paid" && (
                          <span className="text-emerald-700 bg-emerald-50 text-[10px] md:text-xs px-1.5 md:px-2.5 py-0.5 rounded font-medium border border-emerald-200 whitespace-nowrap">Paid</span>
                        )}
                      </div>
                    </td>

                    {/* Column 4: Total Amount */}
                    <td className="px-2 md:px-3 py-3 text-right tabular-nums font-extrabold text-slate-900 text-xs whitespace-nowrap">
                      ₹{parseFloat(sale.total_amount || 0).toFixed(2)}
                    </td>

                    {/* Column 5: Date */}
                    <td className="px-2 md:px-3 py-3 text-slate-500 tabular-nums text-[11px] whitespace-nowrap hidden lg:table-cell">
                      {formatShortDate(sale.created_at)}
                    </td>

                    {/* Column 6: Action */}
                    <td className="pl-1 md:pl-2 pr-3 md:pr-5 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDetails(sale)}
                        aria-label="View sale"
                        className="px-2 md:px-3 py-1 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200/80 transition-all active:scale-95 shadow-2xs inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination skip={skip} limit={limit} total={total} onChange={setSkip} />
        </div>
      )}

      {/* DETAIL DIALOG */}
      {isDetailOpen && selectedSale && (
        <Modal onClose={() => setIsDetailOpen(false)}>
          <div className="bg-white border border-slate-100 rounded-2xl max-w-3xl w-full shadow-2xl p-6 relative flex flex-col max-h-[90vh]">

            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 tabular-nums">{selectedSale.sale_number}</h3>
                  {selectedSale.created_by === null && (
                    <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-bold text-[10px] whitespace-nowrap">Web Order</span>
                  )}
                  {(selectedSale.is_invoiced || selectedSale.status === "invoiced") && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-extrabold border border-emerald-200 uppercase">INVOICED</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                  Type: {selectedSale.sale_type} | Payment: {selectedSale.payment_status}
                </p>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 my-4 space-y-5 text-xs font-semibold">

              {/* Customer section card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-700">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Customer Details</span>
                  </h4>
                  <p>Name: <span className="font-bold text-slate-900">{selectedSale.customer_name || "Walk-in / General Customer"}</span></p>
                  <p>Phone: <span className="tabular-nums font-bold text-slate-900">{selectedSale.customer_phone}</span></p>
                  {selectedSale.customer_gstin && (
                    <p>GSTIN: <span className="tabular-nums text-brand-700 font-bold">{selectedSale.customer_gstin}</span></p>
                  )}
                  {selectedSale.company_name && (
                    <p>Company: <span className="text-slate-900">{selectedSale.company_name}</span></p>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Delivery Address</span>
                  </h4>
                  <p className="text-slate-800 leading-relaxed font-semibold">
                    {selectedSale.delivery_address || "No custom delivery address specified (Physical pickup)."}
                  </p>
                  <p className="text-[10px] text-slate-400">Bill Type: <span className="uppercase font-bold text-slate-600">{selectedSale.bill_type || "Cash"}</span></p>
                </div>
              </div>

              {/* Items List Table */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Line Items Invoice Breakdown</h4>
                <div className="border border-slate-100 rounded-xl w-full">
                  <table className="w-full text-left border-collapse table-fixed text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="px-3 py-2.5 w-[48%] md:w-[36%] lg:w-[32%]">Product Variant</th>
                        <th className="px-2 py-2.5 text-right w-[24%] md:w-[14%] lg:w-[12%]">Qty</th>
                        <th className="px-2 py-2.5 text-right hidden md:table-cell md:w-[16%] lg:w-[14%]">Rate</th>
                        <th className="px-2 py-2.5 text-right hidden xl:table-cell xl:w-[12%]">Discount</th>
                        <th className="px-2 py-2.5 text-right hidden lg:table-cell lg:w-[14%] xl:w-[12%]">GST %</th>
                        <th className="px-3 py-2.5 text-right w-[28%] md:w-[20%] lg:w-[18%]">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {selectedSale.items?.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/20">
                          <td className="px-3 py-2.5 min-w-0">
                            <p className="font-bold text-slate-800 truncate" title={item.variant_display_name}>{item.variant_display_name}</p>
                            <div className="text-[10px] text-slate-400 tabular-nums truncate">
                              <span>HSN: {item.hsn_code || "—"}</span>
                              <span className="md:hidden"> • Rate: ₹{parseFloat(item.rate).toFixed(2)}</span>
                              <span className="lg:hidden"> • GST: {parseFloat(item.gst_percent || 0).toFixed(2)}%</span>
                            </div>
                          </td>
                          <td className="px-2 py-2.5 text-right tabular-nums text-slate-900 whitespace-nowrap">{item.quantity}</td>
                          <td className="px-2 py-2.5 text-right tabular-nums text-slate-500 whitespace-nowrap hidden md:table-cell">₹{parseFloat(item.rate).toFixed(2)}</td>
                          <td className="px-2 py-2.5 text-right tabular-nums text-slate-500 whitespace-nowrap hidden xl:table-cell">{parseFloat(item.discount_percent || 0).toFixed(2)}%</td>
                          <td className="px-2 py-2.5 text-right tabular-nums text-slate-500 whitespace-nowrap hidden lg:table-cell">{parseFloat(item.gst_percent || 0).toFixed(2)}%</td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-slate-900 font-bold whitespace-nowrap">₹{parseFloat(item.total_amount).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals split breakdown grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl h-max">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-1">Administrative Notes</span>
                  <p className="text-slate-600 text-xs italic">{selectedSale.notes || "No notes logged."}</p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>Taxable Value:</span>
                    <span className="tabular-nums text-slate-800 font-bold">₹{parseFloat(selectedSale.total_taxable_amount || 0).toFixed(2)}</span>
                  </div>
                  {selectedSale.total_cgst_amount > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span>CGST:</span>
                      <span className="tabular-nums">₹{parseFloat(selectedSale.total_cgst_amount).toFixed(2)}</span>
                    </div>
                  )}
                  {selectedSale.total_sgst_amount > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span>SGST:</span>
                      <span className="tabular-nums">₹{parseFloat(selectedSale.total_sgst_amount).toFixed(2)}</span>
                    </div>
                  )}
                  {selectedSale.total_igst_amount > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span>IGST:</span>
                      <span className="tabular-nums">₹{parseFloat(selectedSale.total_igst_amount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px] text-rose-700">
                    <span>Total Discount Allowed:</span>
                    <span className="tabular-nums">-₹{parseFloat(selectedSale.total_discount_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline text-slate-900 font-bold">
                    <span className="text-xs">Invoice Value:</span>
                    <span className="text-base font-extrabold tabular-nums text-brand-700">₹{parseFloat(selectedSale.total_amount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Order Status Timeline */}
              <div className="p-4 border border-slate-100 rounded-xl space-y-3">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Fulfillment Audit Timeline</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-[10px] text-slate-500">
                  <div className="p-2 border border-slate-100 rounded-lg bg-slate-50">
                    <p className="font-bold text-slate-800">1. Draft Order</p>
                    <p className="tabular-nums text-[10px] mt-0.5">{formatShortDate(selectedSale.created_at)}</p>
                  </div>
                  <div className={`p-2 border rounded-lg ${selectedSale.confirmed_at ? "bg-blue-50/50 border-blue-100 text-blue-700" : "border-slate-100 text-slate-300"}`}>
                    <p className="font-bold">2. Confirmed</p>
                    <p className="tabular-nums text-[10px] mt-0.5">{selectedSale.confirmed_at ? formatShortDate(selectedSale.confirmed_at) : "Pending"}</p>
                  </div>
                  <div className={`p-2 border rounded-lg ${selectedSale.dispatched_at ? "bg-amber-50/50 border-amber-100 text-amber-700" : "border-slate-100 text-slate-300"}`}>
                    <p className="font-bold">3. Dispatched</p>
                    <p className="tabular-nums text-[10px] mt-0.5">{selectedSale.dispatched_at ? formatShortDate(selectedSale.dispatched_at) : "Pending"}</p>
                  </div>
                  <div className={`p-2 border rounded-lg ${selectedSale.status === "delivered" ? "bg-emerald-50/50 border-emerald-100 text-emerald-700" :
                    selectedSale.status === "failed_delivery" ? "bg-rose-50/50 border-rose-100 text-rose-700" : "border-slate-100 text-slate-300"
                    }`}>
                    <p className="font-bold">4. Fulfill Status</p>
                    <p className="tabular-nums text-[10px] mt-0.5 uppercase">{selectedSale.status === "delivered" ? "Delivered" : selectedSale.status === "failed_delivery" ? "Failed" : "Pending"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer buttons based on current status */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-slate-100 pt-3.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-5 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors w-full sm:w-auto"
              >
                Close View
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                {/* Confirm Order */}
                <button
                  disabled={actionLoading || !hasSalesManagePermission || selectedSale.status !== "draft"}
                  onClick={() => handleConfirmOrder(selectedSale.id)}
                  className={`px-5 py-2 rounded-xl font-bold transition-all w-full sm:w-auto ${hasSalesManagePermission && selectedSale.status === "draft"
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10 active:scale-95 cursor-pointer"
                      : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                    }`}
                >
                  Confirm Order
                </button>

                {/* Dispatch Goods */}
                <button
                  disabled={actionLoading || !hasSalesManagePermission || selectedSale.status !== "confirmed"}
                  onClick={() => handleDispatchOrder(selectedSale.id)}
                  className={`px-5 py-2 rounded-xl font-bold transition-all w-full sm:w-auto ${hasSalesManagePermission && selectedSale.status === "confirmed"
                      ? "bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/10 active:scale-95 cursor-pointer"
                      : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                    }`}
                >
                  Dispatch Goods
                </button>

                {/* Fail Delivery */}
                <button
                  disabled={actionLoading || !hasSalesManagePermission || selectedSale.status !== "dispatched"}
                  onClick={() => handleFailDelivery(selectedSale.id)}
                  className={`px-5 py-2 rounded-xl font-bold transition-all border w-full sm:w-auto ${hasSalesManagePermission && selectedSale.status === "dispatched"
                      ? "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 active:scale-95 cursor-pointer"
                      : "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                    }`}
                >
                  Fail Delivery
                </button>

                {/* Deliver Goods */}
                <button
                  disabled={actionLoading || !hasSalesManagePermission || selectedSale.status !== "dispatched"}
                  onClick={() => handleDeliverOrder(selectedSale.id)}
                  className={`px-5 py-2 rounded-xl font-bold transition-all w-full sm:w-auto ${hasSalesManagePermission && selectedSale.status === "dispatched"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/10 active:scale-95 cursor-pointer"
                      : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                    }`}
                >
                  Deliver Goods
                </button>

                {/* Billing Invoicing controls */}
                {(selectedSale.is_invoiced || selectedSale.status === "invoiced") ? (
                  <button
                    disabled={actionLoading || !hasBillingPermission}
                    onClick={() => handleGenerateInvoice(selectedSale.id)}
                    className={`px-5 py-2 rounded-xl font-bold transition-all shadow-md active:scale-95 w-full sm:w-auto ${hasBillingPermission
                        ? "bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/10 cursor-pointer"
                        : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                      }`}
                  >
                    View Tax Invoice
                  </button>
                ) : (
                  <button
                    disabled={actionLoading || !hasBillingPermission || !["confirmed", "dispatched", "delivered", "failed_delivery"].includes(selectedSale.status)}
                    onClick={() => handleGenerateInvoice(selectedSale.id)}
                    className={`px-5 py-2 rounded-xl font-bold transition-all w-full sm:w-auto ${hasBillingPermission && ["confirmed", "dispatched", "delivered", "failed_delivery"].includes(selectedSale.status)
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/10 active:scale-95 cursor-pointer"
                        : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                      }`}
                  >
                    Generate Invoice
                  </button>
                )}
              </div>
            </div>

          </div>
        </Modal>
      )}

    </div>
  )
}

export default Sales
