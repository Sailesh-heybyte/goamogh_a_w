import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Settings, Save, AlertCircle, CheckCircle2, Sliders, FileText } from "lucide-react"
import useAuth from "@/hooks/useAuth"
import { getSettings, updateSetting } from "@/api/settings"
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

const REQUIRED_TOLERANCE_SETTINGS = [
  {
    id: "default_purchase_price_tolerance",
    key: "purchase_price_tolerance_pct",
    name: "Purchase Rate Tolerance",
    value: "10.00",
    unit: "%",
    description: "Maximum allowable price/rate percentage deviation on operational purchase order lines before validation alert.",
  },
  {
    id: "default_purchase_qty_tolerance",
    key: "purchase_qty_tolerance_pct",
    name: "Purchase Quantity Tolerance",
    value: "10.00",
    unit: "%",
    description: "Maximum allowable quantity percentage deviation on received goods compared to original purchase order items.",
  },
]

const getSettingMeta = (key) => {
  if (key === "purchase_price_tolerance_pct") {
    return {
      title: "Purchase Rate Tolerance",
      description: "Maximum allowable price/rate percentage deviation on operational purchase order lines before validation alert.",
      unit: "%",
      isPct: true,
      icon: Sliders,
    }
  }
  if (key === "purchase_qty_tolerance_pct") {
    return {
      title: "Purchase Quantity Tolerance",
      description: "Maximum allowable quantity percentage deviation on received goods compared to original purchase order items.",
      unit: "%",
      isPct: true,
      icon: Sliders,
    }
  }
  if (key === "po_counter") {
    return {
      title: "PO Counter",
      description: "Sequential purchase order number counter used for generating purchase order reference IDs.",
      unit: "",
      isPct: false,
      icon: FileText,
    }
  }

  const isPct = key.endsWith("_pct") || key.toLowerCase().includes("tolerance")
  const cleanKey = key.endsWith("_pct") ? key.slice(0, -4) : key
  const title = cleanKey
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  return {
    title,
    description: null,
    unit: isPct ? "%" : "",
    isPct,
    icon: Sliders,
  }
}

function SystemSettings() {
  const { isSuperAdmin, isLoading: isAuthLoading } = useAuth()
  const navigate = useNavigate()
  const confirm = useConfirm()

  const [settings, setSettings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Editing state
  const [editingSetting, setEditingSetting] = useState(null)
  const [editValue, setEditValue] = useState("")
  const [editError, setEditError] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  // Redirect non-superadmins
  useEffect(() => {
    if (!isAuthLoading && !isSuperAdmin) {
      navigate("/", { replace: true })
    }
  }, [isSuperAdmin, isAuthLoading, navigate])

  const fetchSettings = async () => {
    setIsLoading(true)
    setError("")
    try {
      const res = await getSettings()
      if (!res.ok) {
        throw new Error("Failed to load configuration settings")
      }
      const data = await res.json()
      const fetchedData = data.data || []

      // Merge fetched settings with required default tolerance settings
      const finalSettings = [...fetchedData]
      REQUIRED_TOLERANCE_SETTINGS.forEach((req) => {
        const existing = finalSettings.find((s) => s.key === req.key)
        if (!existing) {
          finalSettings.push({
            id: req.id,
            key: req.key,
            value: req.value,
            description: req.description,
            isDefault: true,
          })
        }
      })

      setSettings(finalSettings)
    } catch (err) {
      setError(err.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isSuperAdmin) {
      fetchSettings()
    }
  }, [isSuperAdmin])

  const handleEditClick = (setting) => {
    setEditingSetting(setting)
    setEditValue(setting.value)
    setEditError("")
    setSuccessMessage("")
  }

  const validateValue = (key, val) => {
    const meta = getSettingMeta(key)
    if (meta.isPct) {
      const num = parseFloat(val)
      if (isNaN(num)) {
        return "Value must be a valid number"
      }
      if (num < 0.0 || num > 100.0) {
        return "Value must be a decimal percentage between 0.0 and 100.0"
      }
      if (!/^\d+(\.\d+)?$/.test(val.trim())) {
        return "Value must be a valid decimal number"
      }
    } else {
      const num = parseInt(val, 10)
      if (isNaN(num) || num < 0) {
        return "Value must be a non-negative integer"
      }
    }
    return ""
  }

  const handleSaveSubmit = async (e) => {
    e.preventDefault()
    setEditError("")
    setSuccessMessage("")

    const validationErr = validateValue(editingSetting.key, editValue)
    if (validationErr) {
      setEditError(validationErr)
      return
    }

    const meta = getSettingMeta(editingSetting.key)
    const ok = await confirm({
      title: `Update ${meta.title}?`,
      confirmLabel: "Save Config",
    })
    if (!ok) return

    setIsUpdating(true)
    try {
      const payloadVal = meta.isPct ? parseFloat(editValue).toFixed(2) : String(parseInt(editValue, 10))

      const res = await updateSetting(editingSetting.key, payloadVal)

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(parseErrorDetail(errJson.detail, "Failed to update configuration parameter"))
      }

      setSuccessMessage(`Setting "${meta.title}" updated successfully!`)
      setEditingSetting(null)
      fetchSettings()
    } catch (err) {
      setEditError(err.message)
    } finally {
      setIsUpdating(false)
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
        <AlertCircle className="w-12 h-12 text-error-500 animate-bounce" />
        <h3 className="text-lg font-bold text-slate-900">Error Loading System Settings</h3>
        <p className="text-sm font-semibold text-slate-500">{error}</p>
        <button
          onClick={fetchSettings}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-md shadow-brand-500/10"
        >
          Retry Fetching
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in fade-in duration-200">

      {/* Header section */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Configuration</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">Manage global price and quantity tolerances for operational purchase validation.</p>
      </div>

      {successMessage && (
        <div className="flex items-start gap-2.5 p-4 bg-success-50 border border-success-100 rounded-xl text-sm font-semibold text-success-700 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-success-700 shrink-0" />
          <p className="flex-1">{successMessage}</p>
        </div>
      )}

      {/* Settings Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settings.filter((setting) => !setting.key.toLowerCase().includes("invoice")).map((setting) => {
          const meta = getSettingMeta(setting.key)
          const IconComp = meta.icon || Sliders

          return (
            <div
              key={setting.id}
              className="bg-white border border-slate-100 shadow-md hover:shadow-lg rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center font-bold text-brand-600">
                    <IconComp className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                      {meta.title}
                    </h4>
                  </div>
                </div>

                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {setting.description || meta.description || "No description provided."}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Value</span>
                  <span className="text-2xl font-extrabold text-slate-800">
                    {setting.value}{meta.unit}
                  </span>
                </div>

                <button
                  onClick={() => handleEditClick(setting)}
                  className="px-3.5 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-colors active:scale-95 flex items-center gap-1.5"
                >
                  Configure
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit Setting Drawer/Modal */}
      {editingSetting && (() => {
        const meta = getSettingMeta(editingSetting.key)
        return (
          <Modal onClose={() => setEditingSetting(null)}>
            <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-brand-600 shrink-0" />
                  <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                    Update {meta.title}
                  </h3>
                </div>
                <button
                  onClick={() => setEditingSetting(null)}
                  className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSaveSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto flex flex-col justify-between">
                <div>
                  {editError && (
                    <div className="flex items-start gap-2.5 p-4 mb-4 bg-error-50 border border-error-100 rounded-xl text-sm font-semibold text-error-800">
                      <AlertCircle className="w-5 h-5 text-error-800 shrink-0" />
                      <p className="flex-1">{editError}</p>
                    </div>
                  )}

                  <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      {meta.isPct ? "Percentage Value (%)" : "Configured Value"}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder={meta.isPct ? "E.g., 10.00" : "E.g., 1"}
                        className="w-full px-4 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-semibold"
                        disabled={isUpdating}
                      />
                      {meta.unit && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                          {meta.unit}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-semibold text-slate-400 mt-1.5 leading-relaxed">
                      {meta.isPct ? "Enter a value between 0.00 and 100.00." : "Enter a non-negative integer."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-100 mt-6 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingSetting(null)}
                    className="border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 transition-all w-full sm:w-auto"
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
                  >
                    {isUpdating ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
                    <span>Save Config</span>
                  </button>
                </div>
              </form>
            </div>
          </Modal>
        )
      })()}

    </div>
  )
}

export default SystemSettings
