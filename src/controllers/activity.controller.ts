import { Request, Response } from 'express';
import { RequestWithUser } from '../types';
import cloudinary from '../utils/cloudinary';
import { validatePointAssignment } from '../utils/pointCalculation';
import prisma from '../utils/prisma';

// Type assertion to fix Prisma TypeScript issues
const db = prisma as any;

export const getAllActivities = async (req: Request, res: Response) => {
  try {
    const userId = (req as RequestWithUser).user?.id;
    const isAdmin = (req as RequestWithUser).user?.role === 'ADMIN';

    // If admin, get all activities, otherwise only user's activities
    const activities = await db.activity.findMany({
      where: isAdmin ? {} : { userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            nim: true
          }
        },
        competency: true,
        activityType: true,
        recognizedCourse: true,
        event: true,
        verifier: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(activities);
  } catch (error) {
    console.error('Get all activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getActivityById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as RequestWithUser).user?.id;
    const isAdmin = (req as RequestWithUser).user?.role === 'ADMIN';

    const activity = await db.activity.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            nim: true
          }
        },
        competency: true,
        activityType: true,
        recognizedCourse: true,
        event: true,
        verifier: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      }
    });

    if (!activity) {
      res.status(404).json({ message: 'Activity not found' });
      return;
    }

    // Check if auth user is admin or activity owner
    if (activity.userId !== userId && !isAdmin) {
      res.status(403).json({ message: 'Unauthorized access to this activity' });
      return;
    }

    res.json(activity);
  } catch (error) {
    console.error('Get activity by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createActivity = async (req: Request, res: Response) => {
  try {
    const userId = (req as RequestWithUser).user?.id;
    const {
      title,
      description,
      competencyId,
      activityTypeId,
      documentUrl,
      documentPublicId,
      recognizedCourseId,
      eventId
    } = req.body;

    // Validation
    if (!title || !competencyId || !activityTypeId || !documentUrl) {
      res.status(400).json({ message: 'Required fields are missing' });
      return;
    }

    // Additional validation for empty strings
    if (title.trim() === '') {
      res.status(400).json({ message: 'Title cannot be empty' });
      return;
    }

    // Verify competency exists
    const competencyExists = await db.competency.findUnique({
      where: { id: competencyId }
    });

    if (!competencyExists) {
      res.status(400).json({ message: 'Invalid competency ID' });
      return;
    }

    // Verify activity type exists
    const activityTypeExists = await db.activityType.findUnique({
      where: { id: activityTypeId }
    });

    if (!activityTypeExists) {
      res.status(400).json({ message: 'Invalid activity type ID' });
      return;
    }

    // Verify recognized course exists (if provided)
    if (recognizedCourseId) {
      const courseExists = await db.recognizedCourse.findUnique({
        where: { id: recognizedCourseId }
      });

      if (!courseExists) {
        res.status(400).json({ message: 'Invalid recognized course ID' });
        return;
      }
    }

    // Verify event exists (if provided)
    if (eventId) {
      const eventExists = await db.event.findUnique({
        where: { id: eventId }
      });

      if (!eventExists) {
        res.status(400).json({ message: 'Invalid event ID' });
        return;
      }
    }

    // Create activity
    const activity = await db.activity.create({
      data: {
        title,
        description,
        userId,
        competencyId,
        activityTypeId,
        documentUrl,
        documentPublicId,
        recognizedCourseId,
        eventId
      }
    });

    res.status(201).json({
      message: 'Activity created successfully',
      activity
    });
  } catch (error: any) {
    console.error('Create activity error:', error);

    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      res.status(400).json({ message: 'Duplicate entry detected' });
      return;
    }

    if (error.code === 'P2003') {
      res.status(400).json({ message: 'Invalid reference ID provided' });
      return;
    }

    if (error.code === 'P2025') {
      res.status(404).json({ message: 'Referenced record not found' });
      return;
    }

    res.status(500).json({ message: 'Server error' });
  }
};

