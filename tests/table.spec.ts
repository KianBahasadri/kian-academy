import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Library, Resource } from '../src/model';
import { filterRows, sortRows } from '../src/table';

const date = '2026-10-26T12:00:00Z';
const resource = (id: string, title: string, patch: Partial<Resource> = {}): Resource => ({ id, title, creator: 'Ann', format: 'Book', tier: 2, subject: 'Psychology', url: '', description: '', notes: '', status: 'learning', progress: 40, createdAt: date, updatedAt: date, ...patch });
const fixture: Library = {
  version: 1,
  resources: [
    resource('gamma', 'Gamma', { subject: 'Biology', status: 'completed', progress: 100 }),
    resource('epsilon', 'Epsilon', { creator: 'Zed' }),
    resource('beta', 'Beta', { creator: 'Zed', format: 'Article', tier: 1, status: 'planned', progress: 0 }),
    resource('delta', 'Delta', { creator: '', format: 'Course', subject: 'Biology', tier: 3 }),
    resource('alpha', 'Alpha', { notes: 'A note with "quotes", and a comma.\nSecond paragraph.' }),
  ],
  practice: [
    { id: 'essay', title: 'Alpha essay', format: 'Essay', subject: 'Psychology', resourceId: 'alpha', content: 'A practice response.', url: '', status: 'finished', createdAt: date, updatedAt: date },
    { id: 'notes', title: 'Independent notes', format: 'Notes', subject: 'Biology', resourceId: null, content: '', url: '', status: 'draft', createdAt: date, updatedAt: date },
  ],
};

async function load(page: Page, library = fixture) {
  await page.route('**/src/library.ts', route => route.fulfill({ contentType: 'application/javascript', body: `export const library = ${JSON.stringify(library)}; export const repositoryUrl = 'https://github.com/KianBahasadri/kian-academy';` }));
  await page.goto('/');
}
const grid = (page: Page) => page.getByRole('region', { name: 'Resources table', exact: true });
const rowNames = (page: Page) => grid(page).locator('tbody .item-title').evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-label')!.replace('Details for ', '')));
const columnKeys = (page: Page) => grid(page).locator('thead th').evaluateAll(headers => headers.map(header => (header as HTMLElement).dataset.columnKey));
async function options(page: Page, title: string) {
  await page.getByRole('button', { name: `${title} column options`, exact: true }).click();
  return page.getByRole('group', { name: `Column actions for ${title}`, exact: true });
}

test('columns can be shown, hidden, reordered, reset, and kept separate for each collection', async ({ page }) => {
  await load(page);
  await page.getByRole('button', { name: 'Columns', exact: true }).click();
  const picker = page.getByRole('group', { name: 'Table columns', exact: true });
  await expect(picker.getByRole('checkbox', { name: 'Resource', exact: true })).toBeDisabled();
  await picker.getByRole('checkbox', { name: 'Creator', exact: true }).check();
  await picker.getByRole('checkbox', { name: 'Subject', exact: true }).uncheck();
  await expect(picker).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Columns', exact: true })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Sort by Creator', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sort by Subject', exact: true })).toHaveCount(0);
  const menu = await options(page, 'Creator');
  await menu.getByRole('menuitem', { name: 'Move right', exact: true }).click();
  await expect.poll(() => columnKeys(page)).toEqual(['title', 'format', 'creator', 'tier', 'progress', 'practice']);
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: /^Practice/ }).click();
  await expect(page.getByRole('button', { name: 'Sort by Subject', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sort by Creator', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Resources', exact: true }).click();
  await expect.poll(() => columnKeys(page)).toEqual(['title', 'format', 'creator', 'tier', 'progress', 'practice']);
  await page.getByRole('button', { name: 'Columns', exact: true }).click();
  await picker.getByRole('button', { name: 'Reset to default', exact: true }).click();
  await page.keyboard.press('Escape');
  expect(await columnKeys(page)).toEqual(['title', 'format', 'subject', 'tier', 'progress', 'practice']);
});

