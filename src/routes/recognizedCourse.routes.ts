import express from 'express';
import {
    createRecognizedCourse,
    deleteRecognizedCourse,
    getAllRecognizedCourses,
    getRecognizedCourseById,
    updateRecognizedCourse
} from '../controllers/recognizedCourse.controller';
import { adminOnly, auth } from '../middleware/auth';

const router = express.Router();

// Public route
router.get('/', getAllRecognizedCourses);

// Protected routes
router.get('/:id', auth, getRecognizedCourseById);

// Admin routes
router.post('/', auth, adminOnly, createRecognizedCourse);
router.patch('/:id', auth, adminOnly, updateRecognizedCourse);
router.delete('/:id', auth, adminOnly, deleteRecognizedCourse);

export default router;