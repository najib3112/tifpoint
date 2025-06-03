import express from 'express';
import { uploadFile } from '../controllers/upload.controller';
import { auth } from '../middleware/auth';
import upload from '../middleware/upload';

const router = express.Router();

// Upload file route
router.post('/', auth, upload.single('file'), uploadFile);

export default router;