test('sorts cycle, combine by priority, reorder priorities, and restore original row order', async ({ page }) => {
  await load(page);
  const format = page.getByRole('button', { name: 'Sort by Format', exact: true });
  const progress = page.getByRole('button', { name: 'Sort by Progress', exact: true });
  const title = page.getByRole('button', { name: 'Sort by Resource', exact: true });
  await format.click(); await progress.click(); await title.click();
  expect(await rowNames(page)).toEqual(['Beta', 'Alpha', 'Epsilon', 'Gamma', 'Delta']);
  await expect(progress).toHaveAccessibleDescription('Sort priority 2 of 3, ascending');
  await expect(grid(page).locator('th[aria-sort]')).toHaveCount(1);
  await expect(grid(page).locator('th[aria-sort]')).toHaveAttribute('data-column-key', 'format');
  await title.click();
  expect(await rowNames(page)).toEqual(['Beta', 'Epsilon', 'Alpha', 'Gamma', 'Delta']);
  await expect(title).toHaveAccessibleDescription('Sort priority 3 of 3, descending');
  await title.click();
  await expect(title).toHaveAccessibleDescription('Unsorted');
  expect(await rowNames(page)).toEqual(['Beta', 'Epsilon', 'Alpha', 'Gamma', 'Delta']);
  await title.click();
  const menu = await options(page, 'Progress');
  await menu.getByRole('menuitem', { name: 'Sort priority', exact: false }).click();
  await page.getByRole('menu', { name: 'Progress sort priority', exact: true }).getByRole('menuitemradio').first().click();
  expect(await rowNames(page)).toEqual(['Beta', 'Alpha', 'Epsilon', 'Delta', 'Gamma']);
  await expect(progress).toHaveAccessibleDescription('Sort priority 1 of 3, ascending');
  await page.getByRole('button', { name: 'Clear sorting', exact: true }).click();
  expect(await rowNames(page)).toEqual(['Gamma', 'Epsilon', 'Beta', 'Delta', 'Alpha']);
});

