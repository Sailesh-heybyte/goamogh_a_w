import { createRoot } from "react-dom/client"
import "./styles/index.css"
import App from "./App.jsx"

document.addEventListener(
  "wheel",
  (e) => {
    const el = document.activeElement
    if (el && el.type === "number" && el === e.target) el.blur()
  },
  { passive: true }
)

createRoot(document.getElementById("root")).render(<App />)
