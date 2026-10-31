import { GraduationCap } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 px-6">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-600 text-white">
        <GraduationCap size={24} />
      </span>
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-indigo-600" />
      <p className="text-sm text-slate-500">Loading the fee portal…</p>
    </div>
  )
}
