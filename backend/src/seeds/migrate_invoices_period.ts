/**
 * Migración: Añade periodStart y periodEnd a invoices, migra datos desde period y elimina period/dueDate.
 * Ejecutar: npx tsx src/seeds/migrate_invoices_period.ts
 */
import 'dotenv/config';
import { sequelize } from '../config/database';

const sql = `
-- 1. Añadir columnas nuevas (nullable primero para poder migrar)
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "periodStart" jsonb;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "periodEnd" jsonb;

-- 2. Migrar datos: period -> periodStart y periodEnd (copiamos period a ambos)
UPDATE "invoices"
SET "periodStart" = "period",
    "periodEnd" = "period"
WHERE "period" IS NOT NULL AND "periodStart" IS NULL;

-- 3. Para filas sin period (por si acaso), usar valores por defecto
UPDATE "invoices"
SET "periodStart" = '{"month": 1, "year": 2024}'::jsonb,
    "periodEnd" = '{"month": 1, "year": 2024}'::jsonb
WHERE "periodStart" IS NULL;

-- 4. Hacer NOT NULL
ALTER TABLE "invoices" ALTER COLUMN "periodStart" SET NOT NULL;
ALTER TABLE "invoices" ALTER COLUMN "periodEnd" SET NOT NULL;

-- 5. Eliminar columnas antiguas (si existen)
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "period";
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "dueDate";
`;

const run = async (): Promise<void> => {
  try {
    console.log('[migrate] Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('[migrate] Ejecutando migración de invoices (period -> periodStart/periodEnd)...');
    await sequelize.query(sql);
    console.log('[migrate] Migración completada correctamente.');
  } catch (err: any) {
    console.error('[migrate] Error:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

run();
