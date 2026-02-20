import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import logger from '../utils/logger';

export interface AuthUser {
  id: string;
  _id: string;
  fullName: string;
  email: string;
  role: string;
  isActive?: boolean;
  [key: string]: unknown;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. Token no proporcionado.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token!, process.env.JWT_SECRET!) as { id: string };
    const user = await User.findById(decoded.id);
    if (!user || !(user as AuthUser).isActive) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o usuario desactivado.',
      });
    }

    req.user = user as AuthUser;
    next();
  } catch (error) {
    const err = error as Error;
    logger.error(`Error de autenticación: ${err.message}`);
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado.',
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción.',
      }) as unknown as void;
    }
    next();
  };
};
