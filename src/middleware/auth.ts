import { Request, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

// Definisikan UserPayload dan RequestWithUser langsung di file ini
export interface UserPayload {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface RequestWithUser extends Request {
  user?: UserPayload;
}

export const auth: RequestHandler = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No token, authorization denied' });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret) as UserPayload;
    
    // Add user from payload to request
    (req as any).user = decoded;
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export const adminOnly: RequestHandler = (req, res, next) => {
  const userReq = req as any;
  if (userReq.user?.role !== 'ADMIN') {
    res.status(403).json({ message: 'Access denied. Admin only.' });
    return;
  }
  next();
};
