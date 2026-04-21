const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const pool   = require('../config/db')
const { v4: uuidv4 } = require('crypto')

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, hostel_id: user.hostel_id || null },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    // Get user
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email])
    const user = rows[0]
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    // If admin, get their hostel_id
    let hostel_id = null
    if (user.role === 'admin') {
      const [hostels] = await pool.query('SELECT id FROM hostels WHERE owner_id = ? LIMIT 1', [user.id])
      hostel_id = hostels[0]?.id || null
    }

    // If student, get their hostel_id
    if (user.role === 'student') {
      const [students] = await pool.query('SELECT hostel_id FROM students WHERE user_id = ? LIMIT 1', [user.id])
      hostel_id = students[0]?.hostel_id || null
    }

    const userWithHostel = { ...user, hostel_id }
    const token = generateToken(userWithHostel)

    return res.json({
      token,
      user: {
        id:       user.id,
        name:     user.name,
        email:    user.email,
        role:     user.role,
        hostel_id
      }
    })
  } catch (err) {
    console.error('[login]', err)
    return res.status(500).json({ error: 'Server error' })
  }
}

// POST /api/auth/register  (creates hostel admin accounts)
async function register(req, res) {
  const { name, email, password } = req.body
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email])
    if (existing.length > 0) return res.status(409).json({ error: 'Email already registered' })

    const hash = await bcrypt.hash(password, 12)
    const id   = require('crypto').randomUUID()

    await pool.query(
      'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [id, name, email, hash, 'admin']
    )

    const token = generateToken({ id, email, role: 'admin', hostel_id: null })
    return res.status(201).json({
      token,
      user: { id, name, email, role: 'admin', hostel_id: null }
    })
  } catch (err) {
    console.error('[register]', err)
    return res.status(500).json({ error: 'Server error' })
  }
}

// GET /api/auth/me
async function me(req, res) {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id])
    if (!rows[0]) return res.status(404).json({ error: 'User not found' })

    let hostel_id = req.user.hostel_id || null
    // Refresh hostel_id from DB for admins
    if (rows[0].role === 'admin' && !hostel_id) {
      const [h] = await pool.query('SELECT id FROM hostels WHERE owner_id = ? LIMIT 1', [req.user.id])
      hostel_id = h[0]?.id || null
    }
    if (rows[0].role === 'student') {
      const [s] = await pool.query('SELECT hostel_id FROM students WHERE user_id = ? LIMIT 1', [req.user.id])
      hostel_id = s[0]?.hostel_id || null
    }

    return res.json({ ...rows[0], hostel_id })
  } catch (err) {
    console.error('[me]', err)
    return res.status(500).json({ error: 'Server error' })
  }
}

async function changePassword(req, res) {
  const { newPassword } = req.body
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  try {
    const hash = await bcrypt.hash(newPassword, 10)
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id])
    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    console.error('[changePassword]', err)
    res.status(500).json({ error: 'Failed to update password' })
  }
}

module.exports = { login, register, me, changePassword }
