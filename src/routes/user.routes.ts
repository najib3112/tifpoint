import express from 'express';
import { deleteUser, getAllUsers, getUserById, updateUser } from '../controllers/user.controller';
import { adminOnly, auth } from '../middleware/auth';

const router = express.Router();

// Admin routes
router.get('/', auth, adminOnly, getAllUsers);

// User routes (protected)
router.get('/:id', auth, getUserById);
router.patch('/:id', auth, updateUser);
router.delete('/:id', auth, adminOnly, deleteUser);

export default router;