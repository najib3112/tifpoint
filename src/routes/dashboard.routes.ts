import express from 'express';
import {
    getActivityStatistics,
    getAdminDashboard,
    getLeaderboard,
    getStudentDashboard,
    getStudentRecommendations,
    getStudentStatistics
} from '../controllers/dashboard.controller';
import { adminOnly, auth } from '../middleware/auth';

const router = express.Router();

// Student dashboard (protected - only for authenticated students)
router.get('/student', auth, getStudentDashboard);

// Admin dashboard (admin only)
router.get('/admin', auth, adminOnly, getAdminDashboard);

// Get detailed student statistics (admin only)
router.get('/student/:id/statistics', auth, adminOnly, getStudentStatistics);

// Get leaderboard (public or protected based on requirements)
router.get('/leaderboard', auth, getLeaderboard);

// Get activity statistics (admin only)
router.get('/statistics', auth, adminOnly, getActivityStatistics);

// Get recommendations for student
router.get('/recommendations', auth, getStudentRecommendations);

export default router;
