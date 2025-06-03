import express from 'express';
import {
    createCompetency,
    deleteCompetency,
    getAllCompetencies,
    getCompetencyById,
    updateCompetency
} from '../controllers/competency.controller';
import { adminOnly, auth } from '../middleware/auth';

const router = express.Router();

// Get all competencies
router.get('/', getAllCompetencies);

// Get competency by ID
router.get('/:id', getCompetencyById);

// Create competency (admin only)
router.post('/', auth, adminOnly, createCompetency);

// Update competency (admin only)
router.put('/:id', auth, adminOnly, updateCompetency);

// Delete competency (admin only)
router.delete('/:id', auth, adminOnly, deleteCompetency);

export default router;

