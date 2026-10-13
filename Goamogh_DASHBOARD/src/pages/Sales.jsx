import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  ShoppingCart,
  Search,
  Plus,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  User,
  MapPin,
  TrendingUp,
  FileText,
  DollarSign,
  Package,
  Layers,
  ArrowRight,
  TrendingDown
} from "lucide-react"
import {
  getSales,
  getSaleDetails,
  confirmSalesOrder,
  dispatchSalesOrder,
  deliverSalesOrder,
  failSalesOrderDelivery
} from "@/services/sales"
import { generateTaxInvoice } from "@/services/invoices"
import { getPricingPanel } from "@/services/products"
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

function Sales() {
  const navigate = useNavigate()
  const { user, isSuperAdmin, hasPermission } = useAuth()

  // State Lists
  const [sales, setSales] = useState([])
  const [variantsList, setVariantsList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Filter States
  const [saleTypeFilter, setSaleTypeFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [skip, setSkip] = useState(0)
  const [limit, setLimit] = useState(50)

  // Details Modal States
  const [selectedSale, setSelectedSale] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const hasSalesManagePermission = isSuperAdmin || hasPermission("sales_manage")
  useEffect(() => {
    const loadVariants = async () => {
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
                display_name: `${prod.product_name || prod.item_name} - ${v.weight_grams}g`
              })
            })
          })
          setVariantsList(flatList)
        }
      } catch (err) {
        console.error("Failed to load variants helper list:", err)
      }
    }
    loadVariants()
  }, [])

  const getVariantDisplayName = (item) => {
    const cached = variantsList.find((v) => v.variant_id === item.variant_id)
    if (cached) return cached.display_name

    if (item.variant_name) return item.variant_name

    const nestedName = item.variant?.product?.name || item.product?.name || item.product_name
    const nestedWeight = item.variant?.weight_grams || item.weight_grams || item.weight
    if (nestedName && nestedWeight) {
      return `${nestedName} - ${nestedWeight}g`
    }
    if (nestedName) return nestedName

    return `Variant ${item.variant_id}`
  }
  const fetchSales = useCallback(async () => {
    setIsLoading(true)
    setError("")
    try {
      const params = { skip, limit }
      if (saleTypeFilter) params.sale_type = saleTypeFilter
      if (statusFilter) params.status = statusFilter
      const res = await getSales(params)
      if (!res.ok) {
        throw new Error("Failed to load sales list.")
      }
      const json = await res.json()
      setSales(json.data || [])
    } catch (err) {
      setError(err.message || "An error occurred.")
    } finally {
      setIsLoading(false)
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

  // Confirm order (from draft to confirmed status, triggers stock deduction)
  const handleConfirmOrder = async (saleId) => {
    if (!window.confirm("Confirm this order? This will immediately deduct variant stock levels.")) return
    setActionLoading(true)
    try {
      const res = await confirmSalesOrder(saleId)
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(parseErrorDetail(errJson.detail, "Confirmation failed."))
      }

      alert("Order confirmed successfully! DLT SMS, Email, and WhatsApp confirmation notifications were sent.")
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
    if (!window.confirm("Mark order as dispatched? Tax invoice will be generated automatically and attached to dispatch notifications.")) return
    setActionLoading(true)
    try {
      const res = await dispatchSalesOrder(saleId)
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(parseErrorDetail(errJson.detail, "Dispatch failed."))
      }
      alert("Order successfully marked as Dispatched! Tax Invoice PDF generated and DLT SMS, Email, and WhatsApp dispatch alerts were sent.")
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
    if (!window.confirm("Mark order as delivered?")) return
    setActionLoading(true)
    try {
      const res = await deliverSalesOrder(saleId)
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
    if (!window.confirm("Mark order delivery as failed? Stock remains deducted and payment captured for manual intervention.")) return
    setActionLoading(true)
    try {
      const res = await failSalesOrderDelivery(saleId)
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
          <p className="text-sm font-medium text-slate-550 mt-1">
            Unified 3-step order lifecycle: create draft sale, confirm order, dispatch, and deliver with automated notifications.
          </p>
        </div>

        {hasSalesManagePermission && (
          <button
            onClick={() => navigate("/dashboard/sales/create")}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-brand-500/10 active:scale-95 self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Create Direct Sale</span>
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
            placeholder="Search by customer, phone, or invoice number..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-350 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={saleTypeFilter}
            onChange={(e) => setSaleTypeFilter(e.target.value)}
            className="px-3.5 py-2.5 border border-slate-200 hover:border-slate-350 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-700 w-full sm:w-36"
          >
            <option value="">All Types</option>
            <option value="retail">Retail</option>
            <option value="wholesale">Wholesale</option>
            <option value="indent_conversion">Indent Conv.</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 border border-slate-200 hover:border-slate-350 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-700 w-full sm:w-36"
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
        <div className="p-4 bg-error-50 border border-error-200 rounded-2xl text-sm font-semibold text-error-800 flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-error-600 shrink-0 mt-0.5" />
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
          <div className="w-full overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-3.5 py-3.5 w-[22%]">Sale No & Type</th>
                  <th className="px-3 py-3.5 w-[24%]">Customer & Phone</th>
                  <th className="px-3 py-3.5 w-[18%]">Status & Payment</th>
                  <th className="px-3 py-3.5 w-[14%] text-right">Total Amount</th>
                  <th className="px-3 py-3.5 w-[10%]">Date</th>
                  <th className="pl-2 pr-5 py-3.5 w-[12%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {getFilteredSales().map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Column 1: Sale Order # & Type Badge */}
                    <td className="px-3.5 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-mono text-brand-700 font-bold text-xs">{sale.sale_number}</span>
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
                      </div>
                    </td>

                    {/* Column 2: Customer Name & Phone */}
                    <td className="px-3 py-3">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate" title={sale.customer_name || "Walk-in Customer"}>
                          {sale.customer_name || "Walk-in Customer"}
                        </p>
                        <p className="text-[11px] font-mono text-slate-500 mt-0.5">{sale.customer_phone || "—"}</p>
                      </div>
                    </td>

                    {/* Column 3: Status & Payment Badges */}
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {sale.status === "draft" && (
                          <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-200">Draft</span>
                        )}
                        {sale.status === "confirmed" && (
                          <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[10px] font-semibold border border-blue-200/80">Confirmed</span>
                        )}
                        {sale.status === "dispatched" && (
                          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-semibold border border-amber-200/80">Dispatched</span>
                        )}
                        {sale.status === "delivered" && (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-200/80">Delivered</span>
                        )}
                        {sale.status === "failed_delivery" && (
                          <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[10px] font-semibold border border-rose-200/80">Failed</span>
                        )}
                        {sale.status === "invoiced" && (
                          <span className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-300">Invoiced</span>
                        )}

                        {sale.payment_status === "unpaid" && (
                          <span className="text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-200">Unpaid</span>
                        )}
                        {sale.payment_status === "pending" && (
                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-medium border border-amber-200">Pending</span>
                        )}
                        {sale.payment_status === "paid" && (
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-medium border border-emerald-200">Paid</span>
                        )}
                      </div>
                    </td>

                    {/* Column 4: Total Amount */}
                    <td className="px-3 py-3 text-right font-mono font-extrabold text-slate-900 text-xs">
                      ₹{parseFloat(sale.total_amount || 0).toFixed(2)}
                    </td>

                    {/* Column 5: Date */}
                    <td className="px-3 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {formatShortDate(sale.created_at)}
                    </td>

                    {/* Column 6: Action */}
                    <td className="pl-2 pr-5 py-3 text-right">
                      <button
                        onClick={() => handleOpenDetails(sale)}
                        className="px-3 py-1 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200/80 transition-all active:scale-95 shadow-2xs"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL DIALOG */}
      {isDetailOpen && selectedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-center p-4 items-center overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-150 rounded-2xl max-w-3xl w-full shadow-2xl p-6 relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 font-mono">{selectedSale.sale_number}</h3>
                  {selectedSale.created_by === null && (
                    <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-bold text-[10px] whitespace-nowrap">Web Order</span>
                  )}
                  {(selectedSale.is_invoiced || selectedSale.status === "invoiced") && (
                    <span className="text-[8px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-black border border-emerald-200 uppercase">INVOICED</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-450 font-bold uppercase mt-0.5">
                  Type: {selectedSale.sale_type} | Payment: {selectedSale.payment_status}
                </p>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-slate-655 text-xl font-bold">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 my-4 space-y-5 text-xs font-semibold">

              {/* Customer section card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-700">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Customer Details</span>
                  </h4>
                  <p>Name: <span className="font-bold text-slate-900">{selectedSale.customer_name || "Walk-in / General Customer"}</span></p>
                  <p>Phone: <span className="font-mono font-bold text-slate-900">{selectedSale.customer_phone}</span></p>
                  {selectedSale.customer_gstin && (
                    <p>GSTIN: <span className="font-mono text-brand-700 font-bold">{selectedSale.customer_gstin}</span></p>
                  )}
                  {selectedSale.company_name && (
                    <p>Company: <span className="text-slate-900">{selectedSale.company_name}</span></p>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
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
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Line Items Invoice Breakdown</h4>
                <div className="border border-slate-150 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="px-4 py-2.5">Product Variant</th>
                        <th className="px-4 py-2.5 text-right w-[80px]">Qty</th>
                        <th className="px-4 py-2.5 text-right w-[90px]">Rate</th>
                        <th className="px-4 py-2.5 text-right w-[80px]">Discount</th>
                        <th className="px-4 py-2.5 text-right w-[80px]">GST %</th>
                        <th className="px-4 py-2.5 text-right w-[110px]">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {selectedSale.items?.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/20">
                          <td className="px-4 py-2.5">
                            <p className="font-bold text-slate-800">{getVariantDisplayName(item)}</p>
                            <p className="text-[9px] text-slate-400 font-mono">HSN: {item.hsn_code || "—"}</p>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-900">{item.quantity}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-500">₹{parseFloat(item.rate).toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-500">{parseFloat(item.discount_percent || 0).toFixed(2)}%</td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-500">{parseFloat(item.gst_percent || 0).toFixed(2)}%</td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-900 font-bold">₹{parseFloat(item.total_amount).toFixed(2)}</td>
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

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2.5 text-slate-650">
                  <div className="flex justify-between">
                    <span>Taxable Value:</span>
                    <span className="font-mono text-slate-800 font-bold">₹{parseFloat(selectedSale.total_taxable_amount || 0).toFixed(2)}</span>
                  </div>
                  {selectedSale.total_cgst_amount > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span>CGST:</span>
                      <span className="font-mono">₹{parseFloat(selectedSale.total_cgst_amount).toFixed(2)}</span>
                    </div>
                  )}
                  {selectedSale.total_sgst_amount > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span>SGST:</span>
                      <span className="font-mono">₹{parseFloat(selectedSale.total_sgst_amount).toFixed(2)}</span>
                    </div>
                  )}
                  {selectedSale.total_igst_amount > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span>IGST:</span>
                      <span className="font-mono">₹{parseFloat(selectedSale.total_igst_amount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px] text-rose-700">
                    <span>Total Discount Allowed:</span>
                    <span className="font-mono">-₹{parseFloat(selectedSale.total_discount_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline text-slate-900 font-bold">
                    <span className="text-xs">Invoice Value:</span>
                    <span className="text-base font-black font-mono text-brand-700">₹{parseFloat(selectedSale.total_amount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Order Status Timeline */}
              <div className="p-4 border border-slate-150 rounded-xl space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Fulfillment Audit Timeline</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-[10px] text-slate-500">
                  <div className="p-2 border border-slate-100 rounded-lg bg-slate-50">
                    <p className="font-bold text-slate-800">1. Draft Order</p>
                    <p className="font-mono text-[9px] mt-0.5">{formatShortDate(selectedSale.created_at)}</p>
                  </div>
                  <div className={`p-2 border rounded-lg ${selectedSale.confirmed_at ? "bg-blue-50/50 border-blue-150 text-blue-700" : "border-slate-100 text-slate-350"}`}>
                    <p className="font-bold">2. Confirmed</p>
                    <p className="font-mono text-[9px] mt-0.5">{selectedSale.confirmed_at ? formatShortDate(selectedSale.confirmed_at) : "Pending"}</p>
                  </div>
                  <div className={`p-2 border rounded-lg ${selectedSale.dispatched_at ? "bg-amber-50/50 border-amber-150 text-amber-700" : "border-slate-100 text-slate-350"}`}>
                    <p className="font-bold">3. Dispatched</p>
                    <p className="font-mono text-[9px] mt-0.5">{selectedSale.dispatched_at ? formatShortDate(selectedSale.dispatched_at) : "Pending"}</p>
                  </div>
                  <div className={`p-2 border rounded-lg ${selectedSale.status === "delivered" ? "bg-emerald-50/50 border-emerald-150 text-emerald-700" :
                    selectedSale.status === "failed_delivery" ? "bg-rose-50/50 border-rose-150 text-rose-700" : "border-slate-105 text-slate-350"
                    }`}>
                    <p className="font-bold">4. Fulfill Status</p>
                    <p className="font-mono text-[9px] mt-0.5 uppercase">{selectedSale.status === "delivered" ? "Delivered" : selectedSale.status === "failed_delivery" ? "Failed" : "Pending"}</p>
                  </div>
                </div>
              </div>            {/* Footer buttons based on current status */}
              <div className="flex justify-between border-t border-slate-100 pt-3.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="px-5 py-2 border border-slate-200 text-slate-650 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Close View
                </button>

                <div className="flex items-center gap-2">
                  {/* Confirm Order */}
                  <button
                    disabled={actionLoading || !hasSalesManagePermission || selectedSale.status !== "draft"}
                    onClick={() => handleConfirmOrder(selectedSale.id)}
                    className={`px-5 py-2 rounded-xl font-bold transition-all ${hasSalesManagePermission && selectedSale.status === "draft"
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
                    className={`px-5 py-2 rounded-xl font-bold transition-all ${hasSalesManagePermission && selectedSale.status === "confirmed"
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
                    className={`px-5 py-2 rounded-xl font-bold transition-all border ${hasSalesManagePermission && selectedSale.status === "dispatched"
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
                    className={`px-5 py-2 rounded-xl font-bold transition-all ${hasSalesManagePermission && selectedSale.status === "dispatched"
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
                      className={`px-5 py-2 rounded-xl font-bold transition-all shadow-md active:scale-95 ${hasBillingPermission
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
                      className={`px-5 py-2 rounded-xl font-bold transition-all ${hasBillingPermission && ["confirmed", "dispatched", "delivered", "failed_delivery"].includes(selectedSale.status)
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

          </div>
        </div>
      )}

    </div>
  )
}

export default Sales
