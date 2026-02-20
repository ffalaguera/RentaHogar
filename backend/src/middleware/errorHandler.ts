import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface ValidationError extends Error {
  errors?: { message?: string }[];
}

interface MongoError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

interface CastError extends Error {
  value?: unknown;
}

const errorHandler = (
  err: ValidationError & MongoError & CastError & { statusCode?: number },
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response => {
  logger.error(`${err.name}: ${err.message}`, { stack: err.stack });

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((e) => e?.message);
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: messages,
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return res.status(409).json({
      success: false,
      message: `El valor del campo '${field}' ya existe.`,
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `ID inválido: ${err.value}`,
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expirado.',
    });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Error interno del servidor.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFound = (req: Request, res: Response): Response => {
  return res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
};

export { errorHandler };
