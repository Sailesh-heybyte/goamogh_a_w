import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Edit2, ShieldAlert, X, Shield, FileText } from "lucide-react"
import useAuth from "@/hooks/useAuth"
import { getRoles, createRole, updateRole, getPermissions } from "@/services/roles"
import Spinner from "@/components/ui/Spinner"
import { parseBackendUniqueError } from "@/utils/errorUtils"

// Fallback permissions definition
const DEFAULT_PERMISSIONS = [
  { value: "stock_manage", label: "Stock Management", category: "Stock", description: "Permission to adjust stock levels and record damages" },
  { value: "purchase_manage", label: "Purchase Management", category: "Purchase", description: "Permission to manage suppliers, purchase orders and purchase entries" },
  { value: "production_manage", label: "Production Management", category: "Production", description: "Permission to manage and close work orders" },
  { value: "pricing_manage", label: "Pricing Management", category: "Pricing", description: "Permission to configure daily B2C/B2B selling prices" }
]

function parseErrorDetail(detail, defaultMsg) {
  if (!detail) return defaultMsg
  if (Array.isArray(detail)) {
    const messages = detail.map((d) => d.msg).filter(Boolean)
    return messages.length > 0 ? messages.join(", ") : defaultMsg
  }
  return typeof detail === "string" ? detail : defaultMsg
}

function getPermissionLabel(permValue, permissionsList = []) {
  if (permValue === "all") return "Full Access"
  const found = permissionsList.find((p) => p.value === permValue)
  if (found) return found.label
  return permValue
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}


