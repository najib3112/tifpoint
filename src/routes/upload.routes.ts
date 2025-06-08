import express from 'express';
import { uploadFile } from '../controllers/upload.controller';
import { auth } from '../middleware/auth';
import upload from '../middleware/upload';

const router = express.Router();

// Upload file route with error handling
router.post('/', auth, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer upload error:', err);

      // Handle specific multer errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          message: 'File too large. Maximum size is 5MB.'
        });
      }

      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          message: 'Unexpected field name. Use "file" as field name.'
        });
      }

      if (err.message.includes('filetypes')) {
        return res.status(400).json({
          message: 'Invalid file type. Only JPG, PNG, and PDF files are allowed.'
        });
      }

      // Generic multer error
      return res.status(400).json({
        message: 'File upload error: ' + err.message
      });
    }

    // No error, proceed to controller
    return next();
  });
}, uploadFile);

export default router;
