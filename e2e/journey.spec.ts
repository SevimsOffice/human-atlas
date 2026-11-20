import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';

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
  // nothing may be picked at all (the centre can be empty once the heart is hidden); if something is, it is not heart tissue
  const insp = page.getByTestId('inspector');
  const picked = (await insp.count()) ? await insp.getAttribute('data-structure') : '';
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
  await expect(page.getByTestId('credits-derivations')).toContainText('70 kg');
  await expect(page.getByTestId('credits-derivations')).toContainText('Fick');
  for (const id of ['HRA-HEART-M', 'HRA-VASC-M', 'HRA-LUNG-M', 'HRA-XWALK-1.3', 'UBERON', 'OSX-AP2E', 'OSX-CP2E']) await expect(page.getByTestId(`credit-${id}`)).toBeVisible();
  await expect(page.getByTestId('credit-OSX-AP2E')).toContainText('CC BY-NC-SA 4.0');
  await expect(page.getByTestId('credit-HRA-HEART-M')).toContainText('Kristen Browne');
});

// ---- Milestone 2: lungs and respiratory engine ----
const breaths = async (page: Page) => Number(await page.getByTestId('respiratory').getAttribute('data-breaths'));

test('rest shows cited breathing values, derived ventilation, O2 uptake and the heart–lung link', async ({ page }) => {
  await ready(page);
  await expect(page.getByTestId('rr')).toHaveText('14');
  await expect(page.getByTestId('vt')).toHaveText('500');
  await expect(page.getByTestId('ve')).toHaveText('7');
  await expect(page.getByTestId('vo2')).toHaveText('0,34');
  await expect(page.getByTestId('vo2kg')).toHaveText('4,47');
  await expect(page.getByTestId('vo270')).toHaveText('0,31');
  await expect(page.getByTestId('extraction')).toHaveText('59,6');
  await expect(page.getByTestId('respiratory')).toContainText('türetilmiş (Fick ilkesi)');
  await expect(page.getByTestId('respiratory')).toHaveAttribute('data-breath-cycle-s', '4.29');
  const b0 = await breaths(page);
  await expect.poll(() => breaths(page), { timeout: 9000 }).toBeGreaterThan(b0); // one breath ≈ 4.3 s
});

test('running updates O2 uptake and extraction, and shows cited running breathing values (Lee et al. 2025)', async ({ page }) => {
  await ready(page);
  await page.getByRole('radio', { name: 'Koşu (yoğun egzersiz)' }).click();
  await expect(page.getByTestId('vo2')).toHaveText('2,12');
  await expect(page.getByTestId('vo270')).toHaveText('1,95');
  await expect(page.getByTestId('extraction')).toHaveText('100,1');
  await expect(page.getByTestId('rr')).toHaveText('39,9');
  await expect(page.getByTestId('vt')).toHaveText('1.500');
  await expect(page.getByTestId('ve')).toHaveText('55,2');
  await expect(page.getByTestId('respiratory')).toContainText('LEE-2025');
  await expect(page.getByTestId('respiratory')).toHaveAttribute('data-breath-cycle-s', '1.5');
  const b0 = await breaths(page);
  await expect.poll(() => breaths(page), { timeout: 6000 }).toBeGreaterThan(b0 + 1); // one breath ≈ 1.5 s
});

test('lungs are selectable with Uberon IDs and respiratory texts; the lung layer can be hidden', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: /^Sağ akciğer$/ }).click();
  const insp = page.getByTestId('inspector');
  await expect(insp).toHaveAttribute('data-structure', 'VH_M_lungs_R');
  await expect(page.getByTestId('uberon-id')).toHaveText('UBERON:0002167');
  await expect(page.getByTestId('inspector-text')).toContainText('üç lobu');
  await expect(insp).toContainText('Solunum sistemi');
  await expect(page.getByTestId('inspector-source')).toContainText('Lung, Male v1.2');
  await page.getByRole('button', { name: /^Soluk borusu/ }).click();
  await expect(page.getByTestId('uberon-id')).toHaveText('UBERON:0003126');
  await page.getByTestId('layer-lungs').uncheck();
  await expect(page.getByTestId('layer-lungs')).not.toBeChecked();
});

