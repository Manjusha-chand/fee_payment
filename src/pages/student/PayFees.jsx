import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Info,
  Landmark,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import Layout from '../../components/Layout.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { useApp } from '../../lib/store.jsx'
import { studentFee } from '../../lib/fees.js'
import { currency, PAYMENT_METHODS, todayInput } from '../../lib/format.js'
import { COLLEGE } from '../../config.js'
import DownloadReceiptButton from '../../components/DownloadReceiptButton.jsx'

export default function PayFees() {
  const { user, db, addPayment } = useApp()
  const fee = studentFee(db, user)

  const [form, setForm] = useState({
    amount: fee.balance > 0 ? String(fee.balance) : '',
    method: 'upi',
    transactionId: '',
    paidOn: todayInput(),
    note: '',
  })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(null)
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  async function copyUpi() {
    try {
      await navigator.clipboard.writeText(COLLEGE.upiId)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  function validate() {
    const next = {}
    const amount = Number(form.amount)
    if (!form.amount || Number.isNaN(amount) || amount <= 0) {
      next.amount = 'Enter a valid payment amount.'
    } else if (amount > fee.balance) {
      next.amount = `Amount cannot exceed the outstanding balance of ${currency(fee.balance)}.`
    }
    if (!form.method) next.method = 'Select a payment method.'
    const reference = form.transactionId.trim()
    if (reference.length < 5) {
      next.transactionId = 'Enter a valid transaction / reference number.'
    } else if (
      db.payments.some(
        (payment) =>
          payment.transactionId.trim().toLowerCase() === reference.toLowerCase() &&
          payment.status !== 'rejected',
      )
    ) {
      next.transactionId = 'This transaction reference has already been submitted.'
    }
    if (!form.paidOn) next.paidOn = 'Select the payment date.'
    return next
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    try {
      const payment = await addPayment({
        studentId: user.id,
        amount: Number(form.amount),
        method: form.method,
        transactionId: form.transactionId,
        paidOn: form.paidOn,
        note: form.note,
      })
      setSubmitted(payment)
    } catch (error) {
      setErrors({ form: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  function payAgain() {
    setSubmitted(null)
    setForm({
      amount: String(studentFee(db, user).balance),
      method: 'upi',
      transactionId: '',
      paidOn: todayInput(),
      note: '',
    })
    setErrors({})
  }

  if (submitted) {
    return (
      <Layout title="Payment submitted" subtitle="Waiting for office verification">
        <div className="mx-auto max-w-2xl">
          <div className="card p-6 text-center sm:p-8">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <ClipboardCheck size={30} />
            </span>
            <h2 className="mt-5 text-xl font-bold text-slate-900">
              Payment submitted for verification
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              The fee section will verify your payment. Your receipt will be generated
              automatically once it is approved.
            </p>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Payment status
                </span>
                <StatusBadge status={submitted.status} />
              </div>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-500">Amount</dt>
                  <dd className="text-sm font-semibold text-slate-900">
                    {currency(submitted.amount)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Reference</dt>
                  <dd className="font-mono text-sm font-semibold text-slate-900">
                    {submitted.transactionId}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Submitted on</dt>
                  <dd className="text-sm text-slate-900">
                    {new Date(submitted.createdAt).toLocaleString('en-IN')}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Payment method</dt>
                  <dd className="text-sm text-slate-900">
                    {PAYMENT_METHODS.find((item) => item.value === submitted.method)?.label}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <Link to="/student/payments" className="btn-primary">
                View my payments <ArrowRight size={16} />
              </Link>
              <button onClick={payAgain} className="btn-secondary">
                Make another payment
              </button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      title="Pay fees"
      subtitle="Submit your payment details for office verification"
    >
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
            <Info size={18} className="mt-0.5 shrink-0 text-indigo-600" />
            <div className="text-sm text-indigo-900">
              <p className="font-semibold">Demo mode — no real money is charged.</p>
              <p className="mt-1 text-indigo-800/80">
                Complete your payment through the college UPI ID or bank account, then
                enter the transaction reference below. The office verifies every payment
                before a receipt is issued.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="card p-6">
            <div className="flex items-center gap-2">
              <Wallet size={18} className="text-indigo-600" />
              <h2 className="text-sm font-semibold text-slate-900">Payment details</h2>
            </div>

            {fee.balance <= 0 ? (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <p className="flex items-center gap-2 font-semibold">
                  <BadgeCheck size={17} /> No dues pending
                </p>
                <p className="mt-1">
                  All your fees have been verified. Visit your payments page to download
                  receipts.
                </p>
                <Link
                  to="/student/payments"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Go to payments <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="amount" className="label">
                      Amount (₹)
                    </label>
                    <input
                      id="amount"
                      type="number"
                      min="1"
                      className="input"
                      value={form.amount}
                      onChange={(event) => update('amount', event.target.value)}
                      placeholder="0"
                    />
                    {errors.amount ? (
                      <p className="mt-1 text-xs font-medium text-rose-600">{errors.amount}</p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">
                        Balance due: {currency(fee.balance)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="method" className="label">
                      Payment method
                    </label>
                    <select
                      id="method"
                      className="input"
                      value={form.method}
                      onChange={(event) => update('method', event.target.value)}
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                    {errors.method && (
                      <p className="mt-1 text-xs font-medium text-rose-600">{errors.method}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="transactionId" className="label">
                      Transaction / reference number
                    </label>
                    <input
                      id="transactionId"
                      className="input font-mono"
                      value={form.transactionId}
                      onChange={(event) => update('transactionId', event.target.value)}
                      placeholder="e.g. UPI2026103100123"
                      autoComplete="off"
                    />
                    {errors.transactionId ? (
                      <p className="mt-1 text-xs font-medium text-rose-600">
                        {errors.transactionId}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">
                        Found on your bank / UPI app after a successful transfer.
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="paidOn" className="label">
                      Payment date
                    </label>
                    <input
                      id="paidOn"
                      type="date"
                      className="input"
                      value={form.paidOn}
                      max={todayInput()}
                      onChange={(event) => update('paidOn', event.target.value)}
                    />
                    {errors.paidOn && (
                      <p className="mt-1 text-xs font-medium text-rose-600">{errors.paidOn}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="note" className="label">
                      Note <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      id="note"
                      className="input"
                      value={form.note}
                      onChange={(event) => update('note', event.target.value)}
                      placeholder="e.g. Semester 5 part payment"
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  Double-check the reference number. Incorrect references may be rejected
                  by the fee section.
                </div>

                {errors.form && (
                  <div className="mt-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{errors.form}</span>
                  </div>
                )}

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Link to="/student" className="btn-secondary">
                    Cancel
                  </Link>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    <ShieldCheck size={16} />
                    {submitting ? 'Submitting…' : 'Submit for verification'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        <div className="space-y-5">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-900">Fee summary</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Total fee</dt>
                <dd className="font-semibold text-slate-900">{currency(user.totalFee)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Verified paid</dt>
                <dd className="font-semibold text-emerald-600">{currency(fee.verified)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Awaiting verification</dt>
                <dd className="font-semibold text-amber-600">{currency(fee.pending)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <dt className="font-medium text-slate-700">Balance due</dt>
                <dd className="text-lg font-bold text-slate-900">{currency(fee.balance)}</dd>
              </div>
            </dl>
          </div>

          <div className="card p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Landmark size={16} className="text-indigo-600" /> College payment details
            </h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">UPI ID</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="font-mono text-sm font-semibold text-slate-900">
                    {COLLEGE.upiId}
                  </p>
                  <button
                    type="button"
                    onClick={copyUpi}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                  >
                    <Copy size={13} /> {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Bank account</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{COLLEGE.bank}</p>
              </div>
              <p className="text-xs leading-relaxed text-slate-500">
                After paying, submit the form with the exact transaction reference so the
                office can match your payment.
              </p>
            </div>
          </div>

          {fee.payments.some((item) => item.status === 'verified') && (
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-slate-900">Latest verified receipt</h3>
              <p className="mt-1 text-xs text-slate-500">
                You can download receipts once they are verified.
              </p>
              <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-3">
                <div>
                  <p className="text-xs text-slate-500">
                    {fee.payments.find((item) => item.status === 'verified').receiptNo}
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {currency(fee.payments.find((item) => item.status === 'verified').amount)}
                  </p>
                </div>
                <DownloadReceiptButton
                  student={user}
                  payment={fee.payments.find((item) => item.status === 'verified')}
                  compact
                />
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            <p className="text-xs leading-relaxed text-emerald-800">
              Receipts are generated only after the fee section verifies your payment.
              This usually happens within one working day.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
