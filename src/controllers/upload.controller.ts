import { Request, Response } from 'express';
import fs from 'fs';
import cloudinary from '../utils/cloudinary';

export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'tifpoint-evidence',
    });

    // Remove file from server after upload
    fs.unlinkSync(req.file.path);

    // Return the Cloudinary URL and public ID
    res.json({
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('File upload error:', error);
    
    // Remove file from server in case of error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};
