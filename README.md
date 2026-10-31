# FeePay — College Fee Payment Portal

A college fee payment web app with two logins:

- **Student** — view dues, submit a fee payment, track verification, download PDF receipts.
- **Office** — review submitted payments, verify or reject them, manage student records.

Receipts are generated **only after the office verifies a payment**.

> This is a front-end demo for a college project. No real payment gateway is used and
> all data is stored in the browser's `localStorage`.

## Tech stack

- React + Vite
- Tailwind CSS
- React Router
- pdf-lib (PDF receipt generation)

## Run locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Demo logins

| Role    | Login ID  | Password     |
| ------- | --------- | ------------ |
| Student | `CS21001` | `student123` |
| Office  | `office`  | `office123`  |

Other seeded students: `CS21002`, `EC21014`, `ME21027`, `CS21033`
(all with password `student123`).

Use **Reset demo data** on the login page to restore the original data.

## Using your own receipt template

The app can overlay payment details onto your own A4 PDF template.

1. Create an A4 receipt with blank spaces for the student name, roll number,
   payment ID, etc.
2. Save it as `public/receipt-template.pdf`.
3. Open `src/lib/receiptTemplate.js` and adjust the `TEMPLATE_FIELDS` values
   (`x`, `y`, `size`, `maxWidth`) so the text lines up with your blank fields.
   Coordinates are in PDF points from the **bottom-left** corner of the page.

If no template file is present (or it cannot be read), the app automatically
generates a clean built-in receipt instead. Template placeholders are filled with:

`studentName`, `rollNumber`, `course`, `receiptNo`, `paymentId`, `amount`,
`method`, `paidOn`, `verifiedOn`.

## Project structure

```
src/
  components/   shared UI (layout, modal, cards, receipt download)
  data/seed.js  demo students and payments
  lib/          store (auth + data), fee helpers, PDF receipt generation
  pages/        login, student pages, office pages
public/         static assets (add receipt-template.pdf here)
```

## Notes

- Payments move through `pending → verified` or `pending → rejected`.
- Verifying a payment assigns a receipt number like `FEE/2026/0001`.
- Student and office credentials are stored in plain text for demo purposes only.
  Use a real backend with hashed passwords for production.
