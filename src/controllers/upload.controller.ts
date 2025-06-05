import { Request, Response } from 'express';
import fs from 'fs';
import cloudinary from '../utils/cloudinary';

export const uploadFile = async (req: Request, res: Response) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    console.log('📁 File upload attempt:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    // Check if file exists on disk
    if (!fs.existsSync(req.file.path)) {
      res.status(400).json({ message: 'Uploaded file not found on server' });
      return;
    }

    // Validate file size (5MB limit)
    if (req.file.size > 5 * 1024 * 1024) {
      // Clean up file
      fs.unlinkSync(req.file.path);
      res.status(400).json({ message: 'File size exceeds 5MB limit' });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      // Clean up file
      fs.unlinkSync(req.file.path);
      res.status(400).json({ message: 'Invalid file type. Only JPG, PNG, and PDF are allowed' });
      return;
    }

    console.log('☁️ Uploading to Cloudinary...');

    // Upload to Cloudinary with error handling
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'tifpoint-evidence',
      resource_type: 'auto', // Auto-detect file type
      timeout: 60000 // 60 second timeout
    });

    console.log('✅ Cloudinary upload successful:', {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes
    });

    // Remove file from server after successful upload
    try {
      fs.unlinkSync(req.file.path);
      console.log('🗑️ Temporary file cleaned up');
    } catch (cleanupError) {
      console.warn('⚠️ Could not clean up temporary file:', cleanupError);
      // Don't fail the request for cleanup errors
    }

    // Return the Cloudinary URL and public ID
    res.json({
      message: 'File uploaded successfully',
      url: result.secure_url,
      publicId: result.public_id
    });

  } catch (error: any) {
    console.error('❌ File upload error:', error);

    // Clean up file from server in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🗑️ Temporary file cleaned up after error');
      } catch (cleanupError) {
        console.warn('⚠️ Could not clean up temporary file after error:', cleanupError);
      }
    }

    // Handle specific Cloudinary errors
    if (error.http_code) {
      console.error('Cloudinary API error:', {
        http_code: error.http_code,
        message: error.message
      });

      if (error.http_code === 401) {
        res.status(500).json({ message: 'Cloudinary authentication failed' });
        return;
      }

      if (error.http_code === 400) {
        res.status(400).json({ message: 'Invalid file format or corrupted file' });
        return;
      }
    }

    // Handle network/timeout errors
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
      res.status(500).json({ message: 'Upload timeout. Please try again.' });
      return;
    }

    // Handle file system errors
    if (error.code === 'ENOENT') {
      res.status(400).json({ message: 'File not found during upload' });
      return;
    }

    if (error.code === 'EACCES') {
      res.status(500).json({ message: 'File permission error' });
      return;
    }

    // Generic server error
    res.status(500).json({
      message: 'File upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


