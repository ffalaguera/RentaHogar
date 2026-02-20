import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import {
  User,
  Property,
  TenantAssignment,
  Payment,
  Invoice,
  Incident,
  Notification,
} from '../models';
import { generateToken } from '../utils/helpers';
import logger from '../utils/logger';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const { fullName, email, password, phone, gender } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un usuario con ese email.',
      });
    }
    const user = await User.create({
      fullName,
      email,
      password,
      phone,
      gender: gender || null,
      role: 'owner',
    });
    const token = generateToken(user._id);
    logger.info(`Nuevo propietario registrado: ${email}`);
    return res.status(201).json({
      success: true,
      message: 'Registro exitoso.',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          phone: user.phone,
          gender: user.gender || null,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const { email, password } = req.body;
    const user = (await User.findOne({ email, isActive: true }).select('+password')) as any;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No existe ninguna cuenta con ese correo. Regístrate primero o revisa el email.',
      });
    }
    if (typeof user.comparePassword !== 'function') {
      logger.error(`Login: usuario ${email} sin método comparePassword`);
      return res
        .status(500)
        .json({ success: false, message: 'Error interno en la autenticación. Intenta de nuevo.' });
    }
    let isMatch = false;
    try {
      isMatch = await user.comparePassword(password);
    } catch (err) {
      logger.error(`Login comparePassword error: ${(err as Error).message}`);
      return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
    }
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
    }
    const token = generateToken(user._id);
    logger.info(`Inicio de sesión: ${email} (${user.role})`);
    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          gender: user.gender || null,
          mustChangePassword: !!user.mustChangePassword,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const user = await User.findById(req.user!._id);
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const { fullName, phone, avatar } = req.body;
    const updates: Record<string, any> = {};
    if (fullName) updates.fullName = fullName;
    if (phone !== undefined) updates.phone = phone;
    if (avatar !== undefined) updates.avatar = avatar;
    const user = await User.findByIdAndUpdate(req.user!._id, updates);
    return res.status(200).json({ success: true, message: 'Perfil actualizado.', data: user });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = (await User.findById(req.user!._id).select('+password')) as any;
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: 'La contraseña actual es incorrecta.' });
    }
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await User.findByIdAndUpdate(user._id, { password: hashedPassword, mustChangePassword: false });
    logger.info(`Contraseña cambiada: ${user.email}`);
    return res
      .status(200)
      .json({
        success: true,
        message: 'Contraseña actualizada correctamente.',
        data: { mustChangePassword: false },
      });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const ownerId = req.user!._id;
    const role = (req.user as any)?.role;

    if (role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Solo los propietarios pueden eliminar su cuenta desde aquí.',
      });
    }

    const assignments = await TenantAssignment.find({ owner: ownerId });
    const tenantIds = [...new Set(assignments.map((a: any) => String(a.tenant)))];

    await Payment.deleteMany({ owner: ownerId });
    await Incident.deleteMany({ owner: ownerId });
    await Invoice.deleteMany({ owner: ownerId });
    if (tenantIds.length > 0) {
      await Notification.deleteMany({ recipient: { $in: tenantIds } });
    }
    await TenantAssignment.deleteMany({ owner: ownerId });

    for (const tid of tenantIds) {
      const other = await TenantAssignment.find({ tenant: tid });
      if (other.length === 0) {
        await User.findByIdAndDelete(String(tid));
      }
    }

    await Property.deleteMany({ owner: ownerId });
    await User.findByIdAndDelete(String(ownerId));

    logger.info(`Cuenta de propietario eliminada: ${ownerId}`);
    return res.status(200).json({ success: true, message: 'Cuenta eliminada correctamente.' });
  } catch (error) {
    next(error);
  }
};
