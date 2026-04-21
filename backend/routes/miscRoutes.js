const express = require('express')
const router  = express.Router()
const {
  getFees, addFee, generateBulkFees, processPayment, markOverdue, getStudentFees
} = require('../controllers/feeController')
const {
  getDashboardStats, getRevenueByMonth,
  getComplaints, addComplaint, updateComplaint,
  getAnnouncements, addAnnouncement, deleteAnnouncement,
  getAttendance, markAttendance,
  getFoodMenu, saveFoodMenu
} = require('../controllers/miscController')
const { verifyToken, checkRole } = require('../middleware/auth')

router.use(verifyToken)

// Fees
router.get('/fees',                 getFees)
router.post('/fees',                addFee)
router.post('/fees/generate-bulk',  generateBulkFees)
router.post('/fees/:id/payment',    processPayment)
router.post('/fees/mark-overdue',   markOverdue)
router.get('/fees/student/:studentId', getStudentFees)

// Dashboard
router.get('/dashboard',          getDashboardStats)
router.get('/dashboard/revenue',  getRevenueByMonth)

// Complaints
router.get('/complaints',        getComplaints)
router.post('/complaints',       addComplaint)
router.put('/complaints/:id',    checkRole('admin','super_admin'), updateComplaint)

// Announcements
router.get('/announcements',      getAnnouncements)
router.post('/announcements',     checkRole('admin','super_admin'), addAnnouncement)
router.delete('/announcements/:id', checkRole('admin','super_admin'), deleteAnnouncement)

// Attendance
router.get('/attendance',  getAttendance)
router.post('/attendance', markAttendance)

// Food menu
router.get('/food-menu',  getFoodMenu)
router.put('/food-menu',  checkRole('admin','super_admin'), saveFoodMenu)

module.exports = router
