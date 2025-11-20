require('dotenv').config({ path: '.env.local' })
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')
    
    // Define User schema (same as in your model)
    const userSchema = new mongoose.Schema({
      email: { type: String, required: true, unique: true },
      name: { type: String, required: true },
      password: { type: String, required: false },
      roles: [{ type: String, enum: ['client', 'provider', 'admin'], default: ['client'] }],
      emailVerified: { type: Boolean, default: false },
      verificationToken: String,
      verificationTokenExpires: Date,
    }, { timestamps: true })
    
    const User = mongoose.models.User || mongoose.model('User', userSchema)
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      roles: { $in: ['admin'] },
      email: 'admin@zakazivac.app'
    })
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:')
      console.log(`   Email: ${existingAdmin.email}`)
      console.log(`   Name: ${existingAdmin.name}`)
      console.log(`   Roles: ${existingAdmin.roles.join(', ')}`)
      return
    }
    
    // Create admin user
    const adminPassword = 'admin123456' // Change this to a secure password
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@zakazivac.app',
      password: hashedPassword,
      roles: ['admin', 'client', 'provider'], // Admin has all roles
      emailVerified: true, // Admin is pre-verified
    })
    
    console.log('🎉 Admin user created successfully!')
    console.log('📧 Email: admin@zakazivac.app')
    console.log('🔐 Password: admin123456')
    console.log('👤 Roles: admin, client, provider')
    console.log('')
    console.log('⚠️  IMPORTANT: Please change the password after first login!')
    console.log('')
    console.log('🚀 You can now login at: http://localhost:3000/auth/signin')
    console.log('📊 Admin dashboard: http://localhost:3000/dashboard/admin')
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message)
    
    if (error.code === 11000) {
      console.log('💡 User with this email already exists')
    }
  } finally {
    await mongoose.disconnect()
    console.log('👋 Disconnected from MongoDB')
  }
}

createAdminUser()