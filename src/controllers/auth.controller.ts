import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import jwt, { Secret } from 'jsonwebtoken';
import config from '../config';
import prisma from '../utils/prisma';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, name, nim } = req.body;

    // Validation
    if (!username || !email || !password || !name) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    // Check if email exists
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (existingEmail) {
      res.status(400).json({ message: 'Email already in use' });
      return;
    }

    // Check if username exists
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUsername) {
      res.status(400).json({ message: 'Username already in use' });
      return;
    }

    // Check if NIM exists (if provided)
    if (nim) {
      const existingNim = await prisma.user.findUnique({
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
    const user = await prisma.user.create({
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
    const user = await prisma.user.findUnique({
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

    const user = await prisma.user.findUnique({
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

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
