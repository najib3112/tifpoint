import express from 'express';
import {
  createActivity,
  deleteActivity,
  getActivitiesWithFilter,
  getActivityById,
  getAllActivities,
  updateActivity,
  validatePoints,
  verifyActivity
} from '../controllers/activity.controller';
import { adminOnly, auth } from '../middleware/auth';

const router = express.Router();

// Get all activities
router.get('/', auth, getAllActivities);

// Get activities with filter and pagination
router.get('/filter', auth, getActivitiesWithFilter);

// Get activity by ID
router.get('/:id', auth, getActivityById);

// Create activity
router.post('/', auth, createActivity);

// Update activity
router.put('/:id', auth, updateActivity);

// Delete activity
router.delete('/:id', auth, deleteActivity);

// Verify activity (admin only)
router.patch('/:id/verify', auth, adminOnly, verifyActivity);

// Validate point assignment (admin only)
router.post('/validate-points', auth, adminOnly, validatePoints);

export default router;
