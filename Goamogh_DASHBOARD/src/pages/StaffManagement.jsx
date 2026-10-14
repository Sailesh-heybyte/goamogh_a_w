import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Edit2, ShieldAlert, X, Phone, Mail, Lock, User, UserMinus, UserCheck } from "lucide-react"
import useAuth from "@/hooks/useAuth"
import { getStaff, onboardStaff, updateStaff, activateStaff, deactivateStaff } from "@/api/staff"
import { getRoles } from "@/api/roles"
import Spinner from "@/components/ui/Spinner"
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

function StaffManagement() {
  const { user: currentUser, isSuperAdmin, isLoading: isAuthLoading } = useAuth()
  const navigate = useNavigate()
  const confirm = useConfirm()

  const [staffList, setStaffList] = useState([])
  const [roles, setRoles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [successBanner, setSuccessBanner] = useState("")

  // Modals state
  const [isOnboardOpen, setIsOnboardOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)

  // Onboard form state
  const [onboardForm, setOnboardForm] = useState({
    email: "",
    password: "",
    confirm_password: "",
    first_name: "",
    last_name: "",
    phone: "",
    role_id: "",
  })
  const [onboardErrors, setOnboardErrors] = useState({})
  const [isOnboarding, setIsOnboarding] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    role_id: "",
    password: "",
    is_active: true,
  })
  const [editErrors, setEditErrors] = useState({})
  const [isEditing, setIsEditing] = useState(false)

  // Security check: redirect non-super_admins
  useEffect(() => {
    if (!isAuthLoading && !isSuperAdmin) {
      navigate("/dashboard", { replace: true })
    }
  }, [isSuperAdmin, isAuthLoading, navigate])

  const fetchData = async () => {
    setIsLoading(true)
    setError("")
    try {
      const [staffRes, rolesRes] = await Promise.all([
        getStaff(0, 50),
        getRoles(),
      ])

      if (!staffRes.ok || !rolesRes.ok) {
        throw new Error("Failed to load staff directory or roles list")
      }

      const staffData = await staffRes.json()
      const rolesData = await rolesRes.json()

      setStaffList(staffData.data || [])
      setRoles(rolesData.data || [])
    } catch (err) {
      setError(err.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isSuperAdmin) {
      const timer = setTimeout(() => {
        fetchData()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isSuperAdmin])

  // Onboard real-time change validation
  const handleOnboardChange = (field, value) => {
    setOnboardForm((prev) => {
      const updated = { ...prev, [field]: value }
      setOnboardErrors((errs) => {
        const newErrs = { ...errs }

        if (field === "email") {
          if (!value) {
            newErrs.email = "Email is required"
          } else if (!/\S+@\S+\.\S+/.test(value)) {
            newErrs.email = "Invalid email format"
          } else {
            delete newErrs.email
          }
        }
        if (field === "first_name") {
          if (!value) {
            newErrs.first_name = "First name is required"
          } else {
            delete newErrs.first_name
          }
        }
        if (field === "last_name") {
          if (!value) {
            newErrs.last_name = "Last name is required"
          } else {
            delete newErrs.last_name
          }
        }
        if (field === "role_id") {
          if (!value) {
            newErrs.role_id = "Please select a role"
          } else {
            delete newErrs.role_id
          }
        }
        if (field === "password") {
          if (!value) {
            newErrs.password = "Password is required"
          } else if (value.length < 6) {
            newErrs.password = "Password must be at least 6 characters"
          } else {
            delete newErrs.password
          }

          if (prev.confirm_password && prev.confirm_password !== value) {
            newErrs.confirm_password = "Passwords do not match"
          } else if (prev.confirm_password && prev.confirm_password === value) {
            delete newErrs.confirm_password
          }
        }
        if (field === "confirm_password") {
          if (!value) {
            newErrs.confirm_password = "Confirm password is required"
          } else if (value !== prev.password) {
            newErrs.confirm_password = "Passwords do not match"
          } else {
            delete newErrs.confirm_password
          }
        }
        if (field === "phone") {
          if (!value) {
            delete newErrs.phone
          } else if (!/^\+?[1-9]\d{9,14}$/.test(value)) {
            newErrs.phone = "Invalid phone format (must be 10 digits, e.g. +91 9876543211)"
          } else {
            delete newErrs.phone
          }
        }

        return newErrs
      })
      return updated
    })
  }

  // Edit real-time change validation
  const handleEditChange = (field, value) => {
    setEditForm((prev) => {
      const updated = { ...prev, [field]: value }
      setEditErrors((errs) => {
        const newErrs = { ...errs }

        if (field === "first_name") {
          if (!value) {
            newErrs.first_name = "First name is required"
          } else {
            delete newErrs.first_name
          }
        }
        if (field === "last_name") {
          if (!value) {
            newErrs.last_name = "Last name is required"
          } else {
            delete newErrs.last_name
          }
        }
        if (field === "role_id") {
          if (!value) {
            newErrs.role_id = "Role is required"
          } else {
            delete newErrs.role_id
          }
        }
        if (field === "password") {
          if (value && value.length < 6) {
            newErrs.password = "Password must be at least 6 characters"
          } else {
            delete newErrs.password
          }
        }
        if (field === "phone") {
          if (!value) {
            delete newErrs.phone
          } else if (!/^\+?[1-9]\d{9,14}$/.test(value)) {
            newErrs.phone = "Invalid phone format (must be 10 digits, e.g. +91 9876543211)"
          } else {
            delete newErrs.phone
          }
        }

        return newErrs
      })
      return updated
    })
  }

  // Onboard validation
  const validateOnboard = () => {
    const errs = {}
    if (!onboardForm.email) {
      errs.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(onboardForm.email)) {
      errs.email = "Invalid email format"
    }

    if (!onboardForm.password) {
      errs.password = "Password is required"
    } else if (onboardForm.password.length < 6) {
      errs.password = "Password must be at least 6 characters"
    }

    if (onboardForm.password !== onboardForm.confirm_password) {
      errs.confirm_password = "Passwords do not match"
    }

    if (!onboardForm.first_name) errs.first_name = "First name is required"
    if (!onboardForm.last_name) errs.last_name = "Last name is required"
    if (!onboardForm.role_id) errs.role_id = "Please select a role"

    if (onboardForm.phone && !/^\+?[1-9]\d{9,14}$/.test(onboardForm.phone)) {
      errs.phone = "Invalid phone format (must be 10 digits, e.g. +91 9876543211)"
    }

    return errs
  }

  const handleOnboardSubmit = async (e) => {
    e.preventDefault()
    setOnboardErrors({})
    const errs = validateOnboard()
    if (Object.keys(errs).length > 0) {
      setOnboardErrors(errs)
      return
    }

    const ok = await confirm({
      title: `Onboard staff ${onboardForm.first_name} ${onboardForm.last_name}?`,
      confirmLabel: "Onboard staff",
    })
    if (!ok) return

    setIsOnboarding(true)
    setSuccessBanner("")
    try {
      const res = await onboardStaff(onboardForm)

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(parseErrorDetail(errJson.detail, "Failed to onboard staff member"))
      }

      const json = await res.json()
      const employeeId = json.data?.employee_id || ""
      setSuccessBanner(`Staff onboarded successfully! Assigned ID: ${employeeId}`)

      setIsOnboardOpen(false)
      setOnboardForm({
        email: "",
        password: "",
        confirm_password: "",
        first_name: "",
        last_name: "",
        phone: "",
        role_id: "",
      })
      fetchData()
    } catch (err) {
      setOnboardErrors({ global: err.message })
    } finally {
      setIsOnboarding(false)
    }
  }

  // Edit validation
  const validateEdit = () => {
    const errs = {}
    if (!editForm.first_name) errs.first_name = "First name is required"
    if (!editForm.last_name) errs.last_name = "Last name is required"
    if (!editForm.role_id) errs.role_id = "Role is required"

    if (editForm.password && editForm.password.length < 6) {
      errs.password = "Password must be at least 6 characters"
    }

    if (editForm.phone && !/^\+?[1-9]\d{9,14}$/.test(editForm.phone)) {
      errs.phone = "Invalid phone format (must be 10 digits, e.g. +91 9876543211)"
    }

    return errs
  }

  const handleEditOpen = (staff) => {
    setSelectedStaff(staff)
    setEditForm({
      first_name: staff.first_name,
      last_name: staff.last_name,
      phone: staff.phone || "",
      role_id: staff.role_id,
      password: "",
      is_active: staff.is_active,
    })
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setEditErrors({})
    const errs = validateEdit()
    if (Object.keys(errs).length > 0) {
      setEditErrors(errs)
      return
    }

    const ok = await confirm({
      title: `Save changes for ${editForm.first_name} ${editForm.last_name}?`,
      confirmLabel: "Save changes",
    })
    if (!ok) return

    setIsEditing(true)
    try {
      const payload = {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        phone: editForm.phone || null,
        role_id: editForm.role_id,
        is_active: editForm.is_active,
      }

      if (editForm.password) {
        payload.password = editForm.password
      }

      const res = await updateStaff(selectedStaff.id, payload)

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(parseErrorDetail(errJson.detail, "Failed to update staff member"))
      }

      setIsEditOpen(false)
      fetchData()
    } catch (err) {
      setEditErrors({ global: err.message })
    } finally {
      setIsEditing(false)
    }
  }

  const handleToggleStatus = async (staff) => {
    if (staff.id === currentUser?.id) return

    const action = staff.is_active ? "Deactivate" : "Activate"
    const ok = await confirm({
      title: `${action} staff ${staff.first_name} ${staff.last_name}?`,
      confirmLabel: action,
      tone: staff.is_active ? "danger" : undefined,
    })
    if (!ok) return

    try {
      const res = staff.is_active
        ? await deactivateStaff(staff.id)
        : await activateStaff(staff.id)

      const actionName = staff.is_active ? "deactivate" : "activate"
      if (!res.ok) {
        throw new Error(`Failed to ${actionName} staff member`)
      }

      fetchData()
    } catch (err) {
      alert(err.message)
    }
  }

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <ShieldAlert className="w-12 h-12 text-error-500 animate-bounce" />
        <h3 className="text-lg font-bold text-slate-900">Error Loading Staff Directory</h3>
        <p className="text-sm font-semibold text-slate-500">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-md shadow-brand-500/10"
        >
          Retry Fetching
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in fade-in duration-200">

      {/* Title Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Staff Directory</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage platform administrators and access privileges.</p>
        </div>

        <button
          onClick={() => {
            setSuccessBanner("")
            setIsOnboardOpen(true)
          }}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center gap-2 whitespace-nowrap self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard Staff</span>
        </button>
      </div>

      {successBanner && (
        <div className="flex items-start justify-between gap-2.5 p-4 bg-success-50 border border-success-100 rounded-xl text-sm font-semibold text-success-700 animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5">
            <UserCheck className="w-5 h-5 text-success-500 shrink-0" />
            <p className="flex-1">{successBanner}</p>
          </div>
          <button onClick={() => setSuccessBanner("")} className="text-success-500 hover:text-success-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Directory Table Grid Card */}
      <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden w-full">
        <div className="w-full">
          <table className="w-full text-left border-collapse table-fixed text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="pl-4 pr-2 py-3.5 w-[56%] md:w-[40%] lg:w-[28%]">Staff</th>
                <th className="px-2 py-3.5 hidden md:table-cell md:w-[30%] lg:w-[28%]">Contact</th>
                <th className="px-2 py-3.5 hidden lg:table-cell lg:w-[18%]">Assigned Role</th>
                <th className="px-2 py-3.5 w-[24%] md:w-[16%] lg:w-[14%]">Status</th>
                <th className="pl-2 pr-6 py-3.5 w-[20%] md:w-[14%] lg:w-[12%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
              {staffList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-400 font-medium">
                    No staff members found.
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="pl-4 pr-2 py-3.5 min-w-0">
                      <div className="min-w-0">
                        <p className="text-slate-800 font-semibold truncate" title={`${staff.first_name} ${staff.last_name}`}>
                          {staff.first_name} {staff.last_name}
                          {staff.id === currentUser?.id && (
                            <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-brand-50 text-brand-700 rounded-md font-bold inline-block font-sans">
                              You
                            </span>
                          )}
                        </p>
                        {staff.employee_id && (
                          <p className="text-[10px] text-slate-400 tabular-nums truncate" title={staff.employee_id}>
                            {staff.employee_id}
                          </p>
                        )}
                        <div className="lg:hidden mt-0.5">
                          <span
                            className="inline-block max-w-full truncate text-[11px] xl:text-xs tabular-nums font-bold uppercase tracking-wider text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200"
                            title={staff.role?.name || staff.role_name || staff.role || "—"}
                          >
                            {staff.role?.name || staff.role_name || staff.role || "—"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3.5 hidden md:table-cell min-w-0">
                      <div className="min-w-0">
                        <p className="font-normal text-slate-700 truncate" title={staff.email}>
                          {staff.email}
                        </p>
                        {staff.phone && (
                          <p className="text-[10px] text-slate-400 tabular-nums truncate" title={staff.phone}>
                            {staff.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3.5 whitespace-nowrap hidden lg:table-cell">
                      <span
                        className="inline-block max-w-full truncate text-[11px] xl:text-xs tabular-nums font-bold uppercase tracking-wider text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200"
                        title={staff.role?.name || staff.role_name || staff.role || "—"}
                      >
                        {staff.role?.name || staff.role_name || staff.role || "—"}
                      </span>
                    </td>
                    <td className="px-2 py-3.5 whitespace-nowrap">
                      {staff.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-success-50 text-success-700 border-success-100">
                          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-success-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-slate-50 text-slate-500 border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-slate-400" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="pl-2 pr-6 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEditOpen(staff)}
                          className="p-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-800 transition-all active:scale-95 inline-flex items-center"
                          title="Edit Staff"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(staff)}
                          disabled={staff.id === currentUser?.id}
                          className={`p-2 border rounded-xl transition-all active:scale-95 inline-flex items-center ${staff.is_active
                            ? "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-400 hover:text-slate-700 disabled:opacity-40 disabled:hover:bg-transparent"
                            : "border-success-100 bg-success-50 hover:bg-success-100 text-success-700"
                            }`}
                          title={staff.is_active ? "Deactivate Staff" : "Activate Staff"}
                        >
                          {staff.is_active ? <UserMinus className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard Modal Overlay */}
      {isOnboardOpen && (
        <Modal onClose={() => setIsOnboardOpen(false)}>
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-900 text-lg">Onboard Staff Member</h3>
              <button
                onClick={() => setIsOnboardOpen(false)}
                className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {onboardErrors.global && (
                <div className="flex items-start gap-2.5 p-4 bg-error-50 border border-error-100 rounded-xl text-sm font-semibold text-error-800">
                  <ShieldAlert className="w-5 h-5 text-error-800 shrink-0" />
                  <p className="flex-1">{onboardErrors.global}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    First Name <span className="text-error-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      value={onboardForm.first_name}
                      onChange={(e) => handleOnboardChange("first_name", e.target.value)}
                      placeholder="Jane"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                    />
                  </div>
                  {onboardErrors.first_name && <p className="text-xs text-error-800 font-semibold mt-1">{onboardErrors.first_name}</p>}
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Last Name <span className="text-error-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      value={onboardForm.last_name}
                      onChange={(e) => handleOnboardChange("last_name", e.target.value)}
                      placeholder="Smith"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                    />
                  </div>
                  {onboardErrors.last_name && <p className="text-xs text-error-800 font-semibold mt-1">{onboardErrors.last_name}</p>}
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Email Address <span className="text-error-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="email"
                    value={onboardForm.email}
                    onChange={(e) => handleOnboardChange("email", e.target.value)}
                    placeholder="staff@example.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>
                {onboardErrors.email && <p className="text-xs text-error-800 font-semibold mt-1">{onboardErrors.email}</p>}
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Phone Number <span className="text-error-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={onboardForm.phone}
                    onChange={(e) => handleOnboardChange("phone", e.target.value)}
                    placeholder="+1999999999"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>
                {onboardErrors.phone && <p className="text-xs text-error-800 font-semibold mt-1">{onboardErrors.phone}</p>}
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Assigned Role <span className="text-error-500 font-bold">*</span>
                </label>
                <select
                  value={onboardForm.role_id}
                  onChange={(e) => handleOnboardChange("role_id", e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white text-slate-800 font-semibold transition-all"
                >
                  <option value="">Select an access role...</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                {onboardErrors.role_id && <p className="text-xs text-error-800 font-semibold mt-1">{onboardErrors.role_id}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Password <span className="text-error-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="password"
                      value={onboardForm.password}
                      onChange={(e) => handleOnboardChange("password", e.target.value)}
                      placeholder="••••••"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                    />
                  </div>
                  {onboardErrors.password && <p className="text-xs text-error-800 font-semibold mt-1">{onboardErrors.password}</p>}
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Confirm Password <span className="text-error-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="password"
                      value={onboardForm.confirm_password}
                      onChange={(e) => handleOnboardChange("confirm_password", e.target.value)}
                      placeholder="••••••"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                    />
                  </div>
                  {onboardErrors.confirm_password && <p className="text-xs text-error-800 font-semibold mt-1">{onboardErrors.confirm_password}</p>}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-100 mt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsOnboardOpen(false)}
                  className="border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 transition-all w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isOnboarding}
                  className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
                >
                  {isOnboarding ? <Spinner size="sm" /> : null}
                  <span>Onboard Member</span>
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Edit Modal Overlay */}
      {isEditOpen && (
        <Modal onClose={() => setIsEditOpen(false)}>
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-900 text-lg">Edit Staff Details</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {editErrors.global && (
                <div className="flex items-start gap-2.5 p-4 bg-error-50 border border-error-100 rounded-xl text-sm font-semibold text-error-800">
                  <ShieldAlert className="w-5 h-5 text-error-800 shrink-0" />
                  <p className="flex-1">{editErrors.global}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    First Name <span className="text-error-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      value={editForm.first_name}
                      onChange={(e) => handleEditChange("first_name", e.target.value)}
                      placeholder="Jane"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                    />
                  </div>
                  {editErrors.first_name && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.first_name}</p>}
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Last Name <span className="text-error-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      value={editForm.last_name}
                      onChange={(e) => handleEditChange("last_name", e.target.value)}
                      placeholder="Smith"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                    />
                  </div>
                  {editErrors.last_name && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.last_name}</p>}
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Phone Number <span className="text-error-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => handleEditChange("phone", e.target.value)}
                    placeholder="+1999999999"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>
                {editErrors.phone && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.phone}</p>}
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Assigned Role <span className="text-error-500 font-bold">*</span>
                </label>
                <select
                  value={editForm.role_id}
                  onChange={(e) => handleEditChange("role_id", e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white text-slate-800 font-semibold transition-all"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                {editErrors.role_id && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.role_id}</p>}
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Reset Password (Optional)</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => handleEditChange("password", e.target.value)}
                    placeholder="Enter new password to reset..."
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>
                {editErrors.password && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.password}</p>}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    disabled={selectedStaff?.id === currentUser?.id}
                    className="w-4 h-4 rounded-lg border-slate-200 text-brand-600 focus:ring-brand-500 focus:ring-2 focus:ring-offset-2 transition-all cursor-pointer disabled:opacity-40"
                  />
                  Active Status (Deactivating blocks system access)
                </label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-100 mt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 transition-all w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
                >
                  {isEditing ? <Spinner size="sm" /> : null}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

    </div>
  )
}

export default StaffManagement
