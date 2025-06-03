import express from 'express';
import { forgotPassword, getProfile, login, register, resetPassword } from '../controllers/auth.controller';
import { auth } from '../middleware/auth';

const router = express.Router();

// Register route
router.post('/register', register);

// Login route
router.post('/login', login);

// Get profile route (protected)
router.get('/profile', auth, getProfile);

// Forgot password route
router.post('/forgot-password', forgotPassword);

// Reset password route
router.post('/reset-password', resetPassword);

export default router;
