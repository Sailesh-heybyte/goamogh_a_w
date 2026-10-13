import { useState, useEffect, useRef, useCallback } from "react"
import { Plus, Search, ShieldAlert, X, Package, Tag, FileSpreadsheet, Percent, MoreVertical, Star, Scale, AlertTriangle, UploadCloud, Trash2, Edit3 } from "lucide-react"
import { getItems, createItem, getItemDetails, updateItem, addItemVariant, updateItemVariant, authorizeItem } from "@/services/items"
import { getCategories } from "@/services/categories"
import { getRawMaterialLedger, getProductLedger } from "@/services/ledgers"
import Spinner from "@/components/ui/Spinner"
import { parseBackendUniqueError } from "@/utils/errorUtils"

function parseErrorDetail(detail, defaultMsg) {
  if (!detail) return defaultMsg
  if (Array.isArray(detail)) {
    const messages = detail.map((d) => d.msg).filter(Boolean)
    return messages.length > 0 ? messages.join(", ") : defaultMsg
  }
  return typeof detail === "string" ? detail : defaultMsg
}

function ProductCatalog() {


  const [productsList, setProductsList] = useState([])
  const [categories, setCategories] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("")
  const [skip, setSkip] = useState(0)
  const [limit, setLimit] = useState(50)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const latestRequestRef = useRef(0)

  // Product Details Popup state
  const [selectedProductDetails, setSelectedProductDetails] = useState(null)
  const [purchaseHistory, setPurchaseHistory] = useState([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState("")

  // Product Variants Popup state
  const [isVariantsOpen, setIsVariantsOpen] = useState(false)
  const [activeProductId, setActiveProductId] = useState(null)
  const [activeProduct, setActiveProduct] = useState(null)
  const [isVariantsLoading, setIsVariantsLoading] = useState(false)
  const [weightGrams, setWeightGrams] = useState("")
  const [isAddingVariant, setIsAddingVariant] = useState(false)
  const [variantError, setVariantError] = useState("")
  const [updatingVariantIds, setUpdatingVariantIds] = useState({})

  // Multiple Image Upload state
  const [uploadedImages, setUploadedImages] = useState([])
  const [imageError, setImageError] = useState("")

  const [selectedTypeFilter, setSelectedTypeFilter] = useState("")

  // Product Edit Mode state
  const [isEditingProduct, setIsEditingProduct] = useState(false)
  const [editForm, setEditForm] = useState({
    item_type: "finished_good",
    category_id: "",
    name: "",
    description: "",
    hsn_code: "",
    unit_code: "KG",
    gst_percent: "5.00",
    cess_percent: "0.00",
    is_featured: false,
    is_sellable: true,
    is_active: true,
    sourcing_location: "",
  })
  const [editErrors, setEditErrors] = useState({})
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editUploadedImages, setEditUploadedImages] = useState([])
  const [editImageError, setEditImageError] = useState("")

  // Add Product Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    item_type: "finished_good",
    category_id: "",
    name: "",
    description: "",
    hsn_code: "",
    unit_code: "KG",
    gst_percent: "5.00",
    cess_percent: "0.00",
    images: "",
    is_featured: false,
    is_sellable: true,
    sourcing_location: "",
    variants: [],
  })
  const [createErrors, setCreateErrors] = useState({})
  const [isCreating, setIsCreating] = useState(false)

  // Map category IDs to names for table display
  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat.name
    return acc
  }, {})

  const loadPurchaseHistory = async () => {
    if (!selectedProductDetails) {
      setPurchaseHistory([])
      setHistoryError("")
      return
    }

    setIsHistoryLoading(true)
    setHistoryError("")
    try {
      const itemId = selectedProductDetails.id
      const itemType = selectedProductDetails.item_type // "finished_good" or "raw_material"
      const params = { skip: 0, limit: 1000, direction: "in" }

      const res = itemType === "raw_material"
        ? await getRawMaterialLedger(itemId, params)
        : await getProductLedger(itemId, params)

      if (!res.ok) {
        throw new Error("Could not load purchase history")
      }

      const json = await res.json()
      const inEntries = json.data || []

      const peEntries = inEntries.filter(entry => entry.transaction_type === "purchase_receipt" && entry.reference_id)
      const resolvedRows = peEntries.map((entry) => ({
        id: entry.id,
        created_at: entry.created_at,
        supplier_name: entry.supplier_name || null,
        pe_number: entry.pe_number || null,
        invoice_number: entry.invoice_number || null,
        quantity_received: entry.quantity_change,
        batch_number: entry.batch_number || null,
        expiry_date: entry.expiry_date || null,
      }))
      setPurchaseHistory(resolvedRows)
    } catch (err) {
      console.error("Failed to load purchase history inside product catalog details:", err)
      setHistoryError("Could not load purchase history")
    } finally {
      setIsHistoryLoading(false)
    }
  }

  useEffect(() => {
    loadPurchaseHistory()
  }, [selectedProductDetails])

  // Load categories once on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getCategories(true)
        if (!res.ok) throw new Error("Failed to load categories")
        const json = await res.json()
        setCategories(json.data)
      } catch (err) {
        setError("Failed to load categories")
      }
    }
    loadCategories()
  }, [])

  const fetchData = useCallback(async () => {
    const requestId = ++latestRequestRef.current
    setIsLoading(true)
    setError("")
    try {
      const params = { active_only: false, skip, limit }
      if (debouncedSearch && debouncedSearch.trim()) {
        params.search = debouncedSearch.trim()
      }
      if (selectedCategoryFilter) {
        params.category_id = selectedCategoryFilter
      }
      if (selectedTypeFilter) {
        params.item_type = selectedTypeFilter
      }

      const itemsRes = await getItems(params)
      if (requestId !== latestRequestRef.current) return

      if (!itemsRes.ok) {
        throw new Error("Failed to load catalog catalog data")
      }

      const itemsJson = await itemsRes.json()
      if (requestId !== latestRequestRef.current) return

      setProductsList(itemsJson.data)
      setTotal(itemsJson.meta.total)
    } catch (err) {
      if (requestId !== latestRequestRef.current) return
      setError(err.message || "Something went wrong")
    } finally {
      if (requestId === latestRequestRef.current) {
        setIsLoading(false)
      }
    }
  }, [debouncedSearch, selectedCategoryFilter, selectedTypeFilter, skip, limit])

  // Debounce searchQuery by 300 ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Re-run fetchData when debounced search, selectedCategoryFilter, selectedTypeFilter, skip or limit change.
  // When search or a filter changes, reset skip to 0.
  const prevFilterRef = useRef({ search: debouncedSearch, cat: selectedCategoryFilter, type: selectedTypeFilter })
  useEffect(() => {
    const filtersChanged =
      prevFilterRef.current.search !== debouncedSearch ||
      prevFilterRef.current.cat !== selectedCategoryFilter ||
      prevFilterRef.current.type !== selectedTypeFilter

    prevFilterRef.current = { search: debouncedSearch, cat: selectedCategoryFilter, type: selectedTypeFilter }

    if (filtersChanged && skip !== 0) {
      setSkip(0)
      return
    }

    fetchData()
  }, [debouncedSearch, selectedCategoryFilter, selectedTypeFilter, skip, limit, fetchData])

  const [isAuthorizingId, setIsAuthorizingId] = useState(null)
  const [authorizingProduct, setAuthorizingProduct] = useState(null)

  const handleAuthorizeProduct = async (productId) => {
    setIsAuthorizingId(productId)
    try {
      const res = await authorizeItem(productId)
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(parseErrorDetail(errJson.detail, "Failed to authorize item"))
      }

      if (selectedProductDetails && selectedProductDetails.id === productId) {
        const detailRes = await getItemDetails(productId)
        if (detailRes.ok) {
          const detailJson = await detailRes.json()
          setSelectedProductDetails(detailJson.data)
        }
      }

      setAuthorizingProduct(null)
      fetchData()
    } catch (err) {
      alert(err.message || "Failed to authorize item")
    } finally {
      setIsAuthorizingId(null)
    }
  }

  // Disable body scroll when any modal is open to ensure isolated scroll focus
  useEffect(() => {
    const isAnyModalOpen = isCreateOpen || isEditingProduct || isVariantsOpen || !!selectedProductDetails || !!authorizingProduct
    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isCreateOpen, isEditingProduct, isVariantsOpen, selectedProductDetails, authorizingProduct])

  const handleManageVariantsOpen = async (productObj) => {
    setIsVariantsOpen(true)
    setActiveProductId(productObj.id)
    setActiveProduct(null)
    setIsVariantsLoading(true)
    setVariantError("")
    setWeightGrams("")
    try {
      const res = await getItemDetails(productObj.id)
      if (!res.ok) {
        throw new Error("Failed to load product variants")
      }
      const json = await res.json()
      setActiveProduct(json.data)
    } catch (err) {
      setVariantError(err.message || "Failed to load product variants")
    } finally {
      setIsVariantsLoading(false)
    }
  }

  const handleToggleVariantStatus = async (variant) => {
    const variantId = variant.id
    setUpdatingVariantIds(prev => ({ ...prev, [variantId]: true }))
    try {
      const res = await updateItemVariant(variantId, {
        weight_grams: variant.weight_grams,
        is_active: !variant.is_active,
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(parseErrorDetail(errJson.detail, "Failed to update variant status"))
      }

      // Re-fetch details
      const detailRes = await getItemDetails(activeProductId)
      if (detailRes.ok) {
        const detailJson = await detailRes.json()
        setActiveProduct(detailJson.data)
      }
    } catch (err) {
      alert(err.message || "Failed to update variant status")
    } finally {
      setUpdatingVariantIds(prev => ({ ...prev, [variantId]: false }))
    }
  }

  const formatWeight = (grams) => {
    if (grams >= 1000) {
      const kg = grams / 1000
      return `${kg} KG`
    }
    return `${grams} GM`
  }

  const handleAddVariant = async (e) => {
    e.preventDefault()
    setVariantError("")

    const trimmed = weightGrams.trim()
    if (!trimmed) {
      setVariantError("Pack weight is required")
      return
    }

    const weightVal = parseInt(trimmed, 10)
    if (isNaN(weightVal) || weightVal <= 0 || weightVal.toString() !== trimmed) {
      setVariantError("Pack weight must be a positive integer greater than 0")
      return
    }

    // Check if variant with this weight already exists
    if (activeProduct && activeProduct.variants && activeProduct.variants.some(v => v.weight_grams === weightVal)) {
      setVariantError(`A variant size of ${formatWeight(weightVal)} already exists.`)
      return
    }

    setIsAddingVariant(true)
    try {
      const res = await addItemVariant(activeProductId, {
        weight_grams: weightVal,
        images: []
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(parseErrorDetail(errJson.detail, "Failed to add variant size"))
      }

      setWeightGrams("")
      // Re-fetch details
      const detailRes = await getItemDetails(activeProductId)
      if (detailRes.ok) {
        const detailJson = await detailRes.json()
        setActiveProduct(detailJson.data)
      }
    } catch (err) {
      setVariantError(err.message || "Failed to add variant size")
    } finally {
      setIsAddingVariant(false)
    }
  }

  const handleRemoveUploadedImage = (id) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id))
  }

  const processUploadedFiles = (files) => {
    setImageError("")
    const fileList = Array.from(files)

    for (const file of fileList) {
      if (!file.type.startsWith("image/")) {
        setImageError("Only image files are allowed")
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setImageError("Each image must be smaller than 10MB")
        return
      }
    }

    fileList.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
            dataUrl: e.target.result,
            previewUrl: URL.createObjectURL(file),
            name: file.name,
          },
        ])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleImageFileChange = (e) => {
    if (e.target.files) {
      processUploadedFiles(e.target.files)
    }
  }

  const handleImageDragOver = (e) => {
    e.preventDefault()
  }

  const handleImageDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      processUploadedFiles(e.dataTransfer.files)
    }
  }

  const handleStartEditing = () => {
    if (!selectedProductDetails) return

    const mappedImages = (selectedProductDetails.images || []).map((imgUrl, index) => ({
      id: `existing-${index}-${Date.now()}`,
      dataUrl: imgUrl,
      name: `Image ${index + 1}`
    }))

    setEditForm({
      item_type: selectedProductDetails.item_type || "finished_good",
      category_id: selectedProductDetails.category_id || "",
      name: selectedProductDetails.name || "",
      description: selectedProductDetails.description || "",
      hsn_code: selectedProductDetails.hsn_code || "",
      unit_code: selectedProductDetails.unit_code || "KG",
      gst_percent: selectedProductDetails.gst_percent || "5.00",
      cess_percent: selectedProductDetails.cess_percent || "0.00",
      is_featured: selectedProductDetails.is_featured || false,
      is_sellable: selectedProductDetails.is_sellable !== undefined ? selectedProductDetails.is_sellable : true,
      is_active: selectedProductDetails.is_active || false,
      sourcing_location: selectedProductDetails.sourcing_location || "",
    })

    setEditUploadedImages(mappedImages)
    setEditErrors({})
    setEditImageError("")
    setIsEditingProduct(true)
  }

  const handleCancelEditing = () => {
    setIsEditingProduct(false)
    setEditErrors({})
    setEditImageError("")
  }

  const handleEditChange = (field, value) => {
    setEditForm((prev) => {
      const updated = { ...prev, [field]: value }
      setEditErrors((errs) => {
        const newErrs = { ...errs }

        if (field === "name") {
          if (!value || value.length < 2 || value.length > 150) {
            newErrs.name = "Product name must be between 2 and 150 characters long"
          } else {
            delete newErrs.name
          }
        }

        if (field === "hsn_code") {
          if (!value) {
            newErrs.hsn_code = "HSN code is required"
          } else if (!/^\d+$/.test(value)) {
            newErrs.hsn_code = "HSN code must contain only numbers"
          } else if (value.length < 4 || value.length > 8) {
            newErrs.hsn_code = "HSN code must be between 4 and 8 digits long"
          } else {
            delete newErrs.hsn_code
          }
        }

        if (field === "gst_percent") {
          const num = parseFloat(value)
          if (isNaN(num) || num < 0 || num > 100) {
            newErrs.gst_percent = "Tax rates must be between 0% and 100%"
          } else {
            delete newErrs.gst_percent
          }
        }

        if (field === "cess_percent") {
          const num = parseFloat(value)
          if (isNaN(num) || num < 0 || num > 100) {
            newErrs.cess_percent = "Tax rates must be between 0% and 100%"
          } else {
            delete newErrs.cess_percent
          }
        }

        return newErrs
      })
      return updated
    })
  }

  const handleRemoveEditImage = (id) => {
    setEditUploadedImages((prev) => prev.filter((img) => img.id !== id))
  }

  const processEditUploadedFiles = (files) => {
    setEditImageError("")
    const fileList = Array.from(files)

    for (const file of fileList) {
      if (!file.type.startsWith("image/")) {
        setEditImageError("Only image files are allowed")
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setEditImageError("Each image must be smaller than 10MB")
        return
      }
    }

    fileList.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setEditUploadedImages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
            dataUrl: e.target.result,
            previewUrl: URL.createObjectURL(file),
            name: file.name,
          },
        ])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleEditImageFileChange = (e) => {
    if (e.target.files) {
      processEditUploadedFiles(e.target.files)
    }
  }

  const handleEditImageDragOver = (e) => {
    e.preventDefault()
  }

  const handleEditImageDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      processEditUploadedFiles(e.dataTransfer.files)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setEditErrors({})

    const errs = validateForm(editForm, true)
    if (Object.keys(errs).length > 0) {
      setEditErrors(errs)
      return
    }

    setIsSavingEdit(true)
    try {
      const imgArray = editUploadedImages.map((img) => img.dataUrl)

      const payload = {
        category_id: editForm.category_id || null,
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        hsn_code: editForm.hsn_code.trim(),
        unit_code: editForm.unit_code,
        gst_percent: parseFloat(editForm.gst_percent).toFixed(2),
        cess_percent: parseFloat(editForm.cess_percent).toFixed(2),
        images: imgArray,
        is_featured: editForm.is_featured,
        is_sellable: editForm.is_sellable,
        is_active: editForm.is_active,
        sourcing_location: editForm.sourcing_location.trim() || null,
      }

      const res = await updateItem(selectedProductDetails.id, payload)

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        const parsed = parseBackendUniqueError(errJson.detail, "Failed to update item")
        if (Object.keys(parsed.fieldErrors).length > 0) {
          setEditErrors((prev) => ({ ...prev, ...parsed.fieldErrors }))
        }
        if (parsed.global) {
          setEditErrors((prev) => ({ ...prev, global: parsed.global }))
        }
        return
      }

      const json = await res.json()

      setSelectedProductDetails(json.data)
      await fetchData()
      setIsEditingProduct(false)
    } catch (err) {
      setEditErrors({ global: err.message })
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Real-time validations
  const handleCreateChange = (field, value) => {
    setCreateForm((prev) => {
      const updated = { ...prev, [field]: value }

      if (field === "item_type") {
        updated.is_sellable = value === "finished_good"
      }

      setCreateErrors((errs) => {
        const newErrs = { ...errs }

        if (field === "name") {
          if (!value || value.length < 2 || value.length > 150) {
            newErrs.name = "Item name must be between 2 and 150 characters long"
          } else {
            delete newErrs.name
          }
        }

        if (field === "hsn_code") {
          if (!value) {
            newErrs.hsn_code = "HSN code is required"
          } else if (!/^\d+$/.test(value)) {
            newErrs.hsn_code = "HSN code must contain only numbers"
          } else if (value.length < 4 || value.length > 8) {
            newErrs.hsn_code = "HSN code must be between 4 and 8 digits long"
          } else {
            delete newErrs.hsn_code
          }
        }

        if (field === "gst_percent") {
          const num = parseFloat(value)
          if (isNaN(num) || num < 0 || num > 100) {
            newErrs.gst_percent = "Tax rates must be between 0% and 100%"
          } else {
            delete newErrs.gst_percent
          }
        }

        if (field === "cess_percent") {
          const num = parseFloat(value)
          if (isNaN(num) || num < 0 || num > 100) {
            newErrs.cess_percent = "Tax rates must be between 0% and 100%"
          } else {
            delete newErrs.cess_percent
          }
        }

        return newErrs
      })
      return updated
    })
  }

  // Submission validation
  const validateForm = (form, isEdit = false) => {
    const errs = {}
    if (form.item_type === "finished_good" && !form.category_id) {
      errs.category_id = "Please select a category"
    }

    if (!form.name || form.name.length < 2 || form.name.length > 150) {
      errs.name = "Item name must be between 2 and 150 characters long"
    }

    if (!form.hsn_code) {
      errs.hsn_code = "HSN code is required"
    } else if (!/^\d+$/.test(form.hsn_code) || form.hsn_code.length < 4 || form.hsn_code.length > 8) {
      errs.hsn_code = "HSN code must contain only numbers and be between 4 and 8 digits long"
    }

    const gstNum = parseFloat(form.gst_percent)
    if (isNaN(gstNum) || gstNum < 0 || gstNum > 100) {
      errs.gst_percent = "Tax rates must be between 0% and 100%"
    }

    const cessNum = parseFloat(form.cess_percent)
    if (isNaN(cessNum) || cessNum < 0 || cessNum > 100) {
      errs.cess_percent = "Tax rates must be between 0% and 100%"
    }

    if (!isEdit && form.item_type === "finished_good" && (!form.variants || form.variants.length === 0)) {
      errs.variants = "You must add at least one packaging variant size."
    }

    return errs
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setCreateErrors({})
    const errs = validateForm(createForm, false)
    if (Object.keys(errs).length > 0) {
      setCreateErrors(errs)
      return
    }

    setIsCreating(true)
    try {
      const imgArray = uploadedImages.map((img) => img.dataUrl)

      const payload = {
        item_type: createForm.item_type,
        category_id: createForm.category_id || null,
        name: createForm.name.trim(),
        description: createForm.description.trim() || null,
        hsn_code: createForm.hsn_code.trim(),
        unit_code: createForm.unit_code,
        gst_percent: parseFloat(createForm.gst_percent).toFixed(2),
        cess_percent: parseFloat(createForm.cess_percent).toFixed(2),
        images: imgArray,
        is_featured: createForm.is_featured,
        is_sellable: createForm.is_sellable,
        sourcing_location: createForm.sourcing_location.trim() || null,
        variants: createForm.variants.map((grams) => ({ weight_grams: grams, images: [] })),
      }

      const res = await createItem(payload)

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        const parsed = parseBackendUniqueError(errJson.detail, "Failed to create item")
        if (Object.keys(parsed.fieldErrors).length > 0) {
          setCreateErrors((prev) => ({ ...prev, ...parsed.fieldErrors }))
        }
        if (parsed.global) {
          setCreateErrors((prev) => ({ ...prev, global: parsed.global }))
        }
        return
      }

      const json = await res.json()
      const createdItem = json.data

      // Refresh item list and close the creation modal
      await fetchData()
      setIsCreateOpen(false)
      setUploadedImages([])
      setImageError("")

      // Automatically open the packaging variant modal for the newly created item
      if (createdItem && createdItem.id && createdItem.is_sellable) {
        handleManageVariantsOpen(createdItem)
      }
    } catch (err) {
      setCreateErrors({ global: err.message })
    } finally {
      setIsCreating(false)
    }
  }


  const getStockPill = (qty, unit) => {
    const unitStr = unit || "KG"
    if (qty === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-slate-50 text-slate-500 border-slate-200 whitespace-nowrap">
          Out of Stock
        </span>
      )
    }
    if (qty < 10.0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200 whitespace-nowrap">
          Low Stock ({qty.toFixed(2)} {unitStr})
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-success-50 text-success-700 border-success-100 whitespace-nowrap">
        In Stock ({qty.toFixed(2)} {unitStr})
      </span>
    )
  }

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
        <h3 className="text-lg font-bold text-slate-900">Error Loading Item Catalog</h3>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Item Catalog</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage unified catalog items (finished products and raw materials).</p>
        </div>

        <button
          onClick={() => {
            setCreateForm({
              item_type: "finished_good",
              category_id: "",
              name: "",
              description: "",
              hsn_code: "",
              unit_code: "KG",
              gst_percent: "5.00",
              cess_percent: "0.00",
              images: "",
              is_featured: false,
              is_sellable: true,
              sourcing_location: "",
              variants: [],
            })
            setCreateErrors({})
            setUploadedImages([])
            setImageError("")
            setIsCreateOpen(true)
          }}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Item</span>
        </button>
      </div>

      {/* Toolbar Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name or description..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white text-slate-700 font-semibold transition-all"
          >
            <option value="">All Item Types</option>
            <option value="finished_good">Finished Products</option>
            <option value="raw_material">Raw Materials</option>
          </select>
        </div>

        <div className="w-full sm:w-48">
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white text-slate-700 font-semibold transition-all"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Items Catalog Table Layout */}
      {productsList.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 font-medium shadow-sm">
          No items found in catalog.
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden w-full">
          <div className="w-full overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-3.5 py-3.5 w-[32%]">Item & Type</th>
                  <th className="px-3 py-3.5 w-[18%]">Category</th>
                  <th className="px-3 py-3.5 w-[12%]">HSN Code</th>
                  <th className="px-3 py-3.5 w-[16%]">Stock Qty</th>
                  <th className="px-3 py-3.5 w-[10%] text-center">Variants</th>
                  <th className="px-3 py-3.5 w-[12%] text-right">Status / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {productsList.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Column 1: Item Image, Name, SKU & Type */}
                    <td className="px-3.5 py-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-brand-50/80 border border-brand-100 flex items-center justify-center font-bold text-brand-700 shrink-0 shadow-2xs mt-0.5">
                          {prod.images && prod.images.length > 0 ? (
                            <img
                              src={prod.images[0]}
                              alt={prod.name}
                              className="w-full h-full rounded-xl object-cover"
                              onError={(e) => {
                                e.target.style.display = "none"
                              }}
                            />
                          ) : (
                            <Package className="w-4 h-4 text-brand-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-slate-900 font-semibold text-xs leading-snug line-clamp-1 truncate" title={prod.name}>
                            {prod.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium border border-slate-200/50">
                              {prod.product_number || "—"}
                            </span>
                            {prod.item_type === "finished_good" ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/60">
                                Finished Good
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                Raw Material
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Category Name */}
                    <td className="px-3 py-3 text-xs font-medium text-slate-650 min-w-0">
                      <span className="block truncate" title={categoryMap[prod.category_id] || "Unassigned"}>
                        {categoryMap[prod.category_id] || "—"}
                      </span>
                    </td>

                    {/* Column 3: HSN Code */}
                    <td className="px-3 py-3">
                      <span className="font-mono text-xs font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-150 inline-block">
                        {prod.hsn_code || "—"}
                      </span>
                    </td>

                    {/* Column 4: Stock Qty Pill */}
                    <td className="px-3 py-3 text-xs font-medium text-slate-700">
                      {getStockPill(prod.stock_qty || 0, prod.unit_code)}
                    </td>

                    {/* Column 5: Variants Count Link */}
                    <td className="px-3 py-3 text-center">
                      {prod.is_sellable ? (
                        <button
                          onClick={() => handleManageVariantsOpen(prod)}
                          className="px-2.5 py-1 border border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 rounded-lg text-xs font-semibold text-slate-700 hover:text-brand-700 transition-all active:scale-95 inline-flex items-center gap-1 bg-white shadow-2xs"
                        >
                          <Scale className="w-3 h-3 text-slate-400 group-hover:text-brand-600 transition-colors" />
                          <span>{prod.variants?.length || 0}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono">
                          —
                        </span>
                      )}
                    </td>

                    {/* Column 6: Combined Status & Quick Action */}
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {prod.status === "pending" ? (
                          <button
                            onClick={() => setAuthorizingProduct(prod)}
                            disabled={isAuthorizingId === prod.id}
                            className="px-2.5 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[11px] font-semibold transition-all active:scale-95 inline-flex items-center gap-1 shadow-2xs disabled:opacity-50"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                            <span>{isAuthorizingId === prod.id ? "Authorizing..." : "Authorize"}</span>
                          </button>
                        ) : prod.is_active ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <span className="w-1.5 h-1.5 rounded-full mr-1 bg-emerald-500 shrink-0" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                            <span className="w-1.5 h-1.5 rounded-full mr-1 bg-rose-500 shrink-0" />
                            Inactive
                          </span>
                        )}

                        <button
                          onClick={() => setSelectedProductDetails(prod)}
                          className="p-1.5 border border-slate-200 hover:border-brand-300 hover:bg-brand-50/60 rounded-lg text-slate-400 hover:text-brand-700 transition-all active:scale-95 shrink-0"
                          title="View Details"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > 0 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200/80 bg-slate-50/50 text-xs font-medium text-slate-500">
              <span>
                Showing {skip + 1}–{Math.min(skip + limit, total)} of {total}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={skip === 0}
                  onClick={() => setSkip((prev) => Math.max(0, prev - limit))}
                  className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-655 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <button
                  disabled={skip + limit >= total}
                  onClick={() => setSkip((prev) => prev + limit)}
                  className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-655 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Item Modal Overlay */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateSubmit} className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-900 text-lg">Create Item</h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false)
                  setUploadedImages([])
                  setImageError("")
                }}
                className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 min-h-0 scroll-smooth">
              {createErrors.global && (
                <div className="flex items-start gap-2.5 p-4 bg-error-50 border border-error-100 rounded-xl text-sm font-semibold text-error-800">
                  <ShieldAlert className="w-5 h-5 text-error-800 shrink-0" />
                  <p className="flex-1">{createErrors.global}</p>
                </div>
              )}

              {/* SECTION 1: Item Type */}
              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Item Type <span className="text-error-500 font-bold">*</span>
                </label>
                <select
                  name="item_type"
                  value={createForm.item_type}
                  onChange={(e) => handleCreateChange("item_type", e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-350 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white text-slate-700 font-semibold transition-all"
                >
                  <option value="finished_good">Finished Product</option>
                  <option value="raw_material">Raw Material</option>
                </select>
              </div>

              {/* SECTION 2: Basic Details & Name */}
              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Item Name <span className="text-error-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => handleCreateChange("name", e.target.value)}
                    placeholder="E.g., Arabica Gold Roast"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>
                {createErrors.name && <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.name}</p>}
              </div>

              {/* SECTION 3: Category */}
              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Category {createForm.item_type === "finished_good" ? <span className="text-error-500 font-bold">*</span> : <span className="text-slate-400 font-normal">(Optional)</span>}
                </label>
                <select
                  value={createForm.category_id}
                  onChange={(e) => handleCreateChange("category_id", e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white text-slate-800 font-semibold transition-all"
                >
                  <option value="">Select Category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {createErrors.category_id && <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.category_id}</p>}
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => handleCreateChange("description", e.target.value)}
                  placeholder="Describe item characteristics..."
                  rows="2"
                  className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col col-span-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    HSN Code <span className="text-error-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <FileSpreadsheet className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      value={createForm.hsn_code}
                      onChange={(e) => handleCreateChange("hsn_code", e.target.value)}
                      placeholder="E.g., 09012111"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                    />
                  </div>
                  {createErrors.hsn_code && <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.hsn_code}</p>}
                </div>

                <div className="flex flex-col col-span-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Unit Code</label>
                  <select
                    value={createForm.unit_code}
                    onChange={(e) => handleCreateChange("unit_code", e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white text-slate-800 font-semibold transition-all"
                  >
                    <option value="KG">KG</option>
                    <option value="GM">GM</option>
                    <option value="TON">TON</option>
                    <option value="LTR">LTR</option>
                    <option value="ML">ML</option>
                    <option value="PCS">PCS</option>
                    <option value="PACK">PACK</option>
                  </select>
                </div>

                <div className="flex flex-col col-span-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Sourcing Location
                  </label>
                  <input
                    type="text"
                    value={createForm.sourcing_location}
                    onChange={(e) => handleCreateChange("sourcing_location", e.target.value)}
                    placeholder="E.g., Guntur"
                    className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700 bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    GST Percent <span className="text-error-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="number"
                      step="0.01"
                      value={createForm.gst_percent}
                      onChange={(e) => handleCreateChange("gst_percent", e.target.value)}
                      placeholder="5.00"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                    />
                  </div>
                  {createErrors.gst_percent && <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.gst_percent}</p>}
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Cess Percent <span className="text-error-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="number"
                      step="0.01"
                      value={createForm.cess_percent}
                      onChange={(e) => handleCreateChange("cess_percent", e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                    />
                  </div>
                  {createErrors.cess_percent && <p className="text-xs text-error-800 font-semibold mt-1">{createErrors.cess_percent}</p>}
                </div>
              </div>

              {/* SECTION 4: Images */}
              <div className="flex flex-col space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Item Images <span className="text-slate-400 font-normal">(Multiple files supported)</span>
                </label>

                <div
                  onDragOver={handleImageDragOver}
                  onDrop={handleImageDrop}
                  onClick={() => document.getElementById("product-image-file-input").click()}
                  className="border-dashed border-2 border-slate-200 hover:border-brand-500 rounded-xl p-6 text-center cursor-pointer transition-all bg-slate-50 hover:bg-brand-50/5 flex flex-col items-center justify-center gap-2 select-none group"
                >
                  <input
                    id="product-image-file-input"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-brand-600 transition-colors" />
                  <span className="text-sm font-semibold text-slate-650 group-hover:text-slate-800">
                    Drag & drop images here, or <span className="text-brand-600 font-bold hover:underline">browse</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    Supports PNG, JPG, JPEG (Max 5MB per file)
                  </span>
                </div>

                {imageError && (
                  <p className="text-xs font-semibold text-error-800 flex items-center gap-1.5 mt-1 animate-in slide-in-from-top-1 duration-150">
                    <ShieldAlert className="w-4 h-4 text-error-600 shrink-0" />
                    {imageError}
                  </p>
                )}

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 pt-2">
                    {uploadedImages.map((img) => (
                      <div
                        key={img.id}
                        className="w-20 h-20 rounded-xl object-cover border border-slate-200 relative group overflow-hidden shrink-0 shadow-sm"
                      >
                        <img
                          src={img.previewUrl || img.dataUrl}
                          alt={img.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveUploadedImage(img.id)
                            }}
                            className="p-1.5 bg-error-50 border border-error-100 hover:bg-error-100 hover:border-error-200 rounded-lg text-error-800 transition-all transform hover:scale-110 shadow-sm"
                            title="Remove Image"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 5: Selling Options */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Selling Options
                </h4>

                <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-650">Sellable on website?</span>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">Enables weight variants and pricing panel setup.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={createForm.is_sellable}
                      onChange={(e) => handleCreateChange("is_sellable", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-650 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={createForm.is_featured}
                      onChange={(e) => handleCreateChange("is_featured", e.target.checked)}
                      className="w-4 h-4 rounded-lg border-slate-200 text-brand-600 focus:ring-brand-500 focus:ring-2 focus:ring-offset-2 transition-all cursor-pointer"
                    />
                    Featured Item
                  </label>
                </div>
              </div>

              {/* SECTION 6: Variants */}
              {createForm.is_sellable && (
                <div className="border-t border-slate-100 pt-4 flex flex-col space-y-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Packaging Sizes / Variants
                    </h4>
                    <p className="text-[10px] text-slate-450 font-bold leading-relaxed mt-0.5">
                      Define the custom weight sizes in grams (minimum 1 size if sellable).
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      id="new-variant-weight-grams"
                      placeholder="Weight in grams (e.g. 250, 500)"
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById("new-variant-weight-grams")
                        const val = input.value.trim()
                        if (!val) return
                        const gramsVal = parseInt(val, 10)
                        if (isNaN(gramsVal) || gramsVal <= 0 || gramsVal.toString() !== val) {
                          alert("Please enter a valid positive integer.")
                          return
                        }
                        if (createForm.variants.includes(gramsVal)) {
                          alert("This variant size is already added.")
                          return
                        }
                        setCreateForm((prev) => ({
                          ...prev,
                          variants: [...prev.variants, gramsVal]
                        }))
                        input.value = ""
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0"
                    >
                      Add Size
                    </button>
                  </div>

                  {createForm.variants.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {createForm.variants.map((grams) => (
                        <span
                          key={grams}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-150 text-slate-700 border border-slate-200/50"
                        >
                          <span>{formatWeight(grams)}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setCreateForm((prev) => ({
                                ...prev,
                                variants: prev.variants.filter((g) => g !== grams)
                              }))
                            }}
                            className="w-3.5 h-3.5 hover:bg-slate-200 border border-transparent rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {createErrors.variants && (
                    <p className="text-xs text-error-800 font-semibold mt-1">
                      {createErrors.variants}
                    </p>
                  )}
                </div>
              )}

            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50/50">
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false)
                  setUploadedImages([])
                  setImageError("")
                }}
                className="border border-slate-200 hover:border-slate-350 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-650 transition-all bg-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                {isCreating ? <Spinner size="sm" /> : null}
                <span>Create Item</span>
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Item Details Popup Modal Overlay */}
      {selectedProductDetails && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-white border border-slate-100 shadow-2xl rounded-2xl w-full ${isEditingProduct ? "max-w-lg" : "max-w-2xl"} max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-900 text-lg">
                {isEditingProduct ? "Edit Item" : "Item Details"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedProductDetails(null)
                  setIsEditingProduct(false)
                }}
                className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!isEditingProduct ? (
              <>
                <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 min-h-0 scroll-smooth">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center font-bold text-brand-700 shrink-0">
                      {selectedProductDetails.images && selectedProductDetails.images.length > 0 ? (
                        <img
                          src={selectedProductDetails.images[0]}
                          alt={selectedProductDetails.name}
                          className="w-full h-full rounded-xl object-cover"
                          onError={(e) => {
                            e.target.style.display = "none"
                          }}
                        />
                      ) : (
                        <Package className="w-6 h-6 text-brand-650" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 uppercase tracking-wider">
                        {selectedProductDetails.name}
                      </h4>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        {categoryMap[selectedProductDetails.category_id] || "No Category"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Item Type
                        </span>
                        {selectedProductDetails.item_type === "finished_good" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-150 uppercase tracking-wider whitespace-nowrap">
                            Finished Product
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-150 uppercase tracking-wider whitespace-nowrap">
                            Raw Material
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Sellable Online
                        </span>
                        {selectedProductDetails.is_sellable ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-success-50 text-success-700 border border-success-100">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200">
                            No
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Description
                      </span>
                      <p className="text-xs font-semibold text-slate-650 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                        {selectedProductDetails.description || "No description provided."}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-1">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          HSN Code
                        </span>
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1 flex-wrap">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{selectedProductDetails.hsn_code}</span>
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Unit Code
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {selectedProductDetails.unit_code}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Sourcing
                        </span>
                        <span className="text-xs font-bold text-slate-800 truncate block" title={selectedProductDetails.sourcing_location}>
                          {selectedProductDetails.sourcing_location || "—"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          GST Rate
                        </span>
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-0.5">
                          {selectedProductDetails.gst_percent}% <Percent className="w-3 h-3 text-slate-400" />
                        </span>
                      </div>

                      {parseFloat(selectedProductDetails.cess_percent) > 0 && (
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            Cess Rate
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {selectedProductDetails.cess_percent}%
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 mt-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Status
                        </span>
                        {selectedProductDetails.status === "pending" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-yellow-50 text-yellow-800 border-yellow-100 whitespace-nowrap">
                            Pending Authorization
                          </span>
                        ) : selectedProductDetails.is_active ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-success-50 text-success-700 border-success-100 whitespace-nowrap">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-error-50 text-error-800 border-error-100 whitespace-nowrap">
                            Inactive
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Featured Item
                        </span>
                        {selectedProductDetails.is_featured ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-200">
                            <Star className="w-2.5 h-2.5 fill-current text-amber-550" />
                            Yes
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-slate-500">No</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Bulk Stock
                      </span>
                      {getStockPill(selectedProductDetails.stock_qty || 0, selectedProductDetails.unit_code)}
                    </div>

                    {/* Stock Source / Purchase History Section */}
                    <div className="pt-4 border-t border-slate-100 mt-4 space-y-2">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        Stock Source / Purchase History
                      </h5>
                      {isHistoryLoading ? (
                        <div className="flex justify-center items-center py-6 bg-slate-50 rounded-xl border border-slate-100">
                          <Spinner size="sm" />
                        </div>
                      ) : historyError ? (
                        <div className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                          <span>{historyError}</span>
                          <button
                            type="button"
                            onClick={loadPurchaseHistory}
                            className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold transition-colors"
                          >
                            Retry
                          </button>
                        </div>
                      ) : purchaseHistory.length === 0 ? (
                        <p className="text-xs font-semibold text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl border border-slate-100">
                          No purchase history receipts found for this item.
                        </p>
                      ) : (
                        <div className="border border-slate-150 rounded-xl overflow-hidden bg-white max-h-[200px] overflow-y-auto custom-scrollbar">
                          <table className="w-full text-left border-collapse text-[10px]">
                            <thead>
                              <tr className="border-b border-slate-150 bg-slate-100/70 text-slate-500 font-bold uppercase tracking-wider sticky top-0 bg-white">
                                <th className="px-3 py-2">Date</th>
                                <th className="px-3 py-2">Supplier</th>
                                <th className="px-3 py-2">PE Number</th>
                                <th className="px-3 py-2">Invoice #</th>
                                <th className="px-3 py-2 text-right">Qty</th>
                                <th className="px-3 py-2">Batch</th>
                                <th className="px-3 py-2">Expiry</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                              {purchaseHistory.map((row) => (
                                <tr key={row.id} className="hover:bg-slate-50/50">
                                  <td className="px-3 py-2 font-mono whitespace-nowrap">
                                    {new Date(row.created_at).toLocaleDateString("en-GB", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric"
                                    })}
                                  </td>
                                  <td className="px-3 py-2 font-bold text-slate-900 truncate max-w-[120px]" title={row.supplier_name}>
                                    {row.supplier_name}
                                  </td>
                                  <td className="px-3 py-2 font-mono text-slate-500 whitespace-nowrap">
                                    {row.pe_number}
                                  </td>
                                  <td className="px-3 py-2 font-mono text-slate-400 whitespace-nowrap">
                                    {row.invoice_number}
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">
                                    {row.quantity_received.toFixed(1)} {selectedProductDetails.unit_code}
                                  </td>
                                  <td className="px-3 py-2 font-mono text-slate-500 text-[9px] truncate max-w-[80px]" title={row.batch_number}>
                                    {row.batch_number}
                                  </td>
                                  <td className="px-3 py-2 font-mono text-slate-400">
                                    {row.expiry_date ? row.expiry_date.split("T")[0] : "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50/50">
                  {selectedProductDetails.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => setAuthorizingProduct(selectedProductDetails)}
                      disabled={isAuthorizingId === selectedProductDetails.id}
                      className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-md shadow-brand-500/10 flex items-center gap-2 disabled:opacity-50"
                    >
                      <span>Authorize Item</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleStartEditing}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 flex items-center gap-2 ${selectedProductDetails.status === "pending"
                      ? "border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 bg-white"
                      : "bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/10"
                      }`}
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Item</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedProductDetails(null)}
                    className="border border-slate-200 hover:border-slate-350 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-650 transition-all active:scale-95 bg-white"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 min-h-0 scroll-smooth">
                  {editErrors.global && (
                    <div className="flex items-start gap-2.5 p-4 bg-error-50 border border-error-100 rounded-xl text-sm font-semibold text-error-800">
                      <ShieldAlert className="w-5 h-5 text-error-800 shrink-0" />
                      <p className="flex-1">{editErrors.global}</p>
                    </div>
                  )}

                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Category {editForm.item_type === "finished_good" ? <span className="text-error-500 font-bold">*</span> : <span className="text-slate-400 font-normal">(Optional)</span>}
                    </label>
                    <select
                      value={editForm.category_id}
                      onChange={(e) => handleEditChange("category_id", e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white text-slate-800 font-semibold transition-all"
                    >
                      <option value="">Select Category...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    {editErrors.category_id && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.category_id}</p>}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Item Name <span className="text-error-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => handleEditChange("name", e.target.value)}
                        placeholder="E.g., Arabica Gold Roast"
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                      />
                    </div>
                    {editErrors.name && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.name}</p>}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Description</label>
                    <textarea
                      value={editForm.description || ""}
                      onChange={(e) => handleEditChange("description", e.target.value)}
                      placeholder="Describe item characteristics..."
                      rows="2"
                      className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col col-span-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        HSN Code <span className="text-error-500 font-bold">*</span>
                      </label>
                      <div className="relative">
                        <FileSpreadsheet className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          value={editForm.hsn_code}
                          onChange={(e) => handleEditChange("hsn_code", e.target.value)}
                          placeholder="E.g., 09012111"
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                        />
                      </div>
                      {editErrors.hsn_code && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.hsn_code}</p>}
                    </div>

                    <div className="flex flex-col col-span-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Unit Code</label>
                      <select
                        value={editForm.unit_code}
                        onChange={(e) => handleEditChange("unit_code", e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white text-slate-800 font-semibold transition-all"
                      >
                        <option value="KG">KG</option>
                        <option value="GM">GM</option>
                        <option value="TON">TON</option>
                        <option value="LTR">LTR</option>
                        <option value="ML">ML</option>
                        <option value="PCS">PCS</option>
                        <option value="PACK">PACK</option>
                      </select>
                    </div>

                    <div className="flex flex-col col-span-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Sourcing Location
                      </label>
                      <input
                        type="text"
                        value={editForm.sourcing_location}
                        onChange={(e) => handleEditChange("sourcing_location", e.target.value)}
                        placeholder="E.g., Guntur"
                        className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold text-slate-700 bg-slate-50/50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        GST Percent <span className="text-error-500 font-bold">*</span>
                      </label>
                      <div className="relative">
                        <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.gst_percent}
                          onChange={(e) => handleEditChange("gst_percent", e.target.value)}
                          placeholder="5.00"
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                        />
                      </div>
                      {editErrors.gst_percent && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.gst_percent}</p>}
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Cess Percent <span className="text-error-500 font-bold">*</span>
                      </label>
                      <div className="relative">
                        <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.cess_percent}
                          onChange={(e) => handleEditChange("cess_percent", e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                        />
                      </div>
                      {editErrors.cess_percent && <p className="text-xs text-error-800 font-semibold mt-1">{editErrors.cess_percent}</p>}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Item Images <span className="text-slate-400 font-normal">(Multiple files supported)</span>
                    </label>

                    <div
                      onDragOver={handleEditImageDragOver}
                      onDrop={handleEditImageDrop}
                      onClick={() => document.getElementById("edit-product-image-file-input").click()}
                      className="border-dashed border-2 border-slate-200 hover:border-brand-500 rounded-xl p-6 text-center cursor-pointer transition-all bg-slate-50 hover:bg-brand-50/5 flex flex-col items-center justify-center gap-2 select-none group"
                    >
                      <input
                        id="edit-product-image-file-input"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleEditImageFileChange}
                        className="hidden"
                      />
                      <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-brand-600 transition-colors" />
                      <span className="text-sm font-semibold text-slate-650 group-hover:text-slate-800">
                        Drag & drop images here, or <span className="text-brand-600 font-bold hover:underline">browse</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        Supports PNG, JPG, JPEG (Max 5MB per file)
                      </span>
                    </div>

                    {editImageError && (
                      <p className="text-xs font-semibold text-error-800 flex items-center gap-1.5 mt-1 animate-in slide-in-from-top-1 duration-150">
                        <ShieldAlert className="w-4 h-4 text-error-600 shrink-0" />
                        {editImageError}
                      </p>
                    )}

                    {editUploadedImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-3 pt-2">
                        {editUploadedImages.map((img) => (
                          <div
                            key={img.id}
                            className="w-20 h-20 rounded-xl object-cover border border-slate-200 relative group overflow-hidden shrink-0 shadow-sm"
                          >
                            <img
                              src={img.previewUrl || img.dataUrl}
                              alt={img.name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRemoveEditImage(img.id)
                                }}
                                className="p-1.5 bg-error-50 border border-error-100 hover:bg-error-100 hover:border-error-200 rounded-lg text-error-800 transition-all transform hover:scale-110 shadow-sm"
                                title="Remove Image"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-650">Sellable on website?</span>
                      <span className="text-[10px] text-slate-400 font-medium mt-0.5">Enables weight variants and pricing panel setup.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editForm.is_sellable}
                        onChange={(e) => handleEditChange("is_sellable", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mt-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-650 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editForm.is_featured}
                        onChange={(e) => handleEditChange("is_featured", e.target.checked)}
                        className="w-4 h-4 rounded-lg border-slate-200 text-brand-600 focus:ring-brand-500 focus:ring-2 focus:ring-offset-2 transition-all cursor-pointer"
                      />
                      Featured Item
                    </label>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-650 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editForm.is_active}
                        onChange={(e) => handleEditChange("is_active", e.target.checked)}
                        className="w-4 h-4 rounded-lg border-slate-200 text-brand-600 focus:ring-brand-500 focus:ring-2 focus:ring-offset-2 transition-all cursor-pointer"
                      />
                      Active Item
                    </label>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50/50">
                  <button
                    type="button"
                    onClick={handleCancelEditing}
                    className="border border-slate-200 hover:border-slate-350 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-650 transition-all bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSavingEdit ? <Spinner size="sm" /> : null}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Item Variants Management Popup Modal Overlay */}
      {isVariantsOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Manage Item Variants</h3>
                {activeProduct && (
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                    Item: {activeProduct.name}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsVariantsOpen(false)
                  fetchData() // Refresh stock totals/etc. on close
                }}
                className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 min-h-0 scroll-smooth">
              {isVariantsLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : (
                <>
                  {/* Inline Add Form */}
                  <form onSubmit={handleAddVariant} className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Add Packaging Size</h4>
                    <div className="flex flex-col sm:flex-row items-stretch gap-3">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={weightGrams}
                          onChange={(e) => {
                            setWeightGrams(e.target.value)
                            if (variantError) setVariantError("")
                          }}
                          placeholder="Enter pack weight in Grams (e.g. 250, 500, 1000)"
                          className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                          Grams
                        </span>
                      </div>

                      <button
                        type="submit"
                        disabled={isAddingVariant}
                        className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                      >
                        {isAddingVariant ? <Spinner size="sm" /> : <Plus className="w-4 h-4" />}
                        <span>Add Size</span>
                      </button>
                    </div>
                    {variantError && (
                      <p className="text-xs font-semibold text-error-800 flex items-center gap-1.5 mt-1 animate-in slide-in-from-top-1 duration-150">
                        <ShieldAlert className="w-4 h-4 text-error-600 shrink-0" />
                        {variantError}
                      </p>
                    )}
                  </form>

                  {/* Variants Table List */}
                  {!activeProduct || !activeProduct.variants || activeProduct.variants.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-2">
                      <Scale className="w-6 h-6 text-slate-350" />
                      <p className="text-sm font-bold text-slate-650">No Variant Sizes Registered</p>
                      <p className="text-xs text-slate-400 font-medium">
                        Use the form above to register size packages.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-100 rounded-xl shadow-sm">
                      <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                          <tr className="text-slate-500 text-xs font-bold uppercase tracking-wider text-left">
                            <th scope="col" className="px-6 py-3.5">Weight / Size</th>
                            <th scope="col" className="px-6 py-3.5 text-center w-32">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50 text-sm font-semibold text-slate-800">
                          {activeProduct.variants.map((variant) => {
                            const isUpdating = !!updatingVariantIds[variant.id]
                            return (
                              <tr key={variant.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">
                                      g
                                    </span>
                                    <div>
                                      <span className="font-bold text-slate-800">
                                        {formatWeight(variant.weight_grams)}
                                      </span>
                                      <span className="text-xs text-slate-400 font-medium block">
                                        ({variant.weight_grams}g)
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-6 py-4 text-center">
                                  <div className="flex items-center justify-center">
                                    {isUpdating ? (
                                      <Spinner size="sm" />
                                    ) : (
                                      <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          checked={variant.is_active}
                                          onChange={() => handleToggleVariantStatus(variant)}
                                          className="w-4 h-4 rounded-lg border-slate-200 text-brand-600 focus:ring-brand-500 focus:ring-2 focus:ring-offset-2 transition-all cursor-pointer"
                                        />
                                        <span className={`text-xs font-bold ${variant.is_active ? "text-success-700" : "text-slate-400"}`}>
                                          {variant.is_active ? "Active" : "Inactive"}
                                        </span>
                                      </label>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => {
                  setIsVariantsOpen(false)
                  fetchData() // Refresh stock totals/etc. on close
                }}
                className="border border-slate-200 hover:border-slate-350 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-650 transition-all active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Authorization Confirmation Modal Overlay */}
      {authorizingProduct && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 shrink-0">
                  <ShieldAlert className="w-4.5 h-4.5 text-brand-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Confirm Authorization</h3>
              </div>
              <button
                type="button"
                onClick={() => setAuthorizingProduct(null)}
                disabled={!!isAuthorizingId}
                className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                Are you sure you want to authorize <span className="font-bold text-slate-900 uppercase">{authorizingProduct.name}</span>
                {authorizingProduct.product_number ? ` (${authorizingProduct.product_number})` : ""}?
              </p>
              <p className="text-xs text-slate-500 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                Authorizing this item activates it for inventory, purchase orders, work orders, and selling options across the system.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setAuthorizingProduct(null)}
                disabled={!!isAuthorizingId}
                className="border border-slate-200 hover:border-slate-350 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-650 transition-all bg-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAuthorizeProduct(authorizingProduct.id)}
                disabled={!!isAuthorizingId}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-brand-500/10 flex items-center gap-2 disabled:opacity-50"
              >
                {isAuthorizingId ? <Spinner size="sm" /> : null}
                <span>{isAuthorizingId ? "Authorizing..." : "Confirm & Authorize"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default ProductCatalog

