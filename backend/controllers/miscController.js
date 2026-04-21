const pool   = require('../config/db')
const crypto = require('crypto')

// GET /api/dashboard?hostel_id=xxx
async function getDashboardStats(req, res) {
  const hostelId = req.query.hostel_id || req.user.hostel_id
  if (!hostelId) return res.status(400).json({ error: 'hostel_id required' })

  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().split('T')[0]
  const monthEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).toISOString().split('T')[0]

  try {
    const [[{ totalStudents }]] = await pool.query(
      'SELECT COUNT(*) AS totalStudents FROM students WHERE hostel_id = ?', [hostelId]
    )
    const [beds] = await pool.query('SELECT status FROM beds WHERE hostel_id = ?', [hostelId])
    const totalBeds    = beds.length
    const occupiedBeds = beds.filter(b => b.status === 'occupied').length

    const [fees] = await pool.query(
      'SELECT amount, status FROM fees WHERE hostel_id = ? AND month >= ? AND month <= ?',
      [hostelId, monthStart, monthEnd]
    )
    const monthlyRevenue = fees.filter(f => f.status === 'paid').reduce((s, f) => s + Number(f.amount), 0)
    const pendingFees    = fees.filter(f => f.status === 'pending').reduce((s, f) => s + Number(f.amount), 0)
    const overdueFees    = fees.filter(f => f.status === 'overdue').reduce((s, f) => s + Number(f.amount), 0)

    res.json({ totalStudents, totalBeds, occupiedBeds, monthlyRevenue, pendingFees, overdueFees })
  } catch (err) {
    console.error('[getDashboardStats]', err)
    res.status(500).json({ error: 'Server error' })
  }
}

// GET /api/dashboard/revenue?hostel_id=xxx
async function getRevenueByMonth(req, res) {
  const hostelId = req.query.hostel_id || req.user.hostel_id
  try {
    const [rows] = await pool.query(
      "SELECT DATE_FORMAT(month, '%b %y') AS name, SUM(amount) AS amount FROM fees WHERE hostel_id = ? AND status='paid' GROUP BY YEAR(month), MONTH(month) ORDER BY month",
      [hostelId]
    )
    res.json(rows)
  } catch (err) {
    console.error('[getRevenueByMonth]', err)
    res.status(500).json({ error: 'Server error' })
  }
}

// GET /api/complaints?hostel_id=xxx
async function getComplaints(req, res) {
  const hostelId = req.query.hostel_id || req.user.hostel_id
  try {
    const [rows] = await pool.query(
      `SELECT c.*, s.full_name AS student_name, r.room_number
       FROM complaints c
       LEFT JOIN students s ON s.id = c.student_id
       LEFT JOIN rooms r ON r.id = s.room_id
       WHERE c.hostel_id = ? ORDER BY c.created_at DESC`,
      [hostelId]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}

// POST /api/complaints
async function addComplaint(req, res) {
  const { hostel_id, student_id, title, description, category } = req.body
  try {
    const id = crypto.randomUUID()
    await pool.query(
      'INSERT INTO complaints (id, hostel_id, student_id, title, description, category) VALUES (?,?,?,?,?,?)',
      [id, hostel_id, student_id || null, title, description || null, category || null]
    )
    res.status(201).json({ id, success: true })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}

// PUT /api/complaints/:id
async function updateComplaint(req, res) {
  const { id } = req.params
  const { status, priority } = req.body
  try {
    await pool.query('UPDATE complaints SET status=?, priority=? WHERE id=?', [status, priority, id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}

// GET /api/announcements?hostel_id=xxx
async function getAnnouncements(req, res) {
  const hostelId = req.query.hostel_id || req.user.hostel_id
  try {
    const [rows] = await pool.query(
      'SELECT * FROM announcements WHERE hostel_id = ? ORDER BY created_at DESC',
      [hostelId]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}

// POST /api/announcements
async function addAnnouncement(req, res) {
  const { hostel_id, title, message } = req.body
  try {
    const id = crypto.randomUUID()
    await pool.query('INSERT INTO announcements (id, hostel_id, title, message) VALUES (?,?,?,?)', [id, hostel_id, title, message])
    res.status(201).json({ id, success: true })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}

// DELETE /api/announcements/:id
async function deleteAnnouncement(req, res) {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM announcements WHERE id = ?', [id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}

// GET /api/attendance?hostel_id=xxx&date=yyyy-mm-dd
async function getAttendance(req, res) {
  const hostelId = req.query.hostel_id || req.user.hostel_id
  const date = req.query.date || new Date().toISOString().split('T')[0]
  try {
    const [rows] = await pool.query(
      `SELECT s.id, s.full_name, r.room_number,
              a.status AS attendance_status
       FROM students s
       LEFT JOIN rooms r ON r.id = s.room_id
       LEFT JOIN attendance a ON a.student_id = s.id AND a.date = ?
       WHERE s.hostel_id = ?
       ORDER BY s.full_name`,
      [date, hostelId]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}

// POST /api/attendance
async function markAttendance(req, res) {
  const { hostel_id, student_id, date, status } = req.body
  try {
    await pool.query(
      `INSERT INTO attendance (id, hostel_id, student_id, date, status) VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [crypto.randomUUID(), hostel_id, student_id, date, status]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}

// GET /api/food-menu?hostel_id=xxx
async function getFoodMenu(req, res) {
  const hostelId = req.query.hostel_id || req.user.hostel_id
  try {
    const [rows] = await pool.query('SELECT menu FROM food_menus WHERE hostel_id = ?', [hostelId])
    res.json({ menu: rows[0]?.menu || null })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}

// PUT /api/food-menu
async function saveFoodMenu(req, res) {
  const { hostel_id, menu } = req.body
  try {
    await pool.query(
      'INSERT INTO food_menus (id, hostel_id, menu) VALUES (?,?,?) ON DUPLICATE KEY UPDATE menu = VALUES(menu)',
      [crypto.randomUUID(), hostel_id, JSON.stringify(menu)]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}

module.exports = {
  getDashboardStats, getRevenueByMonth,
  getComplaints, addComplaint, updateComplaint,
  getAnnouncements, addAnnouncement, deleteAnnouncement,
  getAttendance, markAttendance,
  getFoodMenu, saveFoodMenu
}
