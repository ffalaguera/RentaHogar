import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getTenantDashboard, getSearchResults } from '../controllers/dashboardController';

const router = Router();

router.use(authenticate);

router.get('/tenant', authorize('tenant'), getTenantDashboard);
router.get('/search', authorize('owner'), getSearchResults);

export default router;
