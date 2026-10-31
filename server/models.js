import mongoose from 'mongoose'

const options = { versionKey: false }

const studentSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    rollNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, default: '' },
    course: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    totalFee: { type: Number, required: true, min: 0 },
    passwordHash: { type: String, required: true },
  },
  options,
)

const officeSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    userId: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    designation: { type: String, default: 'Fee Section' },
    passwordHash: { type: String, required: true },
  },
  options,
)

const paymentSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    studentId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    method: {
      type: String,
      enum: ['upi', 'card', 'netbanking', 'cash'],
      required: true,
    },
    transactionId: { type: String, required: true, trim: true, index: true },
    paidOn: { type: Date, required: true },
    note: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      index: true,
    },
    receiptNo: { type: String },
    verifiedBy: { type: String },
    verifiedOn: { type: Date },
    rejectionReason: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  options,
)

export const Student = mongoose.model('Student', studentSchema)
export const Office = mongoose.model('Office', officeSchema)
export const Payment = mongoose.model('Payment', paymentSchema)

export function toPublic(doc) {
  if (!doc) return null
  const raw = typeof doc.toObject === 'function' ? doc.toObject() : doc
  const { _id, passwordHash, ...rest } = raw
  return { id: _id, ...rest }
}
