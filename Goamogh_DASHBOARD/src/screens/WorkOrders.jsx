import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import {
  Plus,
  Search,
  Eye,
  X,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ClipboardList,
  Wheat,
  Package,
  Clock,
  User,
  Hash,
  TrendingUp,
  ShieldAlert
} from "lucide-react"
import {
  getWorkOrders,
  getWorkOrderDetails,
  createWorkOrder,
  updateWorkOrderStatus,
  previewWorkOrderClose
} from "@/api/workOrders"
import { getItems } from "@/api/items"
import Spinner from "@/components/ui/Spinner"
import Pagination from "@/components/ui/Pagination"
import Modal from "@/components/ui/Modal"
import useConfirm from "@/hooks/useConfirm"

// Parse error response helpers
function parseErrorDetail(detail, defaultMsg) {
  if (!detail) return defaultMsg
  if (Array.isArray(detail)) {
    const messages = detail.map((d) => d.msg).filter(Boolean)
    return messages.length > 0 ? messages.join(", ") : defaultMsg
  }
  return typeof detail === "string" ? detail : defaultMsg
}

function WorkOrders() {
  const confirm = useConfirm()
  const [searchParams] = useSearchParams()
  const woId = searchParams.get("wo_id")
  const openedWoIdRef = useRef(null)
  const [workOrdersList, setWorkOrdersList] = useState([])
  const [productsList, setProductsList] = useState([])
  const [rawMaterialsList, setRawMaterialsList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProductId, setSelectedProductId] = useState("")
  const [selectedRawMaterialId, setSelectedRawMaterialId] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [skip, setSkip] = useState(0)
  const limit = 50
  const latestRequestRef = useRef(0)

  // Modal Visibility States
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isCloseFormOpen, setIsCloseFormOpen] = useState(false)
  const [isStockErrorOpen, setIsStockErrorOpen] = useState(false)
  const [stockErrorMessage, setStockErrorMessage] = useState("")
  const [isAuthorizeConfirmOpen, setIsAuthorizeConfirmOpen] = useState(false)

  // Selected Item for detail/action
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Create Form State
  const [createForm, setCreateForm] = useState({
    product_id: "",
    raw_materials: [{ raw_material_id: "", input_qty: "" }]
  })
  const [createErrors, setCreateErrors] = useState({})
  const [isCreating, setIsCreating] = useState(false)

  // Close Form State
  const [closeForm, setCloseForm] = useState({
    output_qty: "",
    wastage_qty: "",
    batch_number: "",
    batch_date: "",
    expiry_date: "",
    machinery_cost: "",
    machinery_cost_tax: "",
    transport_cost: "",
    transport_cost_tax: "",
    worker_cost: "",
    worker_cost_tax: "",
    other_cost: "",
    other_cost_tax: ""
  })
  const [closeErrors, setCloseErrors] = useState({})
  const [isClosing, setIsClosing] = useState(false)

  // Close Form Preview State
  const [closePreview, setClosePreview] = useState(null)
  const [closePreviewError, setClosePreviewError] = useState("")
  const closePreviewRequestIdRef = useRef(0)

  // Fetch baseline dropdown options (products & raw materials) and work orders
  const fetchBaselineData = useCallback(async () => {
    try {
      const itemsRes = await getItems()
      if (itemsRes.ok) {
        const itemsJson = await itemsRes.json()
        const data = itemsJson.data || []
        setProductsList(data.filter((i) => i.item_type === "finished_good" && i.is_active === true))
        setRawMaterialsList(data.filter((i) => i.item_type === "raw_material" && i.is_active === true))
      }
    } catch (err) {
      console.error("Failed to load baseline filter data:", err)
    }
  }, [])

  const fetchWorkOrdersList = useCallback(async () => {
    const requestId = ++latestRequestRef.current
    setIsLoading(true)
    setError("")
    try {
      const params = {}
      if (selectedProductId) params.product_id = selectedProductId
      if (selectedRawMaterialId) params.raw_material_id = selectedRawMaterialId

      const res = await getWorkOrders(params)
      if (requestId !== latestRequestRef.current) return
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || `Failed to fetch work orders list (Status ${res.status})`)
      }
      const json = await res.json()
      if (requestId !== latestRequestRef.current) return
      setWorkOrdersList(json.data || [])
    } catch (err) {
      if (requestId !== latestRequestRef.current) return
      setError(err.message || "An error occurred while fetching work orders.")
    } finally {
      if (requestId === latestRequestRef.current) {
        setIsLoading(false)
      }
    }
  }, [selectedProductId, selectedRawMaterialId])

  // Get specific work order details
  const handleViewDetails = async (woIdVal) => {
    setIsDetailLoading(true)
    setIsDetailOpen(true)
    try {
      const res = await getWorkOrderDetails(woIdVal)
      if (!res.ok) {
        throw new Error(`Failed to load work order details (Status ${res.status})`)
      }
      const json = await res.json()
      setSelectedWorkOrder(json.data)
    } catch (err) {
      alert(err.message || "Could not retrieve details.")
      setIsDetailOpen(false)
    } finally {
      setIsDetailLoading(false)
    }
  }

  useEffect(() => {
    fetchBaselineData()
  }, [fetchBaselineData])

  useEffect(() => {
    fetchWorkOrdersList()
  }, [fetchWorkOrdersList])

  // Reset skip when filters or search change
  useEffect(() => {
    setSkip(0)
  }, [searchQuery, selectedProductId, selectedRawMaterialId, selectedStatus])

  useEffect(() => {
    if (woId && woId !== openedWoIdRef.current) {
      openedWoIdRef.current = woId
      handleViewDetails(woId)
    }
  }, [woId])

  // Handle Authorize Work Order
  const handleAuthorizeWorkOrder = async (woId) => {
    setActionLoading(true)
    try {
      const res = await updateWorkOrderStatus(woId, "authorize")
      if (res.status === 409) {
        const errJson = await res.json()
        setStockErrorMessage(errJson.detail)
        setIsStockErrorOpen(true)
        setIsAuthorizeConfirmOpen(false)
        return
      }
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(parseErrorDetail(errJson.detail, "Failed to authorize work order"))
      }

      const json = await res.json()
      setSelectedWorkOrder(json.data)
      setIsAuthorizeConfirmOpen(false)
      // Refresh list
      fetchWorkOrdersList()
    } catch (err) {
      alert(err.message || "An error occurred while authorizing the work order.")
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Start Work Order
  const handleStartWorkOrder = async (woId) => {
    const ok = await confirm({
      title: "Start work order?",
      confirmLabel: "Start production",
    })
    if (!ok) return

    setActionLoading(true)
    try {
      const res = await updateWorkOrderStatus(woId, "start")
      if (res.status === 409) {
        const errJson = await res.json()
        setStockErrorMessage(errJson.detail)
        setIsStockErrorOpen(true)
        return
      }
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(parseErrorDetail(errJson.detail, "Failed to start production"))
      }

      const json = await res.json()
      setSelectedWorkOrder(json.data)
      // Refresh list
      fetchWorkOrdersList()
    } catch (err) {
      alert(err.message || "An error occurred while starting the work order.")
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Cancel Work Order
  const handleCancelWorkOrder = async (woId) => {
    const ok = await confirm({
      title: "Cancel work order?",
      message: "Are you sure you want to cancel this work order? This action cannot be undone.",
      confirmLabel: "Cancel work order",
      tone: "danger",
    })
    if (!ok) return
    setActionLoading(true)
    try {
      const res = await updateWorkOrderStatus(woId, "cancel")
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(parseErrorDetail(errJson.detail, "Failed to cancel work order"))
      }
      const json = await res.json()
      setSelectedWorkOrder(json.data)
      // Refresh list
      fetchWorkOrdersList()
    } catch (err) {
      alert(err.message || "An error occurred while cancelling the work order.")
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Close Form Modal Opening
  const handleOpenCloseForm = () => {
    if (!selectedWorkOrder) return
    const now = new Date()
    const expiry = new Date()
    expiry.setFullYear(now.getFullYear() + 1)

    // Format YYYY-MM-DDTHH:MM for datetime-local
    const formatDateTimeLocal = (date) => {
      const pad = (n) => String(n).padStart(2, "0")
      const yyyy = date.getFullYear()
      const mm = pad(date.getMonth() + 1)
      const dd = pad(date.getDate())
      const hh = pad(date.getHours())
      const min = pad(date.getMinutes())
      return `${yyyy}-${mm}-${dd}T${hh}:${min}`
    }

    setCloseForm({
      output_qty: "",
      wastage_qty: "",
      batch_number: selectedWorkOrder.work_order_number || "",
      batch_date: formatDateTimeLocal(now),
      expiry_date: formatDateTimeLocal(expiry),
      machinery_cost: "",
      machinery_cost_tax: "",
      transport_cost: "",
      transport_cost_tax: "",
      worker_cost: "",
      worker_cost_tax: "",
      other_cost: "",
      other_cost_tax: ""
    })
    setClosePreview(null)
    setClosePreviewError("")
    setCloseErrors({})
    setIsCloseFormOpen(true)
  }

  const handleOutputQtyChange = (val) => {
    setCloseForm((prev) => ({
      ...prev,
      output_qty: val
    }))

    // Clear specific errors if typed
    setCloseErrors((prev) => {
      const newErrs = { ...prev }
      delete newErrs.output_qty
      delete newErrs.wastage_qty
      delete newErrs.yieldReconciliation
      return newErrs
    })
  }

  // Effect to preview close work order calculations
  useEffect(() => {
    if (!isCloseFormOpen || !selectedWorkOrder || closeForm.output_qty === "") {
      setClosePreview(null)
      setClosePreviewError("")
      return
    }

    const reqId = ++closePreviewRequestIdRef.current

    const timer = setTimeout(async () => {
      try {
        const body = {
          output_qty: Number(closeForm.output_qty),
          machinery_cost: closeForm.machinery_cost === "" ? 0 : Number(closeForm.machinery_cost),
          machinery_cost_tax: closeForm.machinery_cost_tax === "" ? 0 : Number(closeForm.machinery_cost_tax),
          transport_cost: closeForm.transport_cost === "" ? 0 : Number(closeForm.transport_cost),
          transport_cost_tax: closeForm.transport_cost_tax === "" ? 0 : Number(closeForm.transport_cost_tax),
          worker_cost: closeForm.worker_cost === "" ? 0 : Number(closeForm.worker_cost),
          worker_cost_tax: closeForm.worker_cost_tax === "" ? 0 : Number(closeForm.worker_cost_tax),
          other_cost: closeForm.other_cost === "" ? 0 : Number(closeForm.other_cost),
          other_cost_tax: closeForm.other_cost_tax === "" ? 0 : Number(closeForm.other_cost_tax)
        }

        const res = await previewWorkOrderClose(selectedWorkOrder.id, body)
        if (reqId !== closePreviewRequestIdRef.current) return
        if (!res.ok) {
          setClosePreviewError("Couldn't calculate preview")
          setClosePreview(null)
        } else {
          const json = await res.json()
          if (reqId !== closePreviewRequestIdRef.current) return
          setClosePreview(json.data)
          setClosePreviewError("")
        }
      } catch {
        if (reqId !== closePreviewRequestIdRef.current) return
        setClosePreviewError("Couldn't calculate preview")
        setClosePreview(null)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [
    isCloseFormOpen,
    selectedWorkOrder,
    closeForm.output_qty,
    closeForm.machinery_cost,
    closeForm.machinery_cost_tax,
    closeForm.transport_cost,
    closeForm.transport_cost_tax,
    closeForm.worker_cost,
    closeForm.worker_cost_tax,
    closeForm.other_cost,
    closeForm.other_cost_tax
  ])

  // Submit Close Work Order
  const handleCloseSubmit = async (e) => {
    e.preventDefault()
    setCloseErrors({})

    const outputNum = parseFloat(closeForm.output_qty)
    const machineryCostNum = closeForm.machinery_cost === "" ? 0 : parseFloat(closeForm.machinery_cost)
    const machineryCostTaxNum = closeForm.machinery_cost_tax === "" ? 0 : parseFloat(closeForm.machinery_cost_tax)
    const transportCostNum = closeForm.transport_cost === "" ? 0 : parseFloat(closeForm.transport_cost)
    const transportCostTaxNum = closeForm.transport_cost_tax === "" ? 0 : parseFloat(closeForm.transport_cost_tax)
    const workerCostNum = closeForm.worker_cost === "" ? 0 : parseFloat(closeForm.worker_cost)
    const workerCostTaxNum = closeForm.worker_cost_tax === "" ? 0 : parseFloat(closeForm.worker_cost_tax)
    const otherCostNum = closeForm.other_cost === "" ? 0 : parseFloat(closeForm.other_cost)
    const otherCostTaxNum = closeForm.other_cost_tax === "" ? 0 : parseFloat(closeForm.other_cost_tax)

    const errors = {}
    if (isNaN(outputNum) || outputNum < 0) {
      errors.output_qty = "Please enter a valid positive output quantity"
    }
    if (isNaN(machineryCostNum) || machineryCostNum < 0) {
      errors.machinery_cost = "Please enter a valid machinery cost (>= 0)"
    }
    if (isNaN(machineryCostTaxNum) || machineryCostTaxNum < 0) {
      errors.machinery_cost_tax = "Please enter a valid machinery cost tax (>= 0)"
    }
    if (isNaN(transportCostNum) || transportCostNum < 0) {
      errors.transport_cost = "Please enter a valid transport cost (>= 0)"
    }
    if (isNaN(transportCostTaxNum) || transportCostTaxNum < 0) {
      errors.transport_cost_tax = "Please enter a valid transport cost tax (>= 0)"
    }
    if (isNaN(workerCostNum) || workerCostNum < 0) {
      errors.worker_cost = "Please enter a valid worker/labor cost (>= 0)"
    }
    if (isNaN(workerCostTaxNum) || workerCostTaxNum < 0) {
      errors.worker_cost_tax = "Please enter a valid worker/labor cost tax (>= 0)"
    }
    if (isNaN(otherCostNum) || otherCostNum < 0) {
      errors.other_cost = "Please enter a valid overhead cost (>= 0)"
    }
    if (isNaN(otherCostTaxNum) || otherCostTaxNum < 0) {
      errors.other_cost_tax = "Please enter a valid overhead cost tax (>= 0)"
    }

    if (Object.keys(errors).length > 0) {
      setCloseErrors(errors)
      return
    }

    if (!closePreview || closePreview.yield_valid !== true) {
      setCloseErrors({
        yieldReconciliation: closePreview?.yield_percent != null
          ? `Yield ${closePreview.yield_percent}% is outside the acceptable range.`
          : "Yield is outside the acceptable range."
      })
      return
    }

    const ok = await confirm({
      title: "Close work order and record output?",
      confirmLabel: "Close work order",
    })
    if (!ok) return

    setIsClosing(true)
    try {
      // Backend expects standard ISO string format: YYYY-MM-DDTHH:MM:SSZ
      const payload = {
        output_qty: outputNum,
        wastage_qty: closePreview.wastage_qty,
        batch_number: closeForm.batch_number.trim() || null,
        batch_date: closeForm.batch_date ? new Date(closeForm.batch_date).toISOString() : null,
        expiry_date: closeForm.expiry_date ? new Date(closeForm.expiry_date).toISOString() : null,
        machinery_cost: machineryCostNum,
        machinery_cost_tax: machineryCostTaxNum,
        transport_cost: transportCostNum,
        transport_cost_tax: transportCostTaxNum,
        worker_cost: workerCostNum,
        worker_cost_tax: workerCostTaxNum,
        other_cost: otherCostNum,
        other_cost_tax: otherCostTaxNum
      }

      const res = await updateWorkOrderStatus(selectedWorkOrder.id, "close", payload)
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(parseErrorDetail(errJson.detail, "Failed to close work order"))
      }

      const json = await res.json()
      setSelectedWorkOrder(json.data)
      setIsCloseFormOpen(false)
      // Refresh list
      fetchWorkOrdersList()
    } catch (err) {
      setCloseErrors({ api: err.message || "Failed to complete production entry." })
    } finally {
      setIsClosing(false)
    }
  }

  // Create Form Changes
  const handleCreateChange = (field, val) => {
    setCreateForm((prev) => ({ ...prev, [field]: val }))
    if (createErrors[field]) {
      setCreateErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  const handleAddRawMaterialRow = () => {
    setCreateForm((prev) => ({
      ...prev,
      raw_materials: [...prev.raw_materials, { raw_material_id: "", input_qty: "" }]
    }))
  }

  const handleRemoveRawMaterialRow = (index) => {
    setCreateForm((prev) => ({
      ...prev,
      raw_materials: prev.raw_materials.filter((_, idx) => idx !== index)
    }))
  }

  const handleRawMaterialRowChange = (index, field, val) => {
    setCreateForm((prev) => {
      const updated = [...prev.raw_materials]
      updated[index] = { ...updated[index], [field]: val }
      return { ...prev, raw_materials: updated }
    })
    setCreateErrors((prev) => ({ ...prev, raw_materials: null }))
  }

  // Submit Create Work Order
  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setCreateErrors({})

    const errors = {}
    if (!createForm.product_id) {
      errors.product_id = "Please select a target finished product"
    }

    const validRawMaterials = []
    if (!createForm.raw_materials || createForm.raw_materials.length === 0) {
      errors.raw_materials = "Please add at least one consumed raw material"
    } else {
      for (let i = 0; i < createForm.raw_materials.length; i++) {
        const row = createForm.raw_materials[i]
        const displayName = `Row #${i + 1}`
        if (!row.raw_material_id) {
          errors.raw_materials = `Please select a raw material for ${displayName}`
          break
        }
        const qty = parseFloat(row.input_qty)
        if (isNaN(qty) || qty <= 0) {
          errors.raw_materials = `Quantity for ${displayName} must be a positive number greater than 0`
          break
        }
        validRawMaterials.push({
          raw_material_id: row.raw_material_id,
          input_qty: qty
        })
      }
    }

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors)
      return
    }

    const ok = await confirm({
      title: "Create work order?",
      confirmLabel: "Create work order",
    })
    if (!ok) return

    setIsCreating(true)
    try {
      const res = await createWorkOrder({
        product_id: createForm.product_id,
        raw_materials: validRawMaterials
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(parseErrorDetail(errJson.detail, "Failed to create work order"))
      }

      setIsCreateOpen(false)
      setCreateForm({
        product_id: "",
        raw_materials: [{ raw_material_id: "", input_qty: "" }]
      })
      fetchWorkOrdersList()
    } catch (err) {
      setCreateErrors({ api: err.message || "Failed to create work order." })
    } finally {
      setIsCreating(false)
    }
  }

  // Client-side text and status filter
  const filteredWorkOrders = useMemo(() => {
    const searchLower = searchQuery.toLowerCase().trim()
    return workOrdersList.filter((wo) => {
      if (selectedStatus && wo.status !== selectedStatus) return false
      if (!searchLower) return true

      const woNumMatch = wo.work_order_number?.toLowerCase().includes(searchLower)
      const prodNameMatch = wo.product_name?.toLowerCase().includes(searchLower)
      const rmNameMatch = wo.raw_material_name?.toLowerCase().includes(searchLower)

      return woNumMatch || prodNameMatch || rmNameMatch
    })
  }, [workOrdersList, selectedStatus, searchQuery])
  const pageRows = filteredWorkOrders.slice(skip, skip + limit)

  // Format status badges
  const renderStatusBadge = (status) => {
    switch (status) {
      case "open":
        return (
          <span title="Open" className="inline-flex items-center px-1.5 md:px-2.5 py-1 rounded-full text-xs font-semibold border bg-yellow-50 text-yellow-700 border-yellow-200 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 md:mr-1 text-yellow-500" />
            <span className="sr-only md:hidden">Open</span>
            <span className="hidden md:inline">Open</span>
          </span>
        )
      case "confirmed":
        return (
          <span title="Confirmed" className="inline-flex items-center px-1.5 md:px-2.5 py-1 rounded-full text-xs font-semibold border bg-indigo-50 text-indigo-700 border-indigo-200 whitespace-nowrap">
            <CheckCircle className="w-3.5 h-3.5 md:mr-1 text-indigo-500" />
            <span className="sr-only md:hidden">Confirmed</span>
            <span className="hidden md:inline">Confirmed</span>
          </span>
        )
      case "inprogress":
        return (
          <span title="In Progress" className="inline-flex items-center px-1.5 md:px-2.5 py-1 rounded-full text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-200 whitespace-nowrap">
            <Play className="w-3.5 h-3.5 md:mr-1 text-blue-500 fill-blue-500" />
            <span className="sr-only md:hidden">In Progress</span>
            <span className="hidden md:inline">In Progress</span>
          </span>
        )
      case "closed":
        return (
          <span title="Closed" className="inline-flex items-center px-1.5 md:px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 whitespace-nowrap">
            <CheckCircle className="w-3.5 h-3.5 md:mr-1 text-emerald-600" />
            <span className="sr-only md:hidden">Closed</span>
            <span className="hidden md:inline">Closed</span>
          </span>
        )
      case "cancelled":
        return (
          <span title="Cancelled" className="inline-flex items-center px-1.5 md:px-2.5 py-1 rounded-full text-xs font-semibold border bg-rose-50 text-rose-700 border-rose-200 whitespace-nowrap">
            <XCircle className="w-3.5 h-3.5 md:mr-1 text-rose-500" />
            <span className="sr-only md:hidden">Cancelled</span>
            <span className="hidden md:inline">Cancelled</span>
          </span>
        )
      default:
        return (
          <span title={status} className="inline-flex items-center px-1.5 md:px-2.5 py-1 rounded-full text-xs font-semibold border bg-slate-100 text-slate-800 border-slate-200 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-current md:hidden" aria-hidden="true" />
            <span className="sr-only md:hidden">{status}</span>
            <span className="hidden md:inline">{status}</span>
          </span>
        )
    }
  }

  const inputUnitOf = (wo) => {
    const u = (wo?.raw_materials || []).map(r => r.unit_code)
    return u.length > 0 && u.every(x => x === u[0]) ? u[0] : ""
  }

  const isYieldMismatch = closePreview ? closePreview.yield_valid === false : false

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in fade-in duration-200">

      {/* Title Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Work Orders</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage production conversion, FIFO warehouse depletion, and batch compliance.</p>
        </div>

        <button
          onClick={() => {
            setCreateForm({
              product_id: "",
              raw_materials: [{ raw_material_id: "", input_qty: "" }]
            })
            setCreateErrors({})
            setIsCreateOpen(true)
          }}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center gap-2 whitespace-nowrap self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Work Order</span>
        </button>
      </div>

      {/* Toolbar Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">

        {/* Text search */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search number or names..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Product dropdown filter */}
        <div className="relative">
          <select
            value={selectedProductId}
            onChange={(e) => {
              setSelectedProductId(e.target.value)
              setSkip(0)
            }}
            className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white text-slate-700 font-medium transition-all"
          >
            <option value="">All Finished Products</option>
            {productsList.map((prod) => (
              <option key={prod.id} value={prod.id}>
                {prod.name}
              </option>
            ))}
          </select>
        </div>

        {/* Raw Material dropdown filter */}
        <div className="relative">
          <select
            value={selectedRawMaterialId}
            onChange={(e) => {
              setSelectedRawMaterialId(e.target.value)
              setSkip(0)
            }}
            className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white text-slate-700 font-medium transition-all"
          >
            <option value="">All Consumed Raw Materials</option>
            {rawMaterialsList.map((rm) => (
              <option key={rm.id} value={rm.id}>
                {rm.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status dropdown filter */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value)
              setSkip(0)
            }}
            className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white text-slate-700 font-medium transition-all"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="confirmed">Confirmed</option>
            <option value="inprogress">In Progress</option>
            <option value="closed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
          <AlertTriangle className="w-12 h-12 text-error-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">Failed to load Work Orders</h3>
          <p className="text-sm font-semibold text-slate-500 mb-4">{error}</p>
          <button
            onClick={fetchWorkOrdersList}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95"
          >
            Retry Fetching
          </button>
        </div>
      ) : filteredWorkOrders.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-500 font-semibold shadow-sm">
          No work orders found.
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden w-full">
          <div className="w-full">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-3 py-3.5 w-[56%] md:w-[28%] lg:w-[20%] xl:w-[18%]">Work Order Number</th>
                  <th className="px-3 py-3.5 hidden md:table-cell md:w-[28%] lg:w-[20%] xl:w-[18%]">Finished Product</th>
                  <th className="px-3 py-3.5 hidden xl:table-cell xl:w-[18%]">Consumed Raw Material</th>
                  <th className="px-3 py-3.5 text-right hidden lg:table-cell lg:w-[12%] xl:w-[10%]">Input Qty</th>
                  <th className="px-3 py-3.5 w-[24%] md:w-[22%] lg:w-[16%] xl:w-[12%]"><span className="hidden md:inline">Status</span></th>
                  <th className="px-3 py-3.5 hidden lg:table-cell lg:w-[18%] xl:w-[13%]">Created Date</th>
                  <th className="pl-2 pr-5 py-3.5 w-[20%] md:w-[22%] lg:w-[14%] xl:w-[11%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {pageRows.map((wo) => (
                  <tr key={wo.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3 py-3 font-bold text-slate-900 tracking-tight tabular-nums text-[11px] min-w-0">
                      <div className="truncate" title={wo.work_order_number}>{wo.work_order_number}</div>
                      <div className="text-[10px] text-slate-400 font-normal truncate md:hidden" title={wo.product_name}>
                        {wo.product_name || "—"}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-semibold text-slate-900 min-w-0 truncate hidden md:table-cell" title={wo.product_name}>{wo.product_name || "—"}</td>
                    <td className="px-3 py-3 font-medium text-slate-600 min-w-0 truncate hidden xl:table-cell" title={wo.raw_materials && wo.raw_materials.length > 0 ? wo.raw_materials.map(rm => rm.raw_material_name || rm.raw_material?.name || `Material ${rm.raw_material_id}`).join(", ") : wo.raw_material_name}>
                      {wo.raw_materials && wo.raw_materials.length > 0
                        ? wo.raw_materials.map(rm => rm.raw_material_name || rm.raw_material?.name || `Material ${rm.raw_material_id}`).join(", ")
                        : wo.raw_material_name || "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-extrabold text-slate-900 min-w-0 whitespace-nowrap tabular-nums hidden lg:table-cell">{wo.total_input_qty != null ? `${parseFloat(wo.total_input_qty).toFixed(2)}${inputUnitOf(wo) ? ` ${inputUnitOf(wo)}` : ""}` : "—"}</td>
                    <td className="px-3 py-3 whitespace-nowrap min-w-0">{renderStatusBadge(wo.status)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-slate-500 min-w-0 text-xs font-normal tabular-nums hidden lg:table-cell">
                      {wo.created_at ? (
                        <div className="leading-tight">
                          <div>{new Date(wo.created_at).toLocaleDateString()}</div>
                          <div className="text-[10px] text-slate-400">{new Date(wo.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="pl-2 pr-5 py-3 whitespace-nowrap text-right min-w-0">
                      <button
                        onClick={() => handleViewDetails(wo.id)}
                        aria-label="View work order"
                        className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 transition-all hover:bg-white bg-slate-50 active:scale-95"
                      >
                        <Eye className="w-3 h-3" />
                        <span className="hidden md:inline">View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination skip={skip} limit={limit} total={filteredWorkOrders.length} onChange={setSkip} />
        </div>
      )}

      {/* CREATE WORK ORDER MODAL */}
      {isCreateOpen && (
        <Modal onClose={() => setIsCreateOpen(false)}>
          <div className="bg-white border border-slate-100 rounded-2xl max-w-lg w-full shadow-2xl p-6 relative flex flex-col my-4 md:my-8 max-h-[90vh] gap-4 overflow-hidden">

            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-brand-600" />
                <span>Create Production Work Order</span>
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createErrors.api && (
              <div className="p-3.5 bg-error-50 border border-error-100 rounded-xl text-xs font-semibold text-error-800 flex items-start gap-2.5 shrink-0">
                <AlertTriangle className="w-4 h-4 text-error-500 shrink-0 mt-0.5" />
                <span>{createErrors.api}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 py-1">
                {/* Product Select */}
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Target Finished Product <span className="text-error-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <select
                      value={createForm.product_id}
                      onChange={(e) => handleCreateChange("product_id", e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white text-slate-700 font-medium transition-all"
                    >
                      <option value="">Select target product...</option>
                      {productsList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {createErrors.product_id && (
                    <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.product_id}</p>
                  )}
                </div>

                {/* Consumed Raw Materials List */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Consumed Raw Materials <span className="text-error-500 font-bold">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddRawMaterialRow}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Raw Material</span>
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                    {createForm.raw_materials.map((row, index) => {
                      const selectedRm = rawMaterialsList.find((r) => r.id === row.raw_material_id)
                      const availableStock = selectedRm ? (selectedRm.stock_qty ?? selectedRm.live_stock_qty ?? null) : null
                      const unitCode = selectedRm?.unit_code
                      const requestedQty = parseFloat(row.input_qty || 0)
                      const isStockExceeded = availableStock != null && requestedQty > Number(availableStock)

                      return (
                        <div key={index} className="flex flex-col gap-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 relative">
                          <div className="flex gap-2 items-start">
                            {/* Raw Material Select */}
                            <div className="flex-1 min-w-0">
                              <select
                                value={row.raw_material_id}
                                onChange={(e) => handleRawMaterialRowChange(index, "raw_material_id", e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 hover:border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white text-slate-700 font-medium transition-all"
                              >
                                <option value="">Select raw material...</option>
                                {rawMaterialsList.map((rm) => {
                                  const stockVal = rm.stock_qty ?? rm.live_stock_qty ?? null
                                  const uom = rm.unit_code
                                  return (
                                    <option key={rm.id} value={rm.id}>
                                      {rm.name} {stockVal != null ? `— Stock: ${stockVal} ${uom}` : ""}
                                    </option>
                                  )
                                })}
                              </select>
                            </div>

                            {/* Input Qty */}
                            <div className="w-[130px] shrink-0">
                              <input
                                type="number"
                                step="0.01"
                                value={row.input_qty}
                                onChange={(e) => handleRawMaterialRowChange(index, "input_qty", e.target.value)}
                                placeholder={`Qty (${unitCode})`}
                                className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 transition-all ${isStockExceeded ? "border-error-100 focus:ring-error-500 bg-error-50/40 text-error-800 font-bold" : "border-slate-200 hover:border-slate-300 focus:ring-brand-500 bg-white"
                                  }`}
                              />
                            </div>

                            {/* Remove Row Button */}
                            {createForm.raw_materials.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveRawMaterialRow(index)}
                                className="p-1.5 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg text-rose-500 hover:text-rose-700 transition-all shrink-0 mt-0.5"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Live Stock Info & Warning Badge */}
                          {selectedRm && (
                            <div className="flex items-center justify-between text-[11px] font-semibold px-1 pt-0.5">
                              <span className="text-slate-500">
                                Live Stock: <span className="tabular-nums font-bold text-slate-700">{availableStock != null ? `${availableStock} ${unitCode}` : "—"}</span>
                              </span>
                              {isStockExceeded && (
                                <span className="text-error-800 font-bold bg-error-50 border border-error-100 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                                  ⚠️ Exceeds stock ({availableStock} {unitCode})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {createErrors.raw_materials && (
                    <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.raw_materials}</p>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-100 mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full sm:w-auto px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-md shadow-brand-500/10 flex items-center justify-center min-w-[120px]"
                >
                  {isCreating ? <Spinner size="sm" /> : "Create Order"}
                </button>
              </div>
            </form>

          </div>
        </Modal>
      )}

      {/* DETAIL VIEW MODAL */}
      {isDetailOpen && (
        <Modal onClose={() => setIsDetailOpen(false)}>
          <div className="bg-white border border-slate-100 rounded-2xl max-w-2xl w-full shadow-2xl p-6 relative flex flex-col my-4 md:my-8 max-h-[90vh] gap-4 overflow-hidden">

            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <ClipboardList className="w-6 h-6 text-brand-600" />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Work Order Details
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isDetailLoading || !selectedWorkOrder ? (
              <div className="py-12 flex items-center justify-center flex-1">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="flex flex-col flex-1 overflow-hidden min-h-0">

                {/* Scrollable Body */}
                <div className="overflow-y-auto pr-2 flex-1 space-y-5 py-1">

                  {/* Status Progress Bar */}
                  <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 shrink-0">
                    <div className="flex items-center justify-between relative max-w-md mx-auto my-2">
                      {/* Connection Lines */}
                      <div className="absolute left-[14px] right-[14px] top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-10" />
                      <div
                        className="absolute left-[14px] top-1/2 -translate-y-1/2 h-0.5 bg-brand-500 transition-all duration-300 -z-10"
                        style={{
                          width: selectedWorkOrder.status === "open" ? "0%"
                            : selectedWorkOrder.status === "confirmed" ? "33.3%"
                              : selectedWorkOrder.status === "inprogress" ? "66.6%"
                                : "100%"
                        }}
                      />

                      {/* Step 1: Open */}
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${selectedWorkOrder.status === "open"
                          ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                          : ["confirmed", "inprogress", "closed"].includes(selectedWorkOrder.status)
                            ? "bg-brand-100 text-brand-700"
                            : "bg-slate-200 text-slate-500"
                          }`}>
                          1
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 mt-1">Open</span>
                      </div>

                      {/* Step 2: Confirmed */}
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${selectedWorkOrder.status === "confirmed"
                          ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                          : ["inprogress", "closed"].includes(selectedWorkOrder.status)
                            ? "bg-brand-100 text-brand-700"
                            : "bg-slate-200 text-slate-500"
                          }`}>
                          2
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 mt-1">Confirmed</span>
                      </div>

                      {/* Step 3: In Progress */}
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${selectedWorkOrder.status === "inprogress"
                          ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                          : selectedWorkOrder.status === "closed"
                            ? "bg-brand-100 text-brand-700"
                            : "bg-slate-200 text-slate-500"
                          }`}>
                          3
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 mt-1">In Progress</span>
                      </div>

                      {/* Step 4: Closed / Completed */}
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${selectedWorkOrder.status === "closed"
                          ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                          : "bg-slate-200 text-slate-500"
                          }`}>
                          4
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 mt-1">Completed</span>
                      </div>
                    </div>
                  </div>

                  {/* Status and Work Order Number banner */}
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Work Order No</span>
                      <h4 className="text-base font-extrabold text-slate-900 tracking-tight tabular-nums">{selectedWorkOrder.work_order_number}</h4>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</span>
                      {renderStatusBadge(selectedWorkOrder.status)}
                    </div>
                  </div>

                  {/* Production Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Finished Product Card */}
                    <div className="p-3 border border-slate-100 rounded-xl flex items-start gap-2.5 bg-white">
                      <div className="p-2 bg-brand-50 border border-brand-100 rounded-lg text-brand-700 shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target finished good</span>
                        <p className="text-xs font-bold text-slate-800 mt-0.5 truncate" title={selectedWorkOrder.product_name}>{selectedWorkOrder.product_name}</p>
                      </div>
                    </div>

                    {/* Consumed Raw Material Card */}
                    <div className="p-3 border border-slate-100 rounded-xl flex items-start gap-2.5 bg-white">
                      <div className="p-2 bg-amber-50 border border-amber-100 rounded-lg text-amber-700 shrink-0">
                        <Wheat className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Consumed raw materials</span>
                        {selectedWorkOrder.raw_materials && selectedWorkOrder.raw_materials.length > 0 ? (
                          <div className="space-y-1 mt-1 max-h-[120px] overflow-y-auto custom-scrollbar">
                            {selectedWorkOrder.raw_materials.map((rm, idx) => {
                              const inputVal = rm.input_qty != null ? parseFloat(rm.input_qty) : null
                              const liveVal = rm.live_stock_qty != null ? parseFloat(rm.live_stock_qty) : null
                              const unit = rm.unit_code
                              const hasEnoughStock = liveVal == null || inputVal == null || liveVal >= inputVal

                              return (
                                <div key={idx} className="flex justify-between items-center text-xs font-bold text-slate-800 gap-4 py-0.5">
                                  <span className="truncate" title={rm.raw_material_name || rm.raw_material?.name}>
                                    {rm.raw_material_name || rm.raw_material?.name || `Material ${rm.raw_material_id}`}
                                  </span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-slate-700 tabular-nums">{rm.input_qty != null ? `${parseFloat(rm.input_qty).toFixed(2)} ${unit}` : "—"}</span>
                                    {liveVal != null && (
                                      <span
                                        className={`text-[10px] px-1.5 py-0.5 rounded tabular-nums font-bold border ${hasEnoughStock
                                          ? "bg-success-50 text-success-700 border-success-100"
                                          : "bg-error-50 text-error-800 border-error-100"
                                          }`}
                                        title={`Live warehouse stock: ${liveVal.toFixed(2)} ${unit}`}
                                      >
                                        Stock: {liveVal.toFixed(2)} {unit}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-xs font-bold text-slate-800 mt-0.5 truncate" title={selectedWorkOrder.raw_material_name}>
                            {selectedWorkOrder.raw_material_name || "—"} ({selectedWorkOrder.total_input_qty != null ? `${parseFloat(selectedWorkOrder.total_input_qty).toFixed(2)}${inputUnitOf(selectedWorkOrder) ? ` ${inputUnitOf(selectedWorkOrder)}` : ""}` : "—"})
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Details Metrics grid */}
                  <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
                    <div className="bg-slate-50 border-b border-slate-100 px-4 py-2.5 flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Quantity Reconciliation</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 text-xs">
                      <div className="p-3">
                        <span className="text-[10px] font-bold text-slate-400">Input Qty</span>
                        <p className="text-sm font-extrabold text-slate-800 mt-0.5">{selectedWorkOrder.total_input_qty != null ? `${parseFloat(selectedWorkOrder.total_input_qty).toFixed(2)}${inputUnitOf(selectedWorkOrder) ? ` ${inputUnitOf(selectedWorkOrder)}` : ""}` : "—"}</p>
                      </div>
                      <div className="p-3">
                        <span className="text-[10px] font-bold text-slate-400">Output Qty</span>
                        <p className="text-sm font-extrabold text-brand-700 mt-0.5">{selectedWorkOrder.output_qty != null ? `${parseFloat(selectedWorkOrder.output_qty).toFixed(2)}${selectedWorkOrder.unit_code ? ` ${selectedWorkOrder.unit_code}` : ""}` : "—"}</p>
                      </div>
                      <div className="p-3">
                        <span className="text-[10px] font-bold text-slate-400">Wastage Qty</span>
                        <p className="text-sm font-extrabold text-error-800 mt-0.5">{selectedWorkOrder.wastage_qty != null ? `${parseFloat(selectedWorkOrder.wastage_qty).toFixed(2)}${selectedWorkOrder.unit_code ? ` ${selectedWorkOrder.unit_code}` : ""}` : "—"}</p>
                      </div>
                      <div className="p-3">
                        <span className="text-[10px] font-bold text-slate-400">Remaining Stock</span>
                        <p className="text-sm font-extrabold text-indigo-600 mt-0.5">{selectedWorkOrder.remaining_stock_qty != null ? parseFloat(selectedWorkOrder.remaining_stock_qty).toFixed(2) : "—"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Batch and Compliance Compliance (Visible if closed) */}
                  {selectedWorkOrder.status === "closed" && (() => {
                    const matCost = selectedWorkOrder.material_cost ?? selectedWorkOrder.costing?.material_cost
                    const matTax = selectedWorkOrder.material_cost_tax ?? selectedWorkOrder.costing?.material_cost_tax
                    const machCost = selectedWorkOrder.machinery_cost ?? selectedWorkOrder.costing?.machinery_cost
                    const machTax = selectedWorkOrder.machinery_cost_tax ?? selectedWorkOrder.costing?.machinery_cost_tax
                    const transCost = selectedWorkOrder.transport_cost ?? selectedWorkOrder.costing?.transport_cost
                    const transTax = selectedWorkOrder.transport_cost_tax ?? selectedWorkOrder.costing?.transport_cost_tax
                    const laborCost = selectedWorkOrder.worker_cost ?? selectedWorkOrder.costing?.worker_cost
                    const laborTax = selectedWorkOrder.worker_cost_tax ?? selectedWorkOrder.costing?.worker_cost_tax
                    const otherCost = selectedWorkOrder.other_cost ?? selectedWorkOrder.costing?.other_cost
                    const otherTax = selectedWorkOrder.other_cost_tax ?? selectedWorkOrder.costing?.other_cost_tax

                    return (
                      <>
                        {/* Work Order Costing & Financials Section */}
                        <div className="border border-slate-100 rounded-xl bg-white overflow-hidden">
                          <div className="bg-slate-50 border-b border-slate-100 px-4 py-2.5 flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Work Order Costing & Financials</span>
                          </div>
                          <div className="p-4 space-y-3 text-xs">
                            <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-1.5 font-bold uppercase text-[10px] text-slate-400">
                              <span>Component</span>
                              <span className="text-right">Price</span>
                              <span className="text-right">Tax</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 font-medium text-slate-700">
                              <span>Raw Materials:</span>
                              <span className="text-right tabular-nums font-bold">{matCost != null ? `₹${parseFloat(matCost).toFixed(2)}` : "—"}</span>
                              <span className="text-right tabular-nums font-bold">{matTax != null ? `₹${parseFloat(matTax).toFixed(2)}` : "—"}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 font-medium text-slate-700">
                              <span>Machinery:</span>
                              <span className="text-right tabular-nums font-bold">{machCost != null ? `₹${parseFloat(machCost).toFixed(2)}` : "—"}</span>
                              <span className="text-right tabular-nums font-bold">{machTax != null ? `₹${parseFloat(machTax).toFixed(2)}` : "—"}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 font-medium text-slate-700">
                              <span>Transport:</span>
                              <span className="text-right tabular-nums font-bold">{transCost != null ? `₹${parseFloat(transCost).toFixed(2)}` : "—"}</span>
                              <span className="text-right tabular-nums font-bold">{transTax != null ? `₹${parseFloat(transTax).toFixed(2)}` : "—"}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 font-medium text-slate-700">
                              <span>Labour:</span>
                              <span className="text-right tabular-nums font-bold">{laborCost != null ? `₹${parseFloat(laborCost).toFixed(2)}` : "—"}</span>
                              <span className="text-right tabular-nums font-bold">{laborTax != null ? `₹${parseFloat(laborTax).toFixed(2)}` : "—"}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 font-medium text-slate-700">
                              <span>Others:</span>
                              <span className="text-right tabular-nums font-bold">{otherCost != null ? `₹${parseFloat(otherCost).toFixed(2)}` : "—"}</span>
                              <span className="text-right tabular-nums font-bold">{otherTax != null ? `₹${parseFloat(otherTax).toFixed(2)}` : "—"}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 font-extrabold text-slate-900 border-t border-slate-200 pt-2 text-[13px]">
                              <span>Total:</span>
                              <span className="text-right tabular-nums text-brand-700">
                                {selectedWorkOrder.total_direct_cost != null ? `₹${parseFloat(selectedWorkOrder.total_direct_cost).toFixed(2)}` : "—"}
                              </span>
                              <span className="text-right tabular-nums text-brand-700">
                                {selectedWorkOrder.total_tax != null ? `₹${parseFloat(selectedWorkOrder.total_tax).toFixed(2)}` : "—"}
                              </span>
                            </div>
                            <div className="flex justify-between font-extrabold text-slate-900 border-t border-slate-100 pt-2 text-[13px]">
                              <span>Total production cost & tax:</span>
                              <span className="tabular-nums text-brand-700">
                                {selectedWorkOrder.total_cost_incl_tax != null ? `₹${parseFloat(selectedWorkOrder.total_cost_incl_tax).toFixed(2)}` : "—"}
                              </span>
                            </div>
                            <div className="flex justify-between font-bold text-slate-800 text-xs">
                              <span>Cost per unit:</span>
                              <span className="tabular-nums text-slate-800">
                                {selectedWorkOrder.cost_per_unit != null ? `₹${parseFloat(selectedWorkOrder.cost_per_unit).toFixed(2)}` : "—"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="border border-slate-100 rounded-xl bg-white overflow-hidden">
                          <div className="bg-emerald-50/50 border-b border-emerald-100 px-4 py-2.5 flex items-center gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Batch Compliance Metadata</span>
                          </div>
                          <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-semibold">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 mb-0.5">Batch Number</span>
                              <span className="text-slate-800 font-bold tabular-nums">{selectedWorkOrder.batch_number}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 mb-0.5">Batch Manufacture Date</span>
                              <span className="text-slate-700 text-[11px]">
                                {selectedWorkOrder.batch_date ? new Date(selectedWorkOrder.batch_date).toLocaleDateString() + " " + new Date(selectedWorkOrder.batch_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 mb-0.5">Expiry Date</span>
                              <span className="text-slate-700 text-[11px]">
                                {selectedWorkOrder.expiry_date ? new Date(selectedWorkOrder.expiry_date).toLocaleDateString() + " " + new Date(selectedWorkOrder.expiry_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    )
                  })()}

                  {/* Tracking & Logs */}
                  <div className="border border-slate-100 rounded-xl bg-white p-3.5 space-y-2.5">
                    <div className="flex items-center gap-2 border-b border-slate-50 pb-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">System Logs & Timestamps</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-bold text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Created:</span>
                        <span className="text-slate-700">{new Date(selectedWorkOrder.created_at).toLocaleString()}</span>
                      </div>
                      {selectedWorkOrder.authorized_at && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Completed/Authorized:</span>
                          <span className="text-slate-700">{new Date(selectedWorkOrder.authorized_at).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* DYNAMIC ACTIONS CONTAINER */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-between items-stretch sm:items-center gap-2 pt-4 border-t border-slate-100 mt-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsDetailOpen(false)}
                    className="w-full sm:w-auto px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold active:scale-95 transition-all text-center"
                  >
                    Close Modal
                  </button>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    {selectedWorkOrder.status === "open" && (
                      <>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleCancelWorkOrder(selectedWorkOrder.id)}
                          className="w-full sm:w-auto px-4 py-2 bg-error-500 hover:bg-error-800 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md shadow-error-500/10 text-center"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => setIsAuthorizeConfirmOpen(true)}
                          className="w-full sm:w-auto px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md shadow-brand-500/10 flex items-center justify-center gap-1.5"
                        >
                          {actionLoading ? <Spinner size="sm" /> : (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Authorize Work Order</span>
                            </>
                          )}
                        </button>
                      </>
                    )}

                    {selectedWorkOrder.status === "confirmed" && (
                      <>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleCancelWorkOrder(selectedWorkOrder.id)}
                          className="w-full sm:w-auto px-4 py-2 bg-error-500 hover:bg-error-800 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md shadow-error-500/10 text-center"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleStartWorkOrder(selectedWorkOrder.id)}
                          className="w-full sm:w-auto px-4 py-2 bg-success-500 hover:bg-success-700 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md shadow-success-500/10 flex items-center justify-center gap-1.5"
                        >
                          {actionLoading ? <Spinner size="sm" /> : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-white" />
                              <span>Start Production</span>
                            </>
                          )}
                        </button>
                      </>
                    )}

                    {selectedWorkOrder.status === "inprogress" && (
                      <button
                        type="button"
                        onClick={handleOpenCloseForm}
                        className="w-full sm:w-auto px-4 py-2 bg-success-500 hover:bg-success-700 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md shadow-success-500/10 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Complete & Close Production</span>
                      </button>
                    )}

                    {selectedWorkOrder.status === "closed" && (
                      <div className="flex items-center justify-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-bold w-full sm:w-auto">
                        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Production Completed</span>
                      </div>
                    )}

                    {selectedWorkOrder.status === "cancelled" && (
                      <div className="flex items-center justify-center gap-1.5 text-rose-700 bg-rose-50 border border-rose-200 px-3.5 py-1.5 rounded-xl text-xs font-bold w-full sm:w-auto">
                        <XCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Production Cancelled</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>
        </Modal>
      )}

      {/* CLOSE / COMPLETE WORK ORDER MODAL */}
      {isCloseFormOpen && (
        <Modal onClose={() => setIsCloseFormOpen(false)}>
          <div className="bg-white border border-slate-100 rounded-2xl max-w-lg w-full shadow-2xl p-6 relative flex flex-col max-h-[90vh] gap-4 overflow-hidden">

            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-brand-600" />
                <span>Close Work Order Production</span>
              </h3>
              <button
                onClick={() => setIsCloseFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error alerts banner */}
            {(isYieldMismatch || closeErrors.api || closeErrors.yieldReconciliation || closePreviewError) && (
              <div className="p-3.5 bg-error-50 border border-error-100 rounded-xl text-xs font-semibold text-error-800 flex items-start gap-2.5 shrink-0 animate-in fade-in duration-200">
                <AlertTriangle className="w-4 h-4 text-error-500 shrink-0 mt-0.5" />
                <span>
                  {closeErrors.api || closeErrors.yieldReconciliation || closePreviewError || (closePreview?.yield_percent != null ? `Yield ${closePreview.yield_percent}% is outside the acceptable range.` : "Yield is outside the acceptable range.")}
                </span>
              </div>
            )}

            {selectedWorkOrder && (
              <div className="text-xs bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between shrink-0 font-semibold text-slate-700">
                <span>Order Ref: {selectedWorkOrder.work_order_number}</span>
                <span>Input Qty: {selectedWorkOrder.total_input_qty}{inputUnitOf(selectedWorkOrder) ? ` ${inputUnitOf(selectedWorkOrder)}` : ""}</span>
              </div>
            )}

            <form onSubmit={handleCloseSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 py-1">
                {/* Output Qty */}
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Output Product Quantity ({selectedWorkOrder.unit_code}) <span className="text-error-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={closeForm.output_qty}
                    onChange={(e) => handleOutputQtyChange(e.target.value)}
                    placeholder="Enter finished goods output qty..."
                    className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold"
                  />
                  {closeErrors.output_qty && (
                    <p className="text-xs text-error-800 font-semibold mt-1">{closeErrors.output_qty}</p>
                  )}
                </div>

                {/* Wastage Qty */}
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Wastage Quantity ({selectedWorkOrder.unit_code}) <span className="text-error-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={closePreview?.wastage_qty ?? ""}
                    readOnly
                    placeholder="Calculated automatically..."
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none transition-all font-semibold text-slate-500 cursor-not-allowed select-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block font-semibold">
                    Calculated by the system
                  </span>
                  {closeErrors.wastage_qty && (
                    <p className="text-xs text-error-800 font-semibold mt-1">{closeErrors.wastage_qty}</p>
                  )}
                </div>

                {/* Batch Number */}
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Batch Number Code <span className="text-error-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={closeForm.batch_number}
                    onChange={(e) => setCloseForm({ ...closeForm, batch_number: e.target.value })}
                    placeholder="E.g., BATCH-CHILI-0012"
                    className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold"
                  />
                  {closeErrors.batch_number && (
                    <p className="text-xs text-error-800 font-semibold mt-1">{closeErrors.batch_number}</p>
                  )}
                </div>

                {/* Batch Date & Expiry Date row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Batch Date
                    </label>
                    <input
                      type="datetime-local"
                      value={closeForm.batch_date}
                      onChange={(e) => setCloseForm({ ...closeForm, batch_date: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-slate-700 bg-white font-semibold"
                    />
                    {closeErrors.batch_date && (
                      <p className="text-xs text-error-800 font-semibold mt-1">{closeErrors.batch_date}</p>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Expiry Date <span className="text-error-500 font-bold">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={closeForm.expiry_date}
                      onChange={(e) => setCloseForm({ ...closeForm, expiry_date: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-slate-700 bg-white font-semibold"
                    />
                    {closeErrors.expiry_date && (
                      <p className="text-xs text-error-800 font-semibold mt-1">{closeErrors.expiry_date}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Machinery Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Machinery Cost (INR) <span className="text-error-500 font-bold">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={closeForm.machinery_cost}
                        onChange={(e) => setCloseForm({ ...closeForm, machinery_cost: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700 bg-white"
                      />
                      {closeErrors.machinery_cost && (
                        <p className="text-xs text-error-800 font-semibold mt-1">{closeErrors.machinery_cost}</p>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Machinery Cost Tax (INR) <span className="text-error-500 font-bold">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={closeForm.machinery_cost_tax}
                        onChange={(e) => setCloseForm({ ...closeForm, machinery_cost_tax: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700 bg-white"
                      />
                      {closeErrors.machinery_cost_tax && (
                        <p className="text-xs text-error-800 font-semibold mt-1">{closeErrors.machinery_cost_tax}</p>
                      )}
                    </div>
                  </div>

                  {/* Transport Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Transport Cost (INR) <span className="text-error-500 font-bold">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={closeForm.transport_cost}
                        onChange={(e) => setCloseForm({ ...closeForm, transport_cost: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700 bg-white"
                      />
                      {closeErrors.transport_cost && (
                        <p className="text-xs text-error-800 font-semibold mt-1">{closeErrors.transport_cost}</p>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Transport Cost Tax (INR) <span className="text-error-500 font-bold">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={closeForm.transport_cost_tax}
                        onChange={(e) => setCloseForm({ ...closeForm, transport_cost_tax: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700 bg-white"
                      />
                      {closeErrors.transport_cost_tax && (
                        <p className="text-xs text-error-800 font-semibold mt-1">{closeErrors.transport_cost_tax}</p>
                      )}
                    </div>
                  </div>

                  {/* Labour Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Labour Cost (INR) <span className="text-error-500 font-bold">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={closeForm.worker_cost}
                        onChange={(e) => setCloseForm({ ...closeForm, worker_cost: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700 bg-white"
                      />
                      {closeErrors.worker_cost && (
                        <p className="text-xs text-error-800 font-semibold mt-1">{closeErrors.worker_cost}</p>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Labour Cost Tax (INR) <span className="text-error-500 font-bold">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={closeForm.worker_cost_tax}
                        onChange={(e) => setCloseForm({ ...closeForm, worker_cost_tax: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700 bg-white"
                      />
                      {closeErrors.worker_cost_tax && (
                        <p className="text-xs text-error-800 font-semibold mt-1">{closeErrors.worker_cost_tax}</p>
                      )}
                    </div>
                  </div>

                  {/* Others Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Others Cost (INR) <span className="text-error-500 font-bold">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={closeForm.other_cost}
                        onChange={(e) => setCloseForm({ ...closeForm, other_cost: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700 bg-white"
                      />
                      {closeErrors.other_cost && (
                        <p className="text-xs text-error-800 font-semibold mt-1">{closeErrors.other_cost}</p>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Others Cost Tax (INR) <span className="text-error-500 font-bold">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={closeForm.other_cost_tax}
                        onChange={(e) => setCloseForm({ ...closeForm, other_cost_tax: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700 bg-white"
                      />
                      {closeErrors.other_cost_tax && (
                        <p className="text-xs text-error-800 font-semibold mt-1">{closeErrors.other_cost_tax}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Billing Live Calculations */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700 space-y-1.5">
                  <div className="flex justify-between">
                    <span>Raw Material Cost:</span>
                    <span className="tabular-nums text-slate-700 font-bold">{selectedWorkOrder.costing?.material_cost != null ? `₹${Number(selectedWorkOrder.costing.material_cost).toFixed(2)}` : "—"}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Raw Material Tax (Read-only):</span>
                    <span className="tabular-nums text-slate-500">{selectedWorkOrder.costing?.material_cost_tax != null ? `₹${Number(selectedWorkOrder.costing.material_cost_tax).toFixed(2)}` : "—"}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-1">
                    <span>Total direct cost:</span>
                    <span className="tabular-nums text-slate-700 font-bold">
                      {closePreview?.total_direct_cost != null ? `₹${Number(closePreview.total_direct_cost).toFixed(2)}` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Total tax:</span>
                    <span className="tabular-nums text-slate-500">
                      {closePreview?.total_tax != null ? `₹${Number(closePreview.total_tax).toFixed(2)}` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-slate-200 pt-1.5">
                    <span>Total production cost & tax:</span>
                    <span className="tabular-nums text-brand-700">
                      {closePreview?.total_cost_incl_tax != null ? `₹${Number(closePreview.total_cost_incl_tax).toFixed(2)}` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span>Cost per unit:</span>
                    <span className="tabular-nums text-slate-800">
                      {closePreview?.cost_per_unit != null ? `₹${Number(closePreview.cost_per_unit).toFixed(2)}` : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-100 mt-4 shrink-0 font-semibold">
                <button
                  type="button"
                  onClick={() => setIsCloseFormOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors active:scale-95 text-center"
                >
                  Go Back
                </button>
                <button
                  type="submit"
                  disabled={isClosing || isYieldMismatch}
                  className="w-full sm:w-auto px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-md shadow-brand-500/10 flex items-center justify-center min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isClosing ? <Spinner size="sm" /> : "Complete & Close"}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* INSUFFICIENT STOCK WARNING MODAL */}
      {isStockErrorOpen && (
        <Modal onClose={() => setIsStockErrorOpen(false)}>
          <div className="bg-white border border-slate-100 rounded-2xl max-w-md w-full shadow-2xl p-6 relative flex flex-col gap-4 text-center items-center">

            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-full">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">Insufficient Stock</h3>
              <p className="text-sm font-semibold text-slate-500 max-w-sm">
                {stockErrorMessage}
                <br />
                Please register a Purchase Entry first.
              </p>
            </div>

            <button
              onClick={() => setIsStockErrorOpen(false)}
              className="mt-2 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors active:scale-95 shadow-md"
            >
              Understand & Acknowledge
            </button>

          </div>
        </Modal>
      )}

      {/* Authorize Work Order Confirmation Overlay */}
      {isAuthorizeConfirmOpen && selectedWorkOrder && (
        <Modal onClose={() => setIsAuthorizeConfirmOpen(false)}>
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 shrink-0">
                  <ShieldAlert className="w-4.5 h-4.5 text-brand-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Confirm Work Order Authorization</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthorizeConfirmOpen(false)}
                disabled={actionLoading}
                className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3 flex-1 overflow-y-auto">
              <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                Are you sure you want to authorize Work Order <span className="font-bold text-slate-900 uppercase">{selectedWorkOrder.work_order_number}</span>?
              </p>
              <p className="text-xs text-slate-500 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                Authorizing will verify raw material stock availability and activate the work order for production.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 bg-slate-50/50 shrink-0">
              <button
                type="button"
                onClick={() => setIsAuthorizeConfirmOpen(false)}
                disabled={actionLoading}
                className="w-full sm:w-auto border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 transition-all bg-white disabled:opacity-50 text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAuthorizeWorkOrder(selectedWorkOrder.id)}
                disabled={actionLoading}
                className="w-full sm:w-auto px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-brand-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? <Spinner size="sm" /> : null}
                <span>{actionLoading ? "Authorizing..." : "Confirm & Authorize"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  )
}

export default WorkOrders
