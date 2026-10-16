import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Edit2, ShieldAlert, X, Shield, FileText } from "lucide-react"
import useAuth from "@/hooks/useAuth"
import { getRoles, createRole, updateRole, getPermissions } from "@/api/roles"
import Spinner from "@/components/ui/Spinner"
import Modal from "@/components/ui/Modal"
import useConfirm from "@/hooks/useConfirm"
import { parseBackendUniqueError } from "@/utils/errorUtils"

function getPermissionLabel(permValue, permissionsList = []) {
  const found = permissionsList.find((p) => p.value === permValue)
  return found ? found.label : permValue
}

function RoleManagement() {
  const confirm = useConfirm()
  const { isSuperAdmin, isLoading: isAuthLoading } = useAuth()
  const navigate = useNavigate()

  const [rolesList, setRolesList] = useState([])
  const [systemPermissions, setSystemPermissions] = useState([])
  const [permissionsLoading, setPermissionsLoading] = useState(true)
  const [permissionsError, setPermissionsError] = useState("")
  const [selectedRolePermissions, setSelectedRolePermissions] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)

  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    permissions: [],
  })
  const [createErrors, setCreateErrors] = useState({})
  const [isCreating, setIsCreating] = useState(false)

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    permissions: [],
    is_active: true,
  })
  const [editErrors, setEditErrors] = useState({})
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (!isAuthLoading && !isSuperAdmin) {
      navigate("/", { replace: true })
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
    setPermissionsLoading(true)
    setPermissionsError("")
    try {
      const res = await getPermissions()
      if (!res.ok) throw new Error("Couldn't load permissions")
      const json = await res.json()
      setSystemPermissions(
        json.data.map((p) => ({
          value: p.key,
          label: p.label,
          description: p.description,
        }))
      )
    } catch {
      setPermissionsError("Couldn't load permissions")
    } finally {
      setPermissionsLoading(false)
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

  const handlePermissionToggle = (permissionValue, formType) => {
    const form = formType === "create" ? createForm : editForm
    const setForm = formType === "create" ? setCreateForm : setEditForm

    const hasPermission = form.permissions.includes(permissionValue)
    const newPermissions = hasPermission
      ? form.permissions.filter((p) => p !== permissionValue)
      : [...form.permissions, permissionValue]

    setForm({ ...form, permissions: newPermissions })
  }

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

    const ok = await confirm({
      title: `Create role ${createForm.name.trim()}?`,
      message: `Are you sure you want to create the role "${createForm.name.trim()}"?`,
      confirmLabel: "Create role",
    })
    if (!ok) return

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

    const ok = await confirm({
      title: `Save changes for role ${editForm.name.trim()}?`,
      message: `Are you sure you want to update the role "${editForm.name.trim()}"?`,
      confirmLabel: "Save changes",
    })
    if (!ok) return

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Access Control Roles</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Configure role descriptions and assign granular feature permissions.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center gap-2 whitespace-nowrap self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Role</span>
        </button>
      </div>

      <div className="bg-white border border-slate-100 shadow-lg rounded-2xl overflow-hidden w-full">
        <div className="w-full">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4 w-[55%] md:w-[35%] lg:w-[22%]">Role Name</th>
                <th className="hidden md:table-cell px-6 py-4 w-[35%] lg:w-[28%]">Description</th>
                <th className="hidden lg:table-cell px-6 py-4 w-[28%]">Assigned Permissions</th>
                <th className="px-6 py-4 w-[25%] md:w-[15%] lg:w-[10%]">
                  <span className="hidden md:inline">Status</span>
                </th>
                <th className="pl-2 pr-6 py-4 w-[20%] md:w-[15%] lg:w-[12%] text-right">Actions</th>
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
                        <span
                          className="text-slate-800 font-bold uppercase tracking-wider text-xs truncate"
                          title={role.name}
                        >
                          {role.name}
                        </span>
                      </div>
                      <div className="md:hidden text-[10px] text-slate-400 truncate mt-0.5" title={role.description}>
                        {role.description || "—"}
                      </div>
                      <div className="lg:hidden text-[10px] text-slate-400 truncate">
                        {role.permissions && role.permissions.length > 0
                          ? `${role.permissions.length} permissions`
                          : "No permissions"}
                      </div>
                    </td>
                    <td
                      className="hidden md:table-cell px-6 py-4 font-normal text-slate-500 truncate"
                      title={role.description}
                    >
                      {role.description || "—"}
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {role.permissions && role.permissions.length > 0 ? (
                          <>
                            {role.permissions.slice(0, 2).map((perm) => (
                              <span
                                key={perm}
                                className="px-2 py-0.5 text-[10px] bg-slate-50 text-slate-600 border border-slate-200 rounded-md font-semibold whitespace-nowrap"
                              >
                                {getPermissionLabel(perm, systemPermissions)}
                              </span>
                            ))}
                            {role.permissions.length > 2 && (
                              <span
                                onClick={() => setSelectedRolePermissions(role)}
                                className="px-2 py-0.5 text-[10px] bg-brand-50 text-brand-700 border border-brand-200 rounded-md font-bold cursor-pointer select-none hover:bg-brand-100 transition-colors whitespace-nowrap"
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      {role.is_active ? (
                        <span
                          title="Active"
                          className="inline-flex items-center px-1.5 xl:px-2.5 py-0.5 rounded-full text-[10px] xl:text-xs font-semibold border bg-success-50 text-success-700 border-success-100 whitespace-nowrap"
                        >
                          <span className="w-1.5 h-1.5 rounded-full md:mr-1.5 bg-success-500" aria-hidden="true" />
                          <span className="sr-only md:hidden">Active</span>
                          <span className="hidden md:inline">Active</span>
                        </span>
                      ) : (
                        <span
                          title="Inactive"
                          className="inline-flex items-center px-1.5 xl:px-2.5 py-0.5 rounded-full text-[10px] xl:text-xs font-semibold border bg-slate-50 text-slate-500 border-slate-200 whitespace-nowrap"
                        >
                          <span className="w-1.5 h-1.5 rounded-full md:mr-1.5 bg-slate-400" aria-hidden="true" />
                          <span className="sr-only md:hidden">Inactive</span>
                          <span className="hidden md:inline">Inactive</span>
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

      {isCreateOpen && (
        <Modal onClose={() => setIsCreateOpen(false)}>
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-900 text-lg">Create Custom Role</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
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
                  {createErrors.name && (
                    <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.name}</p>
                  )}
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
                  {createErrors.description && (
                    <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.description}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Configure Permissions <span className="text-error-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    {permissionsLoading ? (
                      <div className="col-span-full flex items-center justify-center py-6">
                        <Spinner size="sm" />
                      </div>
                    ) : permissionsError ? (
                      <div className="col-span-full flex flex-col items-center justify-center py-4 gap-2 text-center">
                        <p className="text-xs font-semibold text-error-800">{permissionsError}</p>
                        <button
                          type="button"
                          onClick={fetchPermissions}
                          className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold"
                        >
                          Retry
                        </button>
                      </div>
                    ) : systemPermissions.length === 0 ? (
                      <p className="col-span-full text-center py-4 text-xs text-slate-400">No permissions available.</p>
                    ) : (
                      systemPermissions.map((perm) => (
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
                            <p className="text-[10px] font-medium text-slate-400 leading-snug">{perm.description}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  {createErrors.permissions && (
                    <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.permissions}</p>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="w-full sm:w-auto border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || permissionsLoading || !!permissionsError}
                  className="w-full sm:w-auto px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCreating ? <Spinner size="sm" /> : null}
                  <span>Create Role</span>
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {isEditOpen && (
        <Modal onClose={() => setIsEditOpen(false)}>
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-900 text-lg">Edit Access Role</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
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
                  {editErrors.description && (
                    <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.description}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Configure Permissions <span className="text-error-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    {permissionsLoading ? (
                      <div className="col-span-full flex items-center justify-center py-6">
                        <Spinner size="sm" />
                      </div>
                    ) : permissionsError ? (
                      <div className="col-span-full flex flex-col items-center justify-center py-4 gap-2 text-center">
                        <p className="text-xs font-semibold text-error-800">{permissionsError}</p>
                        <button
                          type="button"
                          onClick={fetchPermissions}
                          className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold"
                        >
                          Retry
                        </button>
                      </div>
                    ) : systemPermissions.length === 0 ? (
                      <p className="col-span-full text-center py-4 text-xs text-slate-400">No permissions available.</p>
                    ) : (
                      systemPermissions.map((perm) => (
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
                            <p className="text-[10px] font-medium text-slate-400 leading-snug">{perm.description}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  {editErrors.permissions && (
                    <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.permissions}</p>
                  )}
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
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="w-full sm:w-auto border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing || permissionsLoading || !!permissionsError}
                  className="w-full sm:w-auto px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isEditing ? <Spinner size="sm" /> : null}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {selectedRolePermissions && (
        <Modal onClose={() => setSelectedRolePermissions(null)}>
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-sm max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
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

            <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              <p className="text-xs font-semibold text-slate-500">All permissions assigned to this security role:</p>
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                {selectedRolePermissions.permissions.map((perm) => (
                  <div
                    key={perm}
                    className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-xs"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                    <span>{getPermissionLabel(perm, systemPermissions)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 shrink-0">
              <button
                onClick={() => setSelectedRolePermissions(null)}
                className="w-full sm:w-auto px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-md shadow-brand-500/10 text-center"
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

export default RoleManagement
