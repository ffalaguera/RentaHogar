import 'dotenv/config';
import { sequelize } from '../config/database';

const sql = `
-- Enable pgcrypto for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop tables if exist (reverse order)
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "incidents" CASCADE;
DROP TABLE IF EXISTS "invoices" CASCADE;
DROP TABLE IF EXISTS "payments" CASCADE;
DROP TABLE IF EXISTS "tenant_assignments" CASCADE;
DROP TABLE IF EXISTS "properties" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- Users
CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "fullName" varchar(100) NOT NULL,
  "email" varchar(255) NOT NULL UNIQUE,
  "password" varchar(255) NOT NULL,
  "role" varchar(10) NOT NULL DEFAULT 'owner',
  "phone" varchar(30),
  "avatar" text,
  "registeredBy" uuid,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_role_check CHECK ("role" IN ('owner','tenant')),
  CONSTRAINT fk_users_registered_by FOREIGN KEY ("registeredBy") REFERENCES "users"("id") ON DELETE SET NULL
);

-- Properties
CREATE TABLE "properties" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner" uuid NOT NULL,
  "name" varchar(150) NOT NULL,
  "address" jsonb NOT NULL,
  "type" varchar(20) NOT NULL,
  "monthlyRent" numeric(12,2) NOT NULL,
  "rentMode" varchar(20) NOT NULL DEFAULT 'full',
  "roomRents" jsonb,
  "bedrooms" integer DEFAULT 1,
  "bathrooms" integer DEFAULT 1,
  "squareMeters" numeric(8,2) DEFAULT 0,
  "description" text,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT properties_type_check CHECK ("type" IN ('apartment','house','studio','room','commercial')),
  CONSTRAINT fk_properties_owner FOREIGN KEY ("owner") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Tenant assignments
CREATE TABLE "tenant_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant" uuid NOT NULL,
  "property" uuid NOT NULL,
  "owner" uuid NOT NULL,
  "room" integer,
  "monthlyRent" numeric(12,2) NOT NULL DEFAULT 0,
  "startDate" timestamptz NOT NULL DEFAULT now(),
  "endDate" timestamptz,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_ta_tenant FOREIGN KEY ("tenant") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT fk_ta_property FOREIGN KEY ("property") REFERENCES "properties"("id") ON DELETE CASCADE,
  CONSTRAINT fk_ta_owner FOREIGN KEY ("owner") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT tenant_property_unique UNIQUE ("tenant", "property")
);

-- Payments
CREATE TABLE "payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant" uuid NOT NULL,
  "property" uuid NOT NULL,
  "owner" uuid NOT NULL,
  "amount" numeric(12,2) NOT NULL CHECK ("amount" >= 0),
  "month" smallint NOT NULL CHECK ("month" >= 1 AND "month" <= 12),
  "year" integer NOT NULL,
  "dueDate" timestamptz NOT NULL,
  "paidDate" timestamptz,
  "status" varchar(10) NOT NULL DEFAULT 'pending',
  "paymentMethod" varchar(20) NOT NULL DEFAULT 'transfer',
  "notes" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payments_status_check CHECK ("status" IN ('pending','paid','overdue')),
  CONSTRAINT payments_method_check CHECK ("paymentMethod" IN ('transfer','cash','card','bizum','other')),
  CONSTRAINT fk_payments_tenant FOREIGN KEY ("tenant") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT fk_payments_property FOREIGN KEY ("property") REFERENCES "properties"("id") ON DELETE CASCADE,
  CONSTRAINT fk_payments_owner FOREIGN KEY ("owner") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Invoices
CREATE TABLE "invoices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "property" uuid NOT NULL,
  "owner" uuid NOT NULL,
  "type" varchar(30) NOT NULL,
  "amount" numeric(12,2) NOT NULL CHECK ("amount" >= 0),
  "periodStart" jsonb NOT NULL,
  "periodEnd" jsonb NOT NULL,
  "issueDate" timestamptz NOT NULL DEFAULT now(),
  "isPaid" boolean NOT NULL DEFAULT false,
  "paidDate" timestamptz,
  "reference" varchar(255),
  "documentUrl" varchar(500),
  "notes" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_invoices_property FOREIGN KEY ("property") REFERENCES "properties"("id") ON DELETE CASCADE,
  CONSTRAINT fk_invoices_owner FOREIGN KEY ("owner") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Incidents
CREATE TABLE "incidents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant" uuid NOT NULL,
  "property" uuid NOT NULL,
  "owner" uuid NOT NULL,
  "title" varchar(200) NOT NULL,
  "description" text NOT NULL,
  "type" varchar(30) NOT NULL,
  "priority" varchar(10) NOT NULL DEFAULT 'medium',
  "status" varchar(20) NOT NULL DEFAULT 'open',
  "resolvedAt" timestamptz,
  "ownerNotes" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT incidents_priority_check CHECK ("priority" IN ('low','medium','high','urgent')),
  CONSTRAINT incidents_status_check CHECK ("status" IN ('open','in_progress','resolved','closed')),
  CONSTRAINT fk_incidents_tenant FOREIGN KEY ("tenant") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT fk_incidents_property FOREIGN KEY ("property") REFERENCES "properties"("id") ON DELETE CASCADE,
  CONSTRAINT fk_incidents_owner FOREIGN KEY ("owner") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Notifications
CREATE TABLE "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "recipient" uuid NOT NULL,
  "type" varchar(20) NOT NULL,
  "title" varchar(255) NOT NULL,
  "message" text NOT NULL,
  "relatedModel" varchar(50),
  "relatedId" uuid,
  "isRead" boolean NOT NULL DEFAULT false,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_notifications_recipient FOREIGN KEY ("recipient") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_tenant_month_year ON "payments" ("tenant", "month", "year");
CREATE INDEX IF NOT EXISTS idx_payments_property_status ON "payments" ("property", "status");
CREATE INDEX IF NOT EXISTS idx_invoices_property_type ON "invoices" ("property", "type");
CREATE INDEX IF NOT EXISTS idx_incidents_property_status ON "incidents" ("property", "status");
CREATE INDEX IF NOT EXISTS idx_incidents_tenant_status ON "incidents" ("tenant", "status");
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_isread_createdat ON "notifications" ("recipient", "isRead", "createdAt" DESC);
`;

const run = async (): Promise<void> => {
  try {
    console.log('[schema] conectando...');
    await sequelize.authenticate();
    console.log('[schema] ejecutando DDL...');
    await sequelize.query(sql);
    console.log('[schema] esquema recreado correctamente.');
    process.exit(0);
  } catch (err: any) {
    console.error('[schema] error:', err.message || err);
    process.exit(1);
  }
};

run();
