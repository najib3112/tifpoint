import express from 'express';
import {
  createActivityType,
  deleteActivityType,
  getActivityTypeById,
  getAllActivityTypes,
  updateActivityType
} from '../controllers/activityType.controller';
import { adminOnly, auth } from '../middleware/auth';

const router = express.Router();

// Get all activity types
router.get('/', getAllActivityTypes);

// Get activity type by ID
router.get('/:id', getActivityTypeById);

// Create activity type (admin only)
router.post('/', auth, adminOnly, createActivityType);

// Update activity type (admin only)
router.put('/:id', auth, adminOnly, updateActivityType);

// Delete activity type (admin only)
router.delete('/:id', auth, adminOnly, deleteActivityType);

export default router;
