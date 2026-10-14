import { useState, useEffect, useCallback } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  Search,
  AlertCircle,
  Layers,
  Package,
  Wheat,
  ClipboardList,
  FileSpreadsheet,
  Printer,
  X
} from "lucide-react"
import {
  getItemLedger,
  getStockSummary
} from "@/api/ledgers"
import Spinner from "@/components/ui/Spinner"


// Format date format: Tue Mar 3 03:29:58 2026
const formatTimestamp = (isoString) => {
  if (!isoString) return "—"
  try {
    const date = new Date(isoString)
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    const weekday = weekdays[date.getDay()]
    const month = months[date.getMonth()]
    const day = date.getDate()

    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    const seconds = String(date.getSeconds()).padStart(2, "0")

    const year = date.getFullYear()

    return `${weekday} ${month} ${day} ${hours}:${minutes}:${seconds} ${year}`
  } catch {
    return isoString
  }
}

const formatLastUpdated = (isoString) => {
  if (!isoString) return "2026-07-12"
  try {
    const date = new Date(isoString)
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, "0")
    const dd = String(date.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  } catch {
    return isoString
  }
}

const getTenDaysAgoStr = () => {
  const d = new Date()
  d.setDate(d.getDate() - 10)
  return d.toISOString().split("T")[0]
}

const getTodayStr = () => {
  return new Date().toISOString().split("T")[0]
}

