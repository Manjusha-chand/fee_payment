import mongoose from 'mongoose'

export async function connectDb() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error(
      'MONGODB_URI is missing. Copy .env.example to .env and add your connection string.',
    )
  }

  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB || 'gvp_fee_portal',
    serverSelectionTimeoutMS: 15000,
  })

  console.log(`MongoDB connected → ${mongoose.connection.name}`)
  return mongoose.connection
}

export async function disconnectDb() {
  await mongoose.disconnect()
}
