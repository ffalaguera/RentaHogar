import { Router } from 'express';
import authRoutes from './authRoutes';
import propertyRoutes from './propertyRoutes';
import tenantRoutes from './tenantRoutes';
import paymentRoutes from './paymentRoutes';
import invoiceRoutes from './invoiceRoutes';
import incidentRoutes from './incidentRoutes';
import notificationRoutes from './notificationRoutes';
import dashboardRoutes from './dashboardRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/tenants', tenantRoutes);
router.use('/payments', paymentRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/incidents', incidentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
