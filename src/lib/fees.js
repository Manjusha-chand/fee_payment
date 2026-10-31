export function studentFee(db, student) {
  const payments = db.payments
    .filter((payment) => payment.studentId === student.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const verified = payments
    .filter((payment) => payment.status === 'verified')
    .reduce((sum, payment) => sum + Number(payment.amount), 0)

  const pending = payments
    .filter((payment) => payment.status === 'pending')
    .reduce((sum, payment) => sum + Number(payment.amount), 0)

  const rejected = payments
    .filter((payment) => payment.status === 'rejected')
    .reduce((sum, payment) => sum + Number(payment.amount), 0)

  const balance = Math.max(Number(student.totalFee) - verified, 0)
  const progress = student.totalFee
    ? Math.min(100, Math.round((verified / Number(student.totalFee)) * 100))
    : 0

  return { payments, verified, pending, rejected, balance, progress }
}

export function feeStatusText(balance, pending) {
  if (balance <= 0) return 'Cleared'
  if (pending > 0) return 'Pending'
  return 'Due'
}

export const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt)

export function sumBy(items, selector = (item) => item.amount) {
  return items.reduce((total, item) => total + Number(selector(item)), 0)
}
