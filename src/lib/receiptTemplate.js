// Path to your own receipt template. Put the file in the /public folder.
// A4 page size in points: 595.28 x 841.89 (origin is the bottom-left corner).
export const RECEIPT_TEMPLATE_PATH = `${import.meta.env.BASE_URL}receipt-template.pdf`

// Position of each value on your template, measured in PDF points from the
// bottom-left corner. Adjust x / y / size to line up with the blank fields.
// Optional: place the authorised signature on your own template.
// Set to an object like { x: 390, y: 160, scale: 1, color: [0.1, 0.2, 0.55] }
// or leave as null if your template already contains a signature.
export const TEMPLATE_SIGNATURE = null

export const TEMPLATE_FIELDS = {
  studentName: { x: 150, y: 610, size: 12, maxWidth: 300 },
  rollNumber: { x: 150, y: 582, size: 12, maxWidth: 300 },
  course: { x: 150, y: 554, size: 12, maxWidth: 340 },
  receiptNo: { x: 150, y: 526, size: 12, maxWidth: 300 },
  paymentId: { x: 150, y: 498, size: 12, maxWidth: 340 },
  amount: { x: 150, y: 470, size: 14, maxWidth: 300 },
  method: { x: 150, y: 442, size: 12, maxWidth: 300 },
  paidOn: { x: 150, y: 414, size: 12, maxWidth: 300 },
  verifiedOn: { x: 150, y: 386, size: 12, maxWidth: 300 },
}
