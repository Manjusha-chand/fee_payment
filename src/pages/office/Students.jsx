import { useMemo, useState } from 'react'
import { CheckCircle2, Pencil, Plus, Search, Users, X } from 'lucide-react'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { useApp } from '../../lib/store.jsx'
import { feeStatusText, studentFee } from '../../lib/fees.js'
import { currency, initials } from '../../lib/format.js'

const emptyForm = {
  name: '',
  rollNumber: '',
  email: '',
  phone: '',
  course: '',
  semester: '1',
  totalFee: '',
  password: 'student123',
}

const feeStyles = {
  Cleared: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Due: 'bg-rose-50 text-rose-700 ring-rose-600/20',
}

export default function Students() {
  const { db, addStudent, updateStudent } = useApp()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const query = search.trim().toLowerCase()
  const visible = useMemo(
    () =>
      db.students.filter((student) => {
        if (!query) return true
        return (
          student.name.toLowerCase().includes(query) ||
          student.rollNumber.toLowerCase().includes(query) ||
          student.course.toLowerCase().includes(query) ||
          student.email.toLowerCase().includes(query)
        )
      }),
    [db.students, query],
  )

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setOpen(true)
  }

  function openEdit(student) {
    setEditing(student)
    setForm({
      name: student.name,
      rollNumber: student.rollNumber,
      email: student.email,
      phone: student.phone || '',
      course: student.course,
      semester: String(student.semester),
      totalFee: String(student.totalFee),
      password: student.password,
    })
    setErrors({})
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setBusy(false)
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function validate() {
    const next = {}
    if (!form.name.trim()) next.name = 'Enter the student name.'
    if (!editing) {
      if (!form.rollNumber.trim()) next.rollNumber = 'Enter a roll number.'
      else if (
        db.students.some(
          (student) =>
            student.rollNumber.toLowerCase() === form.rollNumber.trim().toLowerCase(),
        )
      ) {
        next.rollNumber = 'This roll number already exists.'
      }
    }
    if (!form.email.trim()) next.email = 'Enter an email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Enter a valid email address.'
    } else if (
      db.students.some(
        (student) =>
          student.email.toLowerCase() === form.email.trim().toLowerCase() &&
          student.id !== editing?.id,
      )
    ) {
      next.email = 'This email is already in use.'
    }
    if (!form.course.trim()) next.course = 'Enter the course.'
    const semester = Number(form.semester)
    if (!semester || semester < 1 || semester > 8) {
      next.semester = 'Semester must be between 1 and 8.'
    }
    const totalFee = Number(form.totalFee)
    if (!form.totalFee || Number.isNaN(totalFee) || totalFee <= 0) {
      next.totalFee = 'Enter a valid total fee.'
    }
    if (!editing && form.password.length < 6) {
      next.password = 'Password must be at least 6 characters.'
    }
    return next
  }

  async function handleSave(event) {
    event.preventDefault()
    if (busy) return
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setBusy(true)
    try {
      if (editing) {
        await updateStudent(editing.id, form)
        setNotice(`${form.name.trim()}'s details were updated.`)
      } else {
        await addStudent(form)
        setNotice(`${form.name.trim()} was added. Login password: ${form.password}`)
      }
      closeModal()
    } catch (error) {
      setErrors({ form: error.message })
      setBusy(false)
    }
  }

  return (
    <Layout
      title="Students"
      subtitle="Manage student records and fee details"
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
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-80">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                className="input pl-9"
                placeholder="Search name, roll, course or email"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <button onClick={openAdd} className="btn-primary">
              <Plus size={16} /> Add student
            </button>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No students found"
              message={
                query
                  ? 'No students match your search.'
                  : 'Add your first student to get started.'
              }
              action={
                !query && (
                  <button onClick={openAdd} className="btn-primary">
                    <Plus size={16} /> Add student
                  </button>
                )
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="table-head">Student</th>
                    <th className="table-head">Course</th>
                    <th className="table-head text-right">Total fee</th>
                    <th className="table-head text-right">Paid</th>
                    <th className="table-head text-right">Balance</th>
                    <th className="table-head">Status</th>
                    <th className="table-head text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((student) => {
                    const fee = studentFee(db, student)
                    const status = feeStatusText(fee.balance, fee.pending)
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/60">
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">
                              {initials(student.name)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900">
                                {student.name}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {student.rollNumber} · {student.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <p>{student.course}</p>
                          <p className="text-xs text-slate-500">Semester {student.semester}</p>
                        </td>
                        <td className="table-cell text-right">{currency(student.totalFee)}</td>
                        <td className="table-cell text-right font-medium text-emerald-600">
                          {currency(fee.verified)}
                        </td>
                        <td className="table-cell text-right font-semibold text-slate-900">
                          {currency(fee.balance)}
                        </td>
                        <td className="table-cell">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${feeStyles[status]}`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="table-cell text-right">
                          <button
                            onClick={() => openEdit(student)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            <Pencil size={13} /> Edit
                          </button>
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
        open={open}
        onClose={closeModal}
        size="lg"
        title={editing ? 'Edit student' : 'Add student'}
        description={
          editing
            ? 'Update the student record and fee details.'
            : 'Create a student account with a login for the fee portal.'
        }
        footer={
          <>
            <button onClick={closeModal} className="btn-secondary" disabled={busy}>
              Cancel
            </button>
            <button onClick={handleSave} className="btn-primary" disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Add student'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
          {errors.form && (
            <div className="sm:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
              {errors.form}
            </div>
          )}
          <div className="sm:col-span-2">
            <label htmlFor="name" className="label">
              Full name
            </label>
            <input
              id="name"
              className="input"
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              placeholder="e.g. Aarav Sharma"
            />
            {errors.name && (
              <p className="mt-1 text-xs font-medium text-rose-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="rollNumber" className="label">
              Roll number
            </label>
            <input
              id="rollNumber"
              className="input uppercase"
              value={form.rollNumber}
              onChange={(event) => update('rollNumber', event.target.value)}
              placeholder="e.g. CS21045"
              disabled={Boolean(editing)}
            />
            {errors.rollNumber && (
              <p className="mt-1 text-xs font-medium text-rose-600">{errors.rollNumber}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
              placeholder="student@sunrise.edu"
            />
            {errors.email && (
              <p className="mt-1 text-xs font-medium text-rose-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="label">
              Phone <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="phone"
              className="input"
              value={form.phone}
              onChange={(event) => update('phone', event.target.value)}
              placeholder="98765 43210"
            />
          </div>

          <div>
            <label htmlFor="course" className="label">
              Course
            </label>
            <input
              id="course"
              className="input"
              value={form.course}
              onChange={(event) => update('course', event.target.value)}
              placeholder="e.g. B.Tech CSE"
            />
            {errors.course && (
              <p className="mt-1 text-xs font-medium text-rose-600">{errors.course}</p>
            )}
          </div>

          <div>
            <label htmlFor="semester" className="label">
              Semester
            </label>
            <select
              id="semester"
              className="input"
              value={form.semester}
              onChange={(event) => update('semester', event.target.value)}
            >
              {Array.from({ length: 8 }, (_, index) => index + 1).map((semester) => (
                <option key={semester} value={semester}>
                  Semester {semester}
                </option>
              ))}
            </select>
            {errors.semester && (
              <p className="mt-1 text-xs font-medium text-rose-600">{errors.semester}</p>
            )}
          </div>

          <div>
            <label htmlFor="totalFee" className="label">
              Total fee (₹)
            </label>
            <input
              id="totalFee"
              type="number"
              min="1"
              className="input"
              value={form.totalFee}
              onChange={(event) => update('totalFee', event.target.value)}
              placeholder="125000"
            />
            {errors.totalFee && (
              <p className="mt-1 text-xs font-medium text-rose-600">{errors.totalFee}</p>
            )}
          </div>

          {!editing && (
            <div>
              <label htmlFor="password" className="label">
                Login password
              </label>
              <input
                id="password"
                className="input"
                value={form.password}
                onChange={(event) => update('password', event.target.value)}
              />
              {errors.password ? (
                <p className="mt-1 text-xs font-medium text-rose-600">{errors.password}</p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  Share this with the student for first login.
                </p>
              )}
            </div>
          )}
        </form>
      </Modal>
    </Layout>
  )
}