test('choice filters include or exclude several values and remain accessible when the column is hidden', async ({ page }) => {
  await load(page);
  const menu = await options(page, 'Format');
  await menu.getByRole('checkbox', { name: 'Include Book', exact: true }).check();
  await menu.getByRole('checkbox', { name: 'Include Article', exact: true }).check();
  await expect(grid(page).locator('tbody tr')).toHaveCount(4);
  await menu.getByRole('checkbox', { name: 'Exclude Article', exact: true }).check();
  await expect(menu.getByRole('checkbox', { name: 'Include Article', exact: true })).not.toBeChecked();
  await expect(grid(page).locator('tbody tr')).toHaveCount(3);
  await menu.getByRole('menuitem', { name: 'Hide column', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Format column options', exact: true })).toHaveCount(0);
  const chip = page.getByRole('button', { name: 'Format: Book except Article', exact: true });
  await chip.click();
  const filter = page.getByRole('group', { name: 'Filter Format', exact: true });
  await expect(filter.getByRole('checkbox', { name: 'Include Book', exact: true })).toBeChecked();
  await expect(filter.getByRole('checkbox', { name: 'Exclude Article', exact: true })).toBeChecked();
  await filter.getByRole('button', { name: 'Clear filter', exact: true }).click();
  await expect(grid(page).locator('tbody tr')).toHaveCount(5);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Sort by Resource', exact: true })).toBeFocused();
});

test('column filters combine across fields and numeric filters respect validity and global controls', async ({ page }) => {
  await load(page);
  const menu = await options(page, 'Progress');
  await menu.getByRole('combobox', { name: 'Progress condition', exact: true }).selectOption('atLeast');
  await menu.getByRole('spinbutton', { name: 'Filter progress', exact: true }).fill('40');
  await expect(grid(page).locator('tbody tr')).toHaveCount(4);
  await menu.getByRole('combobox', { name: 'Progress condition', exact: true }).selectOption('atMost');
  await expect(grid(page).locator('tbody tr')).toHaveCount(4);
  await menu.getByRole('spinbutton', { name: 'Filter progress', exact: true }).fill('40.5');
  await expect(menu.getByRole('spinbutton')).toHaveAttribute('aria-invalid', 'true');
  await expect(grid(page).locator('tbody tr')).toHaveCount(4);
  await page.keyboard.press('Escape');
  const format = await options(page, 'Format');
  await format.getByRole('checkbox', { name: 'Include Book', exact: true }).check();
  await page.keyboard.press('Escape');
  expect(await rowNames(page)).toEqual(['Epsilon', 'Alpha']);
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByRole('combobox', { name: 'Filter by format', exact: true }).selectOption('Article');
  await expect(page.getByRole('button', { name: 'Remove Format filter', exact: true })).toHaveCount(0);
  expect(await rowNames(page)).toEqual(['Beta']);
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click();
  await expect(grid(page).locator('tbody tr')).toHaveCount(5);
  await expect(page.getByRole('group', { name: 'Column filters', exact: true })).toHaveCount(0);
});

test('column menus work by right click and keyboard, and widths reset after resizing', async ({ page }) => {
  await load(page, { ...fixture, resources: fixture.resources.map(item => item.id === 'gamma' ? { ...item, title: 'A long resource title that should wrap inside a resized column' } : item) });
  const header = grid(page).locator('th[data-column-key="format"]');
  await header.click({ button: 'right' });
  const menu = page.getByRole('group', { name: 'Column actions for Format', exact: true });
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');
  const sort = page.getByRole('button', { name: 'Sort by Format', exact: true });
  await expect(sort).toBeFocused();
  await page.keyboard.press('Shift+F10');
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');
  const width = (await header.boundingBox())!.width;
  const handle = page.getByRole('separator', { name: 'Resize Format column', exact: true });
  await handle.focus(); await page.keyboard.press('ArrowRight');
  await expect.poll(async () => (await header.boundingBox())!.width).toBeGreaterThan(width + 14);
  await page.keyboard.press('Home');
  await expect.poll(async () => Math.abs((await header.boundingBox())!.width - width)).toBeLessThan(2);
  const bounds = (await handle.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down(); await page.mouse.move(bounds.x + bounds.width / 2 + 48, bounds.y + bounds.height / 2, { steps: 8 }); await page.mouse.up();
  await expect.poll(async () => (await header.boundingBox())!.width).toBeGreaterThan(width + 40);
  await (await options(page, 'Format')).getByRole('menuitem', { name: 'Reset column width', exact: true }).click();
  await expect.poll(async () => Math.abs((await header.boundingBox())!.width - width)).toBeLessThan(2);
  await page.getByRole('separator', { name: 'Resize Resource column', exact: true }).focus();
  for (let index = 0; index < 20; index++) await page.keyboard.press('ArrowLeft');
  const primary = grid(page).locator('td.primary-cell').first();
  await expect.poll(() => primary.evaluate(cell => cell.querySelector('button')!.getBoundingClientRect().right <= cell.getBoundingClientRect().right - 11)).toBe(true);
});

test('dragging headers moves a column and Escape cancels a later drag', async ({ page }) => {
  await load(page);
  const format = grid(page).locator('th[data-column-key="format"]');
  const tier = grid(page).locator('th[data-column-key="tier"]');
  const from = (await format.boundingBox())!, target = (await tier.boundingBox())!;
  await page.mouse.move(from.x + 24, from.y + from.height / 2); await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 14 }); await page.mouse.up();
  await expect.poll(() => columnKeys(page)).toEqual(['title', 'subject', 'tier', 'format', 'progress', 'practice']);
  await expect(page.locator('.column-drag-layer')).toHaveCount(0);
  const moved = (await format.boundingBox())!;
  await page.mouse.move(moved.x + 24, moved.y + moved.height / 2); await page.mouse.down();
  await page.mouse.move(moved.x - 100, moved.y + moved.height / 2, { steps: 10 });
  await expect(page.locator('.column-drag-layer')).toHaveCount(1);
  await page.keyboard.press('Escape'); await page.mouse.up();
  await expect(page.locator('.column-drag-layer')).toHaveCount(0);
  expect(await columnKeys(page)).toEqual(['title', 'subject', 'tier', 'format', 'progress', 'practice']);
});

test('keyboard row selection survives sorting and details restore focus to the same resource', async ({ page }) => {
  await load(page);
  const gamma = page.getByRole('button', { name: 'Details for Gamma', exact: true });
  await gamma.focus(); await page.keyboard.press('ArrowDown');
  const epsilon = page.getByRole('button', { name: 'Details for Epsilon', exact: true });
  await expect(epsilon).toBeFocused();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Sort by Resource', exact: true }).click();
  await expect(epsilon).toHaveAttribute('tabindex', '0');
  await expect(grid(page).locator('tbody .item-title[tabindex="0"]')).toHaveCount(1);
  await epsilon.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toContainText('Epsilon');
  await expect(page.getByRole('dialog').locator('input, textarea, select')).toHaveCount(0);
  await page.keyboard.press('Escape'); await expect(epsilon).toBeFocused();
});

test('column preferences and filters reset on reload without browser storage', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = Storage.prototype.setItem = () => { throw new Error('Browser persistence is forbidden'); };
  });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await load(page);
  await (await options(page, 'Format')).getByRole('checkbox', { name: 'Include Book', exact: true }).check();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Columns', exact: true }).click();
  await page.getByRole('group', { name: 'Table columns', exact: true }).getByRole('checkbox', { name: 'Notes', exact: true }).check();
  await page.keyboard.press('Escape');
  await expect(grid(page).locator('tbody tr')).toHaveCount(3);
  await page.reload();
  await expect(grid(page).locator('tbody tr')).toHaveCount(5);
  expect(await columnKeys(page)).toEqual(['title', 'format', 'subject', 'tier', 'progress', 'practice']);
  expect(errors).toEqual([]);
});

