/**
 * Seed script to create default superadmin user
 * Run: node seed.js
 */

const bcrypt = require('bcryptjs')
const pool = require('./config/db')
const { randomUUID } = require('crypto')

async function seedSuperAdmin() {
  try {
    console.log('🌱 Starting seed process...')

    // Check if superadmin already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? AND role = ?',
      ['admin@hostel.com', 'super_admin']
    )

    if (existing.length > 0) {
      console.log('ℹ️  Superadmin already exists with email: admin@hostel.com')
      process.exit(0)
    }

    // Create superadmin
    const id = randomUUID()
    const email = 'admin@hostel.com'
    const password = 'Bhanu@2006'
    const name = 'Super Admin'

    const hash = await bcrypt.hash(password, 12)

    await pool.query(
      'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [id, name, email, hash, 'super_admin']
    )

    console.log('✅ Superadmin created successfully!')
    console.log('')
    console.log('📧 Email:    admin@hostel.com')
    console.log('🔐 Password: Bhanu@2006')
    console.log('👤 Role:     Superadmin')
    console.log('')

    process.exit(0)
  } catch (err) {
    console.error('❌ Seed failed:', err.message)
    process.exit(1)
  }
}

seedSuperAdmin()
