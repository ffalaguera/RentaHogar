import { Request, Response, NextFunction } from 'express';
import { Payment, Notification, TenantAssignment, Property } from '../models';
import logger from '../utils/logger';

export const createPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const { tenantId, propertyId, amount, month, year, dueDate, paymentMethod, notes } = req.body;

    const assignment = await TenantAssignment.findOne({
      tenant: tenantId,
      property: propertyId,
      owner: req.user!._id,
      isActive: true,
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'El inquilino no está asignado a esta propiedad.',
      });
    }

    const existingPayment = await Payment.findOne({
      tenant: tenantId,
      property: propertyId,
      month,
      year,
    });

    if (existingPayment) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un registro de pago para este mes.',
      });
    }

    const payment = await Payment.create({
      tenant: tenantId,
      property: propertyId,
      owner: req.user!._id,
      amount,
      month,
      year,
      dueDate: new Date(dueDate),
      paymentMethod,
      notes,
    });

    logger.info(`Pago creado: ${tenantId} - ${month}/${year} - ${amount}€`);

    return res.status(201).json({
      success: true,
      message: 'Pago registrado.',
      data: payment,
    });
  } catch (error) {
    return next(error);
  }
};

export const markAsPaid = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const payment: any = await Payment.findOne({
      _id: req.params.id,
      owner: req.user!._id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado.',
      });
    }

    if (payment.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Este pago ya está marcado como cobrado.',
      });
    }

    payment.status = 'paid';
    payment.paidDate = new Date();
    if (req.body.paymentMethod) payment.paymentMethod = req.body.paymentMethod;
    await payment.save();

    await Notification.create({
      recipient: req.user!._id,
      type: 'payment',
      title: 'Pago recibido',
      message: `Pago de ${payment.amount}€ registrado para ${payment.month}/${payment.year}.`,
      relatedModel: 'Payment',
      relatedId: payment._id,
    });

    logger.info(`Pago marcado como pagado: ${payment._id}`);

    return res.status(200).json({
      success: true,
      message: 'Pago actualizado como pagado.',
      data: payment,
    });
  } catch (error) {
    return next(error);
  }
};

export const getPayments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const { propertyId, tenantId, status, month, year } = req.query as any;
    const filter: any = { owner: req.user!._id };

    if (propertyId) filter.property = propertyId;
    if (tenantId) filter.tenant = tenantId;
    if (status) filter.status = status;
    if (month) filter.month = parseInt(month, 10);
    if (year) filter.year = parseInt(year, 10);

    const now = new Date();
    await Payment.updateMany(
      {
        owner: req.user!._id,
        status: 'pending',
        dueDate: { $lt: now },
      },
      { status: 'overdue' },
    );

    let payments = await Payment.find(filter)
      .populate('tenant', 'fullName email avatar')
      .populate('property', 'name address')
      .sort({ year: -1, month: -1 });

    const hasSpecificMonthFilter = month && year;
    const isFilteringPaidOnly = status === 'paid';

    if (!hasSpecificMonthFilter && !isFilteringPaidOnly) {
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      payments = payments.filter(
        (p: any) =>
          p.status !== 'paid' ||
          p.year > currentYear ||
          (p.year === currentYear && p.month >= currentMonth),
      );
    }

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.status(200).json({
      success: true,
      data: payments,
      total: payments.length,
    });
  } catch (error) {
    return next(error);
  }
};

export const getOverduePayments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const now = new Date();
    const payments = await Payment.find({
      owner: req.user!._id,
      dueDate: { $lt: now },
      $or: [{ status: 'pending' }, { status: 'overdue' }],
    })
      .populate('tenant', 'fullName email avatar')
      .populate('property', 'name')
      .sort({ dueDate: 1 });

    const overdueWithDays = payments.map((payment: any) => {
      const due = new Date(payment.dueDate);
      const diffDays = Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

      let colorLevel = 'green';
      if (diffDays > 5) colorLevel = 'red';
      else if (diffDays > 3) colorLevel = 'yellow';

      return {
        ...payment.toObject(),
        daysOverdue: diffDays,
        colorLevel,
      };
    });

    return res.status(200).json({
      success: true,
      data: overdueWithDays,
    });
  } catch (error) {
    return next(error);
  }
};

export const getDashboardSummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const assignments = await TenantAssignment.find({
      owner: req.user!._id,
      isActive: true,
    }).populate('property', 'name monthlyRent');

    // Fallback: si monthlyRent es 0 (datos legacy/seed antiguo), usar propiedad repartida
    const byProperty = new Map<string, number>();
    for (const a of assignments) {
      const propId = String((a as any).property?._id ?? (a as any).property?.id ?? (a as any).property ?? '');
      if (propId) byProperty.set(propId, (byProperty.get(propId) ?? 0) + 1);
    }
    let monthlyRentTotal = 0;
    for (const a of assignments) {
      const rent = Number((a as any).monthlyRent);
      if (rent > 0) {
        monthlyRentTotal += rent;
      } else {
        const prop = (a as any).property;
        const propRent = Number(prop?.monthlyRent ?? 0);
        const propId = String(prop?._id ?? prop?.id ?? '');
        const count = byProperty.get(propId) ?? 1;
        monthlyRentTotal += propRent > 0 ? propRent / count : 0;
      }
    }
    const annualExpectedRent = monthlyRentTotal * 12;

    const allPayments = await Payment.find({
      owner: req.user!._id,
      year: currentYear,
    });

    const monthlyPayments = allPayments.filter((p: any) => p.month === currentMonth);

    const paidThisMonth = monthlyPayments
      .filter((p: any) => p.status === 'paid')
      .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

    const pendingThisMonth = Math.max(0, monthlyRentTotal - paidThisMonth);

    const paidThisYear = allPayments
      .filter((p: any) => p.status === 'paid')
      .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        currentMonth: {
          totalRent: monthlyRentTotal,
          paid: paidThisMonth,
          pending: pendingThisMonth,
        },
        currentYear: {
          totalRent: annualExpectedRent,
          paid: paidThisYear,
          pending: annualExpectedRent - paidThisYear,
        },
        month: currentMonth,
        year: currentYear,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getTenantPayments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const assignment = await TenantAssignment.findOne({
      tenant: req.user!._id,
      isActive: true,
    }).populate('property', 'name monthlyRent');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'No tienes una propiedad asignada.',
      });
    }

    const payments = await Payment.find({
      tenant: req.user!._id,
      property: (assignment as any).property._id,
    })
      .populate('property', 'name monthlyRent')
      .sort({ year: -1, month: -1 });

    return res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    return next(error);
  }
};

export const deletePayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const payment = await Payment.findOneAndDelete({
      _id: req.params.id,
      owner: req.user!._id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado.',
      });
    }

    logger.info(`Pago eliminado: ${payment._id}`);

    return res.status(200).json({
      success: true,
      message: 'Pago eliminado.',
    });
  } catch (error) {
    return next(error);
  }
};