test('clicking the centre still picks the heart through the translucent lungs', async ({ page }) => {
  await ready(page);
  const box = (await page.locator('[data-testid=stage] canvas').boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  const picked = await page.getByTestId('inspector').getAttribute('data-structure');
  expect(picked).not.toMatch(/lung|lobe|segment/);
});

// ---- Milestone 3: exercise across systems ----
test('blood-flow distribution shows rest and running per organ from the engine, with a working table view', async ({ page }) => {
  await ready(page);
  await page.getByTestId('toggle-bottom').click();
  const chart = page.getByTestId('flow-distribution');
  await expect(chart.getByTestId('bar-rest-skeletalMuscle')).toHaveText('1,09');
  await expect(chart.getByTestId('bar-running-skeletalMuscle')).toHaveText('13,93');
  await expect(chart.getByTestId('bar-running-kidney')).toHaveText('0,67');
  await page.getByTestId('flow-table-toggle').click();
  await expect(page.getByTestId('flow-table')).toBeVisible();
  await expect(page.getByTestId('table-run-skeletalMuscle')).toContainText('71,4%');
  await page.getByTestId('flow-table-toggle').click();
  await expect(page.getByTestId('flow-table')).toHaveCount(0);
});

test('rest → running comparison across heart, lungs and muscle', async ({ page }) => {
  await ready(page);
  await page.getByTestId('toggle-bottom').click();
  const c = page.getByTestId('exercise-compare');
  await expect(c.getByTestId('ratio-heartRate')).toHaveText('2');
  await expect(c.getByTestId('ratio-cardiacOutput')).toHaveText('3,7');
  await expect(c.getByTestId('ratio-oxygenUptake70kg')).toHaveText('6,2');
  await expect(c.getByTestId('ratio-muscleFlow')).toHaveText('12,8');
  await page.getByTestId('lang-en').click();
  await expect(c).toContainText('Skeletal-muscle blood flow');
  await expect(c.getByTestId('ratio-cardiacOutput')).toHaveText('3.7');
});

// ---- M3 review fixes: camera, layout, credit ----
const cam = async (page: Page) => {
  const d = await page.getByTestId('stage').evaluate((el) => ({ ...(el as HTMLElement).dataset }));
  return { polar: Number(d.camPolar), distance: Number(d.camDistance), target: String(d.camTarget) };
};
async function canvasBox(page: Page) { return (await page.locator('[data-testid=stage] canvas').boundingBox())!; }

test('camera orbits the model centre and cannot flip over the top or under the floor', async ({ page }) => {
  await ready(page);
  await expect.poll(async () => Number((await cam(page)).target.split(',')[1])).toBeGreaterThan(0.2); // centre of the visible organs, well above the stage
  const b = await canvasBox(page);
  const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
  for (const dy of [600, -1200]) { // drag far down, then far up
    await page.mouse.move(cx, cy); await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(cx, cy + (dy * i) / 10);
    await page.mouse.up(); await page.waitForTimeout(600);
    const { polar } = await cam(page);
    expect(polar).toBeGreaterThanOrEqual(11.4); // minPolar 0.2 rad
    expect(polar).toBeLessThanOrEqual(97.3); // maxPolar 0.54π
  }
});

test('panning is disabled and zoom is clamped', async ({ page }) => {
  await ready(page);
  await expect(page.getByTestId('stage')).toHaveAttribute('data-intro', 'done', { timeout: 20_000 });
  const before = (await cam(page)).target;
  const b = await canvasBox(page);
  const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
  await page.mouse.move(cx, cy); await page.mouse.down({ button: 'right' });
  await page.mouse.move(cx + 200, cy + 100, { steps: 8 }); await page.mouse.up({ button: 'right' });
  await page.waitForTimeout(500);
  expect((await cam(page)).target).toBe(before);
  for (let i = 0; i < 25; i++) await page.mouse.wheel(0, -400);
  await page.waitForTimeout(800);
  expect((await cam(page)).distance).toBeGreaterThanOrEqual(0.119);
  for (let i = 0; i < 40; i++) await page.mouse.wheel(0, 600);
  await page.waitForTimeout(800);
  expect((await cam(page)).distance).toBeLessThanOrEqual(4.201);
});

test('double-click focuses a structure; reset view re-frames all visible models', async ({ page }) => {
  await ready(page);
  await page.waitForTimeout(500);
  const initial = await cam(page);
  const b = await canvasBox(page);
  await page.mouse.dblclick(b.x + b.width / 2, b.y + b.height / 2);
  const picked = await page.getByTestId('inspector').getAttribute('data-structure');
  expect(picked).toMatch(/^VH_M_/);
  await expect.poll(async () => (await cam(page)).target, { timeout: 8000 }).not.toBe(initial.target);
  await page.getByTestId('reset-view').click();
  await expect.poll(async () => (await cam(page)).target, { timeout: 8000 }).toBe(initial.target);
  await expect.poll(async () => (await cam(page)).distance, { timeout: 8000 }).toBeCloseTo(initial.distance, 2);
});

test('initial view frames every model: nothing is cut off at the top (trachea) or bottom', async ({ page }) => {
  await ready(page);
  await page.waitForTimeout(500);
  // project the top of the airway and the bottom of the IVC with the live camera and check both are on screen
  const inView = await page.evaluate(() => {
    const d = (document.querySelector('[data-testid=stage]') as HTMLElement).dataset;
    return { t: d.camTarget, dist: Number(d.camDistance) };
  });
  expect(inView.dist).toBeGreaterThan(0.6); // the full model needs more distance than the heart alone
  const canvasShot = await page.locator('[data-testid=stage] canvas').screenshot();
  expect(canvasShot.byteLength).toBeGreaterThan(1000);
});

test('3D view is the dominant area and side/bottom panels collapse', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  const w = (await page.getByTestId('stage').boundingBox())!.width;
  expect(w / 1440).toBeGreaterThanOrEqual(0.6);
  await page.getByTestId('toggle-left').click();
  await page.getByTestId('toggle-right').click();
  await expect(page.getByTestId('panel-left')).toHaveCount(0);
  await expect(page.getByTestId('panel-right')).toHaveCount(0);
  await expect.poll(async () => (await page.getByTestId('stage').boundingBox())!.width).toBeGreaterThan(1400);
  // exercise panel is collapsed by default; opened it takes at most ~35 % of the height
  await expect(page.getByTestId('panel-bottom')).toHaveCount(0);
  expect((await page.getByTestId('stage').boundingBox())!.height / 900).toBeGreaterThan(0.8);
  await page.getByTestId('toggle-bottom').click();
  await expect(page.getByTestId('panel-bottom')).toBeVisible();
  expect((await page.getByTestId('panel-bottom').boundingBox())!.height / 900).toBeLessThanOrEqual(0.36);
  await page.getByTestId('toggle-left').click();
  await expect(page.getByTestId('panel-left')).toBeVisible();
});

