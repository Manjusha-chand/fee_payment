import 'dotenv/config'
import bcrypt from 'bcryptjs'
import cors from 'cors'
import express from 'express'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { connectDb } from './db.js'
import { Office, Payment, Student, toPublic } from './models.js'
import { seedDatabase } from './seed.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

const PORT = Number(process.env.PORT) || 5000
const JWT_SECRET = process.env.JWT_SECRET || 'gvp-dev-secret-change-me'
const METHODS = ['upi', 'card', 'netbanking', 'cash']

const wrap = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next)

const text = (value) => String(value ?? '').trim()
const emailOk = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

function signToken(user) {
  return jwt.sign({ role: user.role, id: user.id }, JWT_SECRET, {
    expiresIn: '7d',
  })
}

function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return res.status(401).json({ error: 'Please sign in to continue.' })
  try {
    req.auth = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Your session expired. Please sign in again.' })
  }
}

function requireRole(role) {
  return (req, res, next) =>
    req.auth?.role === role
      ? next()
      : res.status(403).json({ error: 'You do not have permission to do this.' })
}

function nextReceiptNo(verifiedCount) {
  const year = new Date().getFullYear()
  return `FEE/${year}/${String(verifiedCount + 1).padStart(4, '0')}`
}

async function verifiedTotal(studentId) {
  const result = await Payment.aggregate([
    { $match: { studentId, status: 'verified' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ])
  return result[0]?.total || 0
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, database: mongoose.connection.readyState })
})

app.post(
  '/api/auth/login',
  wrap(async (req, res) => {
    const { role, identifier, password } = req.body || {}
    const value = text(identifier)
    if (!value || !password) {
      return res.status(400).json({ error: 'Please enter your credentials.' })
    }

    if (role === 'office') {
      const office = await Office.findOne({
        $or: [{ userId: value.toLowerCase() }, { email: value.toLowerCase() }],
      }).lean()
      const valid = office && (await bcrypt.compare(password, office.passwordHash))
      if (!valid) {
        return res
          .status(401)
          .json({ error: 'Invalid office user ID or password.' })
      }
      const user = { ...toPublic(office), role: 'office' }
      return res.json({ token: signToken(user), user })
    }

    if (role !== 'student') {
      return res.status(400).json({ error: 'Unknown account type.' })
    }

    const student = await Student.findOne({
      $or: [{ rollNumber: value.toUpperCase() }, { email: value.toLowerCase() }],
    }).lean()
    const valid = student && (await bcrypt.compare(password, student.passwordHash))
    if (!valid) {
      return res.status(401).json({ error: 'Invalid roll number or password.' })
    }
    const user = { ...toPublic(student), role: 'student' }
    return res.json({ token: signToken(user), user })
  }),
)

app.get(
  '/api/bootstrap',
  auth,
  wrap(async (req, res) => {
    const office = toPublic(await Office.findOne().lean())

    if (req.auth.role === 'office') {
      const [students, payments] = await Promise.all([
        Student.find({}).sort({ rollNumber: 1 }).lean(),
        Payment.find({}).sort({ createdAt: -1 }).lean(),
      ])
      return res.json({
        office,
        students: students.map(toPublic),
        payments: payments.map(toPublic),
      })
    }

    const [student, payments] = await Promise.all([
      Student.findById(req.auth.id).lean(),
      Payment.find({ studentId: req.auth.id }).sort({ createdAt: -1 }).lean(),
    ])

    if (!student) {
      return res.status(401).json({ error: 'Your account was not found.' })
    }

    return res.json({
      office,
      students: [toPublic(student)],
      payments: payments.map(toPublic),
    })
  }),
)

app.post(
  '/api/payments',
  auth,
  requireRole('student'),
  wrap(async (req, res) => {
    const { amount, method, transactionId, paidOn, note } = req.body || {}
    const numericAmount = Number(amount)
    const reference = text(transactionId).toUpperCase()
    const methodValue = text(method)
    const dateValue = text(paidOn)

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Enter a valid payment amount.' })
    }
    if (!METHODS.includes(methodValue)) {
      return res.status(400).json({ error: 'Select a valid payment method.' })
    }
    if (reference.length < 5) {
      return res
        .status(400)
        .json({ error: 'Enter a valid transaction / reference number.' })
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return res.status(400).json({ error: 'Select a valid payment date.' })
    }

    const student = await Student.findById(req.auth.id).lean()
    if (!student) {
      return res.status(404).json({ error: 'Student account not found.' })
    }

    const paid = await verifiedTotal(req.auth.id)
    const balance = Math.max(Number(student.totalFee) - paid, 0)
    if (numericAmount > balance) {
      return res.status(400).json({
        error: `Amount cannot exceed the outstanding balance of Rs. ${balance}.`,
      })
    }

    const duplicate = await Payment.findOne({
      transactionId: reference,
      status: { $ne: 'rejected' },
    }).lean()
    if (duplicate) {
      return res
        .status(409)
        .json({ error: 'This transaction reference has already been submitted.' })
    }

    const paidDate = new Date(`${dateValue}T00:00:00.000Z`)
    if (Number.isNaN(paidDate.getTime())) {
      return res.status(400).json({ error: 'Select a valid payment date.' })
    }

    const payment = await Payment.create({
      _id: new mongoose.Types.ObjectId().toString(),
      studentId: req.auth.id,
      amount: Math.round(numericAmount),
      method: methodValue,
      transactionId: reference,
      paidOn: paidDate,
      note: text(note),
      status: 'pending',
      createdAt: new Date(),
    })

    res.status(201).json(toPublic(payment))
  }),
)

