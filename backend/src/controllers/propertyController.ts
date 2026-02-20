import { Request, Response, NextFunction } from 'express';
import { Property, TenantAssignment } from '../models';
import logger from '../utils/logger';

export const createProperty = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const property = await Property.create({
      ...req.body,
      owner: req.user!._id,
    });

    logger.info(`Propiedad creada: ${property.name} por ${req.user!.email}`);

    return res.status(201).json({
      success: true,
      message: 'Propiedad creada exitosamente.',
      data: property,
    });
  } catch (error) {
    return next(error);
  }
};

export const getProperties = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const { search, type, page = 1, limit = 10 } = req.query as any;
    const filter: any = { owner: req.user!._id, isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'address.street': { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
      ];
    }

    if (type) {
      filter.type = type;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [properties, total] = await Promise.all([
      Property.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)),
      Property.countDocuments(filter),
    ]);

    const propertiesWithTenants = await Promise.all(
      (properties as any[]).map(async (property: any) => {
        const assignments = await TenantAssignment.find({
          property: property._id,
          isActive: true,
        }).populate('tenant');

        let displayMonthlyRent = property.monthlyRent;
        if (property.rentMode === 'rooms' && assignments.length > 0) {
          displayMonthlyRent = assignments.reduce(
            (sum: number, a: any) => sum + (a.monthlyRent || 0),
            0,
          );
        }

        return {
          ...property.toObject(),
          tenants: (assignments || []).map((a: any) => a.tenant).filter(Boolean),
          tenantCount: (assignments || []).length,
          currentMonthlyRent: displayMonthlyRent,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      data: propertiesWithTenants,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getPropertyById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      owner: req.user!._id,
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Propiedad no encontrada.',
      });
    }

    const assignments = await TenantAssignment.find({
      property: property._id,
      isActive: true,
    }).populate('tenant', 'fullName email phone avatar');

    return res.status(200).json({
      success: true,
      data: {
        ...property.toObject(),
        tenants: assignments.map((a: any) => a.tenant),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateProperty = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const property = await Property.findOneAndUpdate(
      { _id: req.params.id, owner: req.user!._id },
      req.body,
      { new: true, runValidators: true },
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Propiedad no encontrada.',
      });
    }

    logger.info(`Propiedad actualizada: ${property.name}`);

    return res.status(200).json({
      success: true,
      message: 'Propiedad actualizada.',
      data: property,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteProperty = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const property = await Property.findOneAndUpdate(
      { _id: req.params.id, owner: req.user!._id },
      { isActive: false },
      { new: true },
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Propiedad no encontrada.',
      });
    }

    await TenantAssignment.updateMany({ property: property._id }, { isActive: false });

    logger.info(`Propiedad desactivada: ${property.name}`);

    return res.status(200).json({
      success: true,
      message: 'Propiedad eliminada correctamente.',
    });
  } catch (error) {
    return next(error);
  }
};
