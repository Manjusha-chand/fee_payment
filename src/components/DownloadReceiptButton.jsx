import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { downloadReceipt } from '../lib/receipt.js'

export default function DownloadReceiptButton({ student, payment, compact = false }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleDownload() {
    setBusy(true)
    setError('')
    try {
      await downloadReceipt(student, payment)
    } catch (err) {
      setError(err?.message || 'Could not generate the receipt.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleDownload}
        disabled={busy}
        className={
          compact
            ? 'inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50'
            : 'btn-secondary'
        }
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
        {busy ? 'Preparing…' : 'Receipt'}
      </button>
      {error && <span className="text-[11px] font-medium text-rose-600">{error}</span>}
    </div>
  )
}
