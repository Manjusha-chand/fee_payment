# GVP Fee Payment Portal

Online fee payment portal for **Gayatri Vidya Parishad College of Engineering**,
Rushikonda, Visakhapatnam 530045.

Two logins:

- **Student** — view dues, submit a fee payment, track verification, download PDF receipts.
- **Office** — review submitted payments, verify or reject them, manage student records.

Receipts are generated **only after the office verifies a payment**.

> This is a college project. No real payment gateway is used — students submit a
> transaction reference and the office verifies it against the bank statement.

## Tech stack

- React + Vite
- Tailwind CSS
- React Router
- pdf-lib (PDF receipt generation)
- Node.js + Express + Mongoose (REST API)
- MongoDB Atlas (data store)
- JWT auth + bcrypt password hashing

## Run locally

1. Create `.env` in the project root (copy `.env.example`):

   ```ini
   MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/...
   MONGODB_DB=gvp_fee_portal
   JWT_SECRET=<long-random-string>
   PORT=5000
   AUTO_SEED=true
   ALLOW_DEMO_RESET=true
   CLIENT_ORIGIN=http://localhost:5173
   ```

   `.env` is gitignored — never commit real credentials.

2. Install and seed:

   ```bash
   npm install
   npm run seed
   ```

3. Start the API and the web app together:

   ```bash
   npm run dev
   ```

   API: `http://localhost:5000/api` · Web: `http://localhost:5173`

Production build:

```bash
npm run build
npm run preview
```

## Scripts

| Script            | Description                                  |
| ----------------- | -------------------------------------------- |
| `npm run dev`     | API + Vite dev server (`concurrently`)       |
| `npm run dev:web` | Vite dev server only                         |
| `npm run server`  | API only                                     |
| `npm run seed`    | Reset the database with the demo dataset     |
| `npm run build`   | Production frontend build                    |
| `npm run preview` | Preview the production build                 |

## Demo logins

| Role    | Login ID     | Password     |
| ------- | ------------ | ------------ |
| Student | `5241412001` | `student123` |
| Office  | `office`     | `office123`  |

Seventy students are seeded with roll numbers `5241412001`–`5241412070`
(all with password `student123`). Use **Reset demo data** on the login page to
restore the original dataset (requires `ALLOW_DEMO_RESET=true`).

## API overview

| Method | Route                     | Access  | Purpose                         |
| ------ | ------------------------- | ------- | ------------------------------- |
| GET    | `/api/health`             | Public  | Health check                    |
| POST   | `/api/auth/login`         | Public  | Login, returns JWT + profile    |
| GET    | `/api/bootstrap`          | Auth    | Dashboard data for current user |
| POST   | `/api/payments`           | Student | Submit a payment                |
| POST   | `/api/payments/:id/review`| Office  | Verify or reject a payment      |
| POST   | `/api/students`           | Office  | Add a student                   |
| PATCH  | `/api/students/:id`       | Office  | Update a student                |
| POST   | `/api/demo/reset`         | Public* | Re-seed the demo database       |

\* only when `ALLOW_DEMO_RESET=true`.

## Using your own receipt template

The app can overlay payment details onto your own A4 PDF template.

1. Create an A4 receipt with blank spaces for the student name, roll number,
   payment ID, etc.
2. Save it as `public/receipt-template.pdf`.
3. Open `src/lib/receiptTemplate.js` and adjust the `TEMPLATE_FIELDS` values
   (`x`, `y`, `size`, `maxWidth`) so the text lines up with your blank fields.
   Coordinates are in PDF points from the **bottom-left** corner of the page.
4. If your template already has a signature, leave `TEMPLATE_SIGNATURE = null`.
   Otherwise set it to e.g. `{ x: 390, y: 160, scale: 1 }` to draw the built-in
   authorised signature.

If no template file is present (or it cannot be read), the app automatically
generates a clean built-in receipt with the GVP header, college address and an
authorised signature. Template placeholders are filled with:

`studentName`, `rollNumber`, `course`, `receiptNo`, `paymentId`, `amount`,
`method`, `paidOn`, `verifiedOn`.

## Project structure

```
server/           Express API, models, DB connection, seed script
shared/seedData.js deterministic demo dataset (70 students)
src/
  components/     shared UI (layout, modal, cards, receipt download)
  lib/            API client, auth store, fee helpers, PDF receipt generation
  pages/          login, student pages, office pages
public/           static assets (add receipt-template.pdf here)
```

## Notes

- Payments move through `pending → verified` or `pending → rejected`.
- Verifying a payment assigns a receipt number like `FEE/2026/0001`.
- Passwords are bcrypt-hashed in MongoDB and never returned by the API.
- Rotate the Atlas database password if it has ever been shared in chat or code.
