import { expect, test, type Page } from '@playwright/test';

async function ready(page: Page) {
  await page.goto('./');
  await expect(page.getByTestId('stage')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
}
const beats = async (page: Page) => Number(await page.getByTestId('flow').getAttribute('data-beats'));
async function beatsOver(page: Page, ms: number) {
  const a = await beats(page); await page.waitForTimeout(ms); return (await beats(page)) - a;
}

test('opens in Turkish with the disclaimer, models loaded and resting values from the engine', async ({ page }) => {
  await ready(page);
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  await expect(page.getByTestId('disclaimer')).toContainText('Tıbbi tavsiye');
  await expect(page.getByRole('radio', { name: 'Dinlenme' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('hr')).toHaveText('75');
  await expect(page.getByTestId('sv')).toHaveText('70');
  await expect(page.getByTestId('co')).toHaveText('5,25');
  await expect(page.getByTestId('cycle')).toHaveText('0,8');
});

test('selecting a structure shows its name, Uberon ID, text status, neighbours and source', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: /^Sol karıncık/ }).click();
  const insp = page.getByTestId('inspector');
  await expect(insp).toHaveAttribute('data-structure', 'VH_M_heart_left_ventricle');
  await expect(page.getByTestId('inspector-name')).toContainText('Sol karıncık');
  await expect(insp).toContainText('Heart left ventricle');
  await expect(page.getByTestId('uberon-id')).toHaveText('UBERON:0002084');
  await expect(insp).toContainText('uzman incelemesi yapılmadı');
  await expect(page.getByTestId('inspector-source')).toContainText('CC BY 4.0');
  // neighbours are navigable
  await page.getByTestId('neighbors').getByRole('button', { name: /^Mitral kapak/ }).click();
  await expect(insp).toHaveAttribute('data-structure', 'VH_M_mitral_valve');
  await expect(page.getByTestId('uberon-id')).toHaveText('UBERON:0002135');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('inspector-empty')).toBeVisible();
});

test('clicking the 3D model picks a structure', async ({ page }) => {
  await ready(page);
  const box = (await page.locator('[data-testid=stage] canvas').boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByTestId('inspector')).toHaveAttribute('data-structure', /^VH_M_/);
});

test('switching to running changes the values and doubles the animation speed', async ({ page }) => {
  await ready(page);
  await expect(page.getByTestId('flow')).toHaveAttribute('data-cycle-s', '0.8');
  const rest = await beatsOver(page, 4000);
  await page.getByRole('radio', { name: 'Koşu (yoğun egzersiz)' }).click();
  await expect(page.getByTestId('hr')).toHaveText('150');
  await expect(page.getByTestId('sv')).toHaveText('130');
  await expect(page.getByTestId('co')).toHaveText('19,5');
  await expect(page.getByTestId('cycle')).toHaveText('0,4');
  await expect(page.getByTestId('flow')).toHaveAttribute('data-cycle-s', '0.4');
  const run = await beatsOver(page, 4000);
  expect(rest).toBeGreaterThanOrEqual(3); // ≈ 5 beats at 0.8 s
  expect(run / rest).toBeGreaterThan(1.5); // ≈ 2×
  expect(run / rest).toBeLessThan(2.7);
});

test('the blood path advances step by step and can be paused', async ({ page }) => {
  await ready(page);
  const s0 = await page.getByTestId('flow').getAttribute('data-step');
  await expect(page.getByTestId('flow')).not.toHaveAttribute('data-step', s0!, { timeout: 5000 });
  await page.getByTestId('flow-toggle').click();
  expect(await beatsOver(page, 2000)).toBe(0);
  await page.getByTestId('flow-toggle').click();
  expect(await beatsOver(page, 2000)).toBeGreaterThan(0);
});

test('hiding the heart layer removes it from picking', async ({ page }) => {
  await ready(page);
  await page.getByTestId('layer-heart').uncheck();
  const box = (await page.locator('[data-testid=stage] canvas').boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(500);
  const picked = await page.getByTestId('inspector').getAttribute('data-structure').catch(() => null);
  expect(picked ?? '').not.toMatch(/ventricle|atrium|valve|septum|papillary/);
});

test('language switch to English persists across reloads', async ({ page }) => {
  await ready(page);
  await page.getByTestId('lang-en').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('radio', { name: 'Running (vigorous exercise)' })).toBeVisible();
  await expect(page.getByTestId('co')).toHaveText('5.25');
  await page.reload();
  await expect(page.getByTestId('disclaimer')).toContainText('Not medical advice');
});

test('sources & credits page lists every source with its licence', async ({ page }) => {
  await ready(page);
  await page.getByTestId('nav-credits').click();
  await expect(page).toHaveURL(/#\/credits$/);
  for (const id of ['HRA-HEART-M', 'HRA-VASC-M', 'HRA-XWALK-1.3', 'UBERON', 'OSX-AP2E']) await expect(page.getByTestId(`credit-${id}`)).toBeVisible();
  await expect(page.getByTestId('credit-OSX-AP2E')).toContainText('CC BY-NC-SA 4.0');
  await expect(page.getByTestId('credit-HRA-HEART-M')).toContainText('Kristen Browne');
});