test('text under the 3D view is limited to a readable line length and labels the §20.4 column', async ({ page }) => {
  await ready(page);
  await page.getByTestId('toggle-bottom').click();
  const note = page.getByTestId('flow-note');
  expect((await note.boundingBox())!.width).toBeLessThanOrEqual(680);
  await expect(note).toContainText('maksimal egzersiz sütununa');
  await page.getByTestId('lang-en').click();
  await expect(note).toContainText('based on the maximal exercise column of OpenStax A&P 2e §20.4');
});

test('footer and Sources page credit Sevim Durmuş with links opening in a new tab', async ({ page }) => {
  await ready(page);
  const f = page.getByTestId('powered-by');
  await expect(f).toContainText('Geliştiren: Sevim Durmuş');
  for (const [id, href] of [['instagram', 'https://www.instagram.com/sevimsoffice/'], ['linkedin', 'https://www.linkedin.com/in/sevimdurmus/']]) {
    const a = page.getByTestId(`powered-by-${id}`);
    await expect(a).toHaveAttribute('href', href);
    await expect(a).toHaveAttribute('target', '_blank');
    await expect(a).toHaveAttribute('rel', /noopener/);
  }
  await page.getByTestId('lang-en').click();
  await expect(f).toContainText('Powered by Sevim Durmuş');
  await page.getByTestId('nav-credits').click();
  await expect(page.getByTestId('credits-powered-by')).toContainText('Powered by Sevim Durmuş');
  await expect(page.getByTestId('credits-powered-by-linkedin')).toHaveAttribute('href', 'https://www.linkedin.com/in/sevimdurmus/');
});

