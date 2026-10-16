import { useState, useEffect } from "react"
import { Plus, Edit2, ShieldAlert, X, FolderOpen, AlertTriangle, Calendar, Search } from "lucide-react"
import {
  getCategoriesCached,
  clearCategoriesCache,
  createCategory,
  updateCategory,
  getCategoryDetails,
} from "@/api/categories"
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

function CategoryManagement() {
  const confirm = useConfirm()
  const [categoriesList, setCategoriesList] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    image: "",
  })
  const [createErrors, setCreateErrors] = useState({})
  const [isCreating, setIsCreating] = useState(false)

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    image: "",
    is_active: true,
  })
  const [editErrors, setEditErrors] = useState({})
  const [isEditing, setIsEditing] = useState(false)

  const fetchCategories = async () => {
    setIsLoading(true)
    setError("")
    try {
      const data = await getCategoriesCached(false)
      setCategoriesList(data || [])
    } catch (err) {
      setError(err.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories()
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const handleCreateChange = (field, value) => {
    setCreateForm((prev) => {
      const updated = { ...prev, [field]: value }
      setCreateErrors((errs) => {
        const newErrs = { ...errs }
        if (field === "name") {
          if (!value || value.length < 2 || value.length > 100) {
            newErrs.name = "Category name must be between 2 and 100 characters long"
          } else {
            delete newErrs.name
          }
        }
        return newErrs
      })
      return updated
    })
  }

  const handleEditChange = (field, value) => {
    setEditForm((prev) => {
      const updated = { ...prev, [field]: value }
      setEditErrors((errs) => {
        const newErrs = { ...errs }
        if (field === "name") {
          if (!value || value.length < 2 || value.length > 100) {
            newErrs.name = "Category name must be between 2 and 100 characters long"
          } else {
            delete newErrs.name
          }
        }
        return newErrs
      })
      return updated
    })
  }

  const validateForm = (form) => {
    const errs = {}
    if (!form.name || form.name.length < 2 || form.name.length > 100) {
      errs.name = "Category name must be between 2 and 100 characters long"
    }
    return errs
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setCreateErrors({})
    const errs = validateForm(createForm)
    if (Object.keys(errs).length > 0) {
      setCreateErrors(errs)
      return
    }

    const ok = await confirm({
      title: `Create category "${createForm.name.trim()}"?`,
      message: "This will add the new product category to the catalog.",
      confirmLabel: "Create",
    })
    if (!ok) return

    setIsCreating(true)
    try {
      const payload = {
        name: createForm.name.trim(),
        description: createForm.description.trim() || null,
        image: createForm.image.trim() || null,
      }

      const res = await createCategory(payload)

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        const errorDetail = errJson.detail

        if (errorDetail === "Category name already exists.") {
          setCreateErrors({ name: "Category name already exists." })
          throw new Error("Validation failed")
        } else {
          throw new Error(parseErrorDetail(errorDetail, "Failed to create category"))
        }
      }

      setIsCreateOpen(false)
      setCreateForm({ name: "", description: "", image: "" })
      clearCategoriesCache()
      fetchCategories()
    } catch (err) {
      if (err.message !== "Validation failed") {
        setCreateErrors({ global: err.message })
      }
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditOpen = async (category) => {
    setSelectedCategory(category)
    setIsDetailLoading(true)
    setIsEditOpen(true)
    setEditErrors({})

    try {
      const res = await getCategoryDetails(category.id)
      if (!res.ok) {
        throw new Error("Failed to load category details")
      }
      const json = await res.json()
      const details = json.data

      setEditForm({
        name: details.name,
        description: details.description || "",
        image: details.image || "",
        is_active: details.is_active,
      })
    } catch (err) {
      setEditErrors({ global: err.message })
    } finally {
      setIsDetailLoading(false)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setEditErrors({})
    const errs = validateForm(editForm)
    if (Object.keys(errs).length > 0) {
      setEditErrors(errs)
      return
    }

    const ok = await confirm({
      title: `Save changes to category "${selectedCategory.name}"?`,
      message: "This will update the category details.",
      confirmLabel: "Save changes",
    })
    if (!ok) return

    setIsEditing(true)
    try {
      const payload = {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        image: editForm.image.trim() || null,
        is_active: editForm.is_active,
      }

      const res = await updateCategory(selectedCategory.id, payload)

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        const errorDetail = errJson.detail

        if (errorDetail === "Category name already exists.") {
          setEditErrors({ name: "Category name already exists." })
          throw new Error("Validation failed")
        } else {
          throw new Error(parseErrorDetail(errorDetail, "Failed to update category"))
        }
      }

      setIsEditOpen(false)
      clearCategoriesCache()
      fetchCategories()
    } catch (err) {
      if (err.message !== "Validation failed") {
        setEditErrors({ global: err.message })
      }
    } finally {
      setIsEditing(false)
    }
  }

  const filteredCategories = categoriesList.filter((cat) => {
    const term = searchQuery.toLowerCase().trim()
    if (!term) return true
    const nameMatch = cat.name.toLowerCase().includes(term)
    const descMatch = cat.description ? cat.description.toLowerCase().includes(term) : false
    return nameMatch || descMatch
  })

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-4 animate-in fade-in duration-200">
        <ShieldAlert className="w-12 h-12 text-error-500 animate-bounce" />
        <h3 className="text-lg font-bold text-slate-900">Error Loading Product Categories</h3>
        <p className="text-sm font-semibold text-slate-500">{error}</p>
        <button
          onClick={fetchCategories}
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
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Product Categories</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Configure classifications for catalog products and materials.
          </p>
        </div>

        <button
          onClick={() => {
            setCreateForm({ name: "", description: "", image: "" })
            setCreateErrors({})
            setIsCreateOpen(true)
          }}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center gap-2 whitespace-nowrap self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Category</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
        <div className="relative w-full sm:flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories by name or description..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-100 shadow-lg rounded-2xl overflow-hidden w-full">
        <div className="w-full">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-3 md:px-6 py-4 w-[55%] md:w-[35%] lg:w-[25%]">Category Name</th>
                <th className="hidden md:table-cell px-3 md:px-6 py-4 w-[40%] lg:w-[35%]">Description</th>
                <th className="hidden lg:table-cell px-3 md:px-6 py-4 w-[16%]">Created Date</th>
                <th className="px-3 md:px-6 py-4 w-[25%] md:w-[15%] lg:w-[12%]">
                  <span className="hidden md:inline">Status</span>
                </th>
                <th className="px-3 md:px-6 py-4 w-[20%] md:w-[10%] lg:w-[12%] text-right">
                  <span className="hidden md:inline">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-800">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-400 font-medium">
                    No categories found.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-3 md:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0">
                          {cat.image ? (
                            <img
                              src={cat.image}
                              alt={cat.name}
                              className="w-full h-full rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none"
                              }}
                            />
                          ) : (
                            <FolderOpen className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-slate-800 font-bold uppercase tracking-wider text-xs truncate"
                            title={cat.name}
                          >
                            {cat.name}
                          </p>
                          <p
                            className="md:hidden text-[10px] text-slate-400 truncate mt-0.5"
                            title={cat.description || undefined}
                          >
                            {cat.description || "—"}
                          </p>
                          <p className="lg:hidden text-[10px] text-slate-400 truncate">
                            {cat.created_at ? new Date(cat.created_at).toLocaleDateString() : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td
                      className="hidden md:table-cell px-3 md:px-6 py-4 font-normal text-slate-500 truncate"
                      title={cat.description || undefined}
                    >
                      {cat.description || "—"}
                    </td>
                    <td className="hidden lg:table-cell px-3 md:px-6 py-4 font-normal text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cat.created_at ? new Date(cat.created_at).toLocaleDateString() : "—"}</span>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                      {cat.is_active ? (
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
                          className="inline-flex items-center px-1.5 xl:px-2.5 py-0.5 rounded-full text-[10px] xl:text-xs font-semibold border bg-error-50 text-error-800 border-error-100 whitespace-nowrap"
                        >
                          <span className="w-1.5 h-1.5 rounded-full md:mr-1.5 bg-error-500" aria-hidden="true" />
                          <span className="sr-only md:hidden">Inactive</span>
                          <span className="hidden md:inline">Inactive</span>
                        </span>
                      )}
                    </td>
                    <td className="px-3 md:px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleEditOpen(cat)}
                        className="p-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors active:scale-95 inline-flex items-center gap-1.5"
                        title="Edit Category"
                        aria-label="Edit category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="hidden md:inline text-xs font-semibold">Edit</span>
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
              <h3 className="font-bold text-slate-900 text-lg">Create Product Category</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto">
              {createErrors.global && (
                <div className="flex items-start gap-2.5 p-4 bg-error-50 border border-error-100 rounded-xl text-sm font-semibold text-error-800">
                  <ShieldAlert className="w-5 h-5 text-error-800 shrink-0" />
                  <p className="flex-1">{createErrors.global}</p>
                </div>
              )}

              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Category Name <span className="text-error-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <FolderOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => handleCreateChange("name", e.target.value)}
                    placeholder="E.g., Roasted Coffee"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>
                {createErrors.name && <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.name}</p>}
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => handleCreateChange("description", e.target.value)}
                  placeholder="Describe items in this classification..."
                  rows="3"
                  className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Category Image URL
                </label>
                <input
                  type="text"
                  value={createForm.image}
                  onChange={(e) => handleCreateChange("image", e.target.value)}
                  placeholder="E.g., https://cdn.example.com/category-spices.jpg"
                  className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 transition-all w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
                >
                  {isCreating ? <Spinner size="sm" /> : null}
                  <span>Create Category</span>
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
              <h3 className="font-bold text-slate-900 text-lg">Edit Category Details</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isDetailLoading ? (
              <div className="p-12 flex justify-center items-center">
                <Spinner size="lg" />
              </div>
            ) : (
              <form onSubmit={handleEditSubmit} className="p-6 space-y-4 overflow-y-auto">
                {editErrors.global && (
                  <div className="flex items-start gap-2.5 p-4 bg-error-50 border border-error-100 rounded-xl text-sm font-semibold text-error-800">
                    <ShieldAlert className="w-5 h-5 text-error-800 shrink-0" />
                    <p className="flex-1">{editErrors.global}</p>
                  </div>
                )}

                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Category Name <span className="text-error-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <FolderOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => handleEditChange("name", e.target.value)}
                      placeholder="E.g., Roasted blends"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                    />
                  </div>
                  {editErrors.name && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.name}</p>}
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => handleEditChange("description", e.target.value)}
                    placeholder="Describe items in this classification..."
                    rows="3"
                    className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Category Image URL
                  </label>
                  <input
                    type="text"
                    value={editForm.image}
                    onChange={(e) => handleEditChange("image", e.target.value)}
                    placeholder="E.g., https://cdn.example.com/category-spices.jpg"
                    className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editForm.is_active}
                      onChange={(e) => handleEditChange("is_active", e.target.checked)}
                      className="w-4 h-4 rounded-lg border-slate-200 text-brand-600 focus:ring-brand-500 focus:ring-2 focus:ring-offset-2 transition-all cursor-pointer"
                    />
                    Active Status
                  </label>

                  {!editForm.is_active && (
                    <div className="flex items-start gap-2.5 p-3.5 bg-error-50 border border-error-100 rounded-xl text-xs font-bold text-error-800 animate-in slide-in-from-top-1 duration-150 mt-1">
                      <AlertTriangle className="w-4.5 h-4.5 text-error-500 shrink-0" />
                      <p className="flex-1 leading-normal">
                        Deactivating this category will hide it from new product creation.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-100 mt-6">
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
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

export default CategoryManagement
