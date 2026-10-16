import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"

function Modal({ onClose, children, zIndex = "z-50" }) {
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const handleKey = (e) => {
      if (e.key === "Escape") onCloseRef.current()
    }
    window.addEventListener("keydown", handleKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKey)
    }
  }, [])

  return createPortal(
    <div
      className={`modal-overlay fixed inset-0 ${zIndex} flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm`}
    >
      {children}
    </div>,
    document.body
  )
}

export default Modal