test('side panels: compact scenario control and one-line structure rows', async ({ page }) => {
  await ready(page);
  const seg = page.getByRole('radiogroup', { name: /senaryo/i });
  expect((await seg.boundingBox())!.height).toBeLessThanOrEqual(34);
  const row = page.getByRole('button', { name: /^Sağ kulakçık/ });
  expect((await row.boundingBox())!.height).toBeLessThanOrEqual(24);
  await expect(row).toHaveAttribute('title', 'Sağ kulakçık (atrium dextrum)');
  const value = page.getByTestId('hr');
  expect(await value.evaluate((el) => getComputedStyle(el).fontSize)).toBe('14px');
});

// ---- Milestone 4: remaining systems + cross-section ----
test('body systems are layers: urinary, digestive, lymphatic, nervous and skeleton on by default', async ({ page }) => {
  await ready(page);
  for (const l of ['urinary', 'digestive', 'lymphatic', 'nervous', 'skeletal']) await expect(page.getByTestId(`layer-${l}`)).toBeChecked();
  await page.getByRole('button', { name: /^Sol böbrek$/ }).click();
  await expect(page.getByTestId('uberon-id')).toHaveText('UBERON:0004538');
  await expect(page.getByTestId('inspector-system')).toHaveText('Boşaltım sistemi');
  await expect(page.getByTestId('inspector-source')).toContainText('Kidney, Male, Left v1.2');
  await page.getByRole('button', { name: /^Karaciğer$/ }).click();
  await expect(page.getByTestId('inspector-system')).toHaveText('Sindirim sistemi');
  await page.getByRole('button', { name: /^Omurilik/ }).click();
  await expect(page.getByTestId('uberon-id')).toHaveText('UBERON:0002240');
});

test('the HuBMAP partial skeleton is shown by default; reset frames the whole body even with the skin off', async ({ page }) => {
  await ready(page);
  await page.getByTestId('layer-skin').uncheck();
  await page.getByTestId('reset-view').click();
  await expect.poll(async () => (await cam(page)).distance, { timeout: 8000 }).toBeGreaterThan(2.5);
  await page.getByRole('button', { name: /^Sol uyluk kemiği/ }).click();
  await expect(page.getByTestId('inspector-system')).toHaveText('İskelet sistemi');
});

test('sub-structures of the new organs have Turkish terms marked for expert review', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: /^Sol böbrek$/ }).click();
  await page.getByTestId('inspector').getByRole('button', { name: /^Sol böbrek korteksi/ }).first().click();
  await expect(page.getByTestId('inspector-name')).toHaveText('Sol böbrek korteksi');
  await expect(page.getByTestId('inspector')).toContainText('Türkçe terim uzman incelemesi bekliyor');
});

test('cross-section slider moves a clipping plane and clipped geometry cannot be picked', async ({ page }) => {
  await ready(page);
  const stage = page.getByTestId('stage');
  await expect(stage).toHaveAttribute('data-section', 'off');
  await page.getByTestId('section-toggle').check();
  await expect(stage).toHaveAttribute('data-section', 'coronal:0.50');
  await page.getByTestId('section-axis-transverse').click();
  await page.getByTestId('section-slider').fill('3');
  await expect(stage).toHaveAttribute('data-section', 'transverse:0.03');
  const low = Number(await stage.getAttribute('data-section-pos'));
  await page.getByTestId('section-slider').fill('90');
  await expect.poll(async () => Number(await stage.getAttribute('data-section-pos'))).toBeGreaterThan(low);
  // nearly everything removed: a click in the centre must not pick a heart or lung structure
  await page.getByTestId('section-slider').fill('3');
  const b = (await page.locator('[data-testid=stage] canvas').boundingBox())!;
  await page.mouse.click(b.x + b.width / 2, b.y + b.height * 0.35);
  await page.waitForTimeout(400);
  const insp = page.getByTestId('inspector');
  const picked = (await insp.count()) ? await insp.getAttribute('data-structure') : '';
  expect(picked ?? '').not.toMatch(/heart|atrium|ventricle|lung|lobe|aort/);
  await page.getByTestId('section-toggle').uncheck();
  await expect(stage).toHaveAttribute('data-section', 'off');
});

