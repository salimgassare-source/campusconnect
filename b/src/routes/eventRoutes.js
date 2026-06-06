const express = require('express');
const {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    registerForEvent,
    cancelRegistration,
    getUserEvents
} = require('../controllers/eventController');
const authenticate = require('../middleware/auth');
const { isClubAdmin, isAdmin } = require('../middleware/roleCheck');

const router = express.Router();

// Public routes
router.get('/', getEvents);
router.get('/:id', getEventById);

// Protected routes
router.use(authenticate);
router.post('/', isClubAdmin, createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', isAdmin, deleteEvent);
router.post('/:id/register', registerForEvent);
router.delete('/:id/register', cancelRegistration);
router.get('/user/my-events', getUserEvents);

module.exports = router;