import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const validate = (req: Request, res: Response, next: NextFunction): void | Response => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación.',
      errors: errors.array().map((err) => ({
        field: (err as { path?: string }).path,
        message: (err as { msg?: string }).msg,
      })),
    });
  }
  next();
};

export default validate;
