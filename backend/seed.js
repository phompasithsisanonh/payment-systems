
import dotenv from 'dotenv'
import User from './models/User.js'
import mongoose from 'mongoose'

dotenv.config()

await mongoose.connect(process.env.MONGO_URI)

const exists = await User.findOne({ username: 'admin' })
if (!exists) {
  await User.create({ username: 'admin', password: 'admin1234', role: 'admin' })
  console.log('✅ Admin user created — username: admin / password: admin1234')
} else {
  console.log('Admin user already exists')
}

await mongoose.disconnect()