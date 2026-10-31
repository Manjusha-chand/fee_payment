import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { createSeed } from '../data/seed.js'

const DB_KEY = 'feepay.db.v1'
const SESSION_KEY = 'feepay.session.v1'

const AppContext = createContext(null)

function loadDb() {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.students && parsed?.payments && parsed?.office) return parsed
    }
  } catch {
    // fall through to a fresh seed
  }
  return createSeed()
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function nextReceiptNo(db) {
  const verified = db.payments.filter((payment) => payment.status === 'verified')
  const year = new Date().getFullYear()
  return `FEE/${year}/${String(verified.length + 1).padStart(4, '0')}`
}

export function AppProvider({ children }) {
  const [db, setDb] = useState(loadDb)
  const [session, setSession] = useState(loadSession)

  useEffect(() => {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  }, [db])

  useEffect(() => {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else localStorage.removeItem(SESSION_KEY)
  }, [session])

  const user = useMemo(() => {
    if (!session) return null
    if (session.role === 'office') return { ...db.office, role: 'office' }
    const student = db.students.find((item) => item.id === session.id)
    return student ? { ...student, role: 'student' } : null
  }, [session, db])

  function login(role, identifier, password) {
    const value = identifier.trim().toLowerCase()

    if (role === 'office') {
      const office = db.office
      const matchesId = value === office.userId.toLowerCase()
      const matchesEmail = value === office.email.toLowerCase()
      if ((matchesId || matchesEmail) && password === office.password) {
        setSession({ role: 'office', id: office.id })
        return { ok: true }
      }
      return { ok: false, error: 'Invalid office user ID or password.' }
    }

    const student = db.students.find(
      (item) =>
        item.rollNumber.toLowerCase() === value ||
        item.email.toLowerCase() === value,
    )
    if (!student || student.password !== password) {
      return { ok: false, error: 'Invalid roll number or password.' }
    }
    setSession({ role: 'student', id: student.id })
    return { ok: true }
  }

  function logout() {
    setSession(null)
  }

  function addPayment({ studentId, amount, method, transactionId, paidOn, note }) {
    const payment = {
      id: `pay-${Date.now()}`,
      studentId,
      amount: Number(amount),
      method,
      transactionId: transactionId.trim(),
      paidOn: new Date(`${paidOn}T09:00:00`).toISOString(),
      note: note?.trim() || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    setDb((prev) => ({ ...prev, payments: [payment, ...prev.payments] }))
    return payment
  }

  function reviewPayment(paymentId, decision, reason = '') {
    setDb((prev) => {
      const payments = prev.payments.map((payment) => {
        if (payment.id !== paymentId) return payment
        if (decision === 'verify') {
          return {
            ...payment,
            status: 'verified',
            receiptNo: payment.receiptNo || nextReceiptNo(prev),
            verifiedBy: prev.office.name,
            verifiedOn: new Date().toISOString(),
            rejectionReason: undefined,
          }
        }
        return {
          ...payment,
          status: 'rejected',
          verifiedBy: prev.office.name,
          verifiedOn: new Date().toISOString(),
          rejectionReason:
            reason.trim() || 'Payment details could not be verified.',
        }
      })
      return { ...prev, payments }
    })
  }

  function addStudent(values) {
    const student = {
      id: `st-${Date.now()}`,
      rollNumber: values.rollNumber.trim().toUpperCase(),
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone?.trim() || '',
      course: values.course.trim(),
      semester: Number(values.semester),
      password: values.password || 'student123',
      totalFee: Number(values.totalFee),
    }
    setDb((prev) => ({ ...prev, students: [...prev.students, student] }))
    return student
  }

  function updateStudent(studentId, values) {
    setDb((prev) => ({
      ...prev,
      students: prev.students.map((student) =>
        student.id === studentId
          ? {
              ...student,
              name: values.name.trim(),
              email: values.email.trim(),
              phone: values.phone?.trim() || '',
              course: values.course.trim(),
              semester: Number(values.semester),
              totalFee: Number(values.totalFee),
            }
          : student,
      ),
    }))
  }

  function resetDemo() {
    setDb(createSeed())
    setSession(null)
  }

  const value = {
    db,
    session,
    user,
    login,
    logout,
    addPayment,
    reviewPayment,
    addStudent,
    updateStudent,
    resetDemo,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside AppProvider')
  return context
}
