import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { COLLEGE } from '../config.js'
import { useApp } from '../lib/store.jsx'
import { initials } from '../lib/format.js'

const navByRole = {
  student: [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/student/pay', label: 'Pay Fees', icon: Wallet },
    { to: '/student/payments', label: 'Payments & Receipts', icon: ReceiptText },
  ],
  office: [
    { to: '/office', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/office/verify', label: 'Verify Payments', icon: ShieldCheck },
    { to: '/office/students', label: 'Students', icon: Users },
  ],
}

function SidebarContent({ user, pendingCount, onNavigate }) {
  const navigate = useNavigate()
  const { logout } = useApp()
  const items = navByRole[user.role] || []

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-full flex-col bg-slate-900 px-4 py-5 text-slate-300">
      <div className="flex items-center gap-3 px-2">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
          <GraduationCap size={22} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">FeePay</p>
          <p className="truncate text-[11px] text-slate-400">{COLLEGE.shortName} Fee Portal</p>
        </div>
      </div>

      <p className="mt-7 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {user.role === 'office' ? 'Office' : 'Student'} Menu
      </p>

      <nav className="mt-2 flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-500/15 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.to === '/office/verify' && pendingCount > 0 && (
                <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-4 rounded-xl bg-white/5 p-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-200">
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-[11px] text-slate-400">
              {user.role === 'office' ? user.designation : user.rollNumber}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Layout({ title, subtitle, children }) {
  const { user, db } = useApp()
  const [open, setOpen] = useState(false)
  const pendingCount = db.payments.filter((item) => item.status === 'pending').length

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 md:block">
        <SidebarContent user={user} pendingCount={pendingCount} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
            <SidebarContent
              user={user}
              pendingCount={pendingCount}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 md:px-8">
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold text-slate-900 md:text-lg">
                {title}
              </h1>
              {subtitle && (
                <p className="truncate text-xs text-slate-500">{subtitle}</p>
              )}
            </div>
            <div className="hidden items-center gap-2 rounded-full bg-slate-100 py-1.5 pl-1.5 pr-3 sm:flex">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                {initials(user.name)}
              </span>
              <span className="max-w-[140px] truncate text-xs font-medium text-slate-600">
                {user.name}
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
