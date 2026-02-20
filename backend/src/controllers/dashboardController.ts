import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { TenantAssignment, Payment, Invoice, _models } from '../models';

const { TenantAssignmentModel, UserModel, IncidentModel } = _models;

export const getTenantDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const assignment: any = await TenantAssignment.findOne({
      tenant: req.user!._id,
      isActive: true,
    })
      .populate(
        'property',
        'name address monthlyRent type bedrooms bathrooms squareMeters description',
      )
      .populate('owner', 'fullName email phone');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'No tienes una propiedad asignada.',
      });
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const currentPayment: any = await Payment.findOne({
      tenant: req.user!._id,
      property: assignment.property._id,
      month: currentMonth,
      year: currentYear,
    });

    const assignmentStart = assignment.startDate ? new Date(assignment.startDate) : null;
    const allInvoices = await Invoice.find({ property: assignment.property._id });
    const inRange = (inv: any) => {
      if (assignmentStart && inv.issueDate && new Date(inv.issueDate) < assignmentStart) {
        return false;
      }
      const s = inv.periodStart || {};
      const e = inv.periodEnd || {};
      const sm = parseInt(s.month, 10) || 1;
      const sy = parseInt(s.year, 10) || 0;
      const em = parseInt(e.month, 10) || 12;
      const ey = parseInt(e.year, 10) || 9999;
      const startBefore = sy < currentYear || (sy === currentYear && sm <= currentMonth);
      const endAfter = ey > currentYear || (ey === currentYear && em >= currentMonth);
      return startBefore && endAfter;
    };
    const invoices = allInvoices.filter(inRange);

    const tenantCount = await TenantAssignment.countDocuments({
      property: assignment.property._id,
      isActive: true,
    });
    const divisor = Math.max(1, tenantCount);

    const effectiveRent =
      assignment.monthlyRent != null && Number(assignment.monthlyRent) > 0
        ? Number(assignment.monthlyRent)
        : (Number(assignment.property?.monthlyRent) || 0) / divisor;

    const invoicesWithShare = invoices.map((inv: any) => {
      const share = inv.amount / divisor;
      return { ...inv.toObject(), amount: share };
    });
    const totalInvoices = invoicesWithShare.reduce((sum: number, inv: any) => sum + inv.amount, 0);

    let paymentStatus = 'pending';
    let daysOverdue = 0;
    let colorLevel = 'green';

    if (currentPayment) {
      paymentStatus = currentPayment.status;
      if (currentPayment.status !== 'paid' && currentPayment.dueDate < now) {
        daysOverdue = Math.ceil(
          (now.getTime() - new Date(currentPayment.dueDate).getTime()) / (1000 * 60 * 60 * 24),
        );
        if (daysOverdue > 5) colorLevel = 'red';
        else if (daysOverdue > 3) colorLevel = 'yellow';
      }
    }

    const propertyId = (assignment.property as any)?.id ?? (assignment.property as any)?._id;
    const currentUserId = req.user!._id ?? (req.user as any)?.id;

    // Inquilinos que pertenecen a esta propiedad (solo ellos aparecen en compañeros e incidencias)
    const propertyTenantAssignments = await TenantAssignmentModel.findAll({
      where: { property: propertyId, isActive: true },
      attributes: ['tenant'],
    });
    const propertyTenantIds = propertyTenantAssignments.map((a: any) => a.tenant);

    const flatmatesRows = propertyTenantAssignments.filter((a: any) => a.tenant !== currentUserId);

    const flatmateUsers = await Promise.all(
      flatmatesRows.map((row: any) =>
        UserModel.findByPk(row.tenant, { attributes: ['id', 'fullName', 'email', 'phone'] }),
      ),
    );
    const flatmates = flatmateUsers
      .filter(Boolean)
      .map((u: any) => ({
        fullName: u.fullName ?? '',
        email: u.email ?? '',
        phone: u.phone ?? '',
        id: u.id,
      }));

    // Solo incidencias reportadas por inquilinos de esta propiedad
    const incidentRows =
      propertyTenantIds.length > 0
        ? await IncidentModel.findAll({
            where: { property: propertyId, tenant: { [Op.in]: propertyTenantIds } },
            order: [['createdAt', 'DESC']],
            limit: 10,
          })
        : [];

    const incidents = await Promise.all(
      incidentRows.map(async (row: any) => {
        const inc = row.toJSON();
        inc._id = inc.id;
        const tenantUser = await UserModel.findByPk(row.tenant, { attributes: ['fullName'] });
        inc.tenant = tenantUser
          ? { fullName: tenantUser.fullName, id: tenantUser.id, _id: tenantUser.id }
          : null;
        return inc;
      }),
    );

    return res.status(200).json({
      success: true,
      data: {
        owner: assignment.owner,
        property: assignment.property,
        flatmates,
        monthlyRent: effectiveRent,
        invoices: {
          items: invoicesWithShare,
          total: totalInvoices,
        },
        totalMonthly: effectiveRent + totalInvoices,
        paymentStatus: {
          status: paymentStatus,
          daysOverdue,
          colorLevel,
          currentPayment,
        },
        incidents,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getSearchResults = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const { q } = req.query as any;

    if (!q || String(q).length < 2) {
      return res.status(400).json({
        success: false,
        message: 'La búsqueda debe tener al menos 2 caracteres.',
      });
    }

    const regex = new RegExp(String(q), 'i');

    const tenantAssignments: any[] = await TenantAssignment.find({
      owner: req.user!._id,
      isActive: true,
    })
      .populate({
        path: 'tenant',
        match: { $or: [{ fullName: regex }, { email: regex }] },
        select: 'fullName email avatar _id id',
      })
      .populate('property', 'name')
      .limit(10);

    const tenants = tenantAssignments
      .filter((a: any) => a.tenant !== null)
      .map((a: any) => ({
        ...a.tenant.toObject(),
        property: a.property,
      }));

    return res.status(200).json({
      success: true,
      data: {
        properties: [],
        tenants,
      },
    });
  } catch (error) {
    return next(error);
  }
};
