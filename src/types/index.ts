import { Role } from '@prisma/client';
import { Request } from 'express';

export interface UserPayload {
  id: string;
  username: string;
  email: string;
  role: Role;
}

// Perbaiki: gunakan extends Request dengan benar
export interface RequestWithUser extends Request {
  user?: UserPayload;
}