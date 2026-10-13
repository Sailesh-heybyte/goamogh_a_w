import { useState, useEffect, useCallback } from "react"
import {
  Star,
  MessageSquare,
  Search,
  Filter,
  ThumbsUp,
  Calendar,
  Phone,
  User,
  ShoppingBag,
  Award,
  Copy,
  Check,
  X,
  ExternalLink
} from "lucide-react"
import { getCustomerFeedbacks } from "@/services/feedback"
import Spinner from "@/components/ui/Spinner"

export default function CustomerFeedback() {
  const [feedbacks, setFeedbacks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [ratingFilter, setRatingFilter] = useState("all")
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const [copiedField, setCopiedField] = useState("")

  const fetchFeedbacks = useCallback(async () => {
    setIsLoading(true)
    setError("")
    try {
      const data = await getCustomerFeedbacks({ skip: 0, limit: 50 })
      setFeedbacks(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to load customer feedbacks:", err)
      setError(err.message || "Unable to load customer feedback.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Standard initial load on mount
  useEffect(() => {
    fetchFeedbacks()
  }, [fetchFeedbacks])


  // Filtered List
  const filteredFeedbacks = feedbacks.filter((fb) => {
    // Rating Filter
    if (ratingFilter !== "all" && Number(fb.rating) !== Number(ratingFilter)) {
      return false
    }

    // Search Query (Customer Name, Phone, Order Number, Comments)
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    const name = (fb.customer_name || "").toLowerCase()
    const phone = (fb.customer_phone || "").toLowerCase()
    const orderNum = (fb.order_number || fb.sale_id || "").toLowerCase()
    const comments = (fb.comments || "").toLowerCase()

    return name.includes(q) || phone.includes(q) || orderNum.includes(q) || comments.includes(q)
  })

  // KPI Calculations
  const totalReviews = feedbacks.length
  const avgRatingNum =
    totalReviews > 0
      ? (feedbacks.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0) / totalReviews)
      : 0
  const avgRating = avgRatingNum > 0 ? avgRatingNum.toFixed(1) : "0.0"

  const fiveStarCount = feedbacks.filter((fb) => Number(fb.rating) === 5).length
  const fiveStarPct = totalReviews > 0 ? Math.round((fiveStarCount / totalReviews) * 100) : 0

  const positiveCount = feedbacks.filter((fb) => (Number(fb.rating) || 0) >= 4).length
  const positiveRate = totalReviews > 0 ? Math.round((positiveCount / totalReviews) * 100) : 0

  // Date Formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return "—"
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      })
    } catch {
      return dateStr
    }
  }

  // Copy helper
  const handleCopy = (text, fieldName) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(""), 2000)
  }

  // Render Stars Helper
  const renderStars = (rating) => {
    const num = Math.min(5, Math.max(1, Math.round(Number(rating) || 5)))
    return (
      <div className="flex items-center gap-1" title={`${num} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${star <= num ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-100"
              }`}
          />
        ))}
        <span className="ml-1 text-xs font-bold text-slate-700">{num}.0</span>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col space-y-3.5 animate-in fade-in duration-150">
      {/* Page Title Header */}
      <div className="border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
          <span>Sales & Storefront</span>
          <span>/</span>
          <span className="text-slate-800 font-bold">Customer Feedbacks</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1">
          <span>Customer Ratings & Order Reviews</span>
        </h2>
      </div>

      {/* Toolbar Search & Rating Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-2 border border-slate-100 rounded-2xl shadow-sm">
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Customer Name, Phone, Order #, or Comment..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all font-medium placeholder:text-slate-400"
          />
        </div>

        {/* Rating Filter Dropdown */}
        <div className="w-full sm:w-60 flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-700 font-semibold transition-all"
          >
            <option value="all">All Star Ratings</option>
            <option value="5">5 Stars ⭐⭐⭐⭐⭐</option>
            <option value="4">4 Stars ⭐⭐⭐⭐</option>
            <option value="3">3 Stars ⭐⭐⭐</option>
            <option value="2">2 Stars ⭐⭐</option>
            <option value="1">1 Star ⭐</option>
          </select>
        </div>
      </div>

      {/* Standard Bordered Table Grid Card */}
      {error ? (
        <div className="bg-white border border-rose-200/80 rounded-2xl p-10 text-center shadow-sm">
          <p className="text-rose-700 font-bold text-sm mb-3">{error}</p>
          <button
            onClick={fetchFeedbacks}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex-1 flex items-center justify-center min-h-[250px]">
          <Spinner size="lg" />
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 font-semibold text-sm shadow-sm">
          No customer reviews or feedback records match your search and filter criteria.
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden w-full">
          <div className="w-full overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-5 py-3.5 w-[18%]">Date</th>
                  <th className="px-5 py-3.5 w-[16%]">Order #</th>
                  <th className="px-5 py-3.5 w-[22%]">Customer</th>
                  <th className="px-5 py-3.5 w-[18%]">Rating</th>
                  <th className="px-5 py-3.5 w-[26%]">Review / Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredFeedbacks.map((fb) => (
                  <tr
                    key={fb.id || fb.sale_id || fb.order_number}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Date & Time */}
                    <td className="px-5 py-4 font-mono text-slate-500 text-[11px] whitespace-nowrap align-middle">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatDate(fb.created_at)}</span>
                      </div>
                    </td>

                    {/* Order Number (Clickable link/modal trigger) */}
                    <td className="px-5 py-4 align-middle">
                      <button
                        onClick={() => setSelectedFeedback(fb)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-900 font-mono font-bold text-xs transition-colors cursor-pointer"
                        title="Click to view order feedback detail"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                        <span>#{fb.order_number || "SO-26-1002"}</span>
                      </button>
                    </td>

                    {/* Customer Name & Phone */}
                    <td className="px-5 py-4 align-middle">
                      <div>
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{fb.customer_name || "Customer"}</span>
                        </p>
                        {fb.customer_phone ? (
                          <p className="text-[11px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{fb.customer_phone}</span>
                          </p>
                        ) : (
                          <span className="text-slate-400 text-[11px]">N/A</span>
                        )}
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="px-5 py-4 align-middle">
                      {renderStars(fb.rating)}
                    </td>

                    {/* Customer Review / Comments */}
                    <td className="px-5 py-4 align-middle">
                      <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-xs text-slate-700 leading-relaxed max-w-sm">
                        <p className="line-clamp-2">
                          {fb.comments || <span className="italic text-slate-400">No written comment provided.</span>}
                        </p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Order Review Detail
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-slate-600" />
                  <span>Order #{selectedFeedback.order_number || "SO-26-1002"}</span>
                </h3>
              </div>

              <button
                onClick={() => setSelectedFeedback(null)}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Rating Card */}
              <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase text-amber-800 tracking-wider">Rating Given</p>
                  <div className="mt-1">{renderStars(selectedFeedback.rating)}</div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-amber-900">
                    {selectedFeedback.rating}.0
                  </span>
                  <span className="text-xs font-bold text-amber-700"> / 5.0</span>
                </div>
              </div>

              {/* Customer Metadata Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-600" />
                    <span className="font-bold text-slate-900 text-sm">{selectedFeedback.customer_name}</span>
                  </div>
                  {selectedFeedback.customer_phone && (
                    <span className="font-mono text-slate-600 text-xs flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {selectedFeedback.customer_phone}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-slate-500 pt-1 border-t border-slate-200/60">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Submitted on:</span>
                  <span className="font-mono font-semibold text-slate-700">
                    {formatDate(selectedFeedback.created_at)}
                  </span>
                </div>
              </div>

              {/* Customer Written Comment */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Customer Written Review
                  </label>
                  {selectedFeedback.comments && (
                    <button
                      onClick={() => handleCopy(selectedFeedback.comments, "comments")}
                      className="text-slate-500 hover:text-slate-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === "comments" ? (
                        <>
                          <Check className="w-3 h-3 text-slate-800" />
                          <span className="text-slate-800 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Comment</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800 leading-relaxed font-medium min-h-[100px] whitespace-pre-wrap">
                  {selectedFeedback.comments || (
                    <span className="italic text-slate-400">No written review comment provided for this order.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end">
              <button
                onClick={() => setSelectedFeedback(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
