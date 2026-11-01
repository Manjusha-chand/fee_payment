import mongoose from 'mongoose'
import { app } from '../server/index.js'
import { connectDb } from '../server/db.js'
import { Student } from '../server/models.js'
import { seedDatabase } from '../server/seed.js'

let connecting = null

async function ensureDb() {
  if (mongoose.connection.readyState === 1) return

  if (!connecting) {
    connecting = (async () => {
      await connectDb()

      if (process.env.AUTO_SEED !== 'false') {
        const count = await Student.estimatedDocumentCount()
        if (count === 0) await seedDatabase({ log: () => {} })
      }
    })().finally(() => {
      connecting = null
    })
  }

  await connecting
}

// vercel.json rewrites "/api/auth/login" to the function at "/api?__path=auth/login".
// Some routing modes keep the original path instead, so accept both: if the path
// already carries a sub-route, leave it alone; otherwise rebuild it from __path.
function normalizePath(req) {
  const raw = req.url || '/'
  const q = raw.indexOf('?')
  const pathname = q === -1 ? raw : raw.slice(0, q)
  const search = q === -1 ? '' : raw.slice(q + 1)
  if (pathname !== '/api' && pathname !== '/api/') return

  const params = new URLSearchParams(search)
  const forwarded = params.get('__path')
  if (!forwarded) return

  params.delete('__path')
  const rest = params.toString()
  req.url = `/api/${forwarded}${rest ? `?${rest}` : ''}`
}

export default async function handler(req, res) {
  try {
    await ensureDb()
  } catch (error) {
    console.error('Database connection failed:', error.message)
    res.status(503).json({
      error:
        'Database unavailable. Check the MONGODB_URI and MONGODB_DB environment variables in Vercel.',
    })
    return
  }

  normalizePath(req)
  return app(req, res)
}
