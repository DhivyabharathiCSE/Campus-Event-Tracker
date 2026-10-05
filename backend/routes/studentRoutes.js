const express = require('express');
const router = express.Router();
const { getStudents, getAdminStats, getStudentStats } = require('../controllers/studentController');
const { getMyEvents } = require('../controllers/registrationController');
const { authenticate, authorizeAdmin, authorizeStudent } = require('../middleware/auth');

// Admin-facing
router.get('/students', authenticate, authorizeAdmin, getStudents);
router.get('/admin/stats', authenticate, authorizeAdmin, getAdminStats);

// Student-facing
router.get('/student/stats', authenticate, authorizeStudent, getStudentStats);
router.get('/my-events', authenticate, authorizeStudent, getMyEvents);

module.exports = router;