export const updateActivity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as RequestWithUser).user?.id;
    const isAdmin = (req as RequestWithUser).user?.role === 'ADMIN';
    const { 
      title, 
      description, 
      competencyId, 
      activityTypeId, 
      documentUrl, 
      documentPublicId,
      recognizedCourseId,
      eventId
    } = req.body;

    // Check if activity exists
    const activity = await db.activity.findUnique({
      where: { id }
    });

    if (!activity) {
      res.status(404).json({ message: 'Activity not found' });
      return;
    }

    // Check if auth user is admin or activity owner
    if (activity.userId !== userId && !isAdmin) {
      res.status(403).json({ message: 'Unauthorized to update this activity' });
      return;
    }

    // If owner tries to update after approved/rejected, prevent it
    if (!isAdmin && activity.status !== 'PENDING') {
      res.status(403).json({ message: 'Cannot update a processed activity' });
      return;
    }

    // Update activity
    const updatedActivity = await db.activity.update({
      where: { id },
      data: {
        title,
        description,
        competencyId,
        activityTypeId,
        documentUrl,
        documentPublicId,
        recognizedCourseId,
        eventId
      }
    });

    res.json({
      message: 'Activity updated successfully',
      activity: updatedActivity
    });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteActivity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as RequestWithUser).user?.id;
    const isAdmin = (req as RequestWithUser).user?.role === 'ADMIN';

    // Check if activity exists
    const activity = await db.activity.findUnique({
      where: { id }
    });

    if (!activity) {
      res.status(404).json({ message: 'Activity not found' });
      return;
    }

    // Check if auth user is admin or activity owner
    if (activity.userId !== userId && !isAdmin) {
      res.status(403).json({ message: 'Unauthorized to delete this activity' });
      return;
    }

    // If owner tries to delete after approved/rejected, prevent it
    if (!isAdmin && activity.status !== 'PENDING') {
      res.status(403).json({ message: 'Cannot delete a processed activity' });
      return;
    }

    // Delete from Cloudinary if publicId exists
    if (activity.documentPublicId) {
      try {
        await cloudinary.uploader.destroy(activity.documentPublicId);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Continue with deletion even if Cloudinary fails
      }
    }

    // Delete activity
    await db.activity.delete({
      where: { id }
    });

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const verifyActivity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as RequestWithUser).user?.id;
    const { status, point, comment } = req.body;

    // Validation
    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({ message: 'Valid status (APPROVED or REJECTED) is required' });
      return;
    }

    // Check if activity exists
    const activity = await db.activity.findUnique({
      where: { id }
    });

    if (!activity) {
      res.status(404).json({ message: 'Activity not found' });
      return;
    }

    // Update activity with verification details
    const updatedActivity = await db.activity.update({
      where: { id },
      data: {
        status,
        point,
        comment,
        verifiedById: adminId,
        verifiedAt: new Date()
      }
    });

    res.json({
      message: `Activity ${status.toLowerCase()} successfully`,
      activity: updatedActivity
    });
  } catch (error) {
    console.error('Verify activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get activities with filtering and pagination
export const getActivitiesWithFilter = async (req: Request, res: Response) => {
  try {
    const userId = (req as RequestWithUser).user?.id;
    const isAdmin = (req as RequestWithUser).user?.role === 'ADMIN';
    const { status, competencyId, activityTypeId, nim, page = 1, limit = 10 } = req.query;

    // Build where clause
    const whereClause: any = {};

    // If not admin, only show user's activities
    if (!isAdmin) {
      whereClause.userId = userId;
    }

    // Filter by status
    if (status) {
      whereClause.status = status as string;
    }

    // Filter by competency
    if (competencyId) {
      whereClause.competencyId = competencyId as string;
    }

    // Filter by activity type
    if (activityTypeId) {
      whereClause.activityTypeId = activityTypeId as string;
    }

    // Filter by NIM (admin only)
    if (nim && isAdmin) {
      whereClause.user = {
        nim: {
          contains: nim as string,
          mode: 'insensitive'
        }
      };
    }

    // Calculate pagination
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    // Get activities with pagination
    const [activities, totalCount] = await Promise.all([
      db.activity.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              nim: true
            }
          },
          competency: true,
          activityType: true,
          recognizedCourse: true,
          event: true,
          verifier: {
            select: {
              id: true,
              username: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limitNumber
      }),
      db.activity.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalCount / limitNumber);

    res.json({
      activities,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalCount,
        hasNext: pageNumber < totalPages,
        hasPrev: pageNumber > 1
      }
    });
  } catch (error) {
    console.error('Get activities with filter error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Validate point assignment (admin only)
export const validatePoints = async (req: Request, res: Response) => {
  try {
    const { activityTypeId, competencyId, points } = req.body;

    if (!activityTypeId || !competencyId || points === undefined) {
      res.status(400).json({ message: 'Activity type, competency, and points are required' });
      return;
    }

    const validation = await validatePointAssignment(activityTypeId, competencyId, points);
    res.json(validation);
  } catch (error) {
    console.error('Validate points error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

