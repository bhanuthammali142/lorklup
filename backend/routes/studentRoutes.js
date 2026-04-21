const express = require('express')
const router  = express.Router()
const { getStudents, addStudent, updateStudent, deleteStudent } = require('../controllers/studentController')
const { verifyToken, checkRole } = require('../middleware/auth')

router.use(verifyToken)

router.get('/',     getStudents)
router.post('/',    checkRole('admin','super_admin'), addStudent)
router.put('/:id',  checkRole('admin','super_admin'), updateStudent)
router.delete('/:id', checkRole('admin','super_admin'), deleteStudent)

module.exports = router
