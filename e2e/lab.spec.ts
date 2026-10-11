import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const square = (page: Page, sq: string) => page.locator(`button.square[aria-label^="${sq}:"]`);
const button = (page: Page, name: string | RegExp) => page.getByRole('button', { name });
const current = (page: Page) => page.locator('.steps [aria-current="step"]');

async function watchScene(page: Page) {
  for (let i = 0; i < 3; i++) await button(page, 'Nächsten Zug zeigen').click();
  await button(page, 'Weiter').click();
}
async function identifyScene(page: Page) {
  await square(page, 'b8').click();
  await square(page, 'd8').click();
  await button(page, 'Weiter').click();
}
async function unaidedScene(page: Page) {
  await expect(page.locator('svg.arrows line')).toHaveCount(0);
  await square(page, 'b7').click();
  await square(page, 'd7').click();
  await button(page, 'Weiter').click();
}
async function solve(page: Page, from: string, to: string, capture: string) {
  await square(page, from).click();
  await square(page, to).click();
  await button(page, 'Antwort von Schwarz zeigen').click();
  await square(page, to).click();
  await square(page, capture).click();
}

async function pick(page: Page, a: string, b: string) {
  await square(page, a).click();
  await square(page, b).click();
  await button(page, 'Weiter').click();
}

test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('komplette Lernrunde ohne Hilfe', async ({ page }) => {
  await expect(current(page)).toContainText('Entdecken');
  await watchScene(page);
  await expect(current(page)).toContainText('Ziele erkennen');
  await identifyScene(page);
  await expect(current(page)).toContainText('Selbst ziehen');
  await solve(page, 'e5', 'c6', 'd8');
  await button(page, 'Weiter').click();
  await expect(current(page)).toContainText('Selbst erkennen');
  await unaidedScene(page);
  await expect(current(page)).toContainText('Neu anwenden');
  await solve(page, 'e4', 'c5', 'd7');
  await button(page, 'Weiter').click();
  await expect(current(page)).toContainText('Geschafft');
  await expect(page.locator('.results')).toContainText('Ohne Lösungshilfe gelöst');
  await expect(page.locator('.results')).not.toContainText('Mit Unterstützung');
});

test('Hilfe wird getrennt als Unterstützung ausgewiesen', async ({ page }) => {
  await watchScene(page); await identifyScene(page);
  await button(page, /Hilfe 0\/5/).click();
  await expect(page.locator('.hint')).toContainText('König und Dame gleichzeitig');
  await solve(page, 'e5', 'c6', 'd8');
  await button(page, 'Weiter').click();
  await unaidedScene(page);
  await solve(page, 'e4', 'c5', 'd7');
  await button(page, 'Weiter').click();
  await expect(page.locator('.results li').first()).toContainText('Mit Unterstützung gelöst');
  await expect(page.locator('.results li').nth(1)).toContainText('Ohne Lösungshilfe gelöst');
});

test('Fehlzug zeigt Folge und wird zurückgenommen', async ({ page }) => {
  await watchScene(page); await identifyScene(page);
  await square(page, 'e5').click();
  await square(page, 'd7').click();
  await expect(page.locator('.feedback')).toContainText('Schwarz antwortet gleich');
  await expect(page.locator('.feedback')).toContainText('Die Dame kann deinen Springer schlagen');
  await button(page, 'Zurücknehmen').click();
  await expect(square(page, 'e5')).toContainText('e5');
  await expect(square(page, 'e5')).toHaveAttribute('aria-label', /weißer Springer/);
});

test('illegaler Zug verändert die Stellung nicht', async ({ page }) => {
  await watchScene(page); await identifyScene(page);
  await square(page, 'e5').click();
  await square(page, 'e6').click();
  await expect(page.locator('.feedback')).toContainText('nicht erlaubt');
  await expect(square(page, 'e5')).toHaveAttribute('aria-label', /weißer Springer/);
});

test('Fortschritt übersteht ein Neuladen', async ({ page }) => {
  await watchScene(page); await identifyScene(page);
  await page.reload();
  await expect(current(page)).toContainText('Selbst ziehen');
});

test('Zurücksetzen löscht den lokalen Fortschritt', async ({ page }) => {
  await watchScene(page);
  page.once('dialog', d => d.accept());
  await button(page, 'Lernrunde zurücksetzen').click();
  await expect(current(page)).toContainText('Entdecken');
  await page.reload();
  await expect(current(page)).toContainText('Entdecken');
});

test('funktioniert bei gesperrtem Speicher mit Hinweis', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } });
  });
  await page.goto('/');
  await expect(page.locator('footer [role="status"]')).toBeVisible();
  await watchScene(page);
  await expect(current(page)).toContainText('Ziele erkennen');
  await context.close();
});

