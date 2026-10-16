import { useState, useCallback } from "react"
import { ConfirmContext } from "./ConfirmContext"
import Modal from "@/components/ui/Modal"
import { AlertTriangle, HelpCircle } from "lucide-react"

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null)

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        setDialog({ ...options, resolve })
      }),
    []
  )

  const finish = (result) => {
    if (dialog?.resolve) {
      dialog.resolve(result)
    }
    setDialog(null)
  }

  const isDanger = dialog?.tone === "danger"

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <Modal onClose={() => finish(false)} zIndex="z-[60]">
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl w-full max-w-md p-6">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isDanger ? "bg-error-50 text-error-800" : "bg-brand-50 text-brand-600"
              }`}
            >
              {isDanger ? <AlertTriangle className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-900">{dialog.title}</h3>
            {dialog.message && <p className="mt-2 text-sm text-slate-500">{dialog.message}</p>}

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => finish(false)}
                className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700"
              >
                {dialog.cancelLabel || "Cancel"}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => finish(true)}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-bold text-white ${
                  isDanger ? "bg-error-800 hover:bg-error-900" : "bg-brand-600 hover:bg-brand-700"
                }`}
              >
                {dialog.confirmLabel || "Yes, continue"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  )
}

export default ConfirmProvider
