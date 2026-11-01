import { COLLEGE } from '../config.js'
import { amount, formatDate, methodLabel } from './format.js'
import {
  RECEIPT_TEMPLATE_PATH,
  TEMPLATE_FIELDS,
  TEMPLATE_SIGNATURE,
} from './receiptTemplate.js'

const A4 = [595.28, 841.89]

let pdfLib = null
async function getPdfLib() {
  if (!pdfLib) pdfLib = await import('pdf-lib')
  return pdfLib
}

function makePalette(rgb) {
  return {
    ink: rgb(0.12, 0.16, 0.24),
    muted: rgb(0.42, 0.47, 0.55),
    accent: rgb(0.31, 0.27, 0.9),
    line: rgb(0.85, 0.87, 0.91),
    soft: rgb(0.96, 0.97, 1),
    white: rgb(1, 1, 1),
    green: rgb(0.05, 0.45, 0.28),
    greenSoft: rgb(0.93, 0.98, 0.95),
    greenLine: rgb(0.6, 0.85, 0.72),
    accentLine: rgb(0.8, 0.82, 0.95),
  }
}

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
]
const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty',
  'Ninety',
]

function twoDigits(value) {
  if (value < 20) return ones[value]
  return `${tens[Math.floor(value / 10)]}${value % 10 ? ` ${ones[value % 10]}` : ''}`
}

function threeDigits(value) {
  const hundred = Math.floor(value / 100)
  const rest = value % 100
  return [hundred ? `${ones[hundred]} Hundred` : '', rest ? twoDigits(rest) : '']
    .filter(Boolean)
    .join(' ')
}

function numberToWords(value) {
  let num = Math.round(Number(value) || 0)
  if (num === 0) return 'Zero'
  const parts = []
  const crore = Math.floor(num / 10000000)
  num %= 10000000
  const lakh = Math.floor(num / 100000)
  num %= 100000
  const thousand = Math.floor(num / 1000)
  num %= 1000
  if (crore) parts.push(`${threeDigits(crore)} Crore`)
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`)
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`)
  if (num) parts.push(threeDigits(num))
  return parts.join(' ')
}

function fieldValues(student, payment) {
  return {
    studentName: student.name,
    rollNumber: student.rollNumber,
    course: `${student.course} / Semester ${student.semester}`,
    receiptNo: payment.receiptNo || '—',
    paymentId: payment.transactionId,
    amount: `Rs. ${amount(payment.amount)}`,
    method: methodLabel(payment.method),
    paidOn: formatDate(payment.paidOn),
    verifiedOn: formatDate(payment.verifiedOn),
  }
}

function fitSize(text, font, size, maxWidth = Infinity) {
  let current = size
  while (current > 6 && font.widthOfTextAtSize(text, current) > maxWidth) {
    current -= 0.5
  }
  return current
}

// Handwritten-style signature strokes (SVG paths, drawn as a line).
const SIGNATURE_PATHS = [
  'M 2 26 C 8 6, 16 2, 22 14 C 27 24, 18 34, 15 24 C 12 14, 30 4, 38 18 C 42 25, 36 30, 33 23 C 30 16, 48 6, 57 18 C 61 24, 55 30, 52 22 C 49 14, 66 4, 75 16 C 79 22, 74 30, 70 22 C 66 14, 82 6, 91 18 C 95 24, 90 32, 86 24 C 82 16, 100 6, 112 16 C 118 21, 122 28, 130 20 C 136 14, 142 18, 148 26',
  'M 10 36 C 50 44, 100 30, 142 34',
]

function drawSignature(page, rgb, LineCapStyle, options = {}) {
  const { x, y, scale = 1 } = options
  const color = options.color || rgb(0.12, 0.2, 0.55)
  for (const path of SIGNATURE_PATHS) {
    page.drawSvgPath(path, {
      x,
      y,
      scale,
      borderColor: color,
      borderWidth: 1.2,
      borderLineCap: LineCapStyle.Round,
    })
  }
}

async function loadTemplate() {
  const { PDFDocument } = await getPdfLib()
  try {
    const response = await fetch(RECEIPT_TEMPLATE_PATH, { cache: 'no-store' })
    if (!response.ok) return null
    const type = response.headers.get('content-type') || ''
    if (type.includes('text/html')) return null
    const bytes = await response.arrayBuffer()
    return await PDFDocument.load(bytes)
  } catch {
    return null
  }
}

async function fillTemplate(templateDoc, student, payment) {
  const { PDFDocument, StandardFonts, LineCapStyle, rgb } = await getPdfLib()
  const palette = makePalette(rgb)
  const doc = await PDFDocument.create()
  const [page] = await doc.copyPages(templateDoc, [0])
  doc.addPage(page)

  const font = await doc.embedFont(StandardFonts.Helvetica)
  const values = fieldValues(student, payment)

  for (const [key, config] of Object.entries(TEMPLATE_FIELDS)) {
    const value = values[key]
    if (!value) continue
    const size = fitSize(value, font, config.size, config.maxWidth)
    page.drawText(String(value), {
      x: config.x,
      y: config.y,
      size,
      font,
      color: palette.ink,
    })
  }

  if (TEMPLATE_SIGNATURE) {
    drawSignature(page, rgb, LineCapStyle, TEMPLATE_SIGNATURE)
  }

  return doc
}

