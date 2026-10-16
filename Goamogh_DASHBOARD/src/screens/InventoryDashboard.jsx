import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Search,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Package,
  Wheat,
  Layers
} from "lucide-react"
import { getInventoryDashboard } from "@/api/ledgers"
import Spinner from "@/components/ui/Spinner"

function InventoryDashboard() {
  const navigate = useNavigate()

  // Data State
  const [dashboardData, setDashboardData] = useState({
    counts: { raw_material: 0, finished_good: 0 },
    stock_summary: [],
    recent_ledger_entries: []
  })

  // Filter States
  const [itemTypeFilter, setItemTypeFilter] = useState("") // raw_material, finished_good
  const [searchQuery, setSearchQuery] = useState("")
  
  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setError("")
    try {
      const params = {
        recent_ledger_count: 20
      }
      if (itemTypeFilter) params.item_type = itemTypeFilter
      const res = await getInventoryDashboard(params)
      if (!res.ok) {
        throw new Error(`Failed to load dashboard data (Status ${res.status})`)
      }
      const json = await res.json()
      setDashboardData(json.data || {
        counts: { raw_material: 0, finished_good: 0 },
        stock_summary: [],
        recent_ledger_entries: []
      })
    } catch (err) {
      setError(err.message || "Something went wrong fetching the dashboard.")
    } finally {
      setIsLoading(false)
    }
  }, [itemTypeFilter])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  // Filter items in memory
  const getFilteredStock = (list) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return list
    return list.filter((itm) => itm.name.toLowerCase().includes(q))
  }

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
            <span>Inventory</span>
            <span>/</span>
            <span className="text-slate-800">Dashboard</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-brand-600" />
            <span>Inventory Dashboard</span>
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Real-time stock totals summary and live movements history logs.
          </p>
        </div>

        <button
          onClick={loadDashboard}
          disabled={isLoading}
          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 whitespace-nowrap self-start sm:self-auto shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Dashboard</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-error-50 border border-error-100 rounded-2xl text-sm font-semibold text-error-800 flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-error-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{error}</p>
            <button 
              onClick={loadDashboard}
              className="text-xs text-error-800 underline font-bold mt-1.5 block"
            >
              Retry Loading
            </button>
          </div>
        </div>
      )}

      {/* TOP COUNT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Raw Materials Managed</span>
            <span className="text-3xl font-extrabold text-slate-800 mt-1 block">{dashboardData.counts?.raw_material || 0} items</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 border border-amber-100 rounded-2xl">
            <Wheat className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Finished Products Managed</span>
            <span className="text-3xl font-extrabold text-slate-800 mt-1 block">{dashboardData.counts?.finished_good || 0} items</span>
          </div>
          <div className="p-3 bg-brand-50 text-brand-600 border border-brand-100 rounded-2xl">
            <Package className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* FULL WIDTH SUMMARY */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-slate-500" />
            <span>Current Stock Balance Summary</span>
          </h3>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <select
              value={itemTypeFilter}
              onChange={(e) => setItemTypeFilter(e.target.value)}
              className="w-full sm:w-auto sm:min-w-[160px] px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white text-slate-800"
            >
              <option value="">All Types</option>
              <option value="raw_material">Raw Materials</option>
              <option value="finished_good">Finished Goods</option>
            </select>

            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stock..."
                className="w-full sm:w-auto pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-800"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12"><Spinner size="md" /></div>
        ) : getFilteredStock(dashboardData.stock_summary).length === 0 ? (
          <p className="text-slate-400 text-xs font-semibold text-center py-8">No inventory items found.</p>
        ) : (
          <div className="w-full">
            <table className="w-full text-left border-collapse table-fixed text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-2 md:px-4 py-2.5 w-[50%] md:w-[45%] lg:w-[42%]">Item Name</th>
                  <th className="hidden md:table-cell px-2 md:px-4 py-2.5 w-[20%] lg:w-[18%]">Type</th>
                  <th className="px-2 md:px-4 py-2.5 w-[35%] md:w-[25%] lg:w-[25%] text-right">Available Stock</th>
                  <th className="px-2 md:px-4 py-2.5 w-[15%] md:w-[10%] lg:w-[15%] text-center"><span className="hidden md:inline">Drill Down</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {getFilteredStock(dashboardData.stock_summary).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-2 md:px-4 py-3 font-bold text-slate-800">
                      <div className="truncate" title={item.name}>{item.name}</div>
                      <div className="md:hidden text-[10px] text-slate-400 font-normal truncate mt-0.5">
                        {item.item_type === "raw_material" ? "Raw Material" : "Finished Product"}
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-2 md:px-4 py-3 uppercase text-[9px] whitespace-nowrap">
                      {item.item_type === "raw_material" ? (
                        <span className="text-amber-700 bg-amber-50 px-1.5 md:px-2.5 py-0.5 rounded border border-amber-100 font-extrabold text-[10px] md:text-xs whitespace-nowrap">Raw</span>
                      ) : (
                        <span className="text-brand-700 bg-brand-50 px-1.5 md:px-2.5 py-0.5 rounded border border-brand-100 font-extrabold text-[10px] md:text-xs whitespace-nowrap">Finished</span>
                      )}
                    </td>
                    <td className="px-2 md:px-4 py-3 text-right tabular-nums font-extrabold text-slate-900 whitespace-nowrap">
                      {item.stock_qty != null ? `${parseFloat(item.stock_qty).toFixed(2)} ${item.unit_code}` : "—"}
                    </td>
                    <td className="px-2 md:px-4 py-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/stock-ledger?item_id=${item.id}`)}
                        className="p-1 hover:bg-slate-100 text-brand-600 hover:text-brand-800 rounded-lg transition-all"
                        title="Drill down lots"
                        aria-label="Drill down"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default InventoryDashboard
