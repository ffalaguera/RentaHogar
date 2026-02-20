import { Request, Response, NextFunction } from 'express';
import {
  User,
  Property,
  TenantAssignment,
  Notification,
  Payment,
  Invoice,
  Incident,
} from '../models';
import { generateRandomPassword } from '../utils/helpers';
import { sendWelcomeTenantEmail } from '../services/emailService';
import logger from '../utils/logger';

export const registerTenant = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const { fullName, email, phone, gender, propertyId, monthlyRent, room } = req.body;

    const property = await Property.findOne({
      _id: propertyId,
      owner: req.user!._id,
      isActive: true,
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Propiedad no encontrada o no te pertenece.',
      });
    }

    let tenant: any = await User.findOne({ email });
    const plainPassword = generateRandomPassword();
    let isNewUser = false;

    if (tenant) {
      const existingActiveAssignment = await TenantAssignment.findOne({
        tenant: tenant._id,
        property: propertyId,
        isActive: true,
      });

      if (existingActiveAssignment) {
        return res.status(409).json({
          success: false,
          message: 'Este inquilino ya está asignado a esta propiedad.',
        });
      }

      const existingInactiveAssignment = await TenantAssignment.findOne({
        tenant: tenant._id,
        property: propertyId,
        isActive: false,
      });

      if (existingInactiveAssignment) {
        return res.status(409).json({
          success: false,
          message:
            'Este inquilino ya tiene una asignación previa a esta propiedad. Por favor, reactiva la asignación existente o contacta al administrador.',
        });
      }
    } else {
      tenant = await User.create({
        fullName,
        email,
        phone,
        gender,
        password: plainPassword,
        role: 'tenant',
        registeredBy: req.user!._id,
        mustChangePassword: true,
      });
      isNewUser = true;
    }

    let finalMonthlyRent = 0;
    let finalRoom: number | null = null;

    if (property.rentMode === 'rooms') {
      const roomNumber = Number(room);
      if (!Number.isFinite(roomNumber) || roomNumber <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Debes seleccionar una habitación para esta propiedad.',
        });
      }

      const roomIndex = roomNumber - 1;
      const roomRents = Array.isArray(property.roomRents) ? property.roomRents : [];
      const roomRentValue = Number(roomRents[roomIndex] || 0);

      if (!roomRentValue || roomRentValue <= 0) {
        return res.status(400).json({
          success: false,
          message: 'No hay un precio configurado para la habitación seleccionada.',
        });
      }

      const existingRoomAssignment = await TenantAssignment.findOne({
        property: propertyId,
        owner: req.user!._id,
        room: roomNumber,
        isActive: true,
      });

      if (existingRoomAssignment) {
        return res.status(409).json({
          success: false,
          message: 'Esta habitación ya tiene un inquilino activo.',
        });
      }

      finalRoom = roomNumber;
      finalMonthlyRent =
        typeof monthlyRent === 'number' && monthlyRent > 0 ? monthlyRent : roomRentValue;
    } else {
      const activeAssignments = await TenantAssignment.find({
        property: propertyId,
        owner: req.user!._id,
        isActive: true,
      });
      const activeCount = activeAssignments.length;
      const baseRent = Number(property.monthlyRent || 0);
      const autoRent = activeCount >= 0 ? baseRent / (activeCount + 1) : baseRent;
      const rentFromBody = Number(monthlyRent);
      // Aceptar rent del frontend (también si viene como string) o calcular reparto automático
      finalMonthlyRent = rentFromBody > 0 ? rentFromBody : autoRent;
    }

    let assignment: any;
    try {
      assignment = await TenantAssignment.create({
        tenant: tenant._id,
        property: propertyId,
        owner: req.user!._id,
        room: finalRoom,
        monthlyRent: finalMonthlyRent,
      });
    } catch (error: any) {
      if (
        error.name === 'SequelizeUniqueConstraintError' ||
        error.name === 'UniqueConstraintError'
      ) {
        return res.status(409).json({
          success: false,
          message: 'Este inquilino ya está asignado a esta propiedad.',
        });
      }
      throw error;
    }

    // Si la propiedad tiene rentMode 'full', actualizar el alquiler de TODOS los inquilinos activos
    // para que cada uno pague su parte del alquiler total dividido entre todos.
    if (property.rentMode === 'full') {
      const allActiveAssignments = await TenantAssignment.find({
        property: propertyId,
        owner: req.user!._id,
        isActive: true,
      });
      const totalCount = allActiveAssignments.length;
      const baseRent = Number(property.monthlyRent || 0);
      const splitRent = totalCount > 0 ? baseRent / totalCount : baseRent;
      await TenantAssignment.updateMany(
        { property: propertyId, owner: req.user!._id, isActive: true },
        { monthlyRent: splitRent },
      );
    }

    if (isNewUser) {
      await sendWelcomeTenantEmail(
        email,
        fullName,
        req.user!.fullName,
        plainPassword,
        property.name,
      );
    }

    await Notification.create({
      recipient: tenant._id,
      type: 'welcome',
      title: 'Bienvenido a RentaHogar',
      message: `${req.user!.fullName} te ha registrado como inquilino en ${property.name}.`,
      relatedModel: 'Property',
      relatedId: property._id,
    });

    logger.info(`Inquilino registrado: ${email} en propiedad ${property.name}`);

    return res.status(201).json({
      success: true,
      message: isNewUser
        ? 'Inquilino registrado (modo desarrollo: contraseña incluida en la respuesta).'
        : 'Inquilino asignado a la propiedad.',
      data: {
        tenant: {
          id: tenant._id,
          fullName: tenant.fullName,
          email: tenant.email,
          phone: tenant.phone,
          gender: tenant.gender,
        },
        assignment: {
          id: assignment._id,
          property: property.name,
        },
        password: isNewUser ? plainPassword : undefined,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getTenants = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const { search, propertyId } = req.query as any;

    const filter: any = { owner: req.user!._id, isActive: true };
    if (propertyId) filter.property = propertyId;

    const assignments = await TenantAssignment.find(filter)
      .populate('tenant', 'fullName email phone avatar isActive')
      .populate('property', 'name address monthlyRent')
      .sort({ createdAt: -1 });

    // Fallback: si monthlyRent es 0 (datos legacy/seed antiguo), calcular desde la propiedad
    const byProperty = new Map<string, number>();
    for (const a of assignments) {
      const propId = String((a as any).property?._id ?? (a as any).property?.id ?? (a as any).property);
      if (!propId) continue;
      byProperty.set(propId, (byProperty.get(propId) ?? 0) + 1);
    }
    for (const a of assignments) {
      const rent = Number((a as any).monthlyRent);
      if (rent > 0) continue;
      const prop = (a as any).property;
      const propRent = Number(prop?.monthlyRent ?? 0);
      const propId = String(prop?._id ?? prop?.id ?? '');
      const count = byProperty.get(propId) ?? 1;
      (a as any).monthlyRent = propRent > 0 ? propRent / count : 0;
    }

    let results = assignments;

    if (search) {
      const searchLower = String(search).toLowerCase();
      results = assignments.filter(
        (a: any) =>
          a.tenant?.fullName?.toLowerCase().includes(searchLower) ||
          a.tenant?.email?.toLowerCase().includes(searchLower) ||
          a.property?.name?.toLowerCase().includes(searchLower),
      );
    }

    return res.status(200).json({
      success: true,
      data: results,
      total: results.length,
    });
  } catch (error) {
    return next(error);
  }
};

export const getTenantById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const assignment = await TenantAssignment.findOne({
      tenant: req.params.id,
      owner: req.user!._id,
      isActive: true,
    })
      .populate('tenant', 'fullName email phone avatar createdAt')
      .populate('property', 'name address monthlyRent type');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Inquilino no encontrado.',
      });
    }

    return res.status(200).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    return next(error);
  }
};

