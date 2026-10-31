const styles = {
  verified: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-600/20',
}

const dots = {
  verified: 'bg-emerald-500',
  pending: 'bg-amber-500',
  rejected: 'bg-rose-500',
}

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${
        styles[status] || styles.pending
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status] || dots.pending}`} />
      {status}
    </span>
  )
}
