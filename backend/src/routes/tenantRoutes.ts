import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import validate from '../middleware/validate';
import {
  registerTenant,
  getTenants,
  getTenantById,
  removeTenant,
  removeTenantByAssignmentId,
} from '../controllers/tenantController';

const router = Router();

router.use(authenticate);
router.use(authorize('owner'));

router.post(
  '/',
  [
    body('fullName').trim().notEmpty().withMessage('El nombre completo es obligatorio.'),
    body('email').isEmail().withMessage('Email inválido.').normalizeEmail(),
    body('propertyId').notEmpty().withMessage('La propiedad es obligatoria.'),
  ],
  validate,
  registerTenant,
);

router.get('/', getTenants);
router.get('/:id', getTenantById);
router.delete('/assignment/:assignmentId', removeTenantByAssignmentId);
router.delete('/:id/property/:propertyId', removeTenant);

export default router;
