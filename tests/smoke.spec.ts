import { expect, test } from '@playwright/test';

test('navega entre eventos, talhão, estoque e frota', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByText('DADOS SIMULADOS', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /MIP · Talhão 03/ }).click();
  await expect(page.getByRole('heading', { name: 'Talhão 03', exact: true })).toBeVisible();
  await expect(page.getByText('72%', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Armazenagem', exact: true }).click();
  await page
    .locator('.insight-panel')
    .getByRole('button', { name: /Silo 02/ })
    .click();
  await expect(page.getByRole('heading', { name: 'Silo 02', exact: true })).toBeVisible();
  await expect(page.locator('.temperature-box')).toContainText('Ponto quente');
  await page.getByRole('button', { name: 'Frota e manutenção', exact: true }).click();
  await expect(page.locator('.temperature-box')).toContainText('DTC DEMO-042');
  await page.getByRole('slider', { name: 'Data da safra' }).focus();
  await page.keyboard.press('End');
  await expect(page.locator('time')).toHaveText('31 de agosto de 2026');
  await expect(page.locator('.soft-success')).toContainText('Sem falha');
  expect(errors).toEqual([]);
});

test('filtra tabela e exporta retrato sem depender de mapas externos', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Tabela', exact: true }).click();
  await page.getByRole('textbox', { name: 'Buscar talhão ou cultura' }).fill('milho');
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await page.getByRole('button', { name: 'Talhão 04', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Talhão 04', exact: true })).toBeVisible();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar retrato', exact: true }).click();
  expect((await downloadEvent).suggestedFilename()).toBe(
    'terratwin-simulado-aurora-2026-03-12.csv',
  );
});

test('celular inicia em tabela e mantém metas acessíveis', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Tabela', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: /Fazenda Horizonte/ }).click();
  await page.getByRole('button', { name: 'Metas e conquistas', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Plantio na janela', exact: true })).toBeVisible();
  await expect(page.locator('.goal-card').first()).toContainText('Conquistada');
});

test('falha do clima público não substitui clima simulado', async ({ page }) => {
  await page.route('https://api.open-meteo.com/**', (route) => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: 'Consultar clima público de hoje', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Consulta indisponível');
  await expect(page.locator('.weather-temp')).toContainText('Simulado');
});
