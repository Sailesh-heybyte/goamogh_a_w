import { Component } from "react"
import PropTypes from "prop-types"

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Something went wrong</h2>
          <p className="text-sm font-medium text-slate-500 text-center max-w-sm">
            We encountered an unexpected error. Please refresh the page or try again.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-500/10 active:scale-95"
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
}

export default ErrorBoundary
