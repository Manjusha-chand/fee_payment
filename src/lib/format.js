const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const plain = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

export const currency = (value) => inr.format(Number(value) || 0)

export const amount = (value) => plain.format(Number(value) || 0)

export const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export const formatDateTime = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const todayInput = () => {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  return new Date(now.getTime() - offset * 60 * 1000).toISOString().slice(0, 10)
}

export const PAYMENT_METHODS = [
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Debit / Credit Card' },
  { value: 'netbanking', label: 'Net Banking' },
  { value: 'cash', label: 'Cash / Demand Draft' },
]

export const methodLabel = (value) =>
  PAYMENT_METHODS.find((item) => item.value === value)?.label || value

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
