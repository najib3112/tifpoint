import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAllActivityTypes = async (req: Request, res: Response) => {
  try {
    const activityTypes = await prisma.activityType.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    res.json(activityTypes);
  } catch (error) {
    console.error('Get all activity types error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getActivityTypeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const activityType = await prisma.activityType.findUnique({
      where: { id }
    });

    if (!activityType) {
      res.status(404).json({ message: 'Activity type not found' });
      return;
    }

    res.json(activityType);
  } catch (error) {
    console.error('Get activity type by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createActivityType = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    // Validation
    if (!name) {
      res.status(400).json({ message: 'Name is required' });
      return;
    }

    // Create activity type
    const activityType = await prisma.activityType.create({
      data: {
        name,
        description
      }
    });

    res.status(201).json({
      message: 'Activity type created successfully',
      activityType
    });
  } catch (error) {
    console.error('Create activity type error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateActivityType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if activity type exists
    const existingActivityType = await prisma.activityType.findUnique({
      where: { id }
    });

    if (!existingActivityType) {
      res.status(404).json({ message: 'Activity type not found' });
      return;
    }

    // Update activity type
    const updatedActivityType = await prisma.activityType.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined
      }
    });

    res.json({
      message: 'Activity type updated successfully',
      activityType: updatedActivityType
    });
  } catch (error) {
    console.error('Update activity type error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteActivityType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if activity type exists
    const existingActivityType = await prisma.activityType.findUnique({
      where: { id }
    });

    if (!existingActivityType) {
      res.status(404).json({ message: 'Activity type not found' });
      return;
    }

    // Check if activity type is used in any activity
    const activityCount = await prisma.activity.count({
      where: { activityTypeId: id }
    });

    if (activityCount > 0) {
      res.status(400).json({ 
        message: 'Cannot delete activity type that is used in activities',
        count: activityCount
      });
      return;
    }

    // Delete activity type
    await prisma.activityType.delete({
      where: { id }
    });

    res.json({ message: 'Activity type deleted successfully' });
  } catch (error) {
    console.error('Delete activity type error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
