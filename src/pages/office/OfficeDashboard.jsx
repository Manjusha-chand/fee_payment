import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  IndianRupee,
  ReceiptText,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react'
import Layout from '../../components/Layout.jsx'
import StatCard from '../../components/StatCard.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { useApp } from '../../lib/store.jsx'
import { byNewest, studentFee, sumBy } from '../../lib/fees.js'
import { currency, formatDate, formatDateTime } from '../../lib/format.js'

export default function OfficeDashboard() {
  const { db } = useApp()
  const studentById = Object.fromEntries(db.students.map((student) => [student.id, student]))

  const pending = db.payments.filter((item) => item.status === 'pending').sort(byNewest)
  const verified = db.payments
    .filter((item) => item.status === 'verified')
    .sort((a, b) => new Date(b.verifiedOn) - new Date(a.verifiedOn))

  const collected = sumBy(verified)
  const pendingAmount = sumBy(pending)
  const cleared = db.students.filter((student) => studentFee(db, student).balance <= 0).length
  const totalBilled = db.students.reduce((sum, student) => sum + Number(student.totalFee), 0)
  const collectionRate = totalBilled ? Math.round((collected / totalBilled) * 100) : 0

  return (
    <Layout
      title="Office dashboard"
      subtitle="Fee Section · Review payments and monitor collections"
    >
      <div className="space-y-6">
        {pending.length > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                <Clock size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  {pending.length} payment{pending.length > 1 ? 's' : ''} awaiting verification
                </p>
                <p className="text-xs text-amber-800/80">
                  Verify payments to generate receipts for students.
                </p>
              </div>
            </div>
            <Link
              to="/office/verify"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
            >
              Review payments <ArrowRight size={15} />
            </Link>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Collected (verified)"
            value={currency(collected)}
            hint={`${collectionRate}% of total billed`}
            icon={IndianRupee}
            tone="emerald"
          />
          <StatCard
            label="Pending payments"
            value={pending.length}
            hint={`${currency(pendingAmount)} awaiting review`}
            icon={Clock}
            tone="amber"
          />
          <StatCard
            label="Students"
            value={db.students.length}
            hint={`${cleared} fully cleared`}
            icon={Users}
            tone="indigo"
          />
          <StatCard
            label="Receipts issued"
            value={verified.length}
            hint="For verified payments"
            icon={ReceiptText}
            tone="slate"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="card overflow-hidden lg:col-span-2">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Pending verifications</h3>
                <p className="text-xs text-slate-500">Payments submitted by students</p>
              </div>
              <Link
                to="/office/verify"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>

            {pending.length === 0 ? (
              <EmptyState
                icon={BadgeCheck}
                title="All caught up"
                message="There are no pending payments to verify right now."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="table-head">Student</th>
                      <th className="table-head">Amount</th>
                      <th className="table-head">Reference</th>
                      <th className="table-head">Paid on</th>
                      <th className="table-head text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pending.slice(0, 5).map((payment) => {
                      const student = studentById[payment.studentId]
                      return (
                        <tr key={payment.id} className="hover:bg-slate-50/60">
                          <td className="table-cell">
                            <p className="font-medium text-slate-900">{student?.name || 'Unknown'}</p>
                            <p className="text-xs text-slate-500">{student?.rollNumber}</p>
                          </td>
                          <td className="table-cell font-semibold text-slate-900">
                            {currency(payment.amount)}
                          </td>
                          <td className="table-cell font-mono text-xs">
                            {payment.transactionId}
                          </td>
                          <td className="table-cell">{formatDate(payment.paidOn)}</td>
                          <td className="table-cell text-right">
                            <Link
                              to="/office/verify"
                              className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                            >
                              Review
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">Recent verifications</h3>
              <p className="text-xs text-slate-500">Last approved payments</p>
            </div>

            {verified.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="No verifications yet"
                message="Approved payments will appear here."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {verified.slice(0, 5).map((payment) => {
                  const student = studentById[payment.studentId]
                  return (
                    <li key={payment.id} className="flex items-start gap-3 px-5 py-3.5">
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                        <BadgeCheck size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {student?.name || 'Unknown'}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {currency(payment.amount)} · {payment.receiptNo}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {formatDateTime(payment.verifiedOn)}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>

        <section className="card p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Overall collection</h3>
              <p className="text-xs text-slate-500">
                Verified payments against total billed fees across all students.
              </p>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {currency(collected)} <span className="text-slate-400">of</span>{' '}
              {currency(totalBilled)}
            </p>
          </div>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500"
              style={{ width: `${Math.min(collectionRate, 100)}%` }}
            />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Collected
              </p>
              <p className="mt-1 text-sm font-semibold text-emerald-600">{currency(collected)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Pending verification
              </p>
              <p className="mt-1 text-sm font-semibold text-amber-600">{currency(pendingAmount)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Outstanding
              </p>
              <p className="mt-1 text-sm font-semibold text-rose-600">
                {currency(Math.max(totalBilled - collected, 0))}
              </p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  )
}