app.patch(
  '/api/payments/:id/review',
  auth,
  requireRole('office'),
  wrap(async (req, res) => {
    const decision = text(req.body?.decision)
    if (!['verify', 'reject'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid review decision.' })
    }

    const payment = await Payment.findById(req.params.id)
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found.' })
    }
    if (payment.status !== 'pending') {
      return res.status(409).json({ error: 'This payment has already been reviewed.' })
    }

    if (decision === 'verify') {
      if (!payment.receiptNo) {
        const count = await Payment.countDocuments({ status: 'verified' })
        payment.receiptNo = nextReceiptNo(count)
      }
      payment.status = 'verified'
      payment.rejectionReason = undefined
    } else {
      const reason = text(req.body?.reason)
      if (reason.length < 5) {
        return res.status(400).json({ error: 'Please give a short reason for rejection.' })
      }
      payment.status = 'rejected'
      payment.rejectionReason = reason
    }

    const office = await Office.findOne().lean()
    payment.verifiedBy = office?.name || 'Fee Section'
    payment.verifiedOn = new Date()
    await payment.save()

    res.json(toPublic(payment))
  }),
)

app.post(
  '/api/students',
  auth,
  requireRole('office'),
  wrap(async (req, res) => {
    const { name, rollNumber, email, phone, course, semester, totalFee, password } =
      req.body || {}
    const roll = text(rollNumber).toUpperCase()
    const cleanEmail = text(email).toLowerCase()
    const semesterValue = Number(semester)
    const feeValue = Number(totalFee)

    if (!text(name)) return res.status(400).json({ error: 'Enter the student name.' })
    if (!roll) return res.status(400).json({ error: 'Enter a roll number.' })
    if (!emailOk(cleanEmail)) {
      return res.status(400).json({ error: 'Enter a valid email address.' })
    }
    if (!text(course)) return res.status(400).json({ error: 'Enter the course.' })
    if (!Number.isInteger(semesterValue) || semesterValue < 1 || semesterValue > 8) {
      return res.status(400).json({ error: 'Semester must be between 1 and 8.' })
    }
    if (!Number.isFinite(feeValue) || feeValue <= 0) {
      return res.status(400).json({ error: 'Enter a valid total fee.' })
    }
    if (!password || text(password).length < 6) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 6 characters.' })
    }

    const existing = await Student.findOne({
      $or: [{ rollNumber: roll }, { email: cleanEmail }],
    }).lean()
    if (existing) {
      return res.status(409).json({
        error:
          existing.rollNumber === roll
            ? 'This roll number already exists.'
            : 'This email is already in use.',
      })
    }

    const student = await Student.create({
      _id: new mongoose.Types.ObjectId().toString(),
      rollNumber: roll,
      name: text(name),
      email: cleanEmail,
      phone: text(phone),
      course: text(course),
      semester: semesterValue,
      totalFee: feeValue,
      passwordHash: await bcrypt.hash(text(password), 10),
    })

    res.status(201).json(toPublic(student))
  }),
)

app.put(
  '/api/students/:id',
  auth,
  requireRole('office'),
  wrap(async (req, res) => {
    const { name, email, phone, course, semester, totalFee } = req.body || {}
    const cleanEmail = text(email).toLowerCase()
    const semesterValue = Number(semester)
    const feeValue = Number(totalFee)

    if (!text(name)) return res.status(400).json({ error: 'Enter the student name.' })
    if (!emailOk(cleanEmail)) {
      return res.status(400).json({ error: 'Enter a valid email address.' })
    }
    if (!text(course)) return res.status(400).json({ error: 'Enter the course.' })
    if (!Number.isInteger(semesterValue) || semesterValue < 1 || semesterValue > 8) {
      return res.status(400).json({ error: 'Semester must be between 1 and 8.' })
    }
    if (!Number.isFinite(feeValue) || feeValue <= 0) {
      return res.status(400).json({ error: 'Enter a valid total fee.' })
    }

    const student = await Student.findById(req.params.id)
    if (!student) return res.status(404).json({ error: 'Student not found.' })

    const duplicate = await Student.findOne({
      email: cleanEmail,
      _id: { $ne: student._id },
    }).lean()
    if (duplicate) {
      return res.status(409).json({ error: 'This email is already in use.' })
    }

    student.name = text(name)
    student.email = cleanEmail
    student.phone = text(phone)
    student.course = text(course)
    student.semester = semesterValue
    student.totalFee = feeValue
    await student.save()

    res.json(toPublic(student))
  }),
)

app.post(
  '/api/demo/reset',
  wrap(async (req, res) => {
    if (process.env.ALLOW_DEMO_RESET === 'false') {
      return res.status(403).json({ error: 'Demo reset is disabled.' })
    }
    const result = await seedDatabase({ log: () => {} })
    res.json({ ok: true, ...result })
  }),
)

app.use((req, res) => {
  res.status(404).json({ error: 'API route not found.' })
})

app.use((error, req, res, next) => {
  console.error(error)
  if (error?.code === 11000) {
    return res
      .status(409)
      .json({ error: 'A record with these details already exists.' })
  }
  res.status(500).json({ error: 'Something went wrong on the server.' })
})

async function start() {
  await connectDb()

  if (process.env.AUTO_SEED !== 'false') {
    const count = await Student.estimatedDocumentCount()
    if (count === 0) {
      console.log('Empty database — inserting demo data…')
      await seedDatabase()
    }
  }

  app.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`)
  })
}

export { app }

if (!process.env.VERCEL) {
  start().catch((error) => {
    console.error('Failed to start API:', error.message)
    process.exit(1)
  })
}
