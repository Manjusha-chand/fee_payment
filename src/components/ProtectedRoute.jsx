import { Navigate } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import LoadingScreen from './LoadingScreen.jsx'

export default function ProtectedRoute({ role, children }) {
  const { session, user, loading } = useApp()

  if (loading) return <LoadingScreen />
  if (!session || !user) return <Navigate to="/login" replace />
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'office' ? '/office' : '/student'} replace />
  }
  return children
}