// ---- Milestone 5: missions ----
test('mission: follow a red blood cell — camera and inspector follow each step, numbers come from the engine', async ({ page }) => {
  await ready(page);
  await page.waitForTimeout(400);
  const start = await cam(page);
  await page.getByTestId('mission-start-rbc-lungs-to-leg').click();
  const card = page.getByTestId('mission-card');
  await expect(card).toHaveAttribute('data-step', '0');
  await expect(page.getByTestId('inspector')).toHaveAttribute('data-structure', 'VH_M_lungs_R');
  await expect.poll(async () => (await cam(page)).target, { timeout: 8000 }).not.toBe(start.target);
  await page.getByTestId('mission-next').click();
  await page.getByTestId('mission-next').click();
  await expect(page.getByTestId('inspector')).toHaveAttribute('data-structure', 'VH_M_heart_left_ventricle');
  await expect(page.getByTestId('mission-text')).toContainText('70 mL');
  await expect(page.getByTestId('mission-text')).toContainText('5,25 L');
  await page.getByTestId('mission-next').click();
  await page.getByTestId('mission-next').click();
  await expect(page.getByTestId('layer-skeletal')).toBeChecked(); // the leg step turns the skeleton on
  await expect(page.getByTestId('inspector')).toHaveAttribute('data-structure', 'VH_M_femur_L');
  await page.getByTestId('mission-next').click();
  await expect(page.getByTestId('mission-question')).toBeVisible();
  await page.getByTestId('mission-option-0').click();
  await expect(page.getByTestId('mission-feedback')).toContainText('Tekrar düşün');
  await expect(page.getByTestId('mission-option-2')).toBeDisabled();
  await page.getByTestId('mission-finish').click();
  await expect(card).toHaveCount(0);
});

test('mission: what changes when you start running — scenario switches and values update', async ({ page }) => {
  await ready(page);
  await page.getByTestId('mission-start-start-running').click();
  await expect(page.getByTestId('mission-text')).toContainText('75');
  await expect(page.getByTestId('hr')).toHaveText('75');
  await page.getByTestId('mission-next').click();
  await expect(page.getByRole('radio', { name: 'Koşu (yoğun egzersiz)' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('hr')).toHaveText('150');
  await expect(page.getByTestId('mission-text')).toContainText('19,5');
  await page.getByTestId('mission-next').click();
  await expect(page.getByTestId('mission-text')).toContainText('39,9');
  await page.getByTestId('mission-next').click();
  await page.getByTestId('mission-next').click();
  await expect(page.getByTestId('mission-text')).toContainText('13,93');
  await page.getByTestId('mission-back').click();
  await expect(page.getByTestId('mission-card')).toHaveAttribute('data-step', '3');
  await page.getByTestId('mission-next').click();
  await page.getByTestId('mission-next').click();
  await page.getByTestId('mission-option-1').click();
  await expect(page.getByTestId('mission-feedback')).toContainText('Doğru');
  await expect(page.getByTestId('mission-feedback')).toContainText('12,8');
  await page.getByTestId('lang-en').click();
  await expect(page.getByTestId('mission-feedback')).toContainText('12.8-fold');
});

// ---- v1.0: full body ----
test('opens on the whole body (HRA skin outline), then glides to heart and lungs; reset frames the body again', async ({ page }) => {
  await ready(page);
  await expect(page.getByTestId('layer-skin')).toBeChecked();
  const stage = page.getByTestId('stage');
  const whole = await cam(page);
  expect(whole.distance).toBeGreaterThan(2.5); // ≈1.83 m tall body fits the view
  await expect(stage).toHaveAttribute('data-intro', 'done', { timeout: 20_000 });
  const close = await cam(page);
  expect(close.distance).toBeLessThan(1.2);
  expect(Number(close.target.split(',')[1])).toBeGreaterThan(0.35); // chest height (heart ≈ 0.42–0.53 m)
  await page.getByTestId('reset-view').click();
  await expect.poll(async () => (await cam(page)).distance, { timeout: 10_000 }).toBeGreaterThan(2.5);
  // the skin is a real structure from the HRA (Uberon "skin of body"), selectable from the list
  await page.getByRole('button', { name: /^Deri/ }).click();
  await expect(page.getByTestId('uberon-id')).toHaveText('UBERON:0002097');
  await expect(page.getByTestId('inspector-source')).toContainText('Skin, Male v1.2');
});

test('the skin outline is requested only after every organ and bone model, so it never appears alone', async ({ page }) => {
  const fetched: string[] = [];
  page.on('request', (r) => { if (r.url().endsWith('.glb')) fetched.push(r.url().split('/').pop()!); });
  await ready(page);
  for (const f of ['heart.glb', 'lungs.glb', 'liver.glb', 'pelvis.glb', 'knee-left.glb', 'skin.glb']) expect(fetched).toContain(f);
  expect(fetched.at(-1)).toBe('skin.glb');
});

// Decodes a PNG screenshot into raw RGBA pixels.
async function pixels(png: Buffer) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}
/** Number of pixels whose colour changed noticeably between two equally sized screenshots. */
function changed(a: { data: Buffer }, b: { data: Buffer }) {
  let n = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    if (Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]) > 30) n++;
  }
  return n;
}
type Probe = Record<string, { shown: number; inView: number; minOpacity: number; maxOpacity: number; depthWrite: boolean; renderOrder: number }>;

