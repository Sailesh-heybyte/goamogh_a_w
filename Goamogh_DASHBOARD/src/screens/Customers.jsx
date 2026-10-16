import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {
  Users,
  Search,
  Plus,
  Edit2,
  MapPin,
  History,
  AlertCircle,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react"
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  toggleCustomerStatus,
  getCustomerAddresses,
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  searchCustomerByPhone,
  getCustomerOrders,
} from "@/api/customers"
import Spinner from "@/components/ui/Spinner"
import Pagination from "@/components/ui/Pagination"
import Modal from "@/components/ui/Modal"
import useConfirm from "@/hooks/useConfirm"
import { INDIAN_STATES } from "@/utils/indianStates"
import { useToast } from "@/context/ToastContext"

function parseErrorDetail(detail, defaultMsg) {
  if (!detail) return defaultMsg
  if (Array.isArray(detail)) {
    const messages = detail.map((d) => d.msg).filter(Boolean)
    return messages.length > 0 ? messages.join(", ") : defaultMsg
  }
  return typeof detail === "string" ? detail : defaultMsg
}

function Customers() {
  const { showErrorToast } = useToast()
  const confirm = useConfirm()
  const [customers, setCustomers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [skip, setSkip] = useState(0)
  const limit = 50
  const latestRequestRef = useRef(0)

  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAddressesOpen, setIsAddressesOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const [createForm, setCreateForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    gstin: "",
    company_name: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    landmark: "",
  })
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
  })
  const [addressForm, setAddressForm] = useState({
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    landmark: "",
    phone: "",
    is_default: false,
  })

  const [addresses, setAddresses] = useState([])
  const [editingAddressId, setEditingAddressId] = useState(null)
  const [orderHistory, setOrderHistory] = useState([])
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState("")
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setSkip(0)
  }, [debouncedSearch, statusFilter])

  const fetchCustomers = useCallback(async () => {
    const requestId = ++latestRequestRef.current
    setIsLoading(true)
    setError("")
    try {
      const res = await getCustomers()
      if (requestId !== latestRequestRef.current) return
      if (!res.ok) {
        throw new Error("Failed to load customers catalog.")
      }
      const json = await res.json()
      if (requestId !== latestRequestRef.current) return
      setCustomers(json.data || [])
    } catch (err) {
      if (requestId !== latestRequestRef.current) return
      setError(err.message || "An error occurred.")
    } finally {
      if (requestId === latestRequestRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const filtered = useMemo(() => {
    const search = debouncedSearch.trim().toLowerCase()
    return customers.filter((c) => {
      if (statusFilter !== "all" && c.is_active !== (statusFilter === "active")) {
        return false
      }
      if (search) {
        const matches = [c.first_name, c.last_name, c.company_name, c.email, c.phone].some((field) =>
          (field || "").toLowerCase().includes(search)
        )
        if (!matches) return false
      }
      return true
    })
  }, [customers, statusFilter, debouncedSearch])

  const pageRows = filtered.slice(skip, skip + limit)

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setFormErrors({})
    setModalError("")

    let cleanPhone = (createForm.phone || "").trim().replace(/\D/g, "")
    if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) {
      cleanPhone = cleanPhone.substring(2)
    }

    const errors = {}
    if (!(createForm.first_name || "").trim()) errors.first_name = "First name is required"
    if (!(createForm.last_name || "").trim()) errors.last_name = "Last name is required"
    if (!/^\d{10}$/.test(cleanPhone)) {
      errors.phone = "Phone number must be exactly 10 digits (e.g. 9987654321)"
    }
    if ((createForm.address_line_1 || "").trim() && !(createForm.state || "").trim()) {
      errors.state = "Select a state for the address"
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const fullName = `${(createForm.first_name || "").trim()} ${(createForm.last_name || "").trim()}`.trim()
    const ok = await confirm({
      title: `Create customer ${fullName}?`,
      confirmLabel: "Create",
    })
    if (!ok) return

    setModalLoading(true)
    try {
      const payload = {
        phone: cleanPhone,
        first_name: (createForm.first_name || "").trim(),
        last_name: (createForm.last_name || "").trim(),
        email: (createForm.email || "").trim() || null,
        gstin: (createForm.gstin || "").trim() || null,
        company_name: (createForm.company_name || "").trim() || null,
      }
      const res = await createCustomer(payload)
      const resJson = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(parseErrorDetail(resJson.detail, "Failed to create customer."))
      }

      const createdUser = resJson.data?.user || resJson.data || resJson
      const createdUserId = createdUser?.id || createdUser?.user_id
      if (createdUserId && (createForm.address_line_1 || "").trim() && (createForm.city || "").trim()) {
        const addrRes = await addCustomerAddress(createdUserId, {
          address_line_1: (createForm.address_line_1 || "").trim(),
          address_line_2: (createForm.address_line_2 || "").trim() || null,
          city: (createForm.city || "").trim(),
          state: createForm.state,
          postal_code: (createForm.postal_code || "").trim() || null,
          landmark: (createForm.landmark || "").trim() || null,
          phone: cleanPhone,
          is_default: true,
        })
        if (!addrRes.ok)
          showErrorToast("Customer created, but the address was not saved. Add it from the customer's Addresses.")
      }

      setIsCreateOpen(false)
      setCreateForm({
        first_name: "",
        last_name: "",
        phone: "",
        email: "",
        gstin: "",
        company_name: "",
        address_line_1: "",
        address_line_2: "",
        city: "",
        state: "",
        postal_code: "",
        landmark: "",
      })
      fetchCustomers()
    } catch (err) {
      setModalError(err.message)
    } finally {
      setModalLoading(false)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setFormErrors({})
    setModalError("")

    const errors = {}
    if (!(editForm.first_name || "").trim()) errors.first_name = "First name is required"
    if (!(editForm.last_name || "").trim()) errors.last_name = "Last name is required"

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const fullName = `${(editForm.first_name || "").trim()} ${(editForm.last_name || "").trim()}`.trim()
    const ok = await confirm({
      title: `Save changes to customer ${fullName}?`,
      confirmLabel: "Save changes",
    })
    if (!ok) return

    setModalLoading(true)
    try {
      const res = await updateCustomer(selectedCustomer.id, {
        first_name: (editForm.first_name || "").trim(),
        last_name: (editForm.last_name || "").trim(),
        email: (editForm.email || "").trim() || null,
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(parseErrorDetail(errJson.detail, "Failed to update profile."))
      }
      setIsEditOpen(false)
      fetchCustomers()
    } catch (err) {
      setModalError(err.message)
    } finally {
      setModalLoading(false)
    }
  }

  const handleToggleStatus = async (customer) => {
    const custName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || customer.phone || "customer"
    const newStatus = !customer.is_active
    const ok = await confirm({
      title: newStatus ? `Activate customer ${custName}?` : `Deactivate customer ${custName}?`,
      confirmLabel: newStatus ? "Activate" : "Deactivate",
      ...(newStatus ? {} : { tone: "danger" }),
    })
    if (!ok) return

    try {
      const res = await toggleCustomerStatus(customer.id, newStatus)
      if (!res.ok) {
        throw new Error("Failed to change activation status.")
      }
      fetchCustomers()
    } catch (err) {
      alert(err.message || "Something went wrong.")
    }
  }

  const loadAddresses = async (customer) => {
    setSelectedCustomer(customer)
    setAddresses([])
    setEditingAddressId(null)
    setModalError("")
    setModalLoading(true)
    setIsAddressesOpen(true)
    setAddressForm({
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      postal_code: "",
      landmark: "",
      phone: customer.phone || "",
      is_default: false,
    })
    try {
      const custId = customer.id || customer.user_id || customer.user?.id
      let addrList = []

      if (custId) {
        const res = await getCustomerAddresses(custId)
        if (res.ok) {
          const json = await res.json()
          const rawData = json.data
          if (Array.isArray(rawData)) {
            addrList = rawData
          } else if (Array.isArray(rawData?.addresses)) {
            addrList = rawData.addresses
          } else if (rawData?.default_address) {
            addrList = [rawData.default_address]
          } else if (Array.isArray(json)) {
            addrList = json
          }
        }
      }

      if (
        addrList.length === 0 &&
        customer.addresses &&
        Array.isArray(customer.addresses) &&
        customer.addresses.length > 0
      ) {
        addrList = customer.addresses
      } else if (addrList.length === 0 && customer.default_address) {
        addrList = [customer.default_address]
      } else if (addrList.length === 0 && customer.phone) {
        const sRes = await searchCustomerByPhone(customer.phone)
        if (sRes.ok) {
          const sJson = await sRes.json()
          const sData = sJson.data || {}
          addrList = Array.isArray(sData.addresses) ? sData.addresses : []
          if (addrList.length === 0 && sData.default_address) {
            addrList = [sData.default_address]
          }
        }
      }

      setAddresses(addrList)
    } catch (err) {
      setModalError(err.message)
    } finally {
      setModalLoading(false)
    }
  }

  const handleAddressSubmit = async (e) => {
    e.preventDefault()
    setModalError("")

    if (!(addressForm.address_line_1 || "").trim() || !(addressForm.city || "").trim()) {
      setModalError("Please fill out line 1 and city details.")
      return
    }

    const targetId = selectedCustomer?.id || selectedCustomer?.user_id || selectedCustomer?.user?.id
    if (!targetId) {
      setModalError("Customer ID missing. Please reload customers list.")
      return
    }

    const custName = selectedCustomer?.first_name
      ? `${selectedCustomer.first_name} ${selectedCustomer.last_name || ""}`.trim()
      : "customer"
    const ok = await confirm({
      title: editingAddressId ? `Update address for ${custName}?` : `Add address for ${custName}?`,
      confirmLabel: editingAddressId ? "Save changes" : "Add address",
    })
    if (!ok) return

    setModalLoading(true)
    try {
      let res
      if (editingAddressId) {
        res = await updateCustomerAddress(editingAddressId, {
          address_line_1: (addressForm.address_line_1 || "").trim(),
          address_line_2: (addressForm.address_line_2 || "").trim() || null,
          city: (addressForm.city || "").trim(),
          state: addressForm.state,
          postal_code: (addressForm.postal_code || "").trim() || null,
          landmark: (addressForm.landmark || "").trim() || null,
          phone: (addressForm.phone || "").trim() || selectedCustomer?.phone || "",
          is_default: addressForm.is_default,
        })
      } else {
        res = await addCustomerAddress(targetId, {
          address_line_1: (addressForm.address_line_1 || "").trim(),
          address_line_2: (addressForm.address_line_2 || "").trim() || null,
          city: (addressForm.city || "").trim(),
          state: addressForm.state,
          postal_code: (addressForm.postal_code || "").trim() || null,
          landmark: (addressForm.landmark || "").trim() || null,
          phone: (addressForm.phone || "").trim() || selectedCustomer?.phone || "",
          is_default: addressForm.is_default,
        })
      }

      const resJson = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(parseErrorDetail(resJson.detail, "Failed to save address."))
      }

      const savedAddress = resJson.data || resJson
      if (savedAddress && (savedAddress.id || savedAddress.address_line_1)) {
        setAddresses((prev) => {
          const filtered = prev.filter((a) => a.id !== savedAddress.id)
          return [savedAddress, ...filtered]
        })
      }

      const freshRes = await getCustomerAddresses(targetId)
      if (freshRes.ok) {
        const freshJson = await freshRes.json()
        const freshList = Array.isArray(freshJson.data) ? freshJson.data : freshJson.data?.addresses || []
        if (freshList.length > 0) setAddresses(freshList)
      } else if (selectedCustomer?.phone) {
        const sRes = await searchCustomerByPhone(selectedCustomer.phone)
        if (sRes.ok) {
          const sJson = await sRes.json()
          const sData = sJson.data || {}
          let freshList = Array.isArray(sData.addresses) ? sData.addresses : []
          if (freshList.length === 0 && sData.default_address) {
            freshList = [sData.default_address]
          }
          if (freshList.length > 0) setAddresses(freshList)
        }
      }

      fetchCustomers()

      setEditingAddressId(null)
      setAddressForm({
        address_line_1: "",
        address_line_2: "",
        city: "",
        state: "",
        postal_code: "",
        landmark: "",
        phone: selectedCustomer?.phone || "",
        is_default: false,
      })
    } catch (err) {
      setModalError(err.message)
    } finally {
      setModalLoading(false)
    }
  }

  const handleDeleteAddress = async (addressId) => {
    const custName = selectedCustomer?.first_name
      ? `${selectedCustomer.first_name} ${selectedCustomer.last_name || ""}`.trim()
      : "customer"
    const ok = await confirm({
      title: `Delete address for ${custName}?`,
      message: "Are you sure you want to delete this address?",
      confirmLabel: "Delete",
      tone: "danger",
    })
    if (!ok) return
    setModalError("")
    setModalLoading(true)
    const targetId = selectedCustomer?.id || selectedCustomer?.user_id || selectedCustomer?.user?.id
    try {
      const res = await deleteCustomerAddress(addressId)
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(parseErrorDetail(errJson.detail, "Failed to delete address."))
      }
      if (targetId) {
        const freshRes = await getCustomerAddresses(targetId)
        if (freshRes.ok) {
          const freshJson = await freshRes.json()
          const freshList = Array.isArray(freshJson.data) ? freshJson.data : freshJson.data?.addresses || []
          setAddresses(freshList)
        }
      }
      fetchCustomers()
    } catch (err) {
      setModalError(err.message)
    } finally {
      setModalLoading(false)
    }
  }

  const loadOrderHistory = async (customer) => {
    setSelectedCustomer(customer)
    setOrderHistory([])
    setModalError("")
    setModalLoading(true)
    setIsHistoryOpen(true)
    try {
      const res = await getCustomerOrders(customer.id)
      if (!res.ok) throw new Error("Could not retrieve customer purchases history.")
      const json = await res.json()
      setOrderHistory(json.data || [])
    } catch (err) {
      setModalError(err.message)
    } finally {
      setModalLoading(false)
    }
  }

  const formatShortDate = (isoString) => {
    if (!isoString) return "—"
    return new Date(isoString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
            <span>Sales & Accounts</span>
            <span>/</span>
            <span className="text-slate-800">Customers</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-600" />
            <span>Customer Profile Directory</span>
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Manage profiles, verify GST registrations, configure shipping destinations, and review order histories.
          </p>
        </div>

        <button
          onClick={() => {
            setFormErrors({})
            setModalError("")
            setCreateForm({ first_name: "", last_name: "", phone: "", email: "", gstin: "", company_name: "" })
            setIsCreateOpen(true)
          }}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-brand-500/10 active:scale-95 whitespace-nowrap self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
        <div className="relative w-full sm:flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers by name, business, or mobile phone..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="w-full sm:w-auto sm:min-w-[160px]">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setSkip(0)
            }}
            className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white text-slate-700 font-semibold transition-all"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="bg-white border border-error-100 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-sm font-semibold text-error-800">{error}</p>
          <button
            onClick={fetchCustomers}
            className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 font-medium shadow-sm">
          No customer records matching lookup filters.
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden w-full">
          <div className="w-full">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-3.5 py-3.5 w-[56%] md:w-[42%] lg:w-[32%]">Customer & Business</th>
                  <th className="px-3 py-3.5 hidden md:table-cell md:w-[30%] lg:w-[26%]">Contact Details</th>
                  <th className="px-3 py-3.5 hidden lg:table-cell lg:w-[18%]">Quick Access</th>
                  <th className="px-3 py-3.5 w-[22%] md:w-[14%] lg:w-[11%] text-center">Status</th>
                  <th className="px-3 py-3.5 w-[22%] md:w-[14%] lg:w-[13%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {pageRows.map((c) => {
                  const fullName = `${c.first_name || ""} ${c.last_name || ""}`.trim() || "Customer"
                  const initial = (c.first_name || "C")[0].toUpperCase()
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="px-3.5 py-3 min-w-0">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-brand-50/80 border border-brand-100 flex items-center justify-center font-bold text-brand-700 shrink-0 text-xs shadow-2xs mt-0.5">
                            {initial}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-slate-900 font-semibold text-xs leading-snug truncate" title={fullName}>
                              {fullName}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {c.company_name && (
                                <span
                                  className="text-[10px] text-slate-500 font-medium truncate max-w-[140px]"
                                  title={c.company_name}
                                >
                                  {c.company_name}
                                </span>
                              )}
                              {c.gstin && (
                                <span className="tabular-nums text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60 font-medium">
                                  GST: {c.gstin}
                                </span>
                              )}
                              {!c.company_name && !c.gstin && (
                                <span className="text-[10px] text-slate-400 font-medium">Individual Account</span>
                              )}
                            </div>
                            <div
                              className="text-[10px] text-slate-400 truncate md:hidden mt-0.5"
                              title={c.phone || c.email || ""}
                            >
                              {c.phone ? `${c.phone} ` : ""}
                              {c.email ? `• ${c.email}` : ""}
                            </div>
                            <div className="flex items-center gap-2 mt-1 lg:hidden">
                              <button
                                onClick={() => loadAddresses(c)}
                                className="text-[10px] text-brand-600 font-semibold hover:underline inline-flex items-center gap-0.5"
                              >
                                <MapPin className="w-2.5 h-2.5" />
                                <span>Addresses</span>
                              </button>
                              <span className="text-slate-300">•</span>
                              <button
                                onClick={() => loadOrderHistory(c)}
                                className="text-[10px] text-brand-600 font-semibold hover:underline inline-flex items-center gap-0.5"
                              >
                                <History className="w-2.5 h-2.5" />
                                <span>Orders</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3 min-w-0 hidden md:table-cell">
                        <p
                          className="tabular-nums text-xs font-semibold text-slate-800 leading-snug truncate"
                          title={c.phone || ""}
                        >
                          {c.phone || "—"}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5" title={c.email || ""}>
                          {c.email || "No email attached"}
                        </p>
                      </td>

                      <td className="px-3 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => loadAddresses(c)}
                            className="px-2 py-1 border border-slate-200 hover:border-brand-200 hover:bg-brand-50/50 rounded-lg text-[11px] font-semibold text-slate-700 hover:text-brand-700 transition-all inline-flex items-center gap-1 bg-white shadow-2xs group/btn cursor-pointer"
                            title="View Addresses"
                          >
                            <MapPin className="w-3 h-3 text-slate-400 group-hover/btn:text-brand-600 transition-colors" />
                            <span>Addresses</span>
                          </button>
                          <button
                            onClick={() => loadOrderHistory(c)}
                            className="px-2 py-1 border border-slate-200 hover:border-brand-200 hover:bg-brand-50/50 rounded-lg text-[11px] font-semibold text-slate-700 hover:text-brand-700 transition-all inline-flex items-center gap-1 bg-white shadow-2xs group/btn cursor-pointer"
                            title="Order History"
                          >
                            <History className="w-3 h-3 text-slate-400 group-hover/btn:text-brand-600 transition-colors" />
                            <span>Orders</span>
                          </button>
                        </div>
                      </td>

                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        {c.is_active ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedCustomer(c)
                              setEditForm({ first_name: c.first_name, last_name: c.last_name, email: c.email || "" })
                              setFormErrors({})
                              setModalError("")
                              setIsEditOpen(true)
                            }}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200/60 shadow-2xs transition-all cursor-pointer"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(c)}
                            className={`p-1.5 rounded-lg border shadow-2xs transition-all cursor-pointer ${
                              c.is_active
                                ? "border-rose-200/60 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                : "border-emerald-200/60 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
                            }`}
                            title={c.is_active ? "Deactivate Customer" : "Activate Customer"}
                          >
                            {c.is_active ? (
                              <ToggleRight className="w-3.5 h-3.5" />
                            ) : (
                              <ToggleLeft className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination skip={skip} limit={limit} total={filtered.length} onChange={setSkip} />
        </div>
      )}
      {isCreateOpen && (
        <Modal onClose={() => setIsCreateOpen(false)}>
          <div className="bg-white border border-slate-100 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-600" />
                <span>Onboard New Customer</span>
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs font-semibold">
                {modalError && (
                  <div className="p-3 bg-error-50 border border-error-100 rounded-xl text-xs font-semibold text-error-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-error-500 shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                    Customer Profile Information
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-600 mb-1">
                        First Name <span className="text-error-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={createForm.first_name}
                        onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                      />
                      {formErrors.first_name && (
                        <p className="text-[10px] text-error-800 mt-1">{formErrors.first_name}</p>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-600 mb-1">
                        Last Name <span className="text-error-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={createForm.last_name}
                        onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                      />
                      {formErrors.last_name && (
                        <p className="text-[10px] text-error-800 mt-1">{formErrors.last_name}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-600 mb-1">
                        Phone Number <span className="text-error-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 9876543210"
                        value={createForm.phone}
                        onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                      />
                      {formErrors.phone && <p className="text-[10px] text-error-800 mt-1">{formErrors.phone}</p>}
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-600 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-600 mb-1">GSTIN (for B2B/Wholesale)</label>
                      <input
                        type="text"
                        placeholder="e.g. 37ABCDE1234F1Z5"
                        value={createForm.gstin}
                        onChange={(e) => setCreateForm({ ...createForm, gstin: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-600 mb-1">Company Name</label>
                      <input
                        type="text"
                        value={createForm.company_name}
                        onChange={(e) => setCreateForm({ ...createForm, company_name: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3.5 space-y-3.5">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-600" />
                    <span>Default Shipping Address (Optional)</span>
                  </h4>

                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-600 mb-1">Address Line 1</label>
                    <input
                      type="text"
                      placeholder="Street Address, Building, House No."
                      value={createForm.address_line_1}
                      onChange={(e) => setCreateForm({ ...createForm, address_line_1: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-600 mb-1">Address Line 2</label>
                    <input
                      type="text"
                      placeholder="Area, Colony, Sector, Suite"
                      value={createForm.address_line_2}
                      onChange={(e) => setCreateForm({ ...createForm, address_line_2: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-600 mb-1">City</label>
                      <input
                        type="text"
                        placeholder="e.g. Bangalore"
                        value={createForm.city}
                        onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-600 mb-1">State</label>
                      <select
                        value={createForm.state}
                        onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none bg-white font-semibold text-slate-700"
                      >
                        <option value="">Select state</option>
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      {formErrors.state && <p className="text-[10px] text-error-800 mt-1">{formErrors.state}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-600 mb-1">Postal Code</label>
                      <input
                        type="text"
                        placeholder="e.g. 560001"
                        value={createForm.postal_code}
                        onChange={(e) => setCreateForm({ ...createForm, postal_code: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-600 mb-1">Landmark</label>
                      <input
                        type="text"
                        placeholder="e.g. Near Metro Station"
                        value={createForm.landmark}
                        onChange={(e) => setCreateForm({ ...createForm, landmark: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="w-full sm:w-auto px-5 py-2 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all flex items-center justify-center min-w-[110px]"
                >
                  {modalLoading ? <Spinner size="sm" /> : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {isEditOpen && selectedCustomer && (
        <Modal onClose={() => setIsEditOpen(false)}>
          <div className="bg-white border border-slate-100 rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-brand-600" />
                <span>Update Customer Profile</span>
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs font-semibold">
                {modalError && (
                  <div className="p-3 bg-error-50 border border-error-100 rounded-xl text-xs font-semibold text-error-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-error-500 shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-600 mb-1">
                      First Name <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.first_name}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                    />
                    {formErrors.first_name && (
                      <p className="text-[10px] text-error-800 mt-1">{formErrors.first_name}</p>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-600 mb-1">
                      Last Name <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.last_name}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                    />
                    {formErrors.last_name && <p className="text-[10px] text-error-800 mt-1">{formErrors.last_name}</p>}
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="w-full sm:w-auto px-4 py-2 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all flex items-center justify-center min-w-[100px]"
                >
                  {modalLoading ? <Spinner size="sm" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {isAddressesOpen && selectedCustomer && (
        <Modal onClose={() => setIsAddressesOpen(false)}>
          <div className="bg-white border border-slate-100 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand-600" />
                  <span>Configure Shipping Addresses</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                  Customer: {selectedCustomer.first_name} {selectedCustomer.last_name}
                </p>
              </div>
              <button
                onClick={() => setIsAddressesOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {modalError && (
                <div className="p-3 bg-error-50 border border-error-100 rounded-xl text-xs font-semibold text-error-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-error-500 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Registered Destinations</h4>
                {modalLoading && addresses.length === 0 ? (
                  <div className="flex justify-center py-6">
                    <Spinner size="md" />
                  </div>
                ) : addresses.length === 0 ? (
                  <p className="text-slate-400 text-xs italic font-semibold">
                    No addresses registered for this customer yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id || addr.address_line_1}
                        className={`p-3.5 border rounded-xl relative ${addr.is_default ? "border-brand-500 bg-brand-50/10" : "border-slate-200 bg-slate-50/30"}`}
                      >
                        <div className="pr-16 text-xs text-slate-700 font-semibold leading-relaxed">
                          <p className="font-bold text-slate-900">{addr.address_line_1}</p>
                          {addr.address_line_2 && <p>{addr.address_line_2}</p>}
                          <p>
                            {addr.city}, {addr.state} - {addr.postal_code || "—"}
                          </p>
                          {addr.landmark && (
                            <p className="text-[10px] text-slate-400 mt-0.5">Landmark: {addr.landmark}</p>
                          )}
                          {addr.phone && (
                            <p className="text-slate-900 tabular-nums text-[10px] mt-1">Mobile: {addr.phone}</p>
                          )}
                        </div>
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          {addr.is_default && (
                            <span className="text-[10px] font-extrabold text-brand-700 bg-brand-50 border border-brand-200 px-1.5 py-0.5 rounded uppercase">
                              Default
                            </span>
                          )}
                          {addr.id && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAddressId(addr.id)
                                  setAddressForm({
                                    address_line_1: addr.address_line_1 || "",
                                    address_line_2: addr.address_line_2 || "",
                                    city: addr.city || "",
                                    state: addr.state,
                                    postal_code: addr.postal_code || "",
                                    landmark: addr.landmark || "",
                                    phone: addr.phone || selectedCustomer.phone || "",
                                    is_default: !!addr.is_default,
                                  })
                                }}
                                className="p-1 hover:bg-slate-200/60 rounded text-slate-500 hover:text-slate-800 transition-colors"
                                title="Edit Address"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="p-1 hover:bg-rose-100 rounded text-rose-500 hover:text-rose-700 transition-colors"
                                title="Delete Address"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form
                onSubmit={handleAddressSubmit}
                className="border-t border-slate-100 pt-4 space-y-3.5 text-xs font-semibold"
              >
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Add Shipping Destination</h4>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-600 mb-1">
                    Address Line 1 <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.address_line_1}
                    onChange={(e) => setAddressForm({ ...addressForm, address_line_1: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-600 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    value={addressForm.address_line_2}
                    onChange={(e) => setAddressForm({ ...addressForm, address_line_2: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-600 mb-1">
                      City <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-600 mb-1">
                      State <span className="text-error-500">*</span>
                    </label>
                    <select
                      required
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none bg-white font-semibold text-slate-700"
                    >
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-600 mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={addressForm.postal_code}
                      onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-600 mb-1">
                      Mobile Phone <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-600 mb-1">Landmark</label>
                  <input
                    type="text"
                    value={addressForm.landmark}
                    onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={addressForm.is_default}
                    onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="is_default" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Set as default shipping address
                  </label>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="w-full sm:w-auto px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all flex items-center justify-center min-w-[120px]"
                  >
                    {modalLoading ? <Spinner size="sm" /> : "Register Destination"}
                  </button>
                </div>
              </form>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsAddressesOpen(false)}
                className="w-full sm:w-auto px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {isHistoryOpen && selectedCustomer && (
        <Modal onClose={() => setIsHistoryOpen(false)}>
          <div className="bg-white border border-slate-100 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-brand-600" />
                  <span>Customer Orders History</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                  Customer: {selectedCustomer.first_name} {selectedCustomer.last_name}
                </p>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {modalError && (
                <div className="p-3 bg-error-50 border border-error-100 rounded-xl text-xs font-semibold text-error-800 flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 text-error-500 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {modalLoading && orderHistory.length === 0 ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : orderHistory.length === 0 ? (
                <p className="text-center text-slate-400 font-bold py-12">No orders recorded for this customer.</p>
              ) : (
                <div className="w-full border border-slate-200/80 rounded-xl">
                  <table className="w-full text-left border-collapse table-fixed text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                        <th className="px-3 py-2.5 w-[50%] md:w-[28%] lg:w-[24%]">Order / Sale No</th>
                        <th className="px-3 py-2.5 hidden md:table-cell md:w-[16%] lg:w-[14%]">Type</th>
                        <th className="px-3 py-2.5 w-[22%] md:w-[18%] lg:w-[16%]">Status</th>
                        <th className="px-3 py-2.5 hidden lg:table-cell lg:w-[16%]">Payment</th>
                        <th className="px-3 py-2.5 text-right w-[28%] md:w-[22%] lg:w-[16%]">Total Amount</th>
                        <th className="px-3 py-2.5 hidden md:table-cell md:w-[16%] lg:w-[14%]">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {orderHistory.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-3 py-2.5 min-w-0">
                            <div className="tabular-nums font-bold text-brand-700 truncate" title={order.sale_number}>
                              {order.sale_number}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate md:hidden">
                              {order.sale_type} • {formatShortDate(order.created_at)}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 uppercase text-[10px] font-extrabold whitespace-nowrap hidden md:table-cell">
                            {order.sale_type}
                          </td>
                          <td className="px-3 py-2.5 uppercase text-[10px] font-extrabold whitespace-nowrap">
                            {order.status}
                          </td>
                          <td className="px-3 py-2.5 uppercase text-[10px] font-extrabold whitespace-nowrap hidden lg:table-cell">
                            {order.payment_status}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums font-extrabold text-slate-900 whitespace-nowrap">
                            {order.total_amount != null ? `₹${parseFloat(order.total_amount).toFixed(2)}` : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-slate-400 tabular-nums whitespace-nowrap hidden md:table-cell">
                            {formatShortDate(order.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="w-full sm:w-auto px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-white transition-colors"
              >
                Close History
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Customers
