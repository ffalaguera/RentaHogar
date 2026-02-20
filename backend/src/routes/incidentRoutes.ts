import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import validate from '../middleware/validate';
import {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
  getPropertyIncidents,
  deleteIncident,
} from '../controllers/incidentController';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize('tenant'),
  [
    body('title').trim().notEmpty().withMessage('El título es obligatorio.'),
    body('description').trim().notEmpty().withMessage('La descripción es obligatoria.'),
    body('type')
      .isIn(['plumbing', 'electrical', 'structural', 'appliance', 'heating', 'pest', 'other'])
      .withMessage('Tipo de incidencia inválido.'),
  ],
  validate,
  createIncident,
);

router.get('/', getIncidents);
router.get('/property/:propertyId', getPropertyIncidents);
router.get('/my-property/all', authorize('tenant'), getPropertyIncidents);
router.get('/:id', getIncidentById);

router.delete('/:id', authorize('owner'), deleteIncident);

router.patch(
  '/:id/status',
  authorize('owner'),
  [
    body('status')
      .isIn(['open', 'in_progress', 'resolved', 'closed'])
      .withMessage('Estado inválido.'),
  ],
  validate,
  updateIncidentStatus,
);

export default router;
