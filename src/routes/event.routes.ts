import express from 'express';
import {
    createEvent,
    deleteEvent,
    getAllEvents,
    getEventById,
    updateEvent
} from '../controllers/event.controller';
import { adminOnly, auth } from '../middleware/auth';

const router = express.Router();

// Public route
router.get('/', getAllEvents);

// Protected routes
router.get('/:id', auth, getEventById);

// Admin routes
router.post('/', auth, adminOnly, createEvent);
router.patch('/:id', auth, adminOnly, updateEvent);
router.delete('/:id', auth, adminOnly, deleteEvent);

export default router;