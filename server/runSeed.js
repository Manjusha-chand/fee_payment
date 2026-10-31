import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDb } from './db.js'
import { seedDatabase } from './seed.js'

try {
  await connectDb()
  await seedDatabase()
} catch (error) {
  console.error('Seed failed:', error.message)
  process.exitCode = 1
} finally {
  await mongoose.disconnect().catch(() => {})
}
