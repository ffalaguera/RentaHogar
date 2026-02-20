import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'default-secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: userId }, secret, { expiresIn } as jwt.SignOptions);
};

export const generateRandomPassword = (length = 10): string => {
  const charset = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
  let password = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += charset[bytes[i]! % charset.length];
  }
  return password;
};
