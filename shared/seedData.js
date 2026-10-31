// Deterministic demo data generator shared by the API seed script.
// Roll numbers run from 5241412001 to 5241412070.

const FIRST_NAMES_MALE = [
  'Venkata', 'Sai', 'Kiran', 'Ravi', 'Suresh', 'Naveen', 'Praveen', 'Harsha',
  'Teja', 'Charan', 'Manoj', 'Vamsi', 'Pavan', 'Ganesh', 'Rahul', 'Sandeep',
  'Deepak', 'Ajay', 'Vijay', 'Arun', 'Karthik', 'Chaitanya', 'Subhash',
  'Rakesh', 'Srinivas', 'Ram', 'Krishna', 'Satish', 'Bhargav', 'Lokesh',
  'Anand', 'Mahesh', 'Siva', 'Naga', 'Vinay', 'Yashwanth', 'Abhishek',
  'Pradeep', 'Nithin', 'Anil', 'Sagar', 'Vivek', 'Rohit', 'Tarun', 'Surya',
  'Nikhil', 'Mohan', 'Kumar', 'Akhil', 'Vikram',
]

const FIRST_NAMES_FEMALE = [
  'Anusha', 'Divya', 'Sowmya', 'Lakshmi', 'Priya', 'Sravani', 'Keerthi',
  'Harika', 'Mounika', 'Bhavya', 'Sneha', 'Swathi', 'Sirisha', 'Padma',
  'Jhansi', 'Yamini', 'Kavya', 'Neha', 'Ramya', 'Deepthi', 'Pooja', 'Asha',
  'Shruti', 'Madhavi', 'Vasavi', 'Gayatri', 'Hima', 'Sireesha', 'Manasa',
  'Prasanna', 'Lahari', 'Tanuja', 'Sushma', 'Rekha', 'Sridevi', 'Vani',
  'Meghana', 'Anjali', 'Bhavana', 'Nandini', 'Deepika', 'Sahithi', 'Alekhya',
  'Mamatha', 'Sandhya',
]

const SURNAMES = [
  'Veedulamudi', 'Chand', 'Reddy', 'Rao', 'Naidu', 'Varma', 'Sharma', 'Patel',
  'Kumar', 'Prasad', 'Gupta', 'Sastry', 'Murthy', 'Raju', 'Babu', 'Yadav',
  'Chowdary', 'Sri', 'Devi', 'Sagar', 'Sekhar', 'Gowd', 'Pydi', 'Sunkara',
  'Duvvuri', 'Kotari', 'Madduri', 'Pasupuleti', 'Kolli', 'Vangapandu',
  'Boddu', 'Chintala', 'Ganti', 'Yelamanchili', 'Penmetsa', 'Lanka',
  'Tummala', 'Adari', 'Chelluri', 'Gadiraju', 'Pilla', 'Dadi', 'Sabbavarapu',
  'Kadali', 'Mummana',
]

const COURSES = [
  { name: 'B.Tech CSE', fee: 125000 },
  { name: 'B.Tech IT', fee: 122000 },
  { name: 'B.Tech ECE', fee: 118000 },
  { name: 'B.Tech EEE', fee: 115000 },
  { name: 'B.Tech Mechanical', fee: 110000 },
  { name: 'B.Tech Civil', fee: 108000 },
]

const METHODS = ['upi', 'card', 'netbanking']

const NOTES = [
  'Semester fee payment',
  'Part payment',
  'Annual fee instalment',
  'Tuition fee',
  'Examination and tuition fee',
  'Fee payment',
]

const REJECTIONS = [
  'Transaction ID was not found in the bank statement.',
  'Amount received does not match the submitted payment.',
  'Duplicate payment reference submitted by the student.',
  'Payment was reversed by the bank. Please pay again.',
]

const TOTAL_STUDENTS = 70
const START_ROLL = 5241412001

