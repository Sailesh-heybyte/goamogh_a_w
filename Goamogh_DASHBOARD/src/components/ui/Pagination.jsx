function Pagination({ skip, limit, total, onChange }) {
  if (total === 0) return null
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200/80 bg-slate-50/50 text-xs font-medium text-slate-500">
      <span>
        Showing {skip + 1}–{Math.min(skip + limit, total)} of {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={skip === 0}
          onClick={() => onChange(Math.max(0, skip - limit))}
          className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={skip + limit >= total}
          onClick={() => onChange(skip + limit)}
          className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default Pagination
