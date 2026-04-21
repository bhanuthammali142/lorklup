const pool   = require('../config/db')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

// GET /api/students?hostel_id=xxx
async function getStudents(req, res) {
  const hostelId = req.query.hostel_id || req.user.hostel_id
  if (!hostelId) return res.status(400).json({ error: 'hostel_id required' })

  try {
    const [rows] = await pool.query(
      `SELECT s.*, 
              r.room_number, r.type AS room_type, r.monthly_fee,
              b.bed_number
       FROM students s
       LEFT JOIN rooms r ON r.id = s.room_id
       LEFT JOIN beds  b ON b.id = s.bed_id
       WHERE s.hostel_id = ?
       ORDER BY s.created_at DESC`,
      [hostelId]
    )
    res.json(rows)
  } catch (err) {
    console.error('[getStudents]', err)
    res.status(500).json({ error: 'Server error' })
  }
}

// POST /api/students
async function addStudent(req, res) {
  const {
    hostel_id, full_name, email, phone, parent_phone,
    id_number, college_name, branch, joining_date,
    room_id, bed_id
  } = req.body

  if (!full_name || !hostel_id) return res.status(400).json({ error: 'full_name and hostel_id required' })

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // Create user account for student
    let userId = null
    let credentials = null
    if (email) {
      const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email])
      if (existing.length > 0) {
        userId = existing[0].id
      } else {
        const tempPassword = Math.random().toString(36).slice(2, 10) + 'Ab@1'
        const hash = await bcrypt.hash(tempPassword, 12)
        userId = crypto.randomUUID()
        await conn.query(
          'INSERT INTO users (id, name, email, password_hash, role) VALUES (?,?,?,?,?)',
          [userId, full_name, email, hash, 'student']
        )
        credentials = { email, password: tempPassword }
      }
    }

    const studentId = crypto.randomUUID()
    await conn.query(
      `INSERT INTO students 
       (id, hostel_id, user_id, room_id, bed_id, full_name, email, phone, parent_phone, id_number, college_name, branch, joining_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [studentId, hostel_id, userId, room_id || null, bed_id || null, full_name, email || null, phone || null,
       parent_phone || null, id_number || null, college_name || null, branch || null, joining_date || null]
    )

    // Mark bed as occupied
    if (bed_id) {
      await conn.query('UPDATE beds SET status = ? WHERE id = ?', ['occupied', bed_id])
    }

    // Auto-create current month fee if room assigned with a fee
    if (room_id) {
      const [roomRows] = await conn.query('SELECT monthly_fee FROM rooms WHERE id = ?', [room_id])
      const fee = Number(roomRows[0]?.monthly_fee)
      if (fee > 0) {
        const now = new Date()
        const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().split('T')[0]
        const dueDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 5)).toISOString().split('T')[0]
        await conn.query(
          `INSERT INTO fees (id, hostel_id, student_id, amount, due_amount, month, due_date, status) VALUES (?,?,?,?,?,?,?,?)`,
          [crypto.randomUUID(), hostel_id, studentId, fee, fee, monthStart, dueDate, 'pending']
        )
      }
    }

    await conn.commit()
    conn.release()

    const [rows] = await pool.query(
      `SELECT s.*, r.room_number, b.bed_number FROM students s
       LEFT JOIN rooms r ON r.id = s.room_id
       LEFT JOIN beds  b ON b.id = s.bed_id
       WHERE s.id = ?`,
      [studentId]
    )
    res.status(201).json({ student: rows[0], credentials })
  } catch (err) {
    await conn.rollback()
    conn.release()
    console.error('[addStudent]', err)
    res.status(500).json({ error: err.message || 'Server error' })
  }
}

// PUT /api/students/:id
async function updateStudent(req, res) {
  const { id } = req.params
  const fields = req.body
  const allowed = ['full_name','email','phone','parent_phone','id_number','college_name','branch','joining_date','room_id','bed_id','is_verified']
  const updates = Object.keys(fields).filter(k => allowed.includes(k))
  if (updates.length === 0) return res.status(400).json({ error: 'No valid fields to update' })

  try {
    const set = updates.map(k => `${k} = ?`).join(', ')
    const vals = [...updates.map(k => fields[k]), id]
    await pool.query(`UPDATE students SET ${set} WHERE id = ?`, vals)
    res.json({ success: true })
  } catch (err) {
    console.error('[updateStudent]', err)
    res.status(500).json({ error: 'Server error' })
  }
}

// DELETE /api/students/:id
async function deleteStudent(req, res) {
  const { id } = req.params
  try {
    const [rows] = await pool.query('SELECT bed_id FROM students WHERE id = ?', [id])
    if (rows[0]?.bed_id) {
      await pool.query('UPDATE beds SET status = ? WHERE id = ?', ['available', rows[0].bed_id])
    }
    await pool.query('DELETE FROM students WHERE id = ?', [id])
    res.json({ success: true })
  } catch (err) {
    console.error('[deleteStudent]', err)
    res.status(500).json({ error: 'Server error' })
  }
}

module.exports = { getStudents, addStudent, updateStudent, deleteStudent }