function mulberry32(seed) {
  let value = seed
  return function random() {
    value |= 0
    value = (value + 0x6d2b79f5) | 0
    let result = Math.imul(value ^ (value >>> 15), 1 | value)
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

function dateAt(dayOffset, hour) {
  const date = new Date(Date.UTC(2026, 6, 1, hour, 0, 0))
  date.setUTCDate(date.getUTCDate() + dayOffset)
  return date.toISOString()
}

function makeTransactionId(method, rollNumber, seq) {
  const prefix = method === 'upi' ? 'UPI' : method === 'card' ? 'CARD' : 'NEFT'
  const suffix = String(100 + seq).slice(-4)
  return `${prefix}${rollNumber}${suffix}`
}

export function createSeed() {
  const rng = mulberry32(20261031)
  const pick = (list) => list[Math.floor(rng() * list.length)]

  const students = []
  for (let index = 0; index < TOTAL_STUDENTS; index += 1) {
    const rollNumber = String(START_ROLL + index)
    const course = COURSES[index % COURSES.length]
    const isFemale = index % 2 === 1

    let name = `${pick(isFemale ? FIRST_NAMES_FEMALE : FIRST_NAMES_MALE)} ${pick(SURNAMES)}`
    let email = `${rollNumber}@gvp.edu.in`

    if (index === 0) {
      name = 'Manjusha Chand'
      email = 'manjusha.chand@gvp.edu.in'
    }

    students.push({
      id: `st-${index + 1}`,
      rollNumber,
      name,
      email,
      phone: `9${String(1000000000 + Math.floor(rng() * 899999999)).slice(0, 9)}`,
      course: course.name,
      semester: (index % 8) + 1,
      password: 'student123',
      totalFee: course.fee,
    })
  }

  const payments = []
  let sequence = 0
  let dayCursor = 10

  function addPayment(student, amount, status, method, note) {
    sequence += 1
    dayCursor = (dayCursor + 3 + Math.floor(rng() * 4)) % 115
    const paidOn = dateAt(dayCursor, 9 + Math.floor(rng() * 8))
    const payment = {
      id: `pay-${sequence}`,
      studentId: student.id,
      amount,
      method,
      transactionId: makeTransactionId(method, student.rollNumber, sequence),
      paidOn,
      note,
      status,
      createdAt: new Date(new Date(paidOn).getTime() + 30 * 60 * 1000).toISOString(),
    }

    if (status === 'verified' || status === 'rejected') {
      payment.verifiedBy = 'Fee Section'
      payment.verifiedOn = new Date(
        new Date(paidOn).getTime() + 24 * 60 * 60 * 1000,
      ).toISOString()
    }
    if (status === 'rejected') {
      payment.rejectionReason = pick(REJECTIONS)
    }

    payments.push(payment)
  }

  for (const student of students) {
    const index = Number(student.id.split('-')[1]) - 1
    const total = student.totalFee
    const method = pick(METHODS)
    const note = pick(NOTES)

    if (index === 0) {
      addPayment(student, 45000, 'verified', 'upi', 'Semester fee part payment')
      addPayment(student, 30000, 'pending', 'card', 'Second instalment')
      continue
    }

    switch (index % 10) {
      case 1:
      case 2:
        addPayment(student, total, 'verified', method, 'Full academic year fee')
        break
      case 3:
      case 4:
        addPayment(student, Math.round(total * 0.55), 'verified', method, note)
        break
      case 5:
        addPayment(student, Math.round(total * 0.5), 'pending', method, note)
        break
      case 6:
        addPayment(student, Math.round(total * 0.3), 'rejected', method, note)
        break
      case 7:
        break
      case 8:
        addPayment(student, Math.round(total * 0.4), 'verified', method, note)
        addPayment(student, Math.round(total * 0.25), 'pending', method, note)
        break
      case 9:
        addPayment(student, Math.round(total * 0.45), 'pending', method, note)
        break
      default:
        addPayment(student, Math.round(total * 0.35), 'verified', method, note)
        addPayment(student, Math.round(total * 0.35), 'verified', method, note)
        break
    }
  }

  const verified = payments
    .filter((payment) => payment.status === 'verified')
    .sort((a, b) => new Date(a.verifiedOn) - new Date(b.verifiedOn))

  verified.forEach((payment, index) => {
    const year = new Date(payment.verifiedOn).getUTCFullYear()
    payment.receiptNo = `FEE/${year}/${String(index + 1).padStart(4, '0')}`
  })

  return {
    office: {
      id: 'office-1',
      name: 'Fee Section',
      userId: 'office',
      email: 'office@gvp.edu.in',
      password: 'office123',
      designation: 'Accounts Officer',
    },
    students,
    payments,
  }
}