export const removeTenant = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const { id, propertyId } = req.params;
    const ownerId = req.user!._id || (req.user as any).id;

    const assignment = await TenantAssignment.findOne({
      tenant: id,
      property: propertyId,
      owner: ownerId,
      isActive: true,
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Asignación no encontrada.',
      });
    }

    await Payment.deleteMany({ tenant: id, property: propertyId });
    await Incident.deleteMany({ tenant: id, property: propertyId });
    await Notification.deleteMany({ recipient: id });
    await TenantAssignment.deleteMany({ tenant: id, property: propertyId });

    // Si la propiedad tiene rentMode 'full', actualizar el alquiler de los inquilinos restantes
    const property = await Property.findOne({ _id: propertyId });
    if (property?.rentMode === 'full') {
      const remainingAssignments = await TenantAssignment.find({
        property: propertyId,
        owner: ownerId,
        isActive: true,
      });
      const totalCount = remainingAssignments.length;
      const baseRent = Number(property.monthlyRent || 0);
      const splitRent = totalCount > 0 ? baseRent / totalCount : baseRent;
      if (totalCount > 0) {
        await TenantAssignment.updateMany(
          { property: propertyId, owner: ownerId, isActive: true },
          { monthlyRent: splitRent },
        );
      }
    }

    const otherAssignments = await TenantAssignment.find({ tenant: id });
    if (otherAssignments.length === 0) {
      await User.findByIdAndDelete(id);
      logger.info(`Inquilino eliminado completamente: ${id}`);
    }

    logger.info(`Inquilino eliminado de propiedad ${propertyId}`);

    return res.status(200).json({
      success: true,
      message: 'Inquilino eliminado correctamente.',
    });
  } catch (error) {
    return next(error);
  }
};

export const removeTenantByAssignmentId = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const assignmentId = req.params.assignmentId;
    const ownerId = req.user!._id || (req.user as any).id;

    const assignment: any = await TenantAssignment.findOne({
      _id: assignmentId,
      owner: ownerId,
      isActive: true,
    });

    if (!assignment) {
      return res.status(204).send();
    }

    const tenantId = assignment.tenant;
    const propertyId = assignment.property;

    await Payment.deleteMany({ tenant: tenantId, property: propertyId });
    await Incident.deleteMany({ tenant: tenantId, property: propertyId });
    await Notification.deleteMany({ recipient: tenantId });
    await TenantAssignment.findByIdAndDelete(assignmentId);

    // Si la propiedad tiene rentMode 'full', actualizar el alquiler de los inquilinos restantes
    const property: any = await Property.findOne({ _id: propertyId });
    if (property?.rentMode === 'full') {
      const remainingAssignments = await TenantAssignment.find({
        property: propertyId,
        owner: ownerId,
        isActive: true,
      });
      const totalCount = remainingAssignments.length;
      const baseRent = Number(property.monthlyRent || 0);
      const splitRent = totalCount > 0 ? baseRent / totalCount : baseRent;
      if (totalCount > 0) {
        await TenantAssignment.updateMany(
          { property: propertyId, owner: ownerId, isActive: true },
          { monthlyRent: splitRent },
        );
      }
    }

    const otherAssignments = await TenantAssignment.find({ tenant: tenantId });
    if (otherAssignments.length === 0) {
      await User.findByIdAndDelete(tenantId);
      logger.info(`Inquilino eliminado completamente: ${tenantId}`);
    }

    logger.info(`Inquilino eliminado (assignment ${assignmentId})`);

    return res.status(200).json({
      success: true,
      message: 'Inquilino eliminado correctamente.',
    });
  } catch (error) {
    return next(error);
  }
};
