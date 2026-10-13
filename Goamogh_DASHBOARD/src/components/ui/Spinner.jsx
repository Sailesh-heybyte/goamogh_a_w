import PropTypes from "prop-types"

function Spinner({ size }) {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-10 h-10 border-3",
  }

  return (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-slate-200 border-t-brand-600`}
      role="status"
      aria-label="loading"
    />
  )
}

Spinner.propTypes = {
  size: PropTypes.oneOf(["sm", "md", "lg"]),
}

Spinner.defaultProps = {
  size: "md",
}

export default Spinner