test('beschädigter Speicher wird ignoriert', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('schachlabor.gabel.v1', '{"scene":99}'));
  await page.reload();
  await expect(current(page)).toContainText('Entdecken');
  await expect(page.locator('footer [role="status"]')).toBeVisible();
});

test('Brett ist per Tastatur bedienbar', async ({ page }) => {
  await watchScene(page); await identifyScene(page);
  await square(page, 'e5').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(square(page, 'd5')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(square(page, 'e5')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowUp');
  await expect(square(page, 'c6')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.feedback')).toContainText('Schach und Angriff auf die Dame');
});

test('Touch: Figur und Zielfeld antippen', async ({ page, hasTouch }) => {
  test.skip(!hasTouch, 'nur im Touch-Projekt');
  await watchScene(page);
  await square(page, 'b8').tap();
  await square(page, 'd8').tap();
  await button(page, 'Weiter').tap();
  await expect(current(page)).toContainText('Selbst ziehen');
});

for (const [name, setup] of [
  ['Entdecken', async () => {}],
  ['Selbst ziehen', async (p: Page) => { await watchScene(p); await identifyScene(p); }],
] as const) {
  test(`Barrierefreiheit (axe, WCAG A/AA): ${name}`, async ({ page }) => {
    await setup(page);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(result.violations.map(v => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
}

test('zweites Motiv: Fesselung nach der Gabel', async ({ page }) => {
  await watchScene(page); await identifyScene(page);
  await solve(page, 'e5', 'c6', 'd8'); await button(page, 'Weiter').click();
  await unaidedScene(page);
  await solve(page, 'e4', 'c5', 'd7'); await button(page, 'Weiter').click();
  await button(page, 'Nächstes Motiv').click();
  await expect(page.locator('h1')).toContainText('Nicht ziehen dürfen');
  await expect(current(page)).toContainText('Entdecken');
  await expect(page.locator('.steps li')).toHaveCount(6);
  await watchScene(page);
  await expect(page.locator('h2')).toContainText('Was ist gefesselt?');
  await pick(page, 'c6', 'e8');
  await solve(page, 'e2', 'b5', 'c6'); await button(page, 'Weiter').click();
  await expect(page.locator('svg.arrows line')).toHaveCount(0);
  await pick(page, 'e8', 'g8');
  await solve(page, 'd1', 'd8', 'e8'); await button(page, 'Weiter').click();
  await expect(current(page)).toContainText('Geschafft');
  await expect(page.locator('.results li')).toHaveCount(2);
  await expect(page.locator('.results li').first()).toContainText('Ohne Lösungshilfe gelöst');
  await expect(button(page, 'Nächstes Motiv')).toHaveCount(0);
});

test('Übersicht zeigt Wiederholungsstand und ermöglicht erneutes Starten', async ({ page }) => {
  await watchScene(page); await identifyScene(page);
  await solve(page, 'e5', 'c6', 'd8'); await button(page, 'Weiter').click();
  await unaidedScene(page);
  await solve(page, 'e4', 'c5', 'd7'); await button(page, 'Weiter').click();
  const overview = page.locator('.overview');
  await expect(overview).toContainText('An 1 Tag ohne Lösungshilfe gelöst');
  await expect(overview).toContainText('Wiederholung ab');
  await expect(overview).toContainText('Fesselung');
  await expect(overview).toContainText('Noch nicht gestartet');
  await button(page, 'Doppelangriff wiederholen').click();
  await expect(current(page)).toContainText('Entdecken');
  await expect(page.locator('h1')).toContainText('Ein Zug. Zwei Ziele.');
});

test('Export-Code der Lernenden erscheint in der Lehrkraft-Übersicht', async ({ page }) => {
  await watchScene(page); await identifyScene(page);
  await solve(page, 'e5', 'c6', 'd8'); await button(page, 'Weiter').click();
  await page.getByText('Fortschritt für die Lehrkraft exportieren').click();
  await page.getByLabel(/Kürzel/).fill('Fuchs-7');
  await button(page, 'Code erzeugen').click();
  const code = await page.locator('#code').inputValue();
  expect(code).toMatch(/^SL1\./);
  await page.goto('/lehrkraft/');
  await page.locator('#codes').fill(`${code}\nkaputt`);
  await expect(page.locator('table')).toContainText('Fuchs-7');
  await expect(page.locator('table')).toContainText('An 1 Tag ohne Lösungshilfe gelöst');
  await expect(page.locator('p[role="alert"]')).toContainText('Zeile 2');
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(result.violations.map(v => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});
