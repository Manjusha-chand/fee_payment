import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { api } from './api.js'

const SESSION_KEY = 'feepay.session.v1'
const EMPTY_DB = { office: null, students: [], payments: [] }

const AppContext = createContext(null)

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed?.token ? parsed : null
  } catch {
    return null
  }
}

function saveSession(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  else localStorage.removeItem(SESSION_KEY)
}

export function AppProvider({ children }) {
  const [session, setSession] = useState(loadSession)
  const [db, setDb] = useState(EMPTY_DB)
  const [loading, setLoading] = useState(() => Boolean(loadSession()?.token))
  const [bootError, setBootError] = useState('')

  const sessionRef = useRef(session)
  sessionRef.current = session

  const clearSession = useCallback(() => {
    saveSession(null)
    setSession(null)
    setDb(EMPTY_DB)
    setLoading(false)
    setBootError('')
  }, [])

  const refresh = useCallback(async () => {
    const current = sessionRef.current
    if (!current?.token) {
      setLoading(false)
      return
    }
    try {
      const data = await api.bootstrap(current.token)
      setDb({
        office: data.office ?? null,
        students: data.students ?? [],
        payments: data.payments ?? [],
      })
      setBootError('')
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        clearSession()
      }
      setBootError(error.message)
    } finally {
      setLoading(false)
    }
  }, [clearSession])

  useEffect(() => {
    if (!session?.token) {
      setDb(EMPTY_DB)
      setLoading(false)
      return
    }
    setLoading(true)
    refresh()
  }, [session?.token, refresh])

  const user = useMemo(() => {
    if (!session) return null
    if (session.role === 'office') {
      return db.office ? { ...db.office, role: 'office' } : null
    }
    const student = db.students.find((item) => item.id === session.id)
    return student ? { ...student, role: 'student' } : null
  }, [session, db])

  async function login(role, identifier, password) {
    try {
      const data = await api.login({ role, identifier, password })
      const next = { token: data.token, role: data.user.role, id: data.user.id }
      saveSession(next)
      setSession(next)
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error.message }
    }
  }

  async function addPayment(values) {
    const token = sessionRef.current?.token
    const payment = await api.createPayment(token, values)
    await refresh()
    return payment
  }

  async function reviewPayment(paymentId, decision, reason = '') {
    const token = sessionRef.current?.token
    const payment = await api.reviewPayment(token, paymentId, { decision, reason })
    await refresh()
    return payment
  }

  async function addStudent(values) {
    const token = sessionRef.current?.token
    const student = await api.addStudent(token, values)
    await refresh()
    return student
  }

  async function updateStudent(studentId, values) {
    const token = sessionRef.current?.token
    const student = await api.updateStudent(token, studentId, values)
    await refresh()
    return student
  }

  async function resetDemo() {
    await api.resetDemo()
    clearSession()
  }

  const value = {
    db,
    session,
    user,
    loading,
    bootError,
    login,
    logout: clearSession,
    refresh,
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
