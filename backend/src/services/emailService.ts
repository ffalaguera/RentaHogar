import nodemailer from 'nodemailer';
import logger from '../utils/logger';

const createTransporter = () => {
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendWelcomeTenantEmail = async (
  tenantEmail: string,
  tenantName: string,
  ownerName: string,
  password: string,
  propertyName: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"RentaHogar" <${process.env.SMTP_USER}>`,
      to: tenantEmail,
      subject: '🏠 Bienvenido a RentaHogar - Tus credenciales de acceso',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🏠 RentaHogar</h1>
            <p style="color: rgba(255,255,255,0.9); margin-top: 8px;">Gestión inteligente de alquileres</p>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #333; margin-top: 0;">¡Hola, ${tenantName}!</h2>
            <p style="color: #555; line-height: 1.6;">
              Tu casero/a <strong>${ownerName}</strong> te ha registrado como inquilino/a
              en la propiedad <strong>${propertyName}</strong>.
            </p>
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0 0 8px; color: #333;"><strong>Tus credenciales de acceso:</strong></p>
              <p style="margin: 4px 0; color: #555;">📧 Email: <strong>${tenantEmail}</strong></p>
              <p style="margin: 4px 0; color: #555;">🔑 Contraseña: <strong>${password}</strong></p>
            </div>
            <p style="color: #888; font-size: 13px;">
              Te recomendamos cambiar tu contraseña después del primer inicio de sesión.
            </p>
            <a href="${process.env.FRONTEND_URL}/login" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin-top: 15px; font-weight: 600;">
              Acceder a RentaHogar
            </a>
          </div>
          <div style="background: #eee; padding: 15px 30px; text-align: center;">
            <p style="margin: 0; color: #999; font-size: 12px;">
              Este email fue enviado automáticamente por RentaHogar.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email de bienvenida enviado a ${tenantEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    logger.error(`Error enviando email a ${tenantEmail}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const sendIncidentNotificationEmail = async (
  ownerEmail: string,
  ownerName: string,
  tenantName: string,
  incidentTitle: string,
  propertyName: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"RentaHogar" <${process.env.SMTP_USER}>`,
      to: ownerEmail,
      subject: `⚠️ Nueva incidencia en ${propertyName}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">⚠️ Nueva Incidencia</h1>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #333; margin-top: 0;">Hola, ${ownerName}</h2>
            <p style="color: #555; line-height: 1.6;">
              El inquilino/a <strong>${tenantName}</strong> ha reportado una incidencia
              en <strong>${propertyName}</strong>:
            </p>
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f5576c;">
              <p style="margin: 0; color: #333; font-weight: bold;">${incidentTitle}</p>
            </div>
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600;">
              Ver Incidencia
            </a>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email de incidencia enviado a ${ownerEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    logger.error(`Error enviando email de incidencia: ${error.message}`);
    return { success: false, error: error.message };
  }
};