function StockLedger() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const itemIdParam = searchParams.get("item_id")

  // Navigation View State: "stock-summary", "ledger"
  const [currentView, setCurrentView] = useState("stock-summary")

  // Data States
  const [summaryData, setSummaryData] = useState([])
  const [ledgerLogs, setLedgerLogs] = useState([])
  const [ledgerSubView, setLedgerSubView] = useState("logs") // "logs" or "source-history"
  const [purchaseHistory, setPurchaseHistory] = useState([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState("")

  // Selection State
  const [selectedItem, setSelectedItem] = useState(null)

  // Filters State (Stock Summary)
  const [itemTypeFilter, setItemTypeFilter] = useState("") // raw_material, finished_good
  const [searchQuery, setSearchQuery] = useState("")

  // Date/Ledger Filters State (Stock Ledger View)
  const [fromDate, setFromDate] = useState(getTenDaysAgoStr())
  const [toDate, setToDate] = useState(getTodayStr())
  const [ledgerSearch, setLedgerSearch] = useState("")
  const [appliedLedgerFilters, setAppliedLedgerFilters] = useState({
    fromDate: getTenDaysAgoStr(),
    toDate: getTodayStr(),
    search: ""
  })

  // Pagination States (Stock Summary)
  const [summaryPage, setSummaryPage] = useState(1)
  const [summaryLimit, setSummaryLimit] = useState(10)

  // Pagination States (Ledger logs)
  const [ledgerPage, setLedgerPage] = useState(1)
  const [ledgerLimit, setLedgerLimit] = useState(10)

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Load Stock Summary
  const loadStockSummary = useCallback(async () => {
    setIsLoading(true)
    setError("")
    try {
      const params = {}
      if (itemTypeFilter) params.item_type = itemTypeFilter
      const res = await getStockSummary(params)
      if (!res.ok) {
        throw new Error(`Failed to load stock summary (Status ${res.status})`)
      }
      const json = await res.json()
      setSummaryData(json.data || [])
    } catch (err) {
      setError(err.message || "Something went wrong fetching the stock summary.")
    } finally {
      setIsLoading(false)
    }
  }, [itemTypeFilter])

  // Load Detailed Ledger
  const loadLedger = useCallback(async (item) => {
    if (!item) return
    setIsLoading(true)
    setError("")
    try {
      const params = { skip: 0, limit: 1000 }

      const res = await getItemLedger(item.item_type, item.id, params)

      if (!res.ok) {
        throw new Error(`Failed to load ledger history (Status ${res.status})`)
      }
      const json = await res.json()
      setLedgerLogs(json.data || [])
    } catch (err) {
      setError(err.message || "Something went wrong fetching ledger logs.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadPurchaseHistory = useCallback(async (item) => {
    if (!item) return
    setIsHistoryLoading(true)
    setHistoryError("")
    try {
      const params = { skip: 0, limit: 1000, direction: "in" }
      const res = await getItemLedger(item.item_type, item.id, params)

      if (!res.ok) {
        throw new Error("Could not load purchase history")
      }
      const json = await res.json()
      const inEntries = json.data || []

      const resolvedRows = inEntries.map((entry) => ({
        id: entry.id,
        created_at: entry.created_at,
        supplier_name: entry.supplier_name,
        pe_number: entry.pe_number,
        invoice_number: entry.invoice_number,
        quantity_received: entry.quantity_change,
        batch_number: entry.batch_number,
        expiry_date: entry.expiry_date
      }))

      resolvedRows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setPurchaseHistory(resolvedRows)
    } catch {
      setHistoryError("Could not load purchase history")
    } finally {
      setIsHistoryLoading(false)
    }
  }, [])

  // Load stock summary on initial render
  useEffect(() => {
    if (currentView === "stock-summary") {
      loadStockSummary()
    }
  }, [currentView, loadStockSummary])

  // Handle auto-drill down from query parameter
  useEffect(() => {
    if (itemIdParam && summaryData.length > 0) {
      const matched = summaryData.find((itm) => itm.id === itemIdParam)
      if (matched) {
        setSelectedItem(matched)
        setCurrentView("ledger")
        setLedgerSubView("logs")
        setPurchaseHistory([])
        setHistoryError("")
        loadLedger(matched)
      }
    }
  }, [itemIdParam, summaryData, loadLedger])

  // Handle drill down selections
  const handleSelectItem = (item) => {
    setSelectedItem(item)
    setSearchParams({ item_id: item.id })
    setCurrentView("ledger")
    setLedgerSubView("logs")
    setPurchaseHistory([])
    setHistoryError("")
    loadLedger(item)
    // Reset date range filters to default when opening a new ledger
    setFromDate(getTenDaysAgoStr())
    setToDate(getTodayStr())
    setLedgerSearch("")
    setAppliedLedgerFilters({
      fromDate: getTenDaysAgoStr(),
      toDate: getTodayStr(),
      search: ""
    })
    setLedgerPage(1)
  }

  const handleGoBackToSummary = () => {
    setSearchParams({})
    setSelectedItem(null)
    setCurrentView("stock-summary")
    setSummaryPage(1)
  }



  // Filter & Search Logic (Stock Summary)
  const getFilteredStock = () => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return summaryData
    return summaryData.filter((itm) => itm.name?.toLowerCase().includes(q))
  }

  // Filter & Search Logic (Stock Ledger Logs)
  const getFilteredLedgerLogs = () => {
    const filtered = ledgerLogs.filter((row) => {
      // 1. Date Filter
      const rowDate = new Date(row.created_at)
      if (appliedLedgerFilters.fromDate) {
        const start = new Date(appliedLedgerFilters.fromDate)
        start.setHours(0, 0, 0, 0)
        if (rowDate < start) return false
      }
      if (appliedLedgerFilters.toDate) {
        const end = new Date(appliedLedgerFilters.toDate)
        end.setHours(23, 59, 59, 999)
        if (rowDate > end) return false
      }

      // 2. Search query filter on narration
      if (appliedLedgerFilters.search) {
        const q = appliedLedgerFilters.search.toLowerCase().trim()
        const narrationMatch = row.narration?.toLowerCase().includes(q)
        const batchMatch = row.batch_number?.toLowerCase().includes(q)
        if (!narrationMatch && !batchMatch) return false
      }

      return true
    })

    return [...filtered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }

  const handleApplyLedgerFilters = () => {
    setAppliedLedgerFilters({
      fromDate,
      toDate,
      search: ledgerSearch
    })
    setLedgerPage(1)
  }

  // Pagination lists
  const paginatedSummary = () => {
    const filtered = getFilteredStock()
    const startIndex = (summaryPage - 1) * summaryLimit
    return filtered.slice(startIndex, startIndex + summaryLimit)
  }

  const paginatedLedger = () => {
    const filtered = getFilteredLedgerLogs()
    const startIndex = (ledgerPage - 1) * ledgerLimit
    return filtered.slice(startIndex, startIndex + ledgerLimit)
  }

  // Render Breadcrumbs
  const renderBreadcrumbs = () => {
    return (
      <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
        <span className="cursor-pointer hover:text-brand-600 transition-colors" onClick={() => navigate("/dashboard/inventory-dashboard")}>Inventory</span>
        <span>/</span>
        {currentView === "stock-summary" ? (
          <span className="text-slate-800 font-bold">Stock Summary</span>
        ) : (
          <>
            <span className="cursor-pointer hover:text-brand-600 transition-colors" onClick={handleGoBackToSummary}>Stock Summary</span>
            <span>/</span>
            <span className="text-slate-800 font-bold">{selectedItem?.name}</span>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in fade-in duration-200">

      {/* Top Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          {renderBreadcrumbs()}
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-brand-600" />
            <span>{currentView === "stock-summary" ? "Stock List" : "Stock Ledger"}</span>
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {currentView === "stock-summary"
              ? "View current running balances of products and raw materials."
              : "Track chronological stock movement logs and history."}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error-50 border border-error-100 rounded-2xl text-xs font-semibold text-error-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-error-500 shrink-0" />
          <p className="flex-1">{error}</p>
          <button onClick={() => setError("")} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
        </div>
      )}

      {/* RENDER VIEW 1: STOCK SUMMARY */}
      {currentView === "stock-summary" && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 space-y-4 animate-in fade-in duration-200">

          {/* Summary Filters toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex flex-col w-full sm:w-auto">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Item Type</label>
                <select
                  value={itemTypeFilter}
                  onChange={(e) => {
                    setItemTypeFilter(e.target.value)
                    setSummaryPage(1)
                  }}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white text-slate-800 w-full sm:w-auto sm:min-w-[160px]"
                >
                  <option value="">All Items</option>
                  <option value="raw_material">Raw Materials</option>
                  <option value="finished_good">Finished Goods</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-end">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setSummaryPage(1)
                  }}
                  placeholder="Search catalog items..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button type="button" className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition-all active:scale-95" title="Export PDF">
                  <FileSpreadsheet className="w-4 h-4 text-rose-600" />
                </button>
                <button type="button" className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition-all active:scale-95" title="Export Excel">
                  <Layers className="w-4 h-4 text-emerald-600" />
                </button>
                <button type="button" className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition-all active:scale-95" title="Print List">
                  <Printer className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20"><Spinner size="lg" /></div>
          ) : getFilteredStock().length === 0 ? (
            <div className="text-center text-slate-400 font-bold py-16">No stock details found matching search filter.</div>
          ) : (
            <div className="space-y-4">
              <div className="w-full">
                <table className="w-full text-left border-collapse table-fixed text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="hidden md:table-cell px-6 py-3.5 w-[6%]">#</th>
                      <th className="px-6 py-3.5 w-[60%] md:w-[38%] lg:w-[32%]">Product Name</th>
                      <th className="hidden md:table-cell px-6 py-3.5 w-[18%] lg:w-[16%]">Type</th>
                      <th className="px-6 py-3.5 w-[40%] md:w-[22%] lg:w-[18%] text-right">Running Balance</th>
                      <th className="hidden lg:table-cell px-6 py-3.5 w-[10%] text-center">Unit</th>
                      <th className="hidden lg:table-cell px-6 py-3.5 w-[18%] text-center">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {paginatedSummary().map((item, idx) => {
                      const absoluteIndex = (summaryPage - 1) * summaryLimit + idx + 1
                      return (
                        <tr
                          key={item.id}
                          onClick={() => handleSelectItem(item)}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                        >
                          <td className="hidden md:table-cell px-6 py-3.5 text-slate-400 font-bold whitespace-nowrap">{absoluteIndex}</td>
                          <td className="px-6 py-3.5 font-bold text-slate-900 group-hover:text-brand-600">
                            <div className="truncate" title={item.name}>{item.name}</div>
                            <div className="md:hidden text-[10px] text-slate-400 truncate">
                              {item.item_type === "raw_material" ? "Raw Material" : "Finished Product"}
                            </div>
                            <div className="lg:hidden text-[10px] text-slate-400 truncate">
                              Unit: {item.unit_code || "KG"} • {formatLastUpdated(item.updated_at)}
                            </div>
                          </td>
                          <td className="hidden md:table-cell px-6 py-3.5 text-slate-600 font-bold uppercase text-[10px] whitespace-nowrap">
                            {item.item_type === "raw_material" ? (
                              <span className="text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-100 font-extrabold flex items-center w-max gap-1">
                                <Wheat className="w-3 h-3 text-amber-500" />
                                <span className="xl:hidden">Raw</span>
                                <span className="hidden xl:inline">Raw Material</span>
                              </span>
                            ) : (
                              <span className="text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-lg border border-amber-100 font-extrabold flex items-center w-max gap-1">
                                <Package className="w-3 h-3 text-brand-500" />
                                <span className="xl:hidden">Finished</span>
                                <span className="hidden xl:inline">Finished Product</span>
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-right tabular-nums font-extrabold text-sm text-slate-800 whitespace-nowrap">
                            {parseFloat(item.stock_qty || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="hidden lg:table-cell px-6 py-3.5 text-center text-slate-500 uppercase whitespace-nowrap">{item.unit_code || "KG"}</td>
                          <td className="hidden lg:table-cell px-6 py-3.5 text-center text-slate-400 tabular-nums whitespace-nowrap">
                            {formatLastUpdated(item.updated_at)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary Pagination Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-2">
                  <span>Show per page:</span>
                  <select
                    value={summaryLimit}
                    onChange={(e) => {
                      setSummaryLimit(Number(e.target.value))
                      setSummaryPage(1)
                    }}
                    className="border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <span>
                    {(summaryPage - 1) * summaryLimit + 1} - {Math.min(summaryPage * summaryLimit, getFilteredStock().length)} of {getFilteredStock().length} Items
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={summaryPage === 1}
                      onClick={() => setSummaryPage((p) => p - 1)}
                      className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Prev
                    </button>
                    {Array.from({ length: Math.ceil(getFilteredStock().length / summaryLimit) }).map((_, pageIdx) => {
                      const pNum = pageIdx + 1
                      if (pNum === 1 || pNum === Math.ceil(getFilteredStock().length / summaryLimit) || Math.abs(pNum - summaryPage) <= 1) {
                        return (
                          <button
                            key={pNum}
                            onClick={() => setSummaryPage(pNum)}
                            className={`px-3 py-1 rounded-lg border tabular-nums ${summaryPage === pNum
                                ? "bg-brand-600 border-brand-600 text-white font-extrabold shadow-sm"
                                : "border-slate-200 hover:bg-slate-50 text-slate-600"
                              } transition-all`}
                          >
                            {pNum}
                          </button>
                        )
                      }
                      if (pNum === 2 || pNum === Math.ceil(getFilteredStock().length / summaryLimit) - 1) {
                        return <span key={pNum} className="text-slate-400 px-1 font-bold">...</span>
                      }
                      return null
                    })}
                    <button
                      disabled={summaryPage >= Math.ceil(getFilteredStock().length / summaryLimit)}
                      onClick={() => setSummaryPage((p) => p + 1)}
                      className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RENDER VIEW 2: PRODUCT/RAW MATERIAL LEDGER */}
      {currentView === "ledger" && selectedItem && (
        <div className="space-y-6 animate-in fade-in duration-200">

          {/* Header Action toolbar */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 space-y-4">

            {/* Title Block & Subtitle */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-3.5">
              <div className="flex items-center">
                <button
                  onClick={handleGoBackToSummary}
                  className="mr-3.5 p-2.5 border border-slate-200 hover:bg-rose-500 hover:text-white hover:border-rose-500 text-rose-500 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-1.5 capitalize">
                    {selectedItem.item_type === "raw_material" ? (
                      <Wheat className="w-5 h-5 text-amber-500" />
                    ) : (
                      <Package className="w-5 h-5 text-brand-600" />
                    )}
                    <span>{selectedItem.item_type === "raw_material" ? "Raw Material" : "Finished Product"} Ledger</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-bold mt-1 tabular-nums tracking-wide">
                    {selectedItem.name} &bull; HSN: {selectedItem.hsn_code || "—"} &bull; Unit: {selectedItem.unit_code || "KG"}
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Selection Row */}
            <div className="flex border-b border-slate-100 pb-0.5">
              <button
                type="button"
                onClick={() => setLedgerSubView("logs")}
                className={`pb-2.5 px-4 font-bold text-xs border-b-2 transition-all ${ledgerSubView === "logs"
                    ? "border-brand-600 text-brand-700 font-extrabold"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                  }`}
              >
                Detailed Transaction Logs
              </button>
              <button
                type="button"
                onClick={() => {
                  setLedgerSubView("source-history")
                  loadPurchaseHistory(selectedItem)
                }}
                className={`pb-2.5 px-4 font-bold text-xs border-b-2 transition-all ${ledgerSubView === "source-history"
                    ? "border-brand-600 text-brand-700 font-extrabold"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                  }`}
              >
                Stock History
              </button>
            </div>

            {/* Date Filters & Search Row */}
            {ledgerSubView === "logs" && (
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-end gap-3 w-full lg:w-auto">
                  <div className="flex flex-col w-full sm:w-auto">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">From Date</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-800 bg-white w-full sm:w-auto"
                    />
                  </div>

                  <div className="flex flex-col w-full sm:w-auto">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">To Date</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-800 bg-white w-full sm:w-auto"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyLedgerFilters}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-brand-500/10 flex items-center justify-center gap-1.5 whitespace-nowrap self-start sm:self-auto shrink-0"
                  >
                    <Search className="w-3.5 h-3.5 text-white" />
                    <span>Search</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto justify-end">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                    <input
                      type="text"
                      value={ledgerSearch}
                      onChange={(e) => setLedgerSearch(e.target.value)}
                      placeholder="Search narration/lot details..."
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-800"
                    />
                  </div>

                  {/* Actions export group */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button type="button" className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition-all active:scale-95" title="Export PDF">
                      <FileSpreadsheet className="w-4 h-4 text-rose-600" />
                    </button>
                    <button type="button" className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition-all active:scale-95" title="Export Excel">
                      <Layers className="w-4 h-4 text-emerald-600" />
                    </button>
                    <button type="button" className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition-all active:scale-95" title="Print Ledger">
                      <Printer className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* TABLE LOGS */}
          {ledgerSubView === "logs" && (
            isLoading ? (
              <div className="flex justify-center items-center py-20 bg-white border border-slate-100 rounded-2xl shadow-sm"><Spinner size="lg" /></div>
            ) : getFilteredLedgerLogs().length === 0 ? (
              <div className="text-center text-slate-400 font-bold py-16 bg-white border border-slate-100 rounded-2xl shadow-sm">
                No transactions found within the selected date range.
              </div>
            ) : (
              <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 space-y-4 animate-in fade-in duration-200">
                <div className="w-full">
                  <table className="w-full text-left border-collapse table-fixed text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="hidden lg:table-cell px-4 py-4 w-[6%]">S No</th>
                        <th className="hidden md:table-cell px-4 py-4 w-[16%]">Date & Time</th>
                        <th className="px-4 py-4 w-[60%] md:w-[42%] lg:w-[38%] xl:w-[34%]">Narration Details</th>
                        <th className="hidden xl:table-cell px-4 py-4 w-[14%] text-right">Debit (Out)</th>
                        <th className="hidden md:table-cell px-4 py-4 w-[18%] lg:w-[16%] xl:w-[14%] text-right">Credit (In)</th>
                        <th className="px-4 py-4 w-[40%] md:w-[24%] lg:w-[24%] xl:w-[16%] text-right">Running Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700 bg-white">
                      {paginatedLedger().map((row, idx) => {
                        const absoluteIndex = (ledgerPage - 1) * ledgerLimit + idx + 1
                        const changeVal = parseFloat(row.quantity_change)
                        const isNegative = changeVal < 0

                        const debitStr = isNegative ? Math.abs(changeVal).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""
                        const creditStr = !isNegative ? changeVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""

                        return (
                          <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="hidden lg:table-cell px-4 py-3.5 text-slate-400 font-bold whitespace-nowrap">{absoluteIndex}</td>
                            <td className="hidden md:table-cell px-4 py-3.5 tabular-nums text-[10px] text-slate-500 whitespace-nowrap">
                              {formatTimestamp(row.created_at)}
                            </td>
                            <td className="px-4 py-3.5 text-slate-800">
                              <div className="flex flex-wrap items-center gap-2">
                                {row.direction === "in" ? (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 whitespace-nowrap">In</span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 whitespace-nowrap">Out</span>
                                )}
                                <span className="font-bold text-slate-800 truncate" title={row.narration}>{row.narration}</span>
                              </div>
                              <div className="md:hidden text-[10px] text-slate-400 mt-1 truncate">
                                {formatTimestamp(row.created_at)} {debitStr ? `• Out: ${debitStr}` : ""} {creditStr ? `• In: ${creditStr}` : ""}
                              </div>
                              {row.batch_number && (
                                <div className="text-[10px] text-slate-400 mt-0.5 tabular-nums truncate">
                                  FIFO Lot: {row.batch_number} {row.expiry_date && `| Expiry: ${new Date(row.expiry_date.replace(" ", "T")).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`}
                                </div>
                              )}
                            </td>
                            <td className="hidden xl:table-cell px-4 py-3.5 text-right tabular-nums font-bold text-rose-600 whitespace-nowrap">
                              {debitStr ? `${debitStr} ${selectedItem.unit_code || "KG"}` : ""}
                            </td>
                            <td className="hidden md:table-cell px-4 py-3.5 text-right tabular-nums font-bold text-emerald-600 whitespace-nowrap">
                              {creditStr ? `${creditStr} ${selectedItem.unit_code || "KG"}` : ""}
                            </td>
                            <td className="px-4 py-3.5 text-right tabular-nums font-extrabold text-slate-900 whitespace-nowrap">
                              {parseFloat(row.running_balance).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedItem.unit_code || "KG"}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Ledger pagination footer */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
                  <div className="flex items-center gap-2">
                    <span>Show per page:</span>
                    <select
                      value={ledgerLimit}
                      onChange={(e) => {
                        setLedgerLimit(Number(e.target.value))
                        setLedgerPage(1)
                      }}
                      className="border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-4">
                    <span>
                      {(ledgerPage - 1) * ledgerLimit + 1} - {Math.min(ledgerPage * ledgerLimit, getFilteredLedgerLogs().length)} of {getFilteredLedgerLogs().length} Movements
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={ledgerPage === 1}
                        onClick={() => setLedgerPage((p) => p - 1)}
                        className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Prev
                      </button>
                      {Array.from({ length: Math.ceil(getFilteredLedgerLogs().length / ledgerLimit) }).map((_, pageIdx) => {
                        const pNum = pageIdx + 1
                        if (pNum === 1 || pNum === Math.ceil(getFilteredLedgerLogs().length / ledgerLimit) || Math.abs(pNum - ledgerPage) <= 1) {
                          return (
                            <button
                              key={pNum}
                              onClick={() => setLedgerPage(pNum)}
                              className={`px-3 py-1 rounded-lg border tabular-nums ${ledgerPage === pNum
                                  ? "bg-brand-600 border-brand-600 text-white font-extrabold shadow-sm"
                                  : "border-slate-200 hover:bg-slate-50 text-slate-700"
                                } transition-all`}
                            >
                              {pNum}
                            </button>
                          )
                        }
                        if (pNum === 2 || pNum === Math.ceil(getFilteredLedgerLogs().length / ledgerLimit) - 1) {
                          return <span key={pNum} className="text-slate-400 px-1 font-bold">...</span>
                        }
                        return null
                      })}
                      <button
                        disabled={ledgerPage >= Math.ceil(getFilteredLedgerLogs().length / ledgerLimit)}
                        onClick={() => setLedgerPage((p) => p + 1)}
                        className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )
          )}

          {/* STOCK HISTORY */}
          {ledgerSubView === "source-history" && (
            isHistoryLoading ? (
              <div className="flex justify-center items-center py-20 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <Spinner size="lg" />
              </div>
            ) : historyError ? (
              <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-3">
                <p className="text-slate-500 font-medium text-sm">{historyError}</p>
                <button
                  onClick={() => loadPurchaseHistory(selectedItem)}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-95"
                >
                  Retry
                </button>
              </div>
            ) : purchaseHistory.length === 0 ? (
              <div className="text-center text-slate-400 font-bold py-16 bg-white border border-slate-100 rounded-2xl shadow-sm">
                No stock history or receipts found for this item.
              </div>
            ) : (
              <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 space-y-4 animate-in fade-in duration-200 overflow-hidden">
                <div className="w-full">
                  <table className="w-full text-left border-collapse table-fixed text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="hidden lg:table-cell px-4 py-4 lg:w-[6%] xl:w-[5%] whitespace-normal leading-tight">S No</th>
                        <th className="hidden md:table-cell px-4 py-4 md:w-[18%] lg:w-[14%] xl:w-[12%] whitespace-normal leading-tight">Date</th>
                        <th className="px-4 py-4 w-[60%] md:w-[34%] lg:w-[26%] xl:w-[20%] whitespace-normal leading-tight">Supplier / Source</th>
                        <th className="hidden xl:table-cell px-4 py-4 xl:w-[12%] whitespace-normal leading-tight">Source / Ref #</th>
                        <th className="hidden lg:table-cell px-4 py-4 lg:w-[14%] xl:w-[11%] whitespace-normal leading-tight">Invoice #</th>
                        <th className="px-4 py-4 w-[40%] md:w-[22%] lg:w-[17%] xl:w-[13%] text-right whitespace-normal leading-tight">Qty Received</th>
                        <th className="hidden md:table-cell px-4 py-4 md:w-[26%] lg:w-[23%] xl:w-[16%] whitespace-normal leading-tight">Batch</th>
                        <th className="hidden xl:table-cell px-4 py-4 xl:w-[11%] whitespace-normal leading-tight">Expiry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700 bg-white">
                      {purchaseHistory.map((row, idx) => {
                        return (
                          <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="hidden lg:table-cell px-4 py-3.5 text-slate-400 font-bold whitespace-nowrap">{idx + 1}</td>
                            <td className="hidden md:table-cell px-4 py-3.5 tabular-nums">
                              <div className="text-xs text-slate-700">
                                {new Date(row.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {new Date(row.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-slate-800 font-bold">
                              <div className="truncate" title={row.supplier_name || "—"}>{row.supplier_name || "—"}</div>
                              <div className="md:hidden text-[10px] text-slate-400 mt-1 truncate">
                                {new Date(row.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} {row.batch_number ? `• Batch: ${row.batch_number}` : ""}
                              </div>
                              <div className="lg:hidden text-[10px] text-slate-400 truncate">
                                {row.invoice_number ? `Inv: ${row.invoice_number}` : ""} {row.pe_number ? `• Ref: ${row.pe_number}` : ""}
                              </div>
                            </td>
                            <td className="hidden xl:table-cell px-4 py-3.5 tabular-nums text-slate-600">
                              <div className="truncate" title={row.pe_number || ""}>{row.pe_number || "—"}</div>
                            </td>
                            <td className="hidden lg:table-cell px-4 py-3.5 tabular-nums text-slate-500">
                              <div className="truncate" title={row.invoice_number || ""}>{row.invoice_number || "—"}</div>
                            </td>
                            <td className="px-4 py-3.5 text-right tabular-nums font-bold text-emerald-600 whitespace-nowrap">
                              {row.quantity_received.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedItem.unit_code || "KG"}
                            </td>
                            <td className="hidden md:table-cell px-4 py-3.5 tabular-nums text-slate-600 text-[10px]">
                              <div className="truncate" title={row.batch_number || ""}>{row.batch_number || "—"}</div>
                            </td>
                            <td className="hidden xl:table-cell px-4 py-3.5 tabular-nums text-slate-500 whitespace-nowrap">
                              {row.expiry_date ? new Date(row.expiry_date.replace(" ", "T")).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}    </div>
      )}

    </div>
  )
}

export default StockLedger
