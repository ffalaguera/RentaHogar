import { Request, Response, NextFunction } from 'express';

interface InvoiceFormData {
  propertyId: string;
  type: string;
  amount: number;
  periodStart?: { month: number; year: number };
  periodEnd?: { month: number; year: number };
  monthStart?: number;
  yearStart?: number;
  monthEnd?: number;
  yearEnd?: number;
  reference?: string;
  notes?: string;
}

const VALID_TYPES = ['water', 'gas', 'electricity', 'internet', 'community', 'insurance', 'other'];

export const validateInvoiceUpload = (
  req: Request,
  res: Response,
  next: NextFunction,
): void | Response => {
  let data: InvoiceFormData;

  if (req.body?.data) {
    try {
      data = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
    } catch {
      return res.status(400).json({ success: false, message: 'Datos de factura inválidos.' });
    }
  } else {
    data = req.body as InvoiceFormData;
  }

  const errors: { field: string; message: string }[] = [];
  if (!data.propertyId?.trim())
    errors.push({ field: 'propertyId', message: 'La propiedad es obligatoria.' });
  if (!VALID_TYPES.includes(data.type))
    errors.push({ field: 'type', message: 'Tipo de factura inválido.' });
  const amount = parseFloat(String(data.amount));
  if (isNaN(amount) || amount < 0)
    errors.push({ field: 'amount', message: 'El monto debe ser positivo.' });
  const startMonth = parseInt(String(data.periodStart?.month ?? data.monthStart), 10);
  const startYear = parseInt(String(data.periodStart?.year ?? data.yearStart), 10);
  const endMonth = parseInt(String(data.periodEnd?.month ?? data.monthEnd), 10);
  const endYear = parseInt(String(data.periodEnd?.year ?? data.yearEnd), 10);
  if (isNaN(startMonth) || startMonth < 1 || startMonth > 12)
    errors.push({ field: 'periodStart.month', message: 'Mes inicio inválido.' });
  if (isNaN(startYear) || startYear < 2020)
    errors.push({ field: 'periodStart.year', message: 'Año inicio inválido.' });
  if (isNaN(endMonth) || endMonth < 1 || endMonth > 12)
    errors.push({ field: 'periodEnd.month', message: 'Mes fin inválido.' });
  if (isNaN(endYear) || endYear < 2020)
    errors.push({ field: 'periodEnd.year', message: 'Año fin inválido.' });
  if (endYear < startYear || (endYear === startYear && endMonth < startMonth)) {
    errors.push({
      field: 'periodEnd',
      message: 'El periodo fin debe ser igual o posterior al inicio.',
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Error de validación.', errors });
  }

  (req as any).invoiceData = {
    ...data,
    amount,
    periodStart: { month: startMonth, year: startYear },
    periodEnd: { month: endMonth, year: endYear },
  };
  next();
};
