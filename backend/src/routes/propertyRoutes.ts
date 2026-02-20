import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import validate from '../middleware/validate';
import {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
} from '../controllers/propertyController';

const router = Router();

router.use(authenticate);
router.use(authorize('owner'));

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('El nombre es obligatorio.'),
    body('address.street').trim().notEmpty().withMessage('La calle es obligatoria.'),
    body('address.city').trim().notEmpty().withMessage('La ciudad es obligatoria.'),
    body('address.postalCode').trim().notEmpty().withMessage('El código postal es obligatorio.'),
    body('type')
      .isIn(['apartment', 'house', 'studio', 'room', 'commercial'])
      .withMessage('Tipo de propiedad inválido.'),
    body('monthlyRent')
      .isFloat({ min: 0 })
      .withMessage('El alquiler mensual debe ser un número positivo.'),
    body('rentMode').optional().isIn(['full', 'rooms']).withMessage('Tipo de alquiler inválido.'),
    body('roomRents')
      .optional()
      .isArray()
      .withMessage('Los alquileres por habitación deben ser un array.'),
    body('roomRents.*')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Cada alquiler de habitación debe ser un número positivo.'),
  ],
  validate,
  createProperty,
);

router.get('/', getProperties);
router.get('/:id', getPropertyById);
router.put('/:id', updateProperty);
router.delete('/:id', deleteProperty);

export default router;
