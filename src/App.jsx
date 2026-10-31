import { Navigate, Route, Routes } from 'react-router-dom'
import { useApp } from './lib/store.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Login from './pages/Login.jsx'
import StudentDashboard from './pages/student/StudentDashboard.jsx'
import PayFees from './pages/student/PayFees.jsx'
import StudentPayments from './pages/student/StudentPayments.jsx'
import OfficeDashboard from './pages/office/OfficeDashboard.jsx'
import VerifyPayments from './pages/office/VerifyPayments.jsx'
import Students from './pages/office/Students.jsx'
import NotFound from './pages/NotFound.jsx'

function HomeRedirect() {
  const { user } = useApp()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'office' ? '/office' : '/student'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/student"
        element={
          <ProtectedRoute role="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/pay"
        element={
          <ProtectedRoute role="student">
            <PayFees />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/payments"
        element={
          <ProtectedRoute role="student">
            <StudentPayments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/office"
        element={
          <ProtectedRoute role="office">
            <OfficeDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/office/verify"
        element={
          <ProtectedRoute role="office">
            <VerifyPayments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/office/students"
        element={
          <ProtectedRoute role="office">
            <Students />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
