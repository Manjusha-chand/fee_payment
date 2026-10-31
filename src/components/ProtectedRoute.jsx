import { Navigate } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'

export default function ProtectedRoute({ role, children }) {
  const { session, user } = useApp()

  if (!session || !user) return <Navigate to="/login" replace />
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'office' ? '/office' : '/student'} replace />
  }
  return children
}
