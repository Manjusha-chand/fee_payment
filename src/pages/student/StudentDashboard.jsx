import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  IndianRupee,
  ReceiptText,
  Wallet,
} from 'lucide-react'
import Layout from '../../components/Layout.jsx'
import StatCard from '../../components/StatCard.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import DownloadReceiptButton from '../../components/DownloadReceiptButton.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { useApp } from '../../lib/store.jsx'
import { studentFee } from '../../lib/fees.js'
import { currency, formatDate } from '../../lib/format.js'

export default function StudentDashboard() {
  const { user, db } = useApp()
  const fee = studentFee(db, user)
  const recent = fee.payments.slice(0, 5)
  const cleared = fee.balance <= 0

  return (
    <Layout
      title="Student dashboard"
      subtitle={`${user.rollNumber} · ${user.course} · Semester ${user.semester}`}
    >
      <div className="space-y-6">
        <section className="card overflow-hidden">
          <div className="flex flex-col gap-5 bg-gradient-to-r from-indigo-600 to-indigo-500 p-6 text-white md:flex-row md:items-center md:justify-between md:p-7">
            <div>
              <p className="text-sm text-indigo-100">Welcome back,</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
                {user.name}
              </h2>
              <p className="mt-2 text-sm text-indigo-100">
                {cleared
                  ? 'All your fees are cleared. You can download receipts from your payments page.'
                  : `You have ${currency(fee.balance)} left to pay for this academic year.`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/student/pay"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
              >
                <Wallet size={16} /> Pay fees
              </Link>
              <Link
                to="/student/payments"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <ReceiptText size={16} /> My payments
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total fee"
            value={currency(user.totalFee)}
            hint="Academic year"
            icon={IndianRupee}
            tone="slate"
          />
          <StatCard
            label="Verified paid"
            value={currency(fee.verified)}
            hint={`${fee.progress}% of total fee`}
            icon={CheckCircle2}
            tone="emerald"
          />
          <StatCard
            label="Awaiting verification"
            value={currency(fee.pending)}
            hint={
              fee.payments.filter((item) => item.status === 'pending').length
                ? 'Being reviewed by the office'
                : 'No pending payments'
            }
            icon={Clock}
            tone="amber"
          />
          <StatCard
            label="Balance due"
            value={currency(fee.balance)}
            hint={cleared ? 'Fully cleared' : 'Pay to clear your dues'}
            icon={Wallet}
            tone={cleared ? 'emerald' : 'rose'}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="card p-6 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Fee progress</h3>
                <p className="text-xs text-slate-500">
                  Based on payments verified by the fee section.
                </p>
              </div>
              <span className="text-sm font-semibold text-slate-900">{fee.progress}%</span>
            </div>
            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all"
                style={{ width: `${fee.progress}%` }}
              />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Paid
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {currency(fee.verified)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Pending
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {currency(fee.pending)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Balance
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {currency(fee.balance)}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-900">Need help?</h3>
            <p className="mt-1 text-xs text-slate-500">
              Receipts are generated only after the office verifies your payment.
            </p>
            <div className="mt-4 space-y-3">
              <div className="flex gap-3 rounded-xl border border-slate-200 p-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Wallet size={15} />
                </span>
                <p className="text-xs leading-relaxed text-slate-600">
                  Pay using UPI, card, or net banking, then submit the transaction
                  reference.
                </p>
              </div>
              <div className="flex gap-3 rounded-xl border border-slate-200 p-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                  <ReceiptText size={15} />
                </span>
                <p className="text-xs leading-relaxed text-slate-600">
                  Once verified, download your PDF receipt from the payments page.
                </p>
              </div>
            </div>
          </div>
        </section>

        {fee.payments.some((item) => item.status === 'pending') && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              You have{' '}
              <strong>
                {fee.payments.filter((item) => item.status === 'pending').length}
              </strong>{' '}
              payment(s) awaiting verification. The receipt will be available once the
              fee section approves them.
            </p>
          </div>
        )}

        <section className="card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Recent payments</h3>
              <p className="text-xs text-slate-500">Your latest fee submissions</p>
            </div>
            <Link
              to="/student/payments"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {recent.length === 0 ? (
            <EmptyState
              icon={ReceiptText}
              title="No payments yet"
              message="Your payment history will appear here after you submit your first fee payment."
              action={
                <Link to="/student/pay" className="btn-primary">
                  Pay fees
                </Link>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="table-head">Reference</th>
                    <th className="table-head">Amount</th>
                    <th className="table-head">Paid on</th>
                    <th className="table-head">Status</th>
                    <th className="table-head text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recent.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50/60">
                      <td className="table-cell font-mono text-xs">{payment.transactionId}</td>
                      <td className="table-cell font-semibold text-slate-900">
                        {currency(payment.amount)}
                      </td>
                      <td className="table-cell">{formatDate(payment.paidOn)}</td>
                      <td className="table-cell">
                        <StatusBadge status={payment.status} />
                      </td>
                      <td className="table-cell text-right">
                        {payment.status === 'verified' ? (
                          <DownloadReceiptButton
                            student={user}
                            payment={payment}
                            compact
                          />
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Layout>
  )
}
