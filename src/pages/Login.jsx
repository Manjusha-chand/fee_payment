import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  UserRound,
  Wallet,
} from 'lucide-react'
import { COLLEGE } from '../config.js'
import { useApp } from '../lib/store.jsx'

const features = [
  {
    icon: Wallet,
    title: 'Pay fees online',
    text: 'Submit your fee payment with the transaction reference in a few steps.',
  },
  {
    icon: ShieldCheck,
    title: 'Office verification',
    text: 'Every payment is checked and approved by the college fee section.',
  },
  {
    icon: ReceiptText,
    title: 'Instant receipts',
    text: 'Download an official PDF receipt as soon as your payment is verified.',
  },
]

export default function Login() {
  const { user, login, resetDemo } = useApp()
  const navigate = useNavigate()

  const [role, setRole] = useState('student')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  if (user) {
    return <Navigate to={user.role === 'office' ? '/office' : '/student'} replace />
  }

  function switchRole(next) {
    setRole(next)
    setIdentifier('')
    setPassword('')
    setError('')
  }

  function fillDemo() {
    if (role === 'student') {
      setIdentifier('CS21001')
      setPassword('student123')
    } else {
      setIdentifier('office')
      setPassword('office123')
    }
    setError('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!identifier.trim() || !password) {
      setError('Please enter both your credentials.')
      return
    }
    const result = login(role, identifier, password)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate(role === 'office' ? '/office' : '/student', { replace: true })
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-slate-900 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-500 shadow-lg shadow-indigo-500/30">
              <GraduationCap size={24} />
            </span>
            <div>
              <p className="text-base font-semibold">FeePay</p>
              <p className="text-xs text-slate-400">{COLLEGE.tagline}</p>
            </div>
          </div>

          <h1 className="mt-16 max-w-md text-4xl font-bold leading-tight tracking-tight">
            A simpler, safer way to manage college fees.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            {COLLEGE.name} — one portal for students to pay fees and for the fee
            section to verify payments and issue receipts.
          </p>

          <ul className="mt-10 space-y-5">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <li key={feature.title} className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-indigo-300">
                    <Icon size={19} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{feature.title}</p>
                    <p className="mt-0.5 max-w-sm text-xs leading-relaxed text-slate-400">
                      {feature.text}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">
          {COLLEGE.address}
        </p>
      </aside>

      <main className="flex items-center justify-center bg-slate-100 px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white">
              <GraduationCap size={22} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">FeePay</p>
              <p className="text-xs text-slate-500">{COLLEGE.shortName} Fee Portal</p>
            </div>
          </div>

          <div className="card p-6 sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Sign in
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose your account type and enter your credentials.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => switchRole('student')}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  role === 'student'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <GraduationCap size={16} /> Student
              </button>
              <button
                type="button"
                onClick={() => switchRole('office')}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  role === 'office'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck size={16} /> Office
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="identifier" className="label">
                  {role === 'student' ? 'Roll number or email' : 'Office user ID'}
                </label>
                <div className="relative">
                  <UserRound
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="identifier"
                    className="input pl-10"
                    placeholder={role === 'student' ? 'CS21001' : 'office'}
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <div className="relative">
                  <LockKeyhole
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="input pl-10 pr-11"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:text-slate-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="btn-primary w-full">
                Sign in <ArrowRight size={17} />
              </button>
            </form>
          </div>

          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Demo credentials
              </p>
              <button
                type="button"
                onClick={fillDemo}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Fill {role === 'student' ? 'student' : 'office'} login
              </button>
            </div>
            <div className="mt-2 grid gap-1 font-mono text-xs text-slate-600">
              {role === 'student' ? (
                <>
                  <span>Roll: CS21001</span>
                  <span>Password: student123</span>
                </>
              ) : (
                <>
                  <span>User ID: office</span>
                  <span>Password: office123</span>
                </>
              )}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Demo data is stored in your browser. No real payment is processed.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              resetDemo()
              setIdentifier('')
              setPassword('')
              setError('')
            }}
            className="mt-3 w-full text-center text-[11px] font-medium text-slate-400 hover:text-slate-600"
          >
            Reset demo data
          </button>
        </div>
      </main>
    </div>
  )
}
