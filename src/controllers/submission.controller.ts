import { Request, Response } from 'express';
import { RequestWithUser } from '../middleware/auth'; // Gunakan import dari middleware/auth
import cloudinary from '../utils/cloudinary';
import prisma from '../utils/prisma';

export const getAllSubmissions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const isAdmin = (req as any).user?.role === 'ADMIN';

    // If admin, get all submissions, otherwise only user's submissions
    const submissions = await prisma.submission.findMany({
      where: isAdmin ? {} : { userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            nim: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(submissions); // HAPUS RETURN
  } catch (error) {
    console.error('Get all submissions error:', error);
    res.status(500).json({ message: 'Server error' }); // HAPUS RETURN
  }
};

export const getSubmissionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as RequestWithUser).user?.id;
    const isAdmin = (req as RequestWithUser).user?.role === 'ADMIN';

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            nim: true
          }
        }
      }
    });

    if (!submission) {
      res.status(404).json({ message: 'Submission not found' });
      return; // Gunakan return di sini untuk menghentikan eksekusi, bukan untuk res.json
    }

    // Check if auth user is admin or submission owner
    if (submission.userId !== userId && !isAdmin) {
      res.status(403).json({ message: 'Unauthorized access to this submission' });
      return; // Gunakan return di sini
    }

    res.json(submission); // HAPUS RETURN
  } catch (error) {
    console.error('Get submission by ID error:', error);
    res.status(500).json({ message: 'Server error' }); // HAPUS RETURN
  }
};

export const createSubmission = async (req: Request, res: Response) => {
  try {
    const userId = (req as RequestWithUser).user?.id;
    const { title, description, activityType, competencyPath, evidenceUrl, publicId } = req.body;

    // Validation
    if (!title || !activityType || !evidenceUrl || !userId) {
      res.status(400).json({ message: 'Required fields are missing' });
      return; // Gunakan return di sini
    }

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        title,
        description: description || '',
        activityType,
        competencyPath,
        evidenceUrl,
        publicId,
        userId
      }
    });

    res.status(201).json({
      message: 'Submission created successfully',
      submission
    }); // HAPUS RETURN
  } catch (error) {
    console.error('Create submission error:', error);
    res.status(500).json({ message: 'Server error' }); // HAPUS RETURN
  }
};

export const updateSubmission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as RequestWithUser).user?.id;
    const isAdmin = (req as RequestWithUser).user?.role === 'ADMIN';
    const { title, description, activityType, competencyPath, evidenceUrl, publicId, status, points, adminComment } = req.body;

    // Check if submission exists
    const submission = await prisma.submission.findUnique({
      where: { id }
    });

    if (!submission) {
      res.status(404).json({ message: 'Submission not found' });
      return;
    }

    // Check if auth user is admin or submission owner
    if (submission.userId !== userId && !isAdmin) {
      res.status(403).json({ message: 'Unauthorized to update this submission' });
      return;
    }

    // Prepare update data
    const updateData: any = {};

    // Both admin and owner can update these
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (activityType) updateData.activityType = activityType;
    if (competencyPath) updateData.competencyPath = competencyPath;
    if (evidenceUrl) updateData.evidenceUrl = evidenceUrl;
    if (publicId) updateData.publicId = publicId;

    // Only admin can update these
    if (isAdmin) {
      if (status) updateData.status = status;
      if (points !== undefined) updateData.points = points;
      if (adminComment !== undefined) updateData.adminComment = adminComment;
    }

    // If owner tries to update after approved/rejected, prevent it
    if (!isAdmin && submission.status !== 'PENDING') {
      res.status(403).json({ message: 'Cannot update a processed submission' });
      return;
    }

    // Update submission
    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: updateData
    });

    res.json({
      message: 'Submission updated successfully',
      submission: updatedSubmission
    }); // HAPUS RETURN
  } catch (error) {
    console.error('Update submission error:', error);
    res.status(500).json({ message: 'Server error' }); // HAPUS RETURN
  }
};

export const deleteSubmission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as RequestWithUser).user?.id;
    const isAdmin = (req as RequestWithUser).user?.role === 'ADMIN';

    // Check if submission exists
    const submission = await prisma.submission.findUnique({
      where: { id }
    });

    if (!submission) {
      res.status(404).json({ message: 'Submission not found' });
      return;
    }

    // Check if auth user is admin or submission owner
    if (submission.userId !== userId && !isAdmin) {
      res.status(403).json({ message: 'Unauthorized to delete this submission' });
      return;
    }

    // If owner tries to delete after approved/rejected, prevent it
    if (!isAdmin && submission.status !== 'PENDING') {
      res.status(403).json({ message: 'Cannot delete a processed submission' });
      return;
    }

    // Delete from Cloudinary if publicId exists
    if (submission.publicId) {
      try {
        await cloudinary.uploader.destroy(submission.publicId);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Continue with deletion even if Cloudinary fails
      }
    }

    // Delete submission
    await prisma.submission.delete({
      where: { id }
    });

    res.json({ message: 'Submission deleted successfully' }); // HAPUS RETURN
  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({ message: 'Server error' }); // HAPUS RETURN
  }
};