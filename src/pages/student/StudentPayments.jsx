import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Clock, ReceiptText, Wallet, XCircle } from 'lucide-react'
import Layout from '../../components/Layout.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import Tabs from '../../components/Tabs.jsx'
import DownloadReceiptButton from '../../components/DownloadReceiptButton.jsx'
import { useApp } from '../../lib/store.jsx'
import { studentFee } from '../../lib/fees.js'
import { currency, formatDate, methodLabel } from '../../lib/format.js'

export default function StudentPayments() {
  const { user, db } = useApp()
  const fee = studentFee(db, user)
  const [filter, setFilter] = useState('all')

  const counts = useMemo(
    () => ({
      all: fee.payments.length,
      pending: fee.payments.filter((item) => item.status === 'pending').length,
      verified: fee.payments.filter((item) => item.status === 'verified').length,
      rejected: fee.payments.filter((item) => item.status === 'rejected').length,
    }),
    [fee.payments],
  )

  const visible =
    filter === 'all'
      ? fee.payments
      : fee.payments.filter((item) => item.status === filter)

  return (
    <Layout
      title="Payments & receipts"
      subtitle="Track your fee payments and download verified receipts"
    >
      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="card flex items-center gap-4 p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={20} />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-500">Verified paid</p>
              <p className="text-lg font-bold text-slate-900">{currency(fee.verified)}</p>
            </div>
          </div>
          <div className="card flex items-center gap-4 p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <Clock size={20} />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-500">Awaiting verification</p>
              <p className="text-lg font-bold text-slate-900">{currency(fee.pending)}</p>
            </div>
          </div>
          <div className="card flex items-center gap-4 p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-rose-50 text-rose-600">
              <Wallet size={20} />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-500">Balance due</p>
              <p className="text-lg font-bold text-slate-900">{currency(fee.balance)}</p>
            </div>
          </div>
        </section>

        <section className="card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Tabs
              value={filter}
              onChange={setFilter}
              tabs={[
                { value: 'all', label: 'All', count: counts.all },
                { value: 'pending', label: 'Pending', count: counts.pending },
                { value: 'verified', label: 'Verified', count: counts.verified },
                { value: 'rejected', label: 'Rejected', count: counts.rejected },
              ]}
            />
            <Link to="/student/pay" className="btn-primary">
              <Wallet size={16} /> Pay fees
            </Link>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={ReceiptText}
              title="No payments found"
              message={
                filter === 'all'
                  ? 'Submit your first payment to see it here.'
                  : `You have no ${filter} payments.`
              }
              action={
                filter === 'all' ? (
                  <Link to="/student/pay" className="btn-primary">
                    Pay fees
                  </Link>
                ) : (
                  <button onClick={() => setFilter('all')} className="btn-secondary">
                    Show all payments
                  </button>
                )
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="table-head">Reference</th>
                    <th className="table-head">Amount</th>
                    <th className="table-head">Method</th>
                    <th className="table-head">Paid on</th>
                    <th className="table-head">Status</th>
                    <th className="table-head text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((payment) => (
                    <tr key={payment.id} className="align-top hover:bg-slate-50/60">
                      <td className="table-cell">
                        <p className="font-mono text-xs">{payment.transactionId}</p>
                        {payment.status === 'verified' && payment.receiptNo && (
                          <p className="mt-1 text-[11px] font-semibold text-emerald-600">
                            {payment.receiptNo}
                          </p>
                        )}
                        {payment.status === 'rejected' && payment.rejectionReason && (
                          <p className="mt-1 max-w-xs text-[11px] text-rose-600">
                            {payment.rejectionReason}
                          </p>
                        )}
                        {payment.status === 'pending' && (
                          <p className="mt-1 text-[11px] text-amber-600">
                            Waiting for office verification
                          </p>
                        )}
                      </td>
                      <td className="table-cell font-semibold text-slate-900">
                        {currency(payment.amount)}
                      </td>
                      <td className="table-cell">{methodLabel(payment.method)}</td>
                      <td className="table-cell">{formatDate(payment.paidOn)}</td>
                      <td className="table-cell">
                        <StatusBadge status={payment.status} />
                      </td>
                      <td className="table-cell text-right">
                        {payment.status === 'verified' ? (
                          <DownloadReceiptButton student={user} payment={payment} compact />
                        ) : payment.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-rose-500">
                            <XCircle size={13} /> Not issued
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">After verification</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="text-center text-xs text-slate-400">
          Only payments verified by the fee section can generate a receipt.
        </p>
      </div>
    </Layout>
  )
}
