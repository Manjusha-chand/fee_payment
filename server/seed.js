import bcrypt from 'bcryptjs'
import { createSeed } from '../shared/seedData.js'
import { Office, Payment, Student } from './models.js'

export async function seedDatabase({ log = console.log } = {}) {
  const seed = createSeed()

  await Promise.all([
    Student.deleteMany({}),
    Payment.deleteMany({}),
    Office.deleteMany({}),
  ])

  const studentHash = await bcrypt.hash('student123', 10)
  const officeHash = await bcrypt.hash(seed.office.password, 10)

  const { password: _officePassword, id: officeId, ...office } = seed.office
  await Office.create({
    _id: officeId,
    name: office.name,
    userId: office.userId,
    email: office.email,
    designation: office.designation,
    passwordHash: officeHash,
  })

  const students = seed.students.map(({ password: _password, id, ...student }) => ({
    _id: id,
    ...student,
    passwordHash: studentHash,
  }))

  const payments = seed.payments.map(({ id, ...payment }) => ({
    _id: id,
    ...payment,
  }))

  await Student.insertMany(students)
  await Payment.insertMany(payments)

  log(`Seeded ${students.length} students and ${payments.length} payments.`)
  return { students: students.length, payments: payments.length }
}
