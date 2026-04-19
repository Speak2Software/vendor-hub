/**
 * Cached Mongoose connection — safe for both long-running Express server
 * and Lambda cold-start / warm invocations.
 */
const mongoose = require('mongoose')

let conn = null

async function connectDB() {
  if (conn && mongoose.connection.readyState === 1) return conn

  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI environment variable is not set')

  conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  })
  console.log('MongoDB connected:', mongoose.connection.host)
  return conn
}

module.exports = connectDB
