import { test, expect } from '@playwright/test';

/**
 * Prueba E2E: Verificar que propietario e inquilino ven el mismo detalle de factura.
 * Requiere backend en http://localhost:3000 con datos de seed (npm run seed).
 * Credenciales seed: carlos@demo.com/123456 (owner), ana@demo.com/123456 (tenant).
 */
test.describe('Detalle factura: propietario vs inquilino', () => {
  const owner = { email: 'carlos@demo.com', password: '123456' };
  const tenant = { email: 'ana@demo.com', password: '123456' };

  test('propietario e inquilino ven el mismo detalle de factura', async ({ page }) => {
    // —— 1) Login como propietario y abrir detalle de factura ——
    await page.goto('/login');
    await page.getByLabel(/correo|email/i).fill(owner.email);
    await page.getByLabel(/contraseña|password/i).fill(owner.password);
    await page.getByRole('button', { name: /iniciar sesión|entrar/i }).click();
    await expect(page).toHaveURL(/\/owner\/dashboard/, { timeout: 10000 });

    await page.goto('/owner/invoices');
    await expect(page.getByRole('heading', { name: /facturas/i })).toBeVisible({ timeout: 5000 });

    // Buscar una fila de factura clickeable (tabla)
    const invoiceRow = page.locator('.c-table__row--clickable').first();
    await expect(invoiceRow).toBeVisible({ timeout: 5000 });
    await invoiceRow.click();

    // Verificar modal de detalle del propietario
    const modalOwner = page.locator('.c-modal .invoice-detail');
    await expect(modalOwner).toBeVisible({ timeout: 3000 });
    await expect(modalOwner.getByRole('heading', { name: /detalle de factura/i })).toBeVisible();
    await expect(modalOwner.locator('dt', { hasText: /^Tipo$/ })).toBeVisible();
    await expect(modalOwner.locator('dt', { hasText: /^Propiedad$/ })).toBeVisible();
    await expect(modalOwner.locator('dt', { hasText: /^Periodo$/ })).toBeVisible();
    await expect(modalOwner.locator('dt', { hasText: /^Importe$/ })).toBeVisible();
    await expect(modalOwner.locator('dt', { hasText: /^Estado$/ })).toBeVisible();

    // Cerrar modal
    await modalOwner.getByRole('button', { name: /✕/ }).click();
    await expect(modalOwner).not.toBeVisible();

    // —— 2) Cerrar sesión e iniciar como inquilino ——
    await page.getByRole('button', { name: /menú de usuario/i }).click();
    await page.getByRole('button', { name: /cerrar sesión/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });

    await page.getByLabel(/correo|email/i).fill(tenant.email);
    await page.getByLabel(/contraseña|password/i).fill(tenant.password);
    await page.getByRole('button', { name: /iniciar sesión|entrar/i }).click();
    await expect(page).toHaveURL(/\/tenant\/dashboard/, { timeout: 10000 });

    // —— 3) Abrir detalle de factura en dashboard del inquilino ——
    await expect(page.getByRole('heading', { name: 'Mi vivienda' })).toBeVisible({ timeout: 5000 });

    const viewBtn = page.getByRole('button', { name: /visualizar/i }).first();
    await expect(viewBtn).toBeVisible({ timeout: 5000 });
    await viewBtn.click();

    // Verificar modal de detalle del inquilino (mismo contenido)
    const modalTenant = page.locator('.c-modal .invoice-detail');
    await expect(modalTenant).toBeVisible({ timeout: 3000 });
    await expect(modalTenant.getByRole('heading', { name: /detalle de factura/i })).toBeVisible();
    await expect(modalTenant.locator('dt', { hasText: /^Tipo$/ })).toBeVisible();
    await expect(modalTenant.locator('dt', { hasText: /^Propiedad$/ })).toBeVisible();
    await expect(modalTenant.locator('dt', { hasText: /^Periodo$/ })).toBeVisible();
    await expect(modalTenant.locator('dt', { hasText: /^Importe$/ })).toBeVisible();
    await expect(modalTenant.locator('dt', { hasText: /^Estado$/ })).toBeVisible();
  });
});