function RoleManagement() {
  const { isSuperAdmin, isLoading: isAuthLoading } = useAuth()
  const navigate = useNavigate()

  const [rolesList, setRolesList] = useState([])
  const [systemPermissions, setSystemPermissions] = useState(DEFAULT_PERMISSIONS)
  const [selectedRolePermissions, setSelectedRolePermissions] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)

  // Create form state
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    permissions: [],
  })
  const [createErrors, setCreateErrors] = useState({})
  const [isCreating, setIsCreating] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    permissions: [],
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

  const fetchRoles = async () => {
    setIsLoading(true)
    setError("")
    try {
      const res = await getRoles()
      if (!res.ok) {
        throw new Error("Failed to load roles list")
      }
      const data = await res.json()
      setRolesList(data.data || [])
    } catch (err) {
      setError(err.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const res = await getPermissions()
      if (res.ok) {
        const json = await res.json()
        let parsed = []
        if (Array.isArray(json.data)) {
          parsed = json.data.map((p) => {
            const val = p.code || p.key || p.value || ""
            const firstWord = val.split("_")[0]
            const category = p.category || (firstWord.charAt(0).toUpperCase() + firstWord.slice(1))
            return {
              value: val,
              label: p.label || val.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
              description: p.description || p.label || "",
              category,
            }
          })
        } else if (json.data && typeof json.data === "object") {
          parsed = Object.entries(json.data).map(([key, desc]) => {
            const firstWord = key.split("_")[0]
            const category = firstWord.charAt(0).toUpperCase() + firstWord.slice(1)
            return {
              value: key,
              label: key.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
              description: desc || "",
              category,
            }
          })
        }
        if (parsed.length > 0) {
          setSystemPermissions(parsed)
        }
      }
    } catch (err) {
      console.error("Failed to load permissions:", err)
    }
  }

  useEffect(() => {
    if (isSuperAdmin) {
      const timer = setTimeout(() => {
        fetchRoles()
        fetchPermissions()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isSuperAdmin])


  // Handle permission checklist toggle
  const handlePermissionToggle = (permissionValue, formType) => {
    const form = formType === "create" ? createForm : editForm
    const setForm = formType === "create" ? setCreateForm : setEditForm

    const hasPermission = form.permissions.includes(permissionValue)
    const newPermissions = hasPermission
      ? form.permissions.filter((p) => p !== permissionValue)
      : [...form.permissions, permissionValue]

    setForm({ ...form, permissions: newPermissions })
  }

  // Create validation
  const validateCreate = () => {
    const errs = {}
    if (!createForm.name || !createForm.name.trim()) {
      errs.name = "Role name is required"
    } else if (createForm.name.trim().length < 2 || createForm.name.trim().length > 50) {
      errs.name = "Role name must be between 2 and 50 characters"
    }

    if (!createForm.description || !createForm.description.trim()) {
      errs.description = "Role description is required"
    }

    if (!createForm.permissions || createForm.permissions.length === 0) {
      errs.permissions = "At least one permission must be selected"
    }

    return errs
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setCreateErrors({})
    const errs = validateCreate()
    if (Object.keys(errs).length > 0) {
      setCreateErrors(errs)
      return
    }

    setIsCreating(true)
    try {
      const res = await createRole({
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        permissions: createForm.permissions,
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        const parsed = parseBackendUniqueError(errJson.detail, "Failed to create role")
        if (Object.keys(parsed.fieldErrors).length > 0) {
          setCreateErrors((prev) => ({ ...prev, ...parsed.fieldErrors }))
        }
        if (parsed.global) {
          setCreateErrors((prev) => ({ ...prev, global: parsed.global }))
        }
        return
      }

      setIsCreateOpen(false)
      setCreateForm({ name: "", description: "", permissions: [] })
      fetchRoles()
    } catch (err) {
      setCreateErrors({ global: err.message })
    } finally {
      setIsCreating(false)
    }
  }

  // Edit validation
  const validateEdit = () => {
    const errs = {}
    if (!editForm.name || !editForm.name.trim()) {
      errs.name = "Role name is required"
    } else if (editForm.name.trim().length < 2 || editForm.name.trim().length > 50) {
      errs.name = "Role name must be between 2 and 50 characters"
    }

    if (!editForm.description || !editForm.description.trim()) {
      errs.description = "Role description is required"
    }

    if (!editForm.permissions || editForm.permissions.length === 0) {
      errs.permissions = "At least one permission must be selected"
    }

    return errs
  }

  const handleEditOpen = (role) => {
    setSelectedRole(role)
    setEditForm({
      name: role.name,
      description: role.description || "",
      permissions: role.permissions || [],
      is_active: role.is_active,
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

    setIsEditing(true)
    try {
      const res = await updateRole(selectedRole.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        permissions: editForm.permissions,
        is_active: editForm.is_active,
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        const parsed = parseBackendUniqueError(errJson.detail, "Failed to update role")
        if (Object.keys(parsed.fieldErrors).length > 0) {
          setEditErrors((prev) => ({ ...prev, ...parsed.fieldErrors }))
        }
        if (parsed.global) {
          setEditErrors((prev) => ({ ...prev, global: parsed.global }))
        }
        return
      }

      setIsEditOpen(false)
      fetchRoles()
    } catch (err) {
      setEditErrors({ global: err.message })
    } finally {
      setIsEditing(false)
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
        <h3 className="text-lg font-bold text-slate-900">Error Loading Security Roles</h3>
        <p className="text-sm font-semibold text-slate-500">{error}</p>
        <button
          onClick={fetchRoles}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-md shadow-brand-500/10"
        >
          Retry Fetching
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in fade-in duration-200">

      {/* Header title block */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Access Control Roles</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Configure role descriptions and assign granular feature permissions.</p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Role</span>
        </button>
      </div>

      {/* Roles list table */}
      <div className="bg-white border border-slate-100 shadow-lg rounded-2xl overflow-hidden w-full">
        <div className="w-full overflow-hidden">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4 w-[18%]">Role Name</th>
                <th className="px-6 py-4 w-[30%]">Description</th>
                <th className="px-6 py-4 w-[26%]">Assigned Permissions</th>
                <th className="px-6 py-4 w-[11%]">Status</th>
                <th className="pl-2 pr-6 py-4 w-[15%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-800">
              {rolesList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-400 font-medium">
                    No roles created.
                  </td>
                </tr>
              ) : (
                rolesList.map((role) => (
                  <tr key={role.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-brand-600 shrink-0" />
                        <span className="text-slate-800 font-bold uppercase tracking-wider text-xs">
                          {role.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-normal text-slate-500 max-w-xs truncate">
                      {role.description || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {role.permissions && role.permissions.length > 0 ? (
                          <>
                            {role.permissions.slice(0, 2).map((perm) => (
                              <span
                                key={perm}
                                className="px-2 py-0.5 text-[10px] bg-slate-50 text-slate-650 border border-slate-200 rounded-md font-semibold"
                              >
                                {getPermissionLabel(perm, systemPermissions)}
                              </span>
                            ))}
                            {role.permissions.length > 2 && (
                              <span
                                onClick={() => setSelectedRolePermissions(role)}
                                className="px-2 py-0.5 text-[10px] bg-brand-50 text-brand-700 border border-brand-200 rounded-md font-bold cursor-pointer select-none hover:bg-brand-100 transition-colors"
                              >
                                +{role.permissions.length - 2} more
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400 font-normal">None Assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {role.is_active ? (
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
                    <td className="pl-2 pr-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleEditOpen(role)}
                        className="p-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors active:scale-95 inline-flex items-center gap-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">Edit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Role Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">Create Custom Role</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {createErrors.global && (
                <div className="flex items-start gap-2.5 p-4 bg-error-50 border border-error-100 rounded-xl text-sm font-semibold text-error-800">
                  <ShieldAlert className="w-5 h-5 text-error-800 shrink-0" />
                  <p className="flex-1">{createErrors.global}</p>
                </div>
              )}

              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Role Name <span className="text-error-500">*</span>
                </label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="E.g., Procurement Manager"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>
                {createErrors.name && <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.name}</p>}
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Role Description <span className="text-error-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Describe role responsibilities..."
                    rows="3"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
                {createErrors.description && <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.description}</p>}
              </div>

              {/* Permissions Checklist Grid */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Configure Permissions <span className="text-error-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  {systemPermissions.map((perm) => (
                    <label
                      key={perm.value}
                      className="flex items-start gap-2.5 p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-all cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={createForm.permissions.includes(perm.value)}
                        onChange={() => handlePermissionToggle(perm.value, "create")}
                        className="mt-0.5 w-4 h-4 rounded border-slate-200 text-brand-600 focus:ring-brand-500 transition-all"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{perm.label}</p>
                        <p className="text-[10px] font-semibold text-slate-450 uppercase">{perm.category}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {createErrors.permissions && <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.permissions}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                  {isCreating ? <Spinner size="sm" /> : null}
                  <span>Create Role</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">Edit Access Role</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {editErrors.global && (
                <div className="flex items-start gap-2.5 p-4 bg-error-50 border border-error-100 rounded-xl text-sm font-semibold text-error-800">
                  <ShieldAlert className="w-5 h-5 text-error-800 shrink-0" />
                  <p className="flex-1">{editErrors.global}</p>
                </div>
              )}

              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Role Name <span className="text-error-500">*</span>
                </label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="E.g., Procurement Manager"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>
                {editErrors.name && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.name}</p>}
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Role Description <span className="text-error-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Describe role responsibilities..."
                    rows="3"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
                {editErrors.description && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.description}</p>}
              </div>

              {/* Permissions Checklist Grid */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Configure Permissions <span className="text-error-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  {systemPermissions.map((perm) => (
                    <label
                      key={perm.value}
                      className="flex items-start gap-2.5 p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-all cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={editForm.permissions.includes(perm.value)}
                        onChange={() => handlePermissionToggle(perm.value, "edit")}
                        className="mt-0.5 w-4 h-4 rounded border-slate-200 text-brand-600 focus:ring-brand-500 transition-all"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{perm.label}</p>
                        <p className="text-[10px] font-semibold text-slate-450 uppercase">{perm.category}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {editErrors.permissions && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.permissions}</p>}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    className="w-4 h-4 rounded-lg border-slate-200 text-brand-600 focus:ring-brand-500 focus:ring-2 focus:ring-offset-2 transition-all cursor-pointer"
                  />
                  Active Status
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                  {isEditing ? <Spinner size="sm" /> : null}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Permissions Modal */}
      {selectedRolePermissions && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4.5 h-4.5 text-brand-600 shrink-0" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                  {selectedRolePermissions.name} Permissions
                </h3>
              </div>
              <button
                onClick={() => setSelectedRolePermissions(null)}
                className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs font-semibold text-slate-500">
                All permissions assigned to this security role:
              </p>
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                {selectedRolePermissions.permissions.map((perm) => (
                  <div
                    key={perm}
                    className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-slate-805 font-bold text-xs animate-in fade-in slide-in-from-bottom-1 duration-150"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                    <span>{getPermissionLabel(perm, systemPermissions)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedRolePermissions(null)}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-md shadow-brand-500/10"
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

export default RoleManagement
