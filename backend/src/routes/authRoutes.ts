import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import validate from '../middleware/validate';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} from '../controllers/authController';

const router = Router();

router.post(
  '/register',
  [
    body('fullName').trim().notEmpty().withMessage('El nombre es obligatorio.'),
    body('email').isEmail().withMessage('Email inválido.').normalizeEmail(),
    body('gender').optional().isIn(['male', 'female']).withMessage('Género no válido.'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('La contraseña debe tener al menos 6 caracteres.'),
  ],
  validate,
  register,
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido.').normalizeEmail(),
    body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
  ],
  validate,
  login,
);

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('La contraseña actual es obligatoria.'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('La nueva contraseña debe tener al menos 6 caracteres.'),
  ],
  validate,
  changePassword,
);

router.delete('/account', authenticate, deleteAccount);

export default router;
