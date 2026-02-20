import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import validate from '../middleware/validate';
import {
  createPayment,
  markAsPaid,
  getPayments,
  getOverduePayments,
  getDashboardSummary,
  getTenantPayments,
  deletePayment,
} from '../controllers/paymentController';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize('owner'),
  [
    body('tenantId').notEmpty().withMessage('El inquilino es obligatorio.'),
    body('propertyId').notEmpty().withMessage('La propiedad es obligatoria.'),
    body('amount').isFloat({ min: 0 }).withMessage('El monto debe ser positivo.'),
    body('month').isInt({ min: 1, max: 12 }).withMessage('Mes inválido.'),
    body('year').isInt({ min: 2020 }).withMessage('Año inválido.'),
    body('dueDate').isISO8601().withMessage('Fecha de vencimiento inválida.'),
  ],
  validate,
  createPayment,
);

router.get('/summary', authorize('owner'), getDashboardSummary);
router.get('/overdue', authorize('owner'), getOverduePayments);
router.get('/', authorize('owner'), getPayments);
router.patch('/:id/pay', authorize('owner'), markAsPaid);
router.delete('/:id', authorize('owner'), deletePayment);

router.get('/my-payments', authorize('tenant'), getTenantPayments);

export default router;
