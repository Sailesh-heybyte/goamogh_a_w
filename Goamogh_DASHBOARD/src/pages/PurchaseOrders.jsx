import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  Plus,
  Search,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
  Eye,
  Truck,
  ShoppingCart,
  Calendar,
  Layers,
  ArrowRight,
  Edit2,
  X
} from "lucide-react"
import {
  getPurchaseOrders,
  confirmPurchaseOrder,
  sendPurchaseOrder,
  acknowledgePurchaseOrder,
  cancelPurchaseOrder,
  releasePurchaseOrder
} from "@/services/purchases"
import { getSuppliers } from "@/services/suppliers"
import Spinner from "@/components/ui/Spinner"
import { useToast } from "@/context/ToastContext"

function PurchaseOrders() {
  const navigate = useNavigate()
  const { showSuccessToast, showErrorToast, showRateLimitToast } = useToast()
  const [orders, setOrders] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [error, setError] = useState("")

  // Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSupplierId, setSelectedSupplierId] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [dateRange, setDateRange] = useState("all")

  // Modal Detail View
  const [viewingOrder, setViewingOrder] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)

  const triggerActionConfirm = (poId, actionType, poNumber, supplierName) => {
    let title = "Confirm Action"
    let promptText = "Are you sure you want to perform this action?"
    let actionLabel = "Confirm & Proceed"
    let isDanger = false

    if (actionType === "confirm") {
      title = "Confirm PO Authorization"
      promptText = `Are you sure you want to authorize and approve Purchase Order ${poNumber || ""} for ${supplierName || "supplier"}?`
      actionLabel = "Authorize & Approve"
    } else if (actionType === "send") {
      title = "Confirm Send PO"
      promptText = `Are you sure you want to send Purchase Order ${poNumber || ""} to ${supplierName || "supplier"}?`
      actionLabel = "Send PO"
    } else if (actionType === "release") {
      title = "Confirm Release Order"
      promptText = `Are you sure you want to send a Release Order for ${poNumber || ""} to ${supplierName || "supplier"}?`
      actionLabel = "Send Release Order"
    } else if (actionType === "acknowledge") {
      title = "Confirm Acknowledge"
      promptText = `Are you sure you want to mark Purchase Order ${poNumber || ""} as acknowledged by supplier?`
      actionLabel = "Acknowledge"
    } else if (actionType === "cancel") {
      title = "Confirm Cancellation"
      promptText = `Are you sure you want to cancel Purchase Order ${poNumber || ""}? This action cannot be undone.`
      actionLabel = "Confirm Cancellation"
      isDanger = true
    }

    setConfirmModal({
      poId,
      actionType,
      title,
      promptText,
      actionLabel,
      isDanger,
    })
  }

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true)
    setError("")
    try {
      const [ordersRes, suppliersRes] = await Promise.all([
        getPurchaseOrders(),
        getSuppliers()
      ])

      if (!ordersRes.ok) {
        throw new Error("Failed to load purchase orders")
      }
      if (!suppliersRes.ok) {
        throw new Error("Failed to load suppliers list")
      }

      const ordersJson = await ordersRes.json()
      const suppliersJson = await suppliersRes.json()

      setOrders(ordersJson.data || [])
      setSuppliers(suppliersJson.data || [])
    } catch (err) {
      setError(err.message || "An unexpected error occurred while loading data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  const handleStatusAction = async (poId, actionType) => {
    setActionLoadingId(poId)
    try {
      let res
      if (actionType === "confirm") {
        res = await confirmPurchaseOrder(poId)
      } else if (actionType === "send") {
        res = await sendPurchaseOrder(poId)
      } else if (actionType === "acknowledge") {
        res = await acknowledgePurchaseOrder(poId)
      } else if (actionType === "cancel") {
        res = await cancelPurchaseOrder(poId)
      } else if (actionType === "release") {
        res = await releasePurchaseOrder(poId)
      }

      let resJson = null
      if (res && res.headers.get("content-type")?.includes("application/json")) {
        resJson = await res.json().catch(() => null)
      }

      if (!res.ok) {
        const rawDetail = resJson?.detail || resJson?.message
        const errorMsg = typeof rawDetail === "string"
          ? rawDetail
          : Array.isArray(rawDetail)
          ? rawDetail.map((d) => d.msg || d.detail).join(", ")
          : `Failed to ${actionType} purchase order`
        throw new Error(errorMsg)
      }

      if (actionType === "send" || actionType === "release") {
        const backendMessage = resJson?.message || ""
        const isEmailFailed = backendMessage.toUpperCase().includes("FAILED")

        if (isEmailFailed) {
          showErrorToast("PO status updated but email could not be delivered. Please verify supplier email or retry.")
        } else {
          let successText = actionType === "release"
            ? "Release Order sent successfully to supplier."
            : "PO sent successfully to supplier."
          if (backendMessage.includes("simulated")) {
            successText = "Purchase Order sent (email simulated — SMTP not configured)"
          }
          showSuccessToast(successText)
        }
      } else {
        showSuccessToast(`Purchase Order status updated to '${actionType}' successfully.`)
      }

      setConfirmModal(null)

      // Refresh orders list
      const ordersRes = await getPurchaseOrders()
      if (ordersRes.ok) {
        const ordersJson = await ordersRes.json()
        const updatedOrders = ordersJson.data || []
        setOrders(updatedOrders)
        
        // Dynamic Modal State Refresh
        if (viewingOrder && viewingOrder.id === poId) {
          const freshPO = updatedOrders.find((o) => o.id === poId)
          if (freshPO) {
            setViewingOrder(freshPO)
          }
        }
      }
    } catch (err) {
      showErrorToast(err.message || "Something went wrong.")
    } finally {
      setActionLoadingId(null)
    }
  }

  // Client-side filtering
  const filteredOrders = orders.filter((order) => {
    const searchLower = searchQuery.toLowerCase().trim()
    const poNumMatch = order.po_number?.toLowerCase().includes(searchLower)
    const notesMatch = order.notes?.toLowerCase().includes(searchLower)
    const supplierName = (order.supplier_name || order.supplier?.name || order.supplier?.contact_name || "").toLowerCase()
    const supplierNameMatch = supplierName.includes(searchLower)
    const searchMatch = !searchLower || poNumMatch || notesMatch || supplierNameMatch

    const supplierMatch = !selectedSupplierId || selectedSupplierId === "all" || order.supplier_id === selectedSupplierId
    const statusMatch = !selectedStatus || selectedStatus === "all" || order.status === selectedStatus || (selectedStatus === "confirmed" && order.status === "authorized")

    return searchMatch && supplierMatch && statusMatch
  })

  // Format Date Helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "—"
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getStatusBadgeStyles = (status) => {
    switch (status) {
      case "draft":
        return "bg-slate-100 text-slate-600 border-slate-200"
      case "confirmed":
      case "authorized":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "sent":
        return "bg-orange-50 text-orange-700 border-orange-200"
      case "acknowledged":
        return "bg-purple-50 text-purple-700 border-purple-200"
      case "partially_received":
        return "bg-yellow-50 text-yellow-750 border-yellow-205"
      case "received":
        return "bg-emerald-50 text-emerald-750 border-emerald-205"
      case "cancelled":
        return "bg-error-50 text-error-800 border-error-100"
      default:
        return "bg-slate-50 text-slate-500 border-slate-100"
    }
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
        <h3 className="text-lg font-bold text-slate-900">Error Loading Purchase Orders</h3>
        <p className="text-sm font-semibold text-slate-500">{error}</p>
        <button
          onClick={fetchInitialData}
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
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Purchase Orders</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Request inventory raw materials or products, dispatch orders, and track invoice receipts.
          </p>
        </div>

        <button
          onClick={() => navigate("/dashboard/purchase/orders/create")}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center gap-2 self-start md:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Create Purchase Order</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search PO number or notes..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-350 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <select
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 hover:border-slate-350 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white transition-all font-semibold text-slate-700"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name || s.contact_name || "—"}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 hover:border-slate-350 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white transition-all font-semibold text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="sent">Sent</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="partially_received">Partially Received</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* PO Data Table */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-450 font-semibold shadow-sm flex flex-col items-center justify-center gap-3">
          <ShoppingCart className="w-12 h-12 text-slate-300" />
          <p>No purchase orders found matching the filter criteria.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 shadow-md rounded-2xl overflow-hidden">
          <div className="w-full">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="pl-4 pr-2 py-4 w-[28%]">Supplier</th>
                  <th className="px-2 py-4 w-[18%]">Created Date</th>
                  <th className="px-2 py-4 w-[14%]">Status</th>
                  <th className="px-2 py-4 w-[30%]">Remarks</th>
                  <th className="pl-2 pr-4 py-4 w-[10%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-800">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Supplier Name */}
                    <td className="pl-4 pr-2 py-4 text-slate-800 font-bold uppercase tracking-wide text-xs whitespace-nowrap truncate" title={order.supplier_name || order.supplier?.name || order.supplier?.contact_name}>
                      {order.supplier_name || order.supplier?.name || order.supplier?.contact_name || "—"}
                    </td>

                    {/* Created Date */}
                    <td className="px-2 py-4 text-slate-500 font-bold text-xs whitespace-nowrap">
                      {formatDate(order.created_at)}
                    </td>

                    {/* Status Badge */}
                    <td className="px-2 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeStyles(order.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          order.status === "draft" ? "bg-slate-500" :
                          order.status === "authorized" ? "bg-purple-500" :
                          order.status === "sent" ? "bg-blue-500" :
                          order.status === "acknowledged" ? "bg-amber-500" :
                          order.status === "received" ? "bg-success-500" :
                          "bg-error-500"
                        }`} />
                        <span className="capitalize">{order.status}</span>
                      </span>
                    </td>

                    {/* Notes */}
                    <td className="px-2 py-4 text-slate-500 font-medium truncate" title={order.notes}>
                      {order.notes || "—"}
                    </td>

                    {/* Actions */}
                    <td className="pl-2 pr-4 py-4 text-right whitespace-nowrap">
                      {actionLoadingId === order.id ? (
                        <div className="flex justify-end pr-4">
                          <Spinner size="xs" />
                        </div>
                      ) : (
                        <div className="flex justify-end items-center gap-1.5">
                          <button
                            onClick={() => setViewingOrder(order)}
                            className="p-1.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-800 transition-all active:scale-95 inline-flex items-center shrink-0"
                            title="View PO Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PO View Detail Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-3xl flex flex-col max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2rem)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Purchase Order Details</h3>
                <p className="text-xs font-mono font-bold text-slate-400 mt-0.5">{viewingOrder.po_number}</p>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg text-slate-400 hover:text-slate-650 transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-5 flex-1 overflow-y-auto min-h-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Supplier</span>
                  <span className="text-sm font-bold text-slate-800 uppercase mt-0.5 block">
                    {viewingOrder.supplier_name || viewingOrder.supplier?.name || viewingOrder.supplier?.contact_name || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Created Date</span>
                  <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                    {formatDate(viewingOrder.created_at)}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Status</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border mt-1 ${getStatusBadgeStyles(viewingOrder.status)}`}>
                    {viewingOrder.status}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Remarks</span>
                  <span className="text-sm font-medium text-slate-600 mt-0.5 block">
                    {viewingOrder.notes || "No notes added."}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">PO Items Grid</h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <th className="px-4 py-3 w-[50px]">#</th>
                        <th className="px-4 py-3 w-[90px]">HSN</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3 text-right w-[100px]">Qty</th>
                        <th className="px-4 py-3 text-right w-[110px]">Unit Price</th>
                        <th className="px-4 py-3 text-right w-[80px]">GST %</th>
                        <th className="px-4 py-3 text-right w-[100px]">GST Amt</th>
                        <th className="px-4 py-3 text-right w-[120px]">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                      {viewingOrder.items?.map((item, idx) => {
                        const isRM = !!item.raw_material_id
                        const itemName = isRM ? item.raw_material_name || item.raw_material?.name : item.product_name || item.product?.name
                        const subtotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)

                        return (
                          <tr key={item.id || idx} className="hover:bg-slate-50/20">
                            <td className="px-4 py-3 text-slate-450 font-mono">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-3 text-slate-600 font-mono">
                              {item.hsn_code || "—"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${isRM ? "bg-amber-400" : "bg-blue-400"}`} />
                                <div>
                                  <p className="font-bold text-slate-800 leading-snug">{itemName || "Unknown Item"}</p>
                                  <p className="text-[9px] text-slate-450 font-bold mt-0.5">
                                    {isRM ? "Raw Material" : "Finished Product"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-slate-600">
                              {parseFloat(item.quantity).toFixed(2)} {item.unit_code || "KG"}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-slate-655">
                              ₹{(parseFloat(item.unit_price) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-slate-600">
                              {item.gst_percent !== undefined && item.gst_percent !== null ? `${parseFloat(item.gst_percent).toFixed(2)}%` : "—"}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-slate-600">
                              {item.gst_amount !== undefined && item.gst_amount !== null ? `₹${parseFloat(item.gst_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                              ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Grand Totals Summary */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 ml-auto w-full max-w-sm space-y-3 shadow-inner">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-150 pb-1.5">Grand Billing Summary</h4>
                
                <div className="space-y-1.5 text-xs font-semibold text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono text-slate-800 font-bold">
                      ₹{(viewingOrder.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Total GST</span>
                    <span className="font-mono text-slate-800 font-bold">
                      ₹{(viewingOrder.gst_amount !== undefined ? viewingOrder.gst_amount : (viewingOrder.sales_tax_amount || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-slate-800">
                    <span>Grand Total</span>
                    <span className="font-mono text-brand-700 text-base">
                      ₹{(viewingOrder.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/70 flex flex-col-reverse sm:flex-row gap-2.5 justify-between items-stretch sm:items-center shrink-0 z-10">
              {/* Left Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Draft Actions */}
                {viewingOrder.status === "draft" && (
                  <>
                    <button
                      onClick={() => {
                        setViewingOrder(null)
                        navigate(`/dashboard/purchase/orders/create?po_id=${viewingOrder.id}`)
                      }}
                      className="px-3 py-1.5 sm:px-3.5 sm:py-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 bg-white rounded-xl text-xs font-bold text-slate-700 transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Edit PO</span>
                    </button>
                    <button
                      onClick={() => triggerActionConfirm(viewingOrder.id, "confirm", viewingOrder.po_number, viewingOrder.supplier_name || viewingOrder.supplier?.name)}
                      className="px-3 py-1.5 sm:px-3.5 sm:py-2 border border-brand-200 hover:border-brand-400 hover:bg-brand-50 bg-white rounded-xl text-xs font-bold text-brand-700 transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-brand-600" />
                      <span>Authorize & Approve</span>
                    </button>
                  </>
                )}

                {/* 2. Confirmed Actions */}
                {(viewingOrder.status === "confirmed" || viewingOrder.status === "authorized") && (
                  <>
                    <button
                      onClick={() => triggerActionConfirm(viewingOrder.id, "send", viewingOrder.po_number, viewingOrder.supplier_name || viewingOrder.supplier?.name)}
                      disabled={actionLoadingId === viewingOrder.id}
                      className="px-3 py-1.5 sm:px-3.5 sm:py-2 border border-blue-200 hover:border-blue-450 hover:bg-blue-50 bg-white rounded-xl text-xs font-bold text-blue-700 transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoadingId === viewingOrder.id ? <Spinner size="sm" /> : <Send className="w-3.5 h-3.5 text-blue-600" />}
                      <span>Send PO</span>
                    </button>
                    <button
                      onClick={() => triggerActionConfirm(viewingOrder.id, "release", viewingOrder.po_number, viewingOrder.supplier_name || viewingOrder.supplier?.name)}
                      disabled={actionLoadingId === viewingOrder.id}
                      className="px-3 py-1.5 sm:px-3.5 sm:py-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 bg-white rounded-xl text-xs font-bold text-slate-700 transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Sends a delivery request email for the next shipment against this PO"
                    >
                      {actionLoadingId === viewingOrder.id ? <Spinner size="sm" /> : <Send className="w-3.5 h-3.5 text-slate-500" />}
                      <span>Send Release Order</span>
                    </button>
                    <button
                      onClick={() => triggerActionConfirm(viewingOrder.id, "cancel", viewingOrder.po_number, viewingOrder.supplier_name || viewingOrder.supplier?.name)}
                      disabled={actionLoadingId === viewingOrder.id}
                      className="px-3 py-1.5 sm:px-3.5 sm:py-2 border border-transparent hover:border-error-200 hover:bg-error-50 rounded-xl text-xs font-bold text-error-800 transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoadingId === viewingOrder.id ? <Spinner size="sm" /> : <XCircle className="w-3.5 h-3.5 text-error-600" />}
                      <span>Cancel / Deactivate</span>
                    </button>
                  </>
                )}

                {viewingOrder.status === "sent" && (
                  <>
                    <button
                      onClick={() => triggerActionConfirm(viewingOrder.id, "acknowledge", viewingOrder.po_number, viewingOrder.supplier_name || viewingOrder.supplier?.name)}
                      disabled={actionLoadingId === viewingOrder.id}
                      className="px-3 py-1.5 sm:px-3.5 sm:py-2 border border-amber-200 hover:border-amber-450 hover:bg-amber-50 bg-white rounded-xl text-xs font-bold text-amber-700 transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoadingId === viewingOrder.id ? <Spinner size="sm" /> : <CheckCircle className="w-3.5 h-3.5 text-amber-600" />}
                      <span>Acknowledge PO</span>
                    </button>
                    <button
                      onClick={() => triggerActionConfirm(viewingOrder.id, "release", viewingOrder.po_number, viewingOrder.supplier_name || viewingOrder.supplier?.name)}
                      disabled={actionLoadingId === viewingOrder.id}
                      className="px-3 py-1.5 sm:px-3.5 sm:py-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 bg-white rounded-xl text-xs font-bold text-slate-700 transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Sends a delivery request email for the next shipment against this PO"
                    >
                      {actionLoadingId === viewingOrder.id ? <Spinner size="sm" /> : <Send className="w-3.5 h-3.5 text-slate-500" />}
                      <span>Send Release Order</span>
                    </button>
                    <button
                      onClick={() => triggerActionConfirm(viewingOrder.id, "cancel", viewingOrder.po_number, viewingOrder.supplier_name || viewingOrder.supplier?.name)}
                      disabled={actionLoadingId === viewingOrder.id}
                      className="px-3 py-1.5 sm:px-3.5 sm:py-2 border border-transparent hover:border-error-200 hover:bg-error-50 rounded-xl text-xs font-bold text-error-800 transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoadingId === viewingOrder.id ? <Spinner size="sm" /> : <XCircle className="w-3.5 h-3.5 text-error-600" />}
                      <span>Cancel / Deactivate</span>
                    </button>
                  </>
                )}

                {/* 4. Acknowledged / Partially Received Actions */}
                {(viewingOrder.status === "acknowledged" || viewingOrder.status === "partially_received") && (
                  <>
                    <button
                      onClick={() => {
                        setViewingOrder(null)
                        navigate(`/dashboard/purchase/entries/create?po_id=${viewingOrder.id}`)
                      }}
                      className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-sm shadow-brand-500/10"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Log Delivery (Purchase Entry)</span>
                    </button>
                    <button
                      onClick={() => triggerActionConfirm(viewingOrder.id, "release", viewingOrder.po_number, viewingOrder.supplier_name || viewingOrder.supplier?.name)}
                      disabled={actionLoadingId === viewingOrder.id}
                      className="px-3 py-1.5 sm:px-3.5 sm:py-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 bg-white rounded-xl text-xs font-bold text-slate-700 transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Sends a delivery request email for the next shipment against this PO"
                    >
                      {actionLoadingId === viewingOrder.id ? <Spinner size="sm" /> : <Send className="w-3.5 h-3.5 text-slate-500" />}
                      <span>Send Release Order</span>
                    </button>
                    <button
                      onClick={() => triggerActionConfirm(viewingOrder.id, "cancel", viewingOrder.po_number, viewingOrder.supplier_name || viewingOrder.supplier?.name)}
                      disabled={actionLoadingId === viewingOrder.id}
                      className="px-3 py-1.5 sm:px-3.5 sm:py-2 border border-transparent hover:border-error-200 hover:bg-error-50 rounded-xl text-xs font-bold text-error-800 transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoadingId === viewingOrder.id ? <Spinner size="sm" /> : <XCircle className="w-3.5 h-3.5 text-error-600" />}
                      <span>Cancel / Deactivate</span>
                    </button>
                  </>
                )}

                {/* 5. Received / Cancelled badges */}
                {viewingOrder.status === "received" && (
                  <span className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-550 text-xs font-bold rounded-xl flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Contract Expired</span>
                  </span>
                )}
                {viewingOrder.status === "cancelled" && (
                  <span className="px-3 py-1.5 bg-error-50 border border-error-100 text-error-800 text-xs font-bold rounded-xl flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Contract Deactivated</span>
                  </span>
                )}
              </div>

              {/* Right Close Button */}
              <button
                onClick={() => setViewingOrder(null)}
                className="px-4 py-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-100 bg-white rounded-xl text-xs font-bold text-slate-700 transition-all active:scale-95 shrink-0 text-center"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal Overlay */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${confirmModal.isDanger ? "bg-error-50 text-error-800" : "bg-brand-50 text-brand-600"}`}>
                  <AlertTriangle className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">{confirmModal.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={!!actionLoadingId}
                className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                {confirmModal.promptText}
              </p>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={!!actionLoadingId}
                className="border border-slate-200 hover:border-slate-350 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-650 transition-all bg-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const { poId, actionType } = confirmModal
                  handleStatusAction(poId, actionType)
                }}
                disabled={!!actionLoadingId}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md flex items-center gap-2 disabled:opacity-50 ${confirmModal.isDanger ? "bg-error-800 hover:bg-error-900 text-white shadow-error-500/10" : "bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/10"}`}
              >
                {actionLoadingId ? <Spinner size="sm" /> : null}
                <span>{actionLoadingId ? "Processing..." : confirmModal.actionLabel}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PurchaseOrders
