import { Link } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { useApp } from '../lib/store.jsx'

export default function NotFound() {
  const { user } = useApp()
  const home = user ? (user.role === 'office' ? '/office' : '/student') : '/login'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-6 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-600 text-white">
        <GraduationCap size={26} />
      </span>
      <h1 className="mt-5 text-3xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to={home} className="btn-primary mt-6">
        Go to {user ? 'dashboard' : 'login'}
      </Link>
    </div>
  )
}
