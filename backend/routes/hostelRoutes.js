const express = require('express')
const router  = express.Router()
const { getHostels, createHostel, updateHostel, createHostelWithOwner } = require('../controllers/hostelController')
const { verifyToken, checkRole } = require('../middleware/auth')

router.use(verifyToken)

router.get('/',                  getHostels)
router.post('/',                 checkRole('admin','super_admin'), createHostel)
router.put('/:id',               checkRole('admin','super_admin'), updateHostel)
router.post('/create-with-owner', checkRole('super_admin'),       createHostelWithOwner)

module.exports = router
