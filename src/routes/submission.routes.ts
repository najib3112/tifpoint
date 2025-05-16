import express from 'express';
import {
    createSubmission,
    deleteSubmission,
    getAllSubmissions,
    getSubmissionById,
    updateSubmission
} from '../controllers/submission.controller';
import { auth } from '../middleware/auth'; // Pastikan path benar

const router = express.Router();

router.get('/', auth, getAllSubmissions);
router.get('/:id', auth, getSubmissionById);
router.post('/', auth, createSubmission);
router.patch('/:id', auth, updateSubmission);
router.delete('/:id', auth, deleteSubmission);

export default router;