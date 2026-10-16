import { useState, useEffect, useMemo } from "react"
import { Plus, Search, ExternalLink, Edit2, Trash2, Eye, EyeOff, X, AlertCircle, FileCheck2 } from "lucide-react"
import {
  getCertificates,
  createCertificate,
  updateCertificate,
  setCertificateStatus,
  deleteCertificate,
} from "@/api/certificates"
import Spinner from "@/components/ui/Spinner"
import Pagination from "@/components/ui/Pagination"
import Modal from "@/components/ui/Modal"
import useConfirm from "@/hooks/useConfirm"
import { useToast } from "@/context/ToastContext"

export default function QualityCertificates() {
  const confirm = useConfirm()
  const { showSuccessToast, showErrorToast } = useToast()

  const [certificates, setCertificates] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const [searchQuery, setSearchQuery] = useState("")
  const [skip, setSkip] = useState(0)
  const limit = 50

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState("add")
  const [selectedCert, setSelectedCert] = useState(null)
  const [formTitle, setFormTitle] = useState("")
  const [formIssuedOn, setFormIssuedOn] = useState("")
  const [formFile, setFormFile] = useState(null)
  const [formIsPublished, setFormIsPublished] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [modalError, setModalError] = useState("")

  const loadCertificates = async () => {
    setIsLoading(true)
    setError("")
    try {
      const res = await getCertificates()
      if (!res.ok) {
        throw new Error("Failed to load certificates")
      }
      const json = await res.json().catch(() => null)
      setCertificates(Array.isArray(json?.data) ? json.data : [])
    } catch (err) {
      setError(err.message || "Failed to load certificates")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setIsLoading(true)
      setError("")
      try {
        const res = await getCertificates()
        if (cancelled) return
        if (!res.ok) {
          throw new Error("Failed to load certificates")
        }
        const json = await res.json().catch(() => null)
        if (cancelled) return
        setCertificates(Array.isArray(json?.data) ? json.data : [])
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load certificates")
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredCertificates = useMemo(() => {
    if (!searchQuery.trim()) return certificates
    const q = searchQuery.toLowerCase().trim()
    return certificates.filter((c) => (c.title || "").toLowerCase().includes(q))
  }, [certificates, searchQuery])

  useEffect(() => {
    setSkip(0)
  }, [searchQuery])

  const paginatedCertificates = useMemo(() => {
    return filteredCertificates.slice(skip, skip + limit)
  }, [filteredCertificates, skip, limit])

  const formatIssuedDate = (dateStr) => {
    if (!dateStr) return "—"
    try {
      const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  const formatUploadedDate = (dateStr) => {
    if (!dateStr) return "—"
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  const handleOpenAdd = () => {
    setModalMode("add")
    setSelectedCert(null)
    setFormTitle("")
    setFormIssuedOn("")
    setFormFile(null)
    setFormIsPublished(true)
    setModalError("")
    setIsModalOpen(true)
  }

  const handleOpenEdit = (cert) => {
    setModalMode("edit")
    setSelectedCert(cert)
    setFormTitle(cert.title || "")
    setFormIssuedOn(cert.issued_on || "")
    setFormFile(null)
    setFormIsPublished(Boolean(cert.is_published))
    setModalError("")
    setIsModalOpen(true)
  }

  const handleToggleStatus = async (cert) => {
    const nextStatus = !cert.is_published
    try {
      const res = await setCertificateStatus(cert.id, nextStatus)
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        showErrorToast(json?.message || "Failed to update certificate status")
        return
      }
      setCertificates((prev) =>
        prev.map((c) => (c.id === cert.id ? json?.data || { ...c, is_published: nextStatus } : c))
      )
      showSuccessToast(nextStatus ? "Certificate published on website" : "Certificate hidden from website")
    } catch (err) {
      showErrorToast(err.message || "Failed to update certificate status")
    }
  }

  const handleDelete = async (cert) => {
    const ok = await confirm({
      title: "Delete Certificate?",
      message: "Delete this certificate? It will be removed from the website.",
      confirmLabel: "Delete",
      danger: true,
    })
    if (!ok) return

    try {
      const res = await deleteCertificate(cert.id)
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        showErrorToast(json?.message || "Failed to delete certificate")
        return
      }
      setCertificates((prev) => prev.filter((c) => c.id !== cert.id))
      showSuccessToast("Certificate deleted successfully")
    } catch (err) {
      showErrorToast(err.message || "Failed to delete certificate")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setModalError("")

    const trimmedTitle = formTitle.trim()
    if (!trimmedTitle) {
      setModalError("Title is required.")
      return
    }

    if (modalMode === "add" && !formFile) {
      setModalError("Please select a PDF file.")
      return
    }

    if (formFile && formFile.size > 10 * 1024 * 1024) {
      setModalError("PDF must be 10 MB or smaller.")
      return
    }

    const fd = new FormData()
    fd.append("title", trimmedTitle)
    if (formIssuedOn) {
      fd.append("issued_on", formIssuedOn)
    }
    fd.append("is_published", formIsPublished ? "true" : "false")
    if (formFile) {
      fd.append("file", formFile)
    }

    setIsSaving(true)
    try {
      const res = modalMode === "add" ? await createCertificate(fd) : await updateCertificate(selectedCert.id, fd)

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        setModalError(json?.message || "Couldn't save certificate. Try again.")
        return
      }

      if (modalMode === "add") {
        if (json?.data) {
          setCertificates((prev) => [json.data, ...prev])
        } else {
          await loadCertificates()
        }
        showSuccessToast("Certificate added successfully")
      } else {
        if (json?.data) {
          setCertificates((prev) => prev.map((c) => (c.id === selectedCert.id ? json.data : c)))
        } else {
          await loadCertificates()
        }
        showSuccessToast("Certificate updated successfully")
      }

      setIsModalOpen(false)
    } catch (err) {
      setModalError(err.message || "Couldn't save certificate. Try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Certificates of Analysis</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">PDFs shown on the website</p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Certificate</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <Spinner size="lg" />
          <p className="text-sm font-medium text-slate-500 mt-4">Loading certificates…</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-error-50 text-error-600 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Failed to load certificates</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">{error}</p>
          <button
            type="button"
            onClick={loadCertificates}
            className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition"
          >
            Retry
          </button>
        </div>
      ) : certificates.length === 0 ? (
        <div className="p-12 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No certificates yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Upload your first Certificate of Analysis PDF to show on the website.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Certificate</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title…"
                className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white font-medium text-slate-800 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="w-full">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3.5 w-auto">Title</th>
                    <th className="hidden md:table-cell px-4 py-3.5 w-36">Issued On</th>
                    <th className="px-4 py-3.5 w-28">Status</th>
                    <th className="hidden md:table-cell px-4 py-3.5 w-32">Uploaded</th>
                    <th className="px-4 py-3.5 text-right w-36 sm:w-44">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedCertificates.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-sm text-slate-500">
                        No certificates match your search.
                      </td>
                    </tr>
                  ) : (
                    paginatedCertificates.map((cert) => (
                      <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3.5 min-w-0">
                          <div className="font-semibold text-slate-900 text-sm truncate" title={cert.title}>
                            {cert.title}
                          </div>
                          <div
                            className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-xs"
                            title={cert.file_name}
                          >
                            {cert.file_name || "—"}
                          </div>
                          <div className="md:hidden text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                            <span>Issued: {formatIssuedDate(cert.issued_on)}</span>
                            <span>•</span>
                            <span>Uploaded: {formatUploadedDate(cert.created_at)}</span>
                          </div>
                        </td>

                        <td className="hidden md:table-cell px-4 py-3.5 text-xs text-slate-600 font-medium whitespace-nowrap">
                          {formatIssuedDate(cert.issued_on)}
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                              cert.is_published
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {cert.is_published ? "Published" : "Hidden"}
                          </span>
                        </td>

                        <td className="hidden md:table-cell px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                          {formatUploadedDate(cert.created_at)}
                        </td>

                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <a
                              href={cert.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition"
                              title="View PDF"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(cert)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition"
                              title="Edit Certificate"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleStatus(cert)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition"
                              title={cert.is_published ? "Hide from website" : "Publish on website"}
                            >
                              {cert.is_published ? (
                                <EyeOff className="w-4 h-4 text-amber-600" />
                              ) : (
                                <Eye className="w-4 h-4 text-emerald-600" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(cert)}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                              title="Delete Certificate"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              skip={skip}
              limit={limit}
              total={filteredCertificates.length}
              onChange={(newSkip) => setSkip(newSkip)}
            />
          </div>
        </div>
      )}

      {isModalOpen && (
        <Modal onClose={() => !isSaving && setIsModalOpen(false)}>
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-lg">
                {modalMode === "add" ? "Add Certificate" : "Edit Certificate"}
              </h3>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
                {modalError && (
                  <div className="p-3 bg-error-50 border border-error-100 rounded-xl text-xs font-semibold text-error-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="flex-1">{modalError}</p>
                  </div>
                )}

                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Title <span className="text-error-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={150}
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Organic Black Pepper Batch #2026-04"
                    className="w-full px-3.5 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-800 transition"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Issued On <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={formIssuedOn}
                    onChange={(e) => setFormIssuedOn(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-800 transition"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    {modalMode === "add" ? (
                      <>
                        PDF File <span className="text-error-500 font-bold">*</span>
                      </>
                    ) : (
                      <>
                        Replace PDF <span className="text-slate-400 font-normal">(optional)</span>
                      </>
                    )}
                  </label>
                  {modalMode === "edit" && selectedCert?.file_name && (
                    <p className="text-xs text-slate-500 font-mono mb-1.5 truncate">
                      Current file: <span className="font-semibold text-slate-700">{selectedCert.file_name}</span>
                    </p>
                  )}
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(e) => setFormFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-medium text-slate-700 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 transition cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">PDF up to 10 MB</p>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Publish on website</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      When active, visitors can see and download this PDF.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formIsPublished}
                      onChange={(e) => setFormIsPublished(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50/50">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-600 transition-all bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-brand-500/10 active:scale-95 flex items-center gap-2"
                >
                  {isSaving && <Spinner size="sm" />}
                  <span>{modalMode === "add" ? "Upload & Save" : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  )
}
