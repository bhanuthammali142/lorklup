const pool = require('../config/db')

// GET /api/hostels  (super_admin gets all, admin gets their own)
async function getHostels(req, res) {
  try {
    let rows
    if (req.user.role === 'super_admin') {
      ;[rows] = await pool.query(
        `SELECT h.*, u.name AS owner_name, u.email AS owner_email,
                COUNT(DISTINCT s.id) AS student_count
         FROM hostels h
         JOIN users u ON u.id = h.owner_id
         LEFT JOIN students s ON s.hostel_id = h.id
         GROUP BY h.id
         ORDER BY h.created_at DESC`
      )
    } else {
      ;[rows] = await pool.query(
        `SELECT h.*, COUNT(DISTINCT s.id) AS student_count
         FROM hostels h
         LEFT JOIN students s ON s.hostel_id = h.id
         WHERE h.owner_id = ?
         GROUP BY h.id LIMIT 1`,
        [req.user.id]
      )
    }
    res.json(rows)
  } catch (err) {
    console.error('[getHostels]', err)
    res.status(500).json({ error: 'Server error' })
  }
}

// POST /api/hostels  (admin creates their own; super_admin creates with owner)
async function createHostel(req, res) {
  const { name, address, contact_email, contact_phone, owner_id } = req.body
  if (!name) return res.status(400).json({ error: 'Hostel name is required' })

  try {
    const actualOwnerId = req.user.role === 'super_admin' ? (owner_id || req.user.id) : req.user.id
    const id = require('crypto').randomUUID()
    await pool.query(
      'INSERT INTO hostels (id, name, address, contact_email, contact_phone, owner_id) VALUES (?,?,?,?,?,?)',
      [id, name, address || null, contact_email || null, contact_phone || null, actualOwnerId]
    )
    const [rows] = await pool.query('SELECT * FROM hostels WHERE id = ?', [id])
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('[createHostel]', err)
    res.status(500).json({ error: 'Server error' })
  }
}

// PUT /api/hostels/:id
async function updateHostel(req, res) {
  const { id } = req.params
  const { name, address, contact_email, contact_phone } = req.body
  try {
    // ownership check
    if (req.user.role !== 'super_admin') {
      const [h] = await pool.query('SELECT owner_id FROM hostels WHERE id = ?', [id])
      if (!h[0] || h[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
    }
    await pool.query(
      'UPDATE hostels SET name=?, address=?, contact_email=?, contact_phone=? WHERE id=?',
      [name, address, contact_email, contact_phone, id]
    )
    res.json({ success: true })
  } catch (err) {
    console.error('[updateHostel]', err)
    res.status(500).json({ error: 'Server error' })
  }
}

// POST /api/hostels/create-with-owner  (super_admin only — replaces edge function)
async function createHostelWithOwner(req, res) {
  const { ownerName, ownerEmail, ownerPhone, hostelName, address, contact_email, contact_phone, floors, menu } = req.body
  if (!ownerEmail || !hostelName) return res.status(400).json({ error: 'Owner email and hostel name required' })

  const bcrypt = require('bcryptjs')
  const crypto = require('crypto')

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // 1. Create or reuse user
    const tempPassword = Math.random().toString(36).slice(2, 10) + 'A@1'
    const hash = await bcrypt.hash(tempPassword, 12)
    let ownerId

    const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [ownerEmail])
    if (existing.length > 0) {
      ownerId = existing[0].id
    } else {
      ownerId = crypto.randomUUID()
      await conn.query(
        'INSERT INTO users (id, name, email, password_hash, role) VALUES (?,?,?,?,?)',
        [ownerId, ownerName || ownerEmail, ownerEmail, hash, 'admin']
      )
    }

    // 2. Create hostel
    const hostelId = crypto.randomUUID()
    await conn.query(
      'INSERT INTO hostels (id, name, address, contact_email, contact_phone, owner_id) VALUES (?,?,?,?,?,?)',
      [hostelId, hostelName, address || null, contact_email || null, contact_phone || null, ownerId]
    )

    // 3. Create rooms + beds from floors
    if (floors && Array.isArray(floors)) {
      for (const floor of floors) {
        for (const room of (floor.rooms || [])) {
          const roomId = crypto.randomUUID()
          await conn.query(
            'INSERT INTO rooms (id, hostel_id, room_number, floor, type, capacity, monthly_fee) VALUES (?,?,?,?,?,?,?)',
            [roomId, hostelId, room.roomNumber, floor.floorName, room.type || 'Non-AC', room.beds || 3, room.monthlyFee || 5000]
          )
          for (let b = 0; b < (room.beds || 3); b++) {
            await conn.query(
              'INSERT INTO beds (id, hostel_id, room_id, bed_number, status) VALUES (?,?,?,?,?)',
              [crypto.randomUUID(), hostelId, roomId, `B${b + 1}`, 'available']
            )
          }
        }
      }
    }

    // 4. Create food menu
    if (menu) {
      await conn.query('INSERT INTO food_menus (id, hostel_id, menu) VALUES (?,?,?)', [crypto.randomUUID(), hostelId, JSON.stringify(menu)])
    }

    await conn.commit()
    conn.release()

    const [hostels] = await pool.query('SELECT * FROM hostels WHERE id = ?', [hostelId])
    return res.status(201).json({
      hostel: hostels[0],
      credentials: { email: ownerEmail, password: tempPassword },
      summary: `Created hostel "${hostelName}" with owner ${ownerEmail}`
    })
  } catch (err) {
    await conn.rollback()
    conn.release()
    console.error('[createHostelWithOwner]', err)
    return res.status(500).json({ error: err.message || 'Server error' })
  }
}

module.exports = { getHostels, createHostel, updateHostel, createHostelWithOwner }
