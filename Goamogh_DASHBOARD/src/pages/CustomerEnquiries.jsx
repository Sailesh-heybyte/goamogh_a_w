import { useState, useEffect, useCallback } from "react"
import {
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  User,
  MessageSquare,
  ShieldCheck,
  Copy,
  Check,
  X
} from "lucide-react"
import { getContactEnquiries } from "@/services/enquiries"
import Spinner from "@/components/ui/Spinner"
import Modal from "@/components/ui/Modal"

export default function CustomerEnquiries() {
  const [enquiries, setEnquiries] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedEnquiry, setSelectedEnquiry] = useState(null)

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState("")
  const [topicFilter, setTopicFilter] = useState("all")

  // Copy Feedback State
  const [copiedField, setCopiedField] = useState("")

  const fetchEnquiries = useCallback(async () => {
    setIsLoading(true)
    setError("")
    try {
      const data = await getContactEnquiries()
      setEnquiries(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Error loading enquiries:", err)
      setError(err.message || "Unable to load customer enquiries.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Standard initial load on mount
  useEffect(() => {
    fetchEnquiries()
  }, [fetchEnquiries])


  // Topic List
  const topics = [
    "Wholesale & Bulk Orders",
    "General Inquiry",
    "Product Quality & Feedback",
    "Partnership / Business",
    "Other / General"
  ]

  // Filtered List
  const filteredEnquiries = enquiries.filter((item) => {
    // Topic Filter
    if (topicFilter !== "all" && item.inquiry_topic?.toLowerCase() !== topicFilter.toLowerCase()) {
      return false
    }

    // Search Query (Name, Email, Phone, Message, Topic)
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    const name = (item.name || "").toLowerCase()
    const email = (item.email || "").toLowerCase()
    const phone = (item.phone || "").toLowerCase()
    const topic = (item.inquiry_topic || "").toLowerCase()
    const msg = (item.message || "").toLowerCase()

    return name.includes(q) || email.includes(q) || phone.includes(q) || topic.includes(q) || msg.includes(q)
  })

  // Formatter for Date Time
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

  // Copy to clipboard helper
  const handleCopy = (text, fieldName) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(""), 2000)
  }

  return (
    <div className="flex-1 flex flex-col space-y-3.5 animate-in fade-in duration-150">
      {/* Page Title Header */}
      <div className="border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
          <span>Customer Support</span>
          <span>/</span>
          <span className="text-slate-800 font-bold">Contact Enquiries</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Customer Contact Enquiries
        </h2>
      </div>


      {/* Toolbar Search & Rating Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-2 border border-slate-100 rounded-2xl shadow-sm">
        {/* Search Bar */}
        <div className="relative w-full sm:flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Name, Email, Phone, or Keyword..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all font-medium placeholder:text-slate-400"
          />
        </div>

        {/* Filter by Topic */}
        <div className="w-full sm:w-auto sm:min-w-[160px] flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-slate-700 font-semibold transition-all"
          >
            <option value="all">All Topics</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Standard Bordered Table Grid Card */}
      {error ? (
        <div className="bg-white border border-rose-200/80 rounded-2xl p-10 text-center shadow-sm">
          <p className="text-rose-700 font-bold text-sm mb-3">{error}</p>
          <button
            onClick={fetchEnquiries}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex-1 flex items-center justify-center min-h-[250px]">
          <Spinner size="lg" />
        </div>
      ) : filteredEnquiries.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 font-semibold text-sm shadow-sm">
          No customer enquiries match your search and filter criteria.
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden w-full">
          <div className="w-full">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="hidden lg:table-cell px-5 py-3.5 w-[14%]">Date</th>
                  <th className="px-5 py-3.5 w-[65%] md:w-[35%] lg:w-[24%]">Customer Name</th>
                  <th className="hidden md:table-cell px-5 py-3.5 w-[30%] lg:w-[26%]">Email / Phone</th>
                  <th className="hidden md:table-cell px-5 py-3.5 w-[18%] lg:w-[20%]">Topic</th>
                  <th className="pl-2 pr-6 py-3.5 w-[35%] md:w-[17%] lg:w-[16%] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredEnquiries.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Date & Time */}
                    <td className="hidden lg:table-cell px-5 py-4 tabular-nums text-slate-500 text-[11px] whitespace-nowrap align-middle">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </td>

                    {/* Customer Name */}
                    <td className="px-5 py-4 font-bold text-slate-900 align-middle">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
                          {item.name?.charAt(0).toUpperCase() || "C"}
                        </div>
                        <span className="truncate" title={item.name}>{item.name}</span>
                      </div>
                      <div className="md:hidden text-[10px] text-slate-500 font-normal truncate mt-1">
                        {item.inquiry_topic || "General"}
                      </div>
                      <div className="md:hidden text-[10px] text-slate-400 font-normal truncate">
                        {item.email || item.phone || ""}
                      </div>
                      <div className="lg:hidden text-[10px] text-slate-400 font-normal truncate">
                        {formatDate(item.created_at)}
                      </div>
                    </td>

                    {/* Email / Phone Links */}
                    <td className="hidden md:table-cell px-5 py-4 align-middle">
                      <div className="space-y-1">
                        {item.email && (
                          <a
                            href={`mailto:${item.email}?subject=Re: ${item.inquiry_topic || "Inquiry"}`}
                            className="text-slate-700 hover:text-slate-900 font-medium flex items-center gap-1.5 transition-colors group/link truncate"
                            title={item.email}
                          >
                            <Mail className="w-3.5 h-3.5 text-slate-400 group-hover/link:text-slate-600 shrink-0" />
                            <span className="truncate hover:underline">{item.email}</span>
                          </a>
                        )}
                        {item.phone ? (
                          <a
                            href={`tel:${item.phone}`}
                            className="text-slate-500 hover:text-slate-800 tabular-nums text-[11px] flex items-center gap-1.5 transition-colors group/link truncate"
                            title={item.phone}
                          >
                            <Phone className="w-3 h-3 text-slate-400 group-hover/link:text-slate-600 shrink-0" />
                            <span className="truncate">{item.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px]">N/A</span>
                        )}
                      </div>
                    </td>

                    {/* Inquiry Topic Badge */}
                    <td className="hidden md:table-cell px-5 py-4 align-middle">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80 truncate max-w-full" title={item.inquiry_topic || "General"}>
                        {item.inquiry_topic || "General"}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="pl-2 pr-6 py-4 text-right align-middle whitespace-nowrap">
                      <button
                        onClick={() => setSelectedEnquiry(item)}
                        className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 ml-auto"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                        <span>View Message</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Message Detail Modal */}
      {selectedEnquiry && (
        <Modal onClose={() => setSelectedEnquiry(null)}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Customer Inquiry Detail
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {selectedEnquiry.inquiry_topic || "General Inquiry"}
                </h3>
              </div>

              <button
                onClick={() => setSelectedEnquiry(null)}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Customer Metadata Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-600" />
                    <span className="font-bold text-slate-900 text-sm">{selectedEnquiry.name}</span>
                  </div>
                  {selectedEnquiry.terms_accepted && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      <ShieldCheck className="w-3 h-3 text-slate-500" />
                      Terms Accepted
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Email */}
                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800 truncate" title={selectedEnquiry.email}>{selectedEnquiry.email}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(selectedEnquiry.email, "email")}
                      className="text-slate-400 hover:text-slate-600 ml-1 cursor-pointer"
                      title="Copy Email"
                    >
                      {copiedField === "email" ? <Check className="w-3.5 h-3.5 text-slate-800 font-bold" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="tabular-nums font-medium text-slate-800 truncate" title={selectedEnquiry.phone || "N/A"}>
                        {selectedEnquiry.phone || "N/A"}
                      </span>
                    </div>
                    {selectedEnquiry.phone && (
                      <button
                        onClick={() => handleCopy(selectedEnquiry.phone, "phone")}
                        className="text-slate-400 hover:text-slate-600 ml-1 cursor-pointer"
                        title="Copy Phone"
                      >
                        {copiedField === "phone" ? <Check className="w-3.5 h-3.5 text-slate-800 font-bold" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Submission Time */}
                <div className="flex items-center gap-1.5 text-slate-500 pt-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Submitted on:</span>
                  <span className="tabular-nums font-semibold text-slate-700">
                    {formatDate(selectedEnquiry.created_at)}
                  </span>
                </div>
              </div>

              {/* Message Body */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Message Body
                  </label>
                  <button
                    onClick={() => handleCopy(selectedEnquiry.message, "message")}
                    className="text-slate-500 hover:text-slate-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === "message" ? (
                      <>
                        <Check className="w-3 h-3 text-slate-800" />
                        <span className="text-slate-800 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800 leading-relaxed font-medium min-h-[120px] whitespace-pre-wrap">
                  {selectedEnquiry.message}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 shrink-0">
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer w-full sm:w-auto"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
