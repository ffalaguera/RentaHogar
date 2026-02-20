import { Request, Response, NextFunction } from 'express';
import { Invoice, Property, TenantAssignment } from '../models';
import logger from '../utils/logger';

export const createInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const { propertyId, type, amount, periodStart, periodEnd, reference, notes } =
      (req as any).invoiceData || req.body;
    const documentUrl = (req as any).file
      ? `/uploads/invoices/${(req as any).file.filename}`
      : null;

    const property = await Property.findOne({
      _id: propertyId,
      owner: req.user!._id,
      isActive: true,
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Propiedad no encontrada.',
      });
    }

    const invoice = await Invoice.create({
      property: propertyId,
      owner: req.user!._id,
      type,
      amount,
      periodStart,
      periodEnd,
      reference: reference || '',
      documentUrl,
      notes,
    });

    logger.info(`Factura creada: ${type} - ${amount}€ para ${property.name}`);

    return res.status(201).json({
      success: true,
      message: 'Factura registrada.',
      data: invoice,
    });
  } catch (error) {
    return next(error);
  }
};

export const getInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const { propertyId, type, isPaid, month, year } = req.query as any;
    const filter: any = { owner: req.user!._id };

    if (propertyId) filter.property = propertyId;
    if (type) filter.type = type;
    if (isPaid !== undefined) filter.isPaid = isPaid === 'true';
    if (month) filter['periodStart.month'] = parseInt(month, 10);
    if (year) filter['periodStart.year'] = parseInt(year, 10);

    const invoices = await Invoice.find(filter)
      .populate('property', 'name address')
      .sort({ 'periodStart.year': -1, 'periodStart.month': -1 });

    return res.status(200).json({
      success: true,
      data: invoices,
      total: invoices.length,
    });
  } catch (error) {
    return next(error);
  }
};

export const getInvoiceById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      owner: req.user!._id,
    }).populate('property', 'name address');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada.',
      });
    }

    return res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, owner: req.user!._id },
      req.body,
      { new: true, runValidators: true },
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Factura actualizada.',
      data: invoice,
    });
  } catch (error) {
    return next(error);
  }
};

export const markInvoiceAsPaid = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, owner: req.user!._id },
      { isPaid: true, paidDate: new Date() },
      { new: true },
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada.',
      });
    }

    logger.info(`Factura pagada: ${invoice._id}`);

    return res.status(200).json({
      success: true,
      message: 'Factura marcada como pagada.',
      data: invoice,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const invoice = await Invoice.findOneAndDelete({
      _id: req.params.id,
      owner: req.user!._id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada.',
      });
    }

    logger.info(`Factura eliminada: ${invoice._id}`);

    return res.status(200).json({
      success: true,
      message: 'Factura eliminada.',
    });
  } catch (error) {
    return next(error);
  }
};

export const getTenantInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const assignment = await TenantAssignment.findOne({
      tenant: req.user!._id,
      isActive: true,
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'No tienes una propiedad asignada.',
      });
    }

    const invoices = await Invoice.find({
      property: (assignment as any).property,
    })
      .populate('property', 'name')
      .sort({ 'periodStart.year': -1, 'periodStart.month': -1 });

    const tenantCount = await TenantAssignment.countDocuments({
      property: (assignment as any).property,
      isActive: true,
    });
    const divisor = Math.max(1, tenantCount);

    const invoicesWithShare = invoices.map((inv: any) => {
      const share = inv.amount / divisor;
      return { ...inv.toObject(), amount: share };
    });

    return res.status(200).json({
      success: true,
      data: invoicesWithShare,
    });
  } catch (error) {
    return next(error);
  }
};
