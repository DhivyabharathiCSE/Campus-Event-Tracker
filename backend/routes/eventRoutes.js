const express = require('express');
const router = express.Router();
const {
  getEvents, getEventById, createEvent, updateEvent, deleteEvent,
} = require('../controllers/eventController');
const {
  registerForEvent, cancelRegistration, getEventRegistrations,
} = require('../controllers/registrationController');
const { authenticate, authorizeAdmin, authorizeStudent } = require('../middleware/auth');

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', authenticate, authorizeAdmin, createEvent);
router.put('/:id', authenticate, authorizeAdmin, updateEvent);
router.delete('/:id', authenticate, authorizeAdmin, deleteEvent);

router.post('/:id/register', authenticate, authorizeStudent, registerForEvent);
router.delete('/:id/register', authenticate, authorizeStudent, cancelRegistration);
router.get('/:id/registrations', authenticate, authorizeAdmin, getEventRegistrations);

module.exports = router;
