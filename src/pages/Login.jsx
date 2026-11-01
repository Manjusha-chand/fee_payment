import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  UserRound,
  Wallet,
} from 'lucide-react'
import { COLLEGE } from '../config.js'
import { useApp } from '../lib/store.jsx'
import LoadingScreen from '../components/LoadingScreen.jsx'

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
  const { user, loading, login } = useApp()
  const navigate = useNavigate()

  const [role, setRole] = useState('student')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return <LoadingScreen />
  if (user) {
    return <Navigate to={user.role === 'office' ? '/office' : '/student'} replace />
  }

  function switchRole(next) {
    setRole(next)
    setIdentifier('')
    setPassword('')
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (busy) return
    if (!identifier.trim() || !password) {
      setError('Please enter both your credentials.')
      return
    }
    setBusy(true)
    setError('')
    const result = await login(role, identifier, password)
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate(role === 'office' ? '/office' : '/student', { replace: true })
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-slate-950 to-slate-950" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-indigo-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />

        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/40">
              <GraduationCap size={26} />
            </span>
            <div>
              <p className="text-lg font-semibold tracking-tight">FeePay</p>
              <p className="text-xs text-slate-300">{COLLEGE.tagline}</p>
            </div>
          </div>

          <h1 className="mt-16 max-w-lg text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
            A simpler, safer way to manage college fees.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-300">
            {COLLEGE.name} — one portal for students to pay fees and for the fee
            section to verify payments and issue receipts.
          </p>

          <ul className="mt-12 space-y-6">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <li key={feature.title} className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-indigo-300 ring-1 ring-inset ring-white/10">
                    <Icon size={20} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{feature.title}</p>
                    <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-300">
                      {feature.text}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="relative mt-16 border-t border-white/10 pt-6">
          <p className="text-xs text-slate-400">{COLLEGE.address}</p>
          <p className="mt-1 text-xs text-slate-500">
            © {new Date().getFullYear()} {COLLEGE.shortName} Fee Section
          </p>
        </div>
      </aside>

      {/* Sign-in panel */}
      <main className="relative flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-indigo-50 to-transparent" />

        <div className="relative w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <GraduationCap size={22} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">FeePay</p>
              <p className="text-xs text-slate-500">{COLLEGE.shortName} Fee Portal</p>
            </div>
          </div>

          <div className="card p-6 shadow-lg shadow-slate-900/5 sm:p-9">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Sign in
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Choose your account type and enter your credentials.
            </p>

            <div
              className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1"
              role="tablist"
              aria-label="Account type"
            >
              <button
                type="button"
                role="tab"
                aria-selected={role === 'student'}
                onClick={() => switchRole('student')}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  role === 'student'
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <GraduationCap size={16} /> Student
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={role === 'office'}
                onClick={() => switchRole('office')}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  role === 'office'
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck size={16} /> Office
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
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
                    placeholder={role === 'student' ? '5241412001' : 'office'}
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
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
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700"
                >
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full py-3"
                disabled={busy}
              >
                {busy ? (
                  <>
                    <Loader2 size={17} className="animate-spin" /> Signing in…
                  </>
                ) : (
                  <>
                    Sign in <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <p className="text-center text-xs leading-relaxed text-slate-500">
                Use the roll number and password issued by the fee section.
                <br />
                Trouble signing in? Contact the fee section office.
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400 lg:hidden">
            {COLLEGE.address}
          </p>
        </div>
      </main>
    </div>
  )
}
