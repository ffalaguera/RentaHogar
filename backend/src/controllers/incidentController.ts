import { Request, Response, NextFunction } from 'express';
import { Incident, TenantAssignment, Notification, User } from '../models';
import { sendIncidentNotificationEmail } from '../services/emailService';
import logger from '../utils/logger';

export const createIncident = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const { title, description, type, priority } = req.body;

    const assignment: any = await TenantAssignment.findOne({
      tenant: req.user!._id,
      isActive: true,
    }).populate('property', 'name');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'No tienes una propiedad asignada.',
      });
    }

    const incident = await Incident.create({
      tenant: req.user!._id,
      property: assignment.property._id,
      owner: assignment.owner,
      title,
      description,
      type,
      priority: priority || 'medium',
    });

    await Notification.create({
      recipient: assignment.owner,
      type: 'incident',
      title: 'Nueva incidencia reportada',
      message: `${req.user!.fullName} ha reportado: "${title}" en ${assignment.property.name}.`,
      relatedModel: 'Incident',
      relatedId: incident._id,
    });

    const owner: any = await User.findById(assignment.owner);
    if (owner) {
      await sendIncidentNotificationEmail(
        owner.email,
        owner.fullName,
        req.user!.fullName,
        title,
        assignment.property.name,
      );
    }

    logger.info(`Incidencia creada: ${title} por ${req.user!.email}`);

    return res.status(201).json({
      success: true,
      message: 'Incidencia reportada correctamente.',
      data: incident,
    });
  } catch (error) {
    return next(error);
  }
};

export const getIncidents = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const { propertyId, status, type } = req.query as any;
    const filter: any = {};

    if (req.user!.role === 'owner') {
      filter.owner = req.user!._id;
    } else {
      filter.tenant = req.user!._id;
    }

    if (propertyId) filter.property = propertyId;
    if (status) filter.status = status;
    if (type) filter.type = type;

    const incidents = await Incident.find(filter)
      .populate('tenant', 'fullName email avatar')
      .populate('property', 'name address')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: incidents,
      total: incidents.length,
    });
  } catch (error) {
    return next(error);
  }
};

export const getIncidentById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const filter: any = { _id: req.params.id };
    if (req.user!.role === 'owner') {
      filter.owner = req.user!._id;
    } else {
      filter.tenant = req.user!._id;
    }

    const incident = await Incident.findOne(filter)
      .populate('tenant', 'fullName email avatar')
      .populate('property', 'name address');

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incidencia no encontrada.',
      });
    }

    return res.status(200).json({
      success: true,
      data: incident,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateIncidentStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const { status, ownerNotes } = req.body;

    const update: any = { status };
    if (ownerNotes) update.ownerNotes = ownerNotes;
    if (status === 'resolved' || status === 'closed') {
      update.resolvedAt = new Date();
    }

    const updated = await Incident.findOneAndUpdate(
      { _id: req.params.id, owner: req.user!._id },
      update,
    );
    const incident = updated
      ? await Incident.findOne({ _id: updated._id }).populate('property', 'name')
      : null;

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incidencia no encontrada.',
      });
    }

    await Notification.create({
      recipient: incident.tenant,
      type: 'incident',
      title: 'Actualización de incidencia',
      message: `Tu incidencia "${incident.title}" ha cambiado a: ${status}.`,
      relatedModel: 'Incident',
      relatedId: incident._id,
    });

    logger.info(`Incidencia actualizada: ${incident._id} -> ${status}`);

    return res.status(200).json({
      success: true,
      message: 'Estado de incidencia actualizado.',
      data: incident,
    });
  } catch (error) {
    return next(error);
  }
};

export const getPropertyIncidents = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    let filter: any = {};

    if (req.user!.role === 'tenant') {
      const assignment: any = await TenantAssignment.findOne({
        tenant: req.user!._id,
        isActive: true,
      });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'No tienes una propiedad asignada.',
        });
      }

      filter = { property: assignment.property };
    } else {
      filter = { property: req.params.propertyId, owner: req.user!._id };
    }

    const incidents = await Incident.find(filter)
      .populate('tenant', 'fullName avatar')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: incidents,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteIncident = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const incident = await Incident.findOneAndDelete({
      _id: req.params.id,
      owner: req.user!._id,
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incidencia no encontrada.',
      });
    }

    logger.info(`Incidencia eliminada: ${incident._id}`);

    return res.status(200).json({
      success: true,
      message: 'Incidencia eliminada correctamente.',
    });
  } catch (error) {
    return next(error);
  }
};
