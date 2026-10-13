import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Printer,
  AlertCircle,
  FileText,
  Building,
  CheckCircle,
  Clock,
  ExternalLink
} from "lucide-react"
import { getInvoiceDetails } from "@/services/invoices"
import { getPricingPanel } from "@/services/products"
import Spinner from "@/components/ui/Spinner"
import "../styles/print.css"

function InvoiceDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [invoice, setInvoice] = useState(null)
  const [variantsList, setVariantsList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

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

  const loadInvoice = useCallback(async () => {
    setIsLoading(true)
    setError("")
    try {
      const res = await getInvoiceDetails(id)
      if (!res.ok) {
        throw new Error(`Failed to load invoice details (Status ${res.status})`)
      }
      const json = await res.json()
      setInvoice(json.data || null)
    } catch (err) {
      setError(err.message || "An error occurred.")
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadInvoice()
  }, [loadInvoice])

  const handlePrint = () => {
    window.print()
  }

  const formatShortDate = (isoString) => {
    if (!isoString) return "—"
    return new Date(isoString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    })
  }

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center py-20"><Spinner size="lg" /></div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="flex-1 flex flex-col space-y-4 animate-in fade-in">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/invoices")}
            className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-slate-550" />
          </button>
          <span className="text-sm font-bold text-slate-500">Back to Invoices</span>
        </div>
        <div className="p-4 bg-error-50 border border-error-200 rounded-2xl text-sm font-semibold text-error-800 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-error-600 shrink-0 mt-0.5" />
          <p>{error || "Invoice details not found."}</p>
        </div>
      </div>
    )
  }

  const sale = invoice.sale_details || {}
  const isB2b = sale.is_b2b || !!sale.customer_gstin

  return (
    <div className="flex-1 flex flex-col space-y-6">



      {/* Top Header Block: Hide in printing */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/invoices")}
            className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-slate-550" />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
              <span>Sales & Accounts</span>
              <span>/</span>
              <span className="cursor-pointer hover:text-brand-600" onClick={() => navigate("/dashboard/invoices")}>Invoices</span>
              <span>/</span>
              <span className="text-slate-800 font-bold">{invoice.invoice_number}</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" />
              <span>Tax Invoice Document</span>
            </h2>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/dashboard/sales?search=${sale.sale_number}`)}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-655 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Go to Order</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-brand-500/10 active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* Invoice Page Layout */}
      <div className="bg-white border border-slate-150 shadow-sm rounded-2xl p-8 max-w-4xl mx-auto w-full print-card text-xs font-semibold text-slate-700 space-y-6">

        {/* Invoice Top Heading Grid */}
        <div className="grid grid-cols-2 gap-6 border-b border-slate-200 pb-5 items-start">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <img
                src="/logo/Goamogh%20golden.png"
                alt="Goamogh logo"
                className="h-12 w-12 object-contain bg-transparent"
              />
              <h1 className="text-lg font-black text-slate-900 uppercase leading-tight tracking-tight">
                Go Amogh (OPC) Pvt Ltd
              </h1>
            </div>
            <p className="text-slate-500 font-medium leading-relaxed max-w-sm">
              Door No: 3-11-8, Kandukuri Vari Street, Ramnagar, Nidadavole, East Godavari, Andhra Pradesh - 534301
            </p>
            <p className="font-mono text-slate-900">GSTIN: <span className="font-bold text-slate-800">37AAMCG3553B1ZP</span></p>
            <p className="font-mono">State: <span className="font-bold">Andhra Pradesh</span></p>
          </div>

          <div className="text-right space-y-1">
            <h2 className="text-xl font-black text-brand-700 uppercase tracking-wide">Tax Invoice</h2>
            <p className="font-mono">Invoice No: <span className="font-bold text-slate-900">{invoice.invoice_number}</span></p>
            <p className="font-mono text-slate-400">Order Ref: <span className="font-bold text-slate-600">{sale.sale_number}</span></p>
            <p className="font-mono mt-1">Invoice Date: <span className="font-bold text-slate-800">{formatShortDate(invoice.invoice_date || invoice.created_at)}</span></p>
            <p className="font-mono">Due Date: <span className="text-slate-400 font-bold">{formatShortDate(invoice.due_date)}</span></p>
          </div>
        </div>

        {/* Bill to section */}
        <div className="p-4 bg-slate-50/50 border border-slate-150 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Bill To (Customer Details)</span>
            <p className="text-slate-900 font-extrabold text-sm">{sale.customer_name || "Walk-in Customer"}</p>
            {sale.company_name && <p className="font-bold text-slate-700">{sale.company_name}</p>}
            {sale.customer_phone && <p className="font-mono">Phone: {sale.customer_phone}</p>}
            {sale.customer_gstin && (
              <p className="font-mono text-brand-750 font-bold">GSTIN: {sale.customer_gstin}</p>
            )}
          </div>

          <div className="space-y-1 md:border-l md:border-slate-200 md:pl-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Shipping Destination / Delivery Address</span>
            <p className="font-semibold text-slate-800 leading-normal">
              {sale.delivery_address || "No shipping destination specified (Physical Counter Sale)."}
            </p>
            <p className="text-[10px] text-slate-400">Supply State: <span className="font-bold text-slate-600">{sale.customer_state || "Goa"}</span></p>
          </div>
        </div>

        {/* Items Table */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold uppercase text-slate-450 tracking-wider">Product Inventory Line Items</h3>
          <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="px-4 py-3 w-[50px] text-center">SNo</th>
                  <th className="px-4 py-3">Description of Goods</th>
                  <th className="px-4 py-3 font-mono text-center w-[90px]">HSN</th>
                  <th className="px-4 py-3 text-right w-[80px]">Qty</th>
                  <th className="px-4 py-3 text-right w-[90px]">Rate (₹)</th>
                  <th className="px-4 py-3 text-right w-[80px]">Disc %</th>
                  <th className="px-4 py-3 text-right w-[110px]">Taxable Val</th>
                  <th className="px-4 py-3 text-right w-[80px]">GST %</th>
                  <th className="px-4 py-3 text-right w-[100px]">GST Amt (₹)</th>
                  <th className="px-4 py-3 text-right w-[110px]">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 font-semibold text-slate-700">
                {sale.items?.map((item, idx) => {
                  const gross = item.quantity * item.rate
                  const disc = gross * ((item.discount_percent || 0) / 100)
                  const taxable = gross - disc
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/20 transition-colors">
                      <td className="px-4 py-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{getVariantDisplayName(item)}</td>
                      <td className="px-4 py-3 font-mono text-center text-slate-500">{item.hsn_code || "—"}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-900">{item.quantity}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">₹{parseFloat(item.rate).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">{parseFloat(item.discount_percent || 0).toFixed(2)}%</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-900">₹{taxable.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">{parseFloat(item.gst_percent || 0).toFixed(2)}%</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-550">₹{parseFloat(item.gst_amount || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">₹{parseFloat(item.total_amount).toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Breakdown split columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">

            {/* Payment Summary */}
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Receipt Settlement</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold">Settlement Status:</span>
                {invoice.payment_status === "paid" ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                    <CheckCircle className="w-3 h-3" />
                    <span>Paid</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 uppercase">
                    <span>Unpaid</span>
                  </span>
                )}
              </div>
              <p>Settled Amount: <span className="font-mono font-bold text-slate-900">₹{parseFloat(invoice.paid_amount || 0).toFixed(2)}</span></p>
              {invoice.notes && <p className="text-[10px] text-slate-450 mt-1 leading-normal font-semibold">Memo: {invoice.notes}</p>}
            </div>

            {/* Print Disclaimer */}
            <div className="text-[9px] text-slate-400 leading-relaxed font-semibold">
              <p>Terms & Conditions:</p>
              <ul className="list-decimal pl-3 space-y-0.5">
                <li>Goods once sold are not subject to return.</li>
                <li>This document is a computer-generated Tax Invoice and requires no physical signature.</li>
              </ul>
            </div>

          </div>

          {/* Right Calculations block */}
          <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2.5 text-slate-600 font-semibold">
            <div className="flex justify-between">
              <span>Gross Total:</span>
              <span className="font-mono text-slate-900">₹{parseFloat(invoice.total_taxable_amount + (sale.total_discount_amount || 0)).toFixed(2)}</span>
            </div>

            {(sale.total_discount_amount || 0) > 0 && (
              <div className="flex justify-between text-rose-700 text-[11px]">
                <span>Total Discount Applied:</span>
                <span className="font-mono">-₹{parseFloat(sale.total_discount_amount).toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between pt-1.5 border-t border-slate-200">
              <span>Taxable Value:</span>
              <span className="font-mono text-slate-900 font-bold">₹{parseFloat(invoice.total_taxable_amount).toFixed(2)}</span>
            </div>

            {invoice.total_cgst_amount > 0 && (
              <div className="flex justify-between text-[11px]">
                <span>CGST:</span>
                <span className="font-mono">₹{parseFloat(invoice.total_cgst_amount).toFixed(2)}</span>
              </div>
            )}

            {invoice.total_sgst_amount > 0 && (
              <div className="flex justify-between text-[11px]">
                <span>SGST:</span>
                <span className="font-mono">₹{parseFloat(invoice.total_sgst_amount).toFixed(2)}</span>
              </div>
            )}

            {invoice.total_igst_amount > 0 && (
              <div className="flex justify-between text-[11px]">
                <span>IGST:</span>
                <span className="font-mono">₹{parseFloat(invoice.total_igst_amount).toFixed(2)}</span>
              </div>
            )}

            <div className="border-t border-slate-250 pt-2.5 flex justify-between items-baseline text-slate-900 font-bold">
              <span className="text-xs uppercase">Grand Invoice Value:</span>
              <span className="text-base font-black font-mono text-brand-700">₹{parseFloat(invoice.total_amount).toFixed(2)}</span>
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-col items-end pr-1 gap-1 text-[10px] text-slate-450">
              <div className="w-32 border-b border-slate-300 h-10"></div>
              <span>Authorized Signatory</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}

export default InvoiceDetails
