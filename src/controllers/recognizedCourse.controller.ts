import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAllRecognizedCourses = async (req: Request, res: Response) => {
  try {
    const courses = await prisma.recognizedCourse.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    res.json(courses);
  } catch (error) {
    console.error('Get all recognized courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRecognizedCourseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const course = await prisma.recognizedCourse.findUnique({
      where: { id }
    });

    if (!course) {
      res.status(404).json({ message: 'Recognized course not found' });
      return;
    }

    res.json(course);
  } catch (error) {
    console.error('Get recognized course by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createRecognizedCourse = async (req: Request, res: Response) => {
  try {
    const { name, provider, duration, pointValue, url } = req.body;

    // Validation
    if (!name || !provider || duration === undefined || pointValue === undefined) {
      res.status(400).json({ message: 'Required fields are missing' });
      return;
    }

    // Create course
    const course = await prisma.recognizedCourse.create({
      data: {
        name,
        provider,
        duration,
        pointValue,
        url
      }
    });

    res.status(201).json({
      message: 'Recognized course created successfully',
      course
    });
  } catch (error) {
    console.error('Create recognized course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateRecognizedCourse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, provider, duration, pointValue, url } = req.body;

    // Check if course exists
    const existingCourse = await prisma.recognizedCourse.findUnique({
      where: { id }
    });

    if (!existingCourse) {
      res.status(404).json({ message: 'Recognized course not found' });
      return;
    }

    // Update course
    const updatedCourse = await prisma.recognizedCourse.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        provider: provider !== undefined ? provider : undefined,
        duration: duration !== undefined ? duration : undefined,
        pointValue: pointValue !== undefined ? pointValue : undefined,
        url: url !== undefined ? url : undefined
      }
    });

    res.json({
      message: 'Recognized course updated successfully',
      course: updatedCourse
    });
  } catch (error) {
    console.error('Update recognized course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteRecognizedCourse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if course exists
    const existingCourse = await prisma.recognizedCourse.findUnique({
      where: { id }
    });

    if (!existingCourse) {
      res.status(404).json({ message: 'Recognized course not found' });
      return;
    }

    // Delete course
    await prisma.recognizedCourse.delete({
      where: { id }
    });

    res.json({ message: 'Recognized course deleted successfully' });
  } catch (error) {
    console.error('Delete recognized course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
