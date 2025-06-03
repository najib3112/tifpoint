import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Request, Response } from 'express';
import jwt, { Secret } from 'jsonwebtoken';
import config from '../config';
import prisma from '../utils/prisma';

// Type assertion to fix Prisma TypeScript issues
const db = prisma as any;

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, name, nim } = req.body;

    // Validation
    if (!username || !email || !password || !name) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    // Check if email exists
    const existingEmail = await db.user.findUnique({
      where: { email }
    });

    if (existingEmail) {
      res.status(400).json({ message: 'Email already in use' });
      return;
    }

    // Check if username exists
    const existingUsername = await db.user.findUnique({
      where: { username }
    });

    if (existingUsername) {
      res.status(400).json({ message: 'Username already in use' });
      return;
    }

    // Check if NIM exists (if provided)
    if (nim) {
      const existingNim = await db.user.findUnique({
        where: { nim }
      });

      if (existingNim) {
        res.status(400).json({ message: 'NIM already in use' });
        return;
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await db.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        name,
        nim,
        role: 'MAHASISWA'
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        nim: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'User registered successfully',
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({ message: 'Please provide email and password' });
      return;
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email }
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    // Create JWT payload
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    // Sign token - perbaiki tipe data
const token = jwt.sign(
  payload,
  config.jwtSecret as Secret,
  { expiresIn: config.jwtExpiresIn as any }
);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        nim: user.nim,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Gunakan any untuk mengakses property user yang ditambahkan oleh middleware
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        nim: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // If user is a student, include point statistics
    if (user.role === 'MAHASISWA') {
      const approvedActivities = await db.activity.findMany({
        where: {
          userId,
          status: 'APPROVED'
        },
        select: { point: true }
      });

      const totalPoints = approvedActivities.reduce((sum: number, activity: any) => {
        return sum + (activity.point || 0);
      }, 0);

      const TARGET_POINTS = 36;
      const completionPercentage = Math.min((totalPoints / TARGET_POINTS) * 100, 100);

      res.json({
        ...user,
        statistics: {
          totalPoints,
          targetPoints: TARGET_POINTS,
          completionPercentage: Math.round(completionPercentage * 100) / 100,
          remainingPoints: Math.max(TARGET_POINTS - totalPoints, 0),
          isCompleted: totalPoints >= TARGET_POINTS
        }
      });
    } else {
      res.json(user);
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email }
    });

    if (!user) {
      // For security reasons, don't reveal that the email doesn't exist
      res.status(200).json({ message: 'If your email is registered, you will receive a password reset link' });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token expiry (1 hour from now)
    const resetPasswordExpires = new Date(Date.now() + 3600000);

    // Save token to database
    await db.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken,
        resetPasswordExpires
      }
    });

    // In a real application, you would send an email with the reset link
    // For this example, we'll just return the token
    res.status(200).json({
      message: 'If your email is registered, you will receive a password reset link',
      // In production, remove the token from the response
      resetToken
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ message: 'Token and password are required' });
      return;
    }

    // Hash the token from the URL
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with the token and check if token is still valid
    const user = await db.user.findFirst({
      where: {
        resetPasswordToken,
        resetPasswordExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid or expired token' });
      return;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and clear reset token fields
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

