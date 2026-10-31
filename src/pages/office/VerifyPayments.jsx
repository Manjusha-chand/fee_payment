import { useMemo, useState } from 'react'
import {
  BadgeCheck,
  CheckCircle2,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react'
import Layout from '../../components/Layout.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import Tabs from '../../components/Tabs.jsx'
import Modal from '../../components/Modal.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import DownloadReceiptButton from '../../components/DownloadReceiptButton.jsx'
import { useApp } from '../../lib/store.jsx'
import { byNewest } from '../../lib/fees.js'
import { currency, formatDate, formatDateTime, methodLabel } from '../../lib/format.js'

export default function VerifyPayments() {
  const { db, reviewPayment } = useApp()
  const [filter, setFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [target, setTarget] = useState(null)
  const [action, setAction] = useState(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const studentById = useMemo(
    () => Object.fromEntries(db.students.map((student) => [student.id, student])),
    [db.students],
  )

  const all = [...db.payments].sort(byNewest)
  const counts = {
    all: all.length,
    pending: all.filter((item) => item.status === 'pending').length,
    verified: all.filter((item) => item.status === 'verified').length,
    rejected: all.filter((item) => item.status === 'rejected').length,
  }

  const query = search.trim().toLowerCase()
  const visible = all.filter((payment) => {
    if (filter !== 'all' && payment.status !== filter) return false
    if (!query) return true
    const student = studentById[payment.studentId]
    return (
      student?.name.toLowerCase().includes(query) ||
      student?.rollNumber.toLowerCase().includes(query) ||
      payment.transactionId.toLowerCase().includes(query)
    )
  })

  function openModal(payment, nextAction) {
    setTarget(payment)
    setAction(nextAction)
    setReason('')
    setError('')
  }

  function closeModal() {
    setTarget(null)
    setAction(null)
    setReason('')
    setError('')
  }

  function confirmVerify() {
    reviewPayment(target.id, 'verify')
    setNotice(`Payment of ${currency(target.amount)} verified. A receipt has been generated.`)
    closeModal()
  }

  function confirmReject() {
    if (reason.trim().length < 5) {
      setError('Please give a short reason (at least 5 characters).')
      return
    }
    reviewPayment(target.id, 'reject', reason)
    setNotice(`Payment of ${currency(target.amount)} was rejected.`)
    closeModal()
  }

  const targetStudent = target ? studentById[target.studentId] : null

  return (
    <Layout
      title="Verify payments"
      subtitle="Approve or reject student fee payments to issue receipts"
    >
      <div className="space-y-5">
        {notice && (
          <div className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
              <p className="text-sm text-emerald-800">{notice}</p>
            </div>
            <button
              onClick={() => setNotice('')}
              className="rounded-lg p-1 text-emerald-600 transition hover:bg-emerald-100"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <div className="card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <Tabs
              value={filter}
              onChange={setFilter}
              tabs={[
                { value: 'pending', label: 'Pending', count: counts.pending },
                { value: 'verified', label: 'Verified', count: counts.verified },
                { value: 'rejected', label: 'Rejected', count: counts.rejected },
                { value: 'all', label: 'All', count: counts.all },
              ]}
            />
            <div className="relative w-full lg:w-72">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                className="input pl-9"
                placeholder="Search name, roll or reference"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={filter === 'pending' ? BadgeCheck : ShieldCheck}
              title={filter === 'pending' ? 'No pending payments' : 'No payments found'}
              message={
                query
                  ? 'No payments match your search.'
                  : filter === 'pending'
                    ? 'Every submitted payment has been reviewed.'
                    : 'Nothing to show for this filter yet.'
              }
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
                    <th className="table-head">Status</th>
                    <th className="table-head text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((payment) => {
                    const student = studentById[payment.studentId]
                    return (
                      <tr key={payment.id} className="align-top hover:bg-slate-50/60">
                        <td className="table-cell">
                          <p className="font-medium text-slate-900">
                            {student?.name || 'Unknown student'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {student?.rollNumber} · {student?.course}
                          </p>
                        </td>
                        <td className="table-cell font-semibold text-slate-900">
                          {currency(payment.amount)}
                        </td>
                        <td className="table-cell">
                          <p className="font-mono text-xs">{payment.transactionId}</p>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {methodLabel(payment.method)}
                          </p>
                        </td>
                        <td className="table-cell">
                          <p>{formatDate(payment.paidOn)}</p>
                          {payment.status === 'verified' && payment.verifiedOn && (
                            <p className="mt-0.5 text-[11px] text-slate-400">
                              Verified {formatDate(payment.verifiedOn)}
                            </p>
                          )}
                        </td>
                        <td className="table-cell">
                          <StatusBadge status={payment.status} />
                          {payment.status === 'verified' && payment.receiptNo && (
                            <p className="mt-1 text-[11px] font-semibold text-emerald-600">
                              {payment.receiptNo}
                            </p>
                          )}
                          {payment.status === 'rejected' && payment.rejectionReason && (
                            <p className="mt-1 max-w-[220px] text-[11px] text-rose-600">
                              {payment.rejectionReason}
                            </p>
                          )}
                        </td>
                        <td className="table-cell text-right">
                          {payment.status === 'pending' ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openModal(payment, 'verify')}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                              >
                                <CheckCircle2 size={13} /> Verify
                              </button>
                              <button
                                onClick={() => openModal(payment, 'reject')}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                              >
                                <XCircle size={13} /> Reject
                              </button>
                            </div>
                          ) : payment.status === 'verified' && student ? (
                            <div className="flex justify-end">
                              <DownloadReceiptButton
                                student={student}
                                payment={payment}
                                compact
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={action === 'verify'}
        onClose={closeModal}
        title="Verify payment"
        description="Approving this payment will generate a receipt for the student."
        footer={
          <>
            <button onClick={closeModal} className="btn-secondary">
              Cancel
            </button>
            <button onClick={confirmVerify} className="btn-success">
              <ShieldCheck size={16} /> Confirm verification
            </button>
          </>
        }
      >
        {target && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-500">Student</dt>
                  <dd className="text-sm font-semibold text-slate-900">
                    {targetStudent?.name}
                  </dd>
                  <dd className="text-xs text-slate-500">{targetStudent?.rollNumber}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Amount</dt>
                  <dd className="text-sm font-semibold text-slate-900">
                    {currency(target.amount)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Reference</dt>
                  <dd className="font-mono text-sm text-slate-900">
                    {target.transactionId}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Paid on</dt>
                  <dd className="text-sm text-slate-900">{formatDate(target.paidOn)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Method</dt>
                  <dd className="text-sm text-slate-900">{methodLabel(target.method)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Submitted</dt>
                  <dd className="text-sm text-slate-900">
                    {formatDateTime(target.createdAt)}
                  </dd>
                </div>
              </dl>
              {target.note && (
                <p className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Note:</span> {target.note}
                </p>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Make sure the reference number matches the college bank statement before
              confirming.
            </p>
          </div>
        )}
      </Modal>

      <Modal
        open={action === 'reject'}
        onClose={closeModal}
        title="Reject payment"
        description="The student will see your reason on their payments page."
        footer={
          <>
            <button onClick={closeModal} className="btn-secondary">
              Cancel
            </button>
            <button onClick={confirmReject} className="btn-danger">
              <XCircle size={16} /> Reject payment
            </button>
          </>
        }
      >
        {target && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-semibold text-slate-900">{targetStudent?.name}</p>
              <p className="text-xs text-slate-500">
                {targetStudent?.rollNumber} · {currency(target.amount)} ·{' '}
                <span className="font-mono">{target.transactionId}</span>
              </p>
            </div>

            <div>
              <label htmlFor="reason" className="label">
                Reason for rejection
              </label>
              <textarea
                id="reason"
                rows={3}
                className="input resize-none"
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value)
                  setError('')
                }}
                placeholder="e.g. Transaction reference not found in the bank statement."
              />
              {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  )
}
