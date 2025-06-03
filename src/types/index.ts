import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export interface UserPayload extends JwtPayload {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'MAHASISWA';
}

export interface RequestWithUser extends Request {
  user?: UserPayload;
}

