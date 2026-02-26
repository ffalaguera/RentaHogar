import { Sequelize } from 'sequelize';
import logger from '../utils/logger';

// Soporta DATABASE_URL (Neon, Supabase, Render) o variables individuales
const connectionUri =
  process.env.DATABASE_URL ||
  `postgres://${encodeURIComponent(process.env.DB_USER || 'postgres')}:${encodeURIComponent(
    process.env.DB_PASS || '',
  )}@${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'rental_management'}`;

const isCloudDb = !!process.env.DATABASE_URL;

export const sequelize = new Sequelize(connectionUri, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: isCloudDb
    ? {
        ssl: {
          rejectUnauthorized: false, // Render/Neon usan certificados autofirmados
        },
      }
    : {},
});

export const connectDB = async (): Promise<void> => {
  try {
    console.log('[DB] connecting to', process.env.DB_HOST || 'DATABASE_URL', process.env.DB_PORT || '');
    await sequelize.authenticate();
    await sequelize.sync();
    await sequelize
      .query(
        `
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
    `,
      )
      .catch(() => {});
    await sequelize
      .query(
        `
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "gender" VARCHAR(10) DEFAULT NULL;
    `,
      )
      .catch(() => {});
    logger.info(
      `Postgres conectado: ${process.env.DATABASE_URL ? 'DATABASE_URL' : `${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 5432}`}`,
    );
  } catch (error: any) {
    logger.error(`Error de conexión a Postgres: ${error.message}`);
    process.exit(1);
  }
};