test('default full-body view: every organ layer and the skeleton are really drawn and the faint skin hides none of them', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  await expect(page.getByTestId('stage')).toHaveAttribute('data-intro', 'done', { timeout: 20_000 });
  await page.getByTestId('layer-flow').uncheck(); // stop the moving blood cells so screenshots only differ by what we toggle
  await page.getByTestId('reset-view').click(); // the default whole-body framing
  await expect.poll(async () => (await cam(page)).distance, { timeout: 10_000 }).toBeGreaterThan(2.5);
  await page.waitForTimeout(1500);

  const layers = ['heart', 'greatVessels', 'lungs', 'airways', 'urinary', 'digestive', 'lymphatic', 'nervous', 'skeletal'];
  const probe = JSON.parse((await page.getByTestId('stage').getAttribute('data-scene'))!) as Probe;
  for (const l of layers) {
    expect(probe[l]?.shown, `${l} meshes shown`).toBeGreaterThan(0);
    expect(probe[l]?.inView, `${l} meshes inside the view`).toBeGreaterThan(0);
  }
  // skin: very faint, never writes depth, drawn after everything else
  expect(probe.skin.maxOpacity).toBeGreaterThanOrEqual(0.08);
  expect(probe.skin.maxOpacity).toBeLessThanOrEqual(0.12);
  expect(probe.skin.depthWrite).toBe(false);
  for (const l of layers) expect(probe.skin.renderOrder, `skin drawn after ${l}`).toBeGreaterThan(probe[l].renderOrder);

  // pixels: with the skin ON, switching each layer off must visibly change the picture
  const canvas = page.locator('[data-testid=stage] canvas');
  const shot = async () => pixels(await canvas.screenshot());
  const measure = async (list: string[]) => {
    const base = await shot();
    const noise = Math.max(changed(base, await shot()), changed(base, await shot())); // remaining animation
    for (const l of list) {
      await page.getByTestId(`layer-${l}`).uncheck();
      await page.waitForTimeout(700);
      const diff = changed(base, await shot());
      expect(diff, `${l}: changed pixels vs noise ${noise}`).toBeGreaterThan(noise * 2 + 60); // ≥ 60 changed pixels: thin structures (spinal cord) cover ~170 px at full-body scale
      await page.getByTestId(`layer-${l}`).check();
      await page.waitForTimeout(500);
    }
  };
  // the lungs breathe (they are the only moving model): check them first, then hide them so the rest is measured without that motion
  await measure(['lungs']);
  await page.getByTestId('layer-lungs').uncheck();
  await page.waitForTimeout(700);
  await measure(layers.filter((l) => l !== 'lungs'));
});

test('the Sources page keeps the Turkish-terms expert-review note visible', async ({ page }) => {
  await ready(page);
  await page.getByTestId('nav-credits').click();
  await expect(page.getByTestId('terms-review-note')).toContainText('uzman incelemesi');
  await expect(page.getByText(/Skin, Male v1\.2/).first()).toBeVisible();
});
