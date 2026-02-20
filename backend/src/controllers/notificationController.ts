import { Request, Response, NextFunction } from 'express';
import { Notification } from '../models';

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const { unreadOnly } = req.query as any;
    const filter: any = { recipient: req.user!._id };

    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user!._id,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    return next(error);
  }
};

export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user!._id },
      { isRead: true },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada.',
      });
    }

    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    return next(error);
  }
};

export const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    await Notification.updateMany({ recipient: req.user!._id, isRead: false }, { isRead: true });

    return res.status(200).json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas.',
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteNotification = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user!._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notificación eliminada.',
    });
  } catch (error) {
    return next(error);
  }
};