async function buildDefaultReceipt(student, payment) {
  const { PDFDocument, StandardFonts, LineCapStyle, rgb } = await getPdfLib()
  const palette = makePalette(rgb)
  const { ink, muted, accent, line, soft, white } = palette

  const doc = await PDFDocument.create()
  const page = doc.addPage(A4)
  const { width } = page.getSize()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  page.drawRectangle({
    x: 36,
    y: 36,
    width: width - 72,
    height: 770,
    color: white,
    borderColor: line,
    borderWidth: 1,
  })

  page.drawRectangle({
    x: 36,
    y: 688,
    width: width - 72,
    height: 118,
    color: soft,
  })

  page.drawText(COLLEGE.headerLine1, {
    x: 60,
    y: 773,
    size: 15,
    font: bold,
    color: ink,
  })
  page.drawText(COLLEGE.tagline, { x: 60, y: 752, size: 9.5, font, color: muted })
  page.drawText('FEE PAYMENT RECEIPT', {
    x: 60,
    y: 708,
    size: 10.5,
    font: bold,
    color: accent,
  })

  const receiptNo = payment.receiptNo || '—'
  page.drawText('RECEIPT NO', {
    x: width - 60 - bold.widthOfTextAtSize('RECEIPT NO', 8),
    y: 769,
    size: 8,
    font: bold,
    color: muted,
  })
  page.drawText(receiptNo, {
    x: width - 60 - bold.widthOfTextAtSize(receiptNo, 11),
    y: 750,
    size: 11,
    font: bold,
    color: ink,
  })

  page.drawRectangle({
    x: width - 200,
    y: 705,
    width: 139,
    height: 22,
    color: palette.greenSoft,
    borderColor: palette.greenLine,
    borderWidth: 0.8,
  })
  page.drawText('PAYMENT VERIFIED', {
    x: width - 200 + (139 - bold.widthOfTextAtSize('PAYMENT VERIFIED', 7.5)) / 2,
    y: 713,
    size: 7.5,
    font: bold,
    color: palette.green,
  })

  const rows = [
    ['Student Name', student.name],
    ['Roll Number', student.rollNumber],
    ['Course / Semester', `${student.course} / Semester ${student.semester}`],
    ['Payment Reference', payment.transactionId],
    ['Payment Method', methodLabel(payment.method)],
    ['Payment Date', formatDate(payment.paidOn)],
    ['Verified On', formatDate(payment.verifiedOn)],
  ]

  let y = 648
  rows.forEach(([label, value]) => {
    page.drawText(label.toUpperCase(), {
      x: 60,
      y,
      size: 8,
      font: bold,
      color: muted,
    })
    const size = fitSize(String(value), font, 11.5, 330)
    page.drawText(String(value), { x: 200, y, size, font, color: ink })
    page.drawLine({
      start: { x: 60, y: y - 12 },
      end: { x: width - 60, y: y - 12 },
      thickness: 0.6,
      color: line,
    })
    y -= 32
  })

  page.drawRectangle({
    x: 60,
    y: 355,
    width: width - 120,
    height: 70,
    color: soft,
    borderColor: palette.accentLine,
    borderWidth: 0.8,
  })
  page.drawText('AMOUNT PAID', {
    x: 80,
    y: 396,
    size: 8.5,
    font: bold,
    color: muted,
  })
  page.drawText(`Rs. ${amount(payment.amount)}`, {
    x: 80,
    y: 369,
    size: 22,
    font: bold,
    color: accent,
  })

  const words = `Rupees ${numberToWords(payment.amount)} Only`
  page.drawText(words, {
    x: 80,
    y: 335,
    size: fitSize(words, font, 10, width - 160),
    font,
    color: muted,
  })

  page.drawLine({
    start: { x: width - 210, y: 150 },
    end: { x: width - 70, y: 150 },
    thickness: 0.8,
    color: ink,
  })
  drawSignature(page, rgb, LineCapStyle, {
    x: width - 210,
    y: 153,
    scale: 0.92,
    color: rgb(0.12, 0.2, 0.55),
  })
  page.drawText('Authorised Signatory', {
    x: width - 210 + (140 - font.widthOfTextAtSize('Authorised Signatory', 8)) / 2,
    y: 136,
    size: 8,
    font,
    color: muted,
  })

  page.drawText(
    'This is a computer-generated receipt and does not require a physical signature.',
    { x: 60, y: 150, size: 8.5, font, color: muted },
  )
  page.drawText(COLLEGE.address, { x: 60, y: 134, size: 8.5, font, color: muted })
  page.drawText(`Support: ${COLLEGE.upiId}`, {
    x: 60,
    y: 118,
    size: 8.5,
    font,
    color: muted,
  })

  return doc
}

export async function buildReceiptBlob(student, payment) {
  const templateDoc = await loadTemplate()

  if (templateDoc) {
    try {
      const doc = await fillTemplate(templateDoc, student, payment)
      const bytes = await doc.save()
      return new Blob([bytes], { type: 'application/pdf' })
    } catch (error) {
      console.warn('Receipt template could not be filled, using default layout.', error)
    }
  }

  const doc = await buildDefaultReceipt(student, payment)
  const bytes = await doc.save()
  return new Blob([bytes], { type: 'application/pdf' })
}

export function receiptFileName(payment) {
  const ref = (payment.receiptNo || payment.transactionId || 'receipt').replace(
    /[^a-zA-Z0-9]+/g,
    '-',
  )
  return `Fee-Receipt-${ref}.pdf`
}

export async function downloadReceipt(student, payment) {
  const blob = await buildReceiptBlob(student, payment)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = receiptFileName(payment)
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
