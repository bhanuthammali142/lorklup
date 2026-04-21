require('dotenv').config()
const express = require('express')
const cors    = require('cors')

const authRoutes   = require('./routes/authRoutes')
const hostelRoutes = require('./routes/hostelRoutes')
const studentRoutes = require('./routes/studentRoutes')
const roomRoutes   = require('./routes/roomRoutes')
const miscRoutes   = require('./routes/miscRoutes')

const app = express()

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
  ],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Request Logger ────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes)
app.use('/api/hostels',  hostelRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/rooms',    roomRoutes)
app.use('/api',          miscRoutes)

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }))

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 HostelOS backend running on http://localhost:${PORT}`)
})
