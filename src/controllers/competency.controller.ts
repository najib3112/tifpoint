import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAllCompetencies = async (req: Request, res: Response) => {
  try {
    const competencies = await prisma.competency.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    res.json(competencies);
  } catch (error) {
    console.error('Get all competencies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCompetencyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const competency = await prisma.competency.findUnique({
      where: { id }
    });

    if (!competency) {
      res.status(404).json({ message: 'Competency not found' });
      return;
    }

    res.json(competency);
  } catch (error) {
    console.error('Get competency by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createCompetency = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    // Validation
    if (!name) {
      res.status(400).json({ message: 'Name is required' });
      return;
    }

    // Create competency
    const competency = await prisma.competency.create({
      data: {
        name,
        description
      }
    });

    res.status(201).json({
      message: 'Competency created successfully',
      competency
    });
  } catch (error) {
    console.error('Create competency error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCompetency = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if competency exists
    const existingCompetency = await prisma.competency.findUnique({
      where: { id }
    });

    if (!existingCompetency) {
      res.status(404).json({ message: 'Competency not found' });
      return;
    }

    // Update competency
    const updatedCompetency = await prisma.competency.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined
      }
    });

    res.json({
      message: 'Competency updated successfully',
      competency: updatedCompetency
    });
  } catch (error) {
    console.error('Update competency error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteCompetency = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if competency exists
    const existingCompetency = await prisma.competency.findUnique({
      where: { id }
    });

    if (!existingCompetency) {
      res.status(404).json({ message: 'Competency not found' });
      return;
    }

    // Check if competency is used in any activity
    const activityCount = await prisma.activity.count({
      where: { competencyId: id }
    });

    if (activityCount > 0) {
      res.status(400).json({ 
        message: 'Cannot delete competency that is used in activities',
        count: activityCount
      });
      return;
    }

    // Delete competency
    await prisma.competency.delete({
      where: { id }
    });

    res.json({ message: 'Competency deleted successfully' });
  } catch (error) {
    console.error('Delete competency error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