test('CSV exports matching rows and visible column order with correct quoting', async ({ page }) => {
  await load(page);
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByRole('combobox', { name: 'Filter by format', exact: true }).selectOption('Book');
  await page.getByRole('button', { name: 'Columns', exact: true }).click();
  const picker = page.getByRole('group', { name: 'Table columns', exact: true });
  await picker.getByRole('checkbox', { name: 'Notes', exact: true }).check();
  await picker.getByRole('checkbox', { name: 'Subject', exact: true }).uncheck();
  await page.keyboard.press('Escape');
  await (await options(page, 'Format')).getByRole('menuitem', { name: 'Move left', exact: true }).click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export CSV', exact: true }).click()]);
  const csv = await readFile((await download.path())!, 'utf8');
  expect(csv).toContain('"Format","Resource","Tier","Progress","Practice","Notes"');
  expect(csv).toContain('"A note with ""quotes"", and a comma.\nSecond paragraph."');
  expect(csv).toContain('"Alpha"'); expect(csv).toContain('"Gamma"'); expect(csv).toContain('"Epsilon"');
  expect(csv).not.toContain('"Beta"'); expect(csv).not.toContain('"Delta"');
});

test('wide tables and column popovers stay inside a phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await load(page);
  await page.getByRole('button', { name: 'Columns', exact: true }).click();
  const picker = page.getByRole('group', { name: 'Table columns', exact: true });
  await picker.getByRole('checkbox', { name: 'Website', exact: true }).check();
  await page.keyboard.press('Escape');
  const menu = await options(page, 'Website');
  const bounds = (await menu.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(12);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(308);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Sort by Website', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  expect(await grid(page).evaluate(region => region.scrollWidth > region.clientWidth)).toBe(true);
});

test('unknown values stay last in both directions and text and numeric filters compose', () => {
  const rows = [{ id: 'a', n: 2, text: 'Alpha' }, { id: 'b', n: null, text: 'Beta' }, { id: 'c', n: 1, text: 'ALPHA' }, { id: 'd', n: 2, text: 'Alpha' }];
  const model = { value: (row: typeof rows[number], key: string) => key === 'n' ? row.n : row.text };
  expect(sortRows(rows, [{ key: 'n', direction: 1 }], model).map(row => row.id)).toEqual(['c', 'a', 'd', 'b']);
  expect(sortRows(rows, [{ key: 'n', direction: -1 }], model).map(row => row.id)).toEqual(['a', 'd', 'c', 'b']);
  expect(filterRows(rows, { n: { kind: 'number', operator: 'atLeast', value: 2 }, text: { kind: 'text', value: 'alpha' } }, model).map(row => row.id)).toEqual(['a', 'd']);
});

test('quick filters collapse while keeping active fields reachable and reset restores focus', async ({ page }) => {
  await load(page);
  const filters = page.getByRole('button', { name: 'Filters', exact: true });
  await expect(filters).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('combobox', { name: 'Filter by format', exact: true })).toHaveCount(0);
  await filters.click();
  await page.getByRole('combobox', { name: 'Filter by format', exact: true }).selectOption('Book');
  await filters.click();
  await expect(page.getByRole('group', { name: 'Active resources filters', exact: true })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Filter by format', exact: true })).toHaveValue('Book');
  await expect(page.getByRole('combobox', { name: 'Filter by subject', exact: true })).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Filter by format', exact: true }).selectOption('all');
  await expect(filters).toBeFocused();
  await expect(grid(page).locator('tbody tr')).toHaveCount(5);
});

test('pagination covers the full collection and resets after filtering', async ({ page }) => {
  const library: Library = { ...fixture, resources: Array.from({ length: 61 }, (_, index) => resource(`item-${index}`, `Item ${String(index).padStart(2, '0')}`)), practice: [] };
  await load(page, library);
  await expect(grid(page).locator('tbody tr')).toHaveCount(50);
  const pages = page.getByRole('navigation', { name: 'Resources pages', exact: true });
  await pages.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(grid(page).locator('tbody tr')).toHaveCount(11);
  await expect(page.getByRole('button', { name: 'Details for Item 50', exact: true })).toBeVisible();
  await page.getByRole('searchbox').fill('Item 00');
  await expect(grid(page).locator('tbody tr')).toHaveCount(1);
  await expect(pages).toHaveCount(0);
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click();
  await expect(grid(page).locator('tbody tr')).toHaveCount(50);
  await expect(pages.getByRole('button', { name: 'Previous', exact: true })).toBeDisabled();
});
