import { test, expect } from '@playwright/test';

/**
 * Prueba E2E: Registrar propietario, propiedad, inquilino y factura.
 * Requiere backend en http://localhost:3000
 */
test.describe('Flujo: Registro + Propiedad + Inquilino + Factura', () => {
  const owner = {
    fullName: 'Prueba Propietario E2E',
    email: `propietario.e2e.${Date.now()}@test.com`,
    password: '123456',
  };

  test('registrar propiedad, inquilino y factura', async ({ page }) => {
    // —— 1) Registro como propietario ——
    await page.goto('/register');
    await page.getByLabel(/nombre completo/i).fill(owner.fullName);
    await page.getByLabel(/correo electrónico/i).fill(owner.email);
    await page.getByLabel(/contraseña/i).fill(owner.password);
    await page.getByRole('button', { name: /crear cuenta/i }).click();
    await expect(page).toHaveURL(/\/owner\/dashboard/);

    // —— 2) Crear propiedad ——
    await page.goto('/owner/properties');
    await page.getByRole('button', { name: /nueva propiedad/i }).click();
    await expect(page.getByRole('heading', { name: /nueva propiedad/i })).toBeVisible();

    await page.getByLabel(/^nombre$/i).fill('Piso Prueba E2E');
    await page.locator('#propType').selectOption('apartment');
    await page.getByLabel(/alquiler mensual/i).fill('750');
    await page.getByLabel(/^calle$/i).fill('Calle Test 1');
    await page.getByLabel(/^ciudad$/i).fill('Valencia');
    await page.getByLabel(/código postal/i).fill('46001');
    await page.getByRole('button', { name: /crear propiedad/i }).click();
    await expect(page.locator('.c-modal')).not.toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Piso Prueba E2E').first()).toBeVisible({ timeout: 10000 });

    // —— 3) Registrar inquilino ——
    await page.goto('/owner/tenants');
    await page.getByRole('button', { name: /nuevo inquilino/i }).click();
    await expect(page.getByRole('heading', { name: /registrar nuevo inquilino/i })).toBeVisible();

    await page.getByLabel(/nombre completo/i).fill('Inquilino Prueba');
    await page.getByLabel(/correo electrónico/i).fill('inquilino.e2e@test.com');
    await page.locator('#tProp').selectOption({ index: 1 }); // primera propiedad
    await page.getByRole('button', { name: /registrar y enviar email/i }).click();
    await expect(page.getByText(/inquilino registrado|registrado correctamente/i)).toBeVisible({ timeout: 10000 });

    // Cerrar modal si sigue abierto (éxito)
    await page.waitForTimeout(1500);

    // —— 4) Crear factura ——
    await page.goto('/owner/invoices');
    await page.getByRole('button', { name: /nueva factura/i }).click();
    await expect(page.getByRole('heading', { name: /nueva factura/i })).toBeVisible();

    await page.locator('#invProp').selectOption({ index: 1 });
    await page.locator('#invType').selectOption('electricity');
    await page.getByLabel(/importe/i).fill('85.50');
    const now = new Date();
    await page.getByLabel(/mes inicio/i).fill(String(now.getMonth() + 1));
    await page.getByLabel(/año inicio/i).fill(String(now.getFullYear()));
    await page.getByLabel(/mes fin/i).fill(String(now.getMonth() + 1));
    await page.getByLabel(/año fin/i).fill(String(now.getFullYear()));
    await page.getByRole('button', { name: /registrar factura/i }).click();

    await expect(page.getByText(/electricidad|⚡/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('85.5')).toBeVisible();
  });
});
