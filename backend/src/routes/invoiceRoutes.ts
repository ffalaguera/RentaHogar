import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { invoiceDocumentUpload } from '../middleware/upload';
import { validateInvoiceUpload } from '../middleware/validateInvoiceUpload';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  markInvoiceAsPaid,
  deleteInvoice,
  getTenantInvoices,
} from '../controllers/invoiceController';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize('owner'),
  invoiceDocumentUpload.single('document'),
  validateInvoiceUpload,
  createInvoice,
);

router.get('/', authorize('owner'), getInvoices);
router.get('/my-invoices', authorize('tenant'), getTenantInvoices);
router.get('/:id', authorize('owner'), getInvoiceById);
router.put('/:id', authorize('owner'), updateInvoice);
router.patch('/:id/pay', authorize('owner'), markInvoiceAsPaid);
router.delete('/:id', authorize('owner'), deleteInvoice);

export default router;
