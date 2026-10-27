import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import type { Library } from '../src/model';
import { chooseOption } from './helpers';

const published = JSON.parse(readFileSync('data/library.json', 'utf8')) as Library;

const date = '2026-10-26T12:00:00Z';
const fixture: Library = {
  version: 1,
  resources: [
    { id: 'vectors', title: 'Vectors and transformations', creator: 'Test author', format: 'Playlist', tier: 3, subject: 'Mathematics', url: 'https://example.com/vectors', description: 'A visual introduction.', notes: 'Linear transformations preserve addition and scaling.', status: 'completed', progress: 100, createdAt: date, updatedAt: date },
    { id: 'python', title: 'Python basics', creator: 'Test teacher', format: 'Course', tier: 2, subject: 'Computer science', url: 'https://example.com/python', description: '', notes: 'Functions and small programs.', status: 'learning', progress: 40, createdAt: date, updatedAt: date },
    { id: 'writing', title: 'Clear prose', creator: 'Test writer', format: 'Book', tier: 1, subject: 'Writing', url: '', description: '', notes: '', status: 'planned', progress: 0, createdAt: date, updatedAt: date },
  ],
  practice: [
    { id: 'essay', title: 'Explaining a matrix', format: 'Essay', subject: 'Mathematics', resourceId: 'vectors', url: '', content: 'A matrix describes a transformation.\n\nThe basis vectors show what it does.', status: 'finished', createdAt: date, updatedAt: date },
    { id: 'video', title: 'A recorded explanation', format: 'Video', subject: 'Mathematics', resourceId: null, url: 'https://example.com/my-video', content: 'A short demonstration.', status: 'finished', createdAt: date, updatedAt: date },
  ],
};

async function useFixture(page: Page, read: () => Library = () => fixture) {
  await page.route('**/src/library.ts', route => route.fulfill({ contentType: 'application/javascript', body: `export const library = ${JSON.stringify(read())}; export const repositoryUrl = 'https://github.com/KianBahasadri/kian-academy';` }));
  await page.goto('/');
}

test('loads committed data without browser storage or account/API requests', async ({ page }) => {
  const errors: string[] = [], apiRequests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (/\/api\/|clerk\./.test(request.url())) apiRequests.push(request.url()); });
  await page.addInitScript(() => {
    const forbidden = () => { throw new Error('The published page must not use browser storage'); };
    Storage.prototype.getItem = forbidden; Storage.prototype.setItem = forbidden; Storage.prototype.removeItem = forbidden;
  });
  await page.goto('/');
  await expect(page.locator('tbody tr')).toHaveCount(published.resources.length);
  await expect(page.getByRole('button', { name: /sign in|add resource|create practice/i })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'View source' })).toHaveAttribute('href', 'https://github.com/KianBahasadri/kian-academy');
  await page.getByRole('link', { name: 'Practice', exact: true }).click();
  if (published.practice.length) await expect(page.locator('tbody tr')).toHaveCount(published.practice.length);
  else await expect(page.getByRole('heading', { name: 'No practice published yet' })).toBeVisible();
  expect(errors).toEqual([]); expect(apiRequests).toEqual([]);
});

test('search, combined filters, sorting and status tabs find published resources', async ({ page }) => {
  await useFixture(page);
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await chooseOption(page, 'Filter by subject', 'Mathematics');
  await chooseOption(page, 'Filter by format', 'Playlist');
  await page.getByRole('searchbox').fill('scaling');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody')).toContainText('Vectors and transformations');
  await page.getByRole('searchbox').fill('no matching entry');
  await expect(page.getByRole('heading', { name: 'No matches here' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByRole('button', { name: 'Sort by Resource', exact: true }).click();
  await expect(page.locator('tbody tr').first()).toContainText('Clear prose');
  await page.getByRole('button', { name: 'Completed 1', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody')).toContainText('Vectors and transformations');
});

test('resource tiers filter and sort independently of progress and explain the five levels', async ({ page }) => {
  await useFixture(page);
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  const tiers = page.getByRole('combobox', { name: 'Filter by tier', exact: true });
  await tiers.click();
  await expect(page.getByRole('listbox', { name: 'Filter by tier', exact: true }).getByRole('option')).toHaveText(['All tiers', 'Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Tier 5']);
  await chooseOption(page, 'Filter by tier', 'Tier 2');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody')).toContainText('Python basics');
  await expect(page.getByRole('cell', { name: 'Tier 2', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Details for Python basics' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Tier 2', { exact: true })).toBeVisible();
  await expect(dialog).toContainText('Builds on entry-level familiarity with the topic.');
  await expect(dialog.getByRole('progressbar')).toHaveAttribute('value', '40');
  await page.keyboard.press('Escape');
  await chooseOption(page, 'Filter by tier', 'Tier 3');
  await expect(page.locator('tbody')).toContainText('Vectors and transformations');
  await expect(page.locator('tbody')).toContainText('Completed');
  await chooseOption(page, 'Filter by tier', 'Tier 5');
  await expect(page.getByRole('heading', { name: 'No matches here' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(tiers).toHaveValue('All tiers');
  await page.getByRole('button', { name: 'Sort by Tier', exact: true }).click();
  await expect(page.locator('tbody tr').nth(0)).toContainText('Clear prose');
  await expect(page.locator('tbody tr').nth(1)).toContainText('Python basics');
  await expect(page.locator('tbody tr').nth(2)).toContainText('Vectors and transformations');
  await page.getByRole('button', { name: 'Help', exact: true }).click();
  for (const value of [1, 2, 3, 4, 5]) await expect(dialog.getByText(`Tier ${value}`, { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: /^Practice/ }).click();
  await expect(tiers).toHaveCount(0);
  await expect(page.getByRole('columnheader', { name: 'Tier', exact: true })).toHaveCount(0);
});

test('header search filters commands and returns focus after actions and dismissal', async ({ page }) => {
  await useFixture(page);
  const launcher = page.getByRole('button', { name: 'Open search and commands', exact: true });
  await launcher.click();
  const dialog = page.getByRole('dialog', { name: 'Search and commands', exact: true });
  const input = dialog.getByRole('combobox', { name: 'Search commands', exact: true });
  await expect(input).toBeFocused();
  await expect(launcher).toHaveAttribute('aria-expanded', 'true');
  await expect(dialog.getByRole('option')).toHaveCount(4);
  await expect(dialog.getByRole('option', { name: 'Jump to…', exact: true })).toHaveAttribute('aria-selected', 'true');
  await input.fill('tHeMe');
  await expect(dialog.getByRole('option', { name: 'Toggle theme', exact: true })).toBeVisible();
  await expect(dialog.getByRole('option')).toHaveCount(1);
  await page.keyboard.press('Enter');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(launcher).toBeFocused();

  await launcher.click();
  await input.fill('no matching command');
  await expect(dialog.getByText('No matching commands', { exact: true })).toBeVisible();
  expect(await input.getAttribute('aria-activedescendant')).toBeNull();
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(launcher).toBeFocused();

  await launcher.click();
  await input.fill('collection');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('searchbox')).toBeFocused();
  await page.getByRole('searchbox').fill('Python');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody')).toContainText('Python basics');
});

test('command navigation and shortcuts work on phones without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await useFixture(page);
  const launcher = page.getByRole('button', { name: 'Open search and commands', exact: true });
  await expect(launcher).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await launcher.click();
  await page.keyboard.press('Enter');
  const pages = page.getByRole('dialog', { name: 'Jump to a page', exact: true });
  const input = pages.getByRole('combobox', { name: 'Jump to a page', exact: true });
  await expect(input).toBeFocused();
  await expect(pages.getByRole('option')).toHaveCount(2);
  await input.fill('practice');
  await expect(pages.getByRole('option', { name: 'Practice', exact: true })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: /^Practice/ })).toHaveAttribute('aria-current', 'page');
  await page.keyboard.press('Alt+1');
  await expect(page.getByRole('link', { name: 'Resources', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.keyboard.press('Alt+j');
  await expect(pages).toBeVisible();
  await expect(input).toHaveValue('');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.mouse.click(1, 1);
  await expect(pages).toHaveCount(0);
  await expect(launcher).toBeFocused();

  await page.keyboard.press('Control+Space');
  const commands = page.getByRole('dialog', { name: 'Search and commands', exact: true });
  await commands.getByRole('combobox').fill('shortcuts');
  await page.keyboard.press('Enter');
  const shortcuts = page.getByRole('dialog', { name: 'Keyboard shortcuts', exact: true });
  await expect(shortcuts).toBeVisible();
  await expect(shortcuts).toContainText('Space');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.keyboard.press('Escape');
  await expect(launcher).toBeFocused();
  await page.keyboard.press('Alt+Shift+t');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('details show read-only progress, notes, and related writing', async ({ page }) => {
  await useFixture(page);
  await page.getByRole('button', { name: 'Details for Vectors and transformations' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Linear transformations preserve addition and scaling.');
  await expect(dialog.getByRole('progressbar')).toHaveAttribute('value', '100');
  await expect(dialog.locator('input, textarea, select')).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: /edit|remove|create|mark completed/i })).toHaveCount(0);
  await expect(dialog.getByRole('link', { name: 'Open resource', exact: true })).toHaveAttribute('href', 'https://example.com/vectors');
  await dialog.getByRole('button', { name: /Explaining a matrix/ }).click();
  await expect(dialog).toContainText('The basis vectors show what it does.');
  await expect(dialog).toContainText('Finished');
});

test('related and independent practice can be browsed and linked work opens safely', async ({ page }) => {
  await useFixture(page);
  await page.getByRole('button', { name: 'View practice for Vectors and transformations' }).click();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody')).toContainText('Explaining a matrix');
  await page.getByRole('button', { name: 'Clear resource filter' }).click();
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await chooseOption(page, 'Filter by resource', 'Independent practice');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: 'Details for A recorded explanation' }).click();
  const link = page.getByRole('link', { name: 'Open work', exact: true });
  await expect(link).toHaveAttribute('href', 'https://example.com/my-video');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
});

test('Help appears beneath View source and opens the current collection guide without a visible page title', async ({ page }) => {
  await useFixture(page);
  const help = page.getByRole('button', { name: 'Help', exact: true });
  const source = (await page.getByRole('link', { name: 'View source', exact: true }).boundingBox())!;
  const button = (await help.boundingBox())!;
  expect(button.y).toBeGreaterThan(source.y + source.height);
  expect(Math.abs(button.x + button.width - source.x - source.width)).toBeLessThan(8);
  for (const [path, title] of [['resources', 'About learning resources'], ['practice', 'About practice']]) {
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: path === 'resources' ? 'Resources' : /^Practice/ }).click();
    await expect.poll(() => page.locator('main h1').evaluate(heading => {
      const bounds = heading.getBoundingClientRect(); return bounds.width <= 1 && bounds.height <= 1;
    })).toBe(true);
    await help.click();
    await expect(page.getByRole('dialog', { name: title, exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(help).toBeFocused();
  }
});

test('styled dropdowns search, select by keyboard, and restore unmatched input on dismissal', async ({ page }) => {
  await useFixture(page);
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  const format = page.getByRole('combobox', { name: 'Filter by format', exact: true });
  const list = page.getByRole('listbox', { name: 'Filter by format', exact: true });
  await expect(page.locator('select')).toHaveCount(0);
  await format.click();
  await expect(list.getByRole('option')).toHaveCount(7);
  await expect(list.getByRole('option', { name: 'All formats', exact: true })).toHaveAttribute('aria-selected', 'true');
  await format.fill('  pLaYlIsT  ');
  await expect(list.getByRole('option')).toHaveText(['Playlist']);
  await expect(page.getByText('1 option available', { exact: true })).toHaveCount(1);
  await expect(format).toBeFocused();
  const optionId = await list.getByRole('option').getAttribute('id');
  await expect(format).toHaveAttribute('aria-activedescendant', optionId!);
  await expect(page.locator('tbody tr')).toHaveCount(3);
  await page.keyboard.press('Enter');
  await expect(format).toHaveValue('Playlist');
  await expect(page.locator('input[type="hidden"][name="Filter by format"]')).toHaveValue('Playlist');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await format.click(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  await expect(format).toHaveValue('Course');
  await expect(page.locator('tbody')).toContainText('Python basics');
  for (const key of ['Escape', 'Tab']) {
    await format.fill('No such format');
    await expect(list).toContainText('No matching options');
    await expect(list.getByRole('option')).toHaveCount(0);
    await format.press(key);
    await expect(format).toHaveValue('Course');
    await expect(list).toHaveCount(0);
  }
  await format.fill('  bOoK '); await format.press('Tab');
  await expect(format).toHaveValue('Book');
  await expect(page.locator('tbody')).toContainText('Clear prose');
  await format.fill('Another unmatched value');
  await page.getByRole('searchbox').click();
  await expect(format).toHaveValue('Book');
  await expect(page.getByRole('searchbox')).toBeFocused();
  await expect(list).toHaveCount(0);
});

test('dropdown lists fit phone viewports in both themes and wrap long resource labels', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  const longTitle = 'A very long learning resource title with a longidentifierthatmustwrapwithinthepopup';
  await useFixture(page, () => ({ ...fixture, resources: fixture.resources.map(resource => resource.id === 'vectors' ? { ...resource, title: longTitle } : resource) }));
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: /^Practice/ }).click();
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  const field = page.getByRole('combobox', { name: 'Filter by resource', exact: true });
  const list = page.getByRole('listbox', { name: 'Filter by resource', exact: true });
  for (const theme of ['dark', 'light']) {
    if (theme === 'light') await page.getByRole('button', { name: 'Switch to light theme', exact: true }).click();
    await field.click();
    await expect(list.getByRole('option', { name: longTitle, exact: true })).toBeVisible();
    const bounds = (await list.boundingBox())!, input = (await field.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(12);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(308);
    expect(bounds.y).toBeGreaterThanOrEqual(12);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(832);
    expect(Math.abs(bounds.width - input.width)).toBeLessThan(2);
    expect(await list.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await expect(list).toHaveCSS('background-color', theme === 'dark' ? 'rgb(21, 29, 33)' : 'rgb(255, 255, 255)');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    await page.keyboard.press('Escape');
    await expect(field).toBeFocused();
  }
  await expect(page.locator('select')).toHaveCount(0);
});

test('phone layout, keyboard focus and transient theme work without persistence', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await useFixture(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Details for Vectors and transformations' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Details for Vectors and transformations' })).toBeFocused();
  await page.keyboard.press('/'); await expect(page.getByRole('searchbox')).toBeFocused();
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('combobox', { name: 'Search commands', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open search and commands', exact: true })).toBeFocused();
});

test('a new published data version is reflected on reload', async ({ page }) => {
  const data = structuredClone(fixture);
  await useFixture(page, () => data);
  await page.getByRole('button', { name: 'Details for Python basics' }).click();
  await expect(page.getByRole('dialog')).toContainText('Functions and small programs.');
  data.resources[1].notes = 'New notes published in a later commit.';
  data.resources[1].progress = 75;
  await page.reload();
  await page.getByRole('button', { name: 'Details for Python basics' }).click();
  await expect(page.getByRole('dialog')).toContainText('New notes published in a later commit.');
  await expect(page.getByRole('dialog').getByRole('progressbar')).toHaveAttribute('value', '75');
});

test('publication validation rejects broken relationships without changing source data', async () => {
  const before = await readFile('data/library.json', 'utf8');
  const directory = await mkdtemp(join(tmpdir(), 'academy-invalid-data-'));
  try {
    const data = structuredClone(fixture); data.practice[0].resourceId = 'missing-resource';
    const path = join(directory, 'library.json'); await writeFile(path, JSON.stringify(data));
    const result = spawnSync(process.execPath, ['--experimental-strip-types', 'scripts/validate-data.mjs', path], { encoding: 'utf8' });
    expect(result.status).toBe(1); expect(result.stderr).toContain('Invalid practice');
    expect(await readFile('data/library.json', 'utf8')).toBe(before);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('publication validation requires an integer resource tier from 1 to 5', async () => {
  const before = await readFile('data/library.json', 'utf8');
  const directory = await mkdtemp(join(tmpdir(), 'academy-tier-validation-'));
  try {
    const path = join(directory, 'library.json');
    for (const tier of [1, 2, 3, 4, 5, undefined, null, 0, 6, 1.5, '2']) {
      const data = { ...fixture, resources: [{ ...fixture.resources[0], tier }, ...fixture.resources.slice(1)] };
      await writeFile(path, JSON.stringify(data));
      const result = spawnSync(process.execPath, ['--experimental-strip-types', 'scripts/validate-data.mjs', path], { encoding: 'utf8' });
      if (typeof tier === 'number' && Number.isInteger(tier) && tier >= 1 && tier <= 5) {
        expect(result.status, `Tier ${tier} must be accepted`).toBe(0);
      } else {
        expect(result.status, `Tier ${String(tier)} must be rejected`).toBe(1);
        expect(result.stderr).toContain('Invalid resources');
      }
    }
    expect(await readFile('data/library.json', 'utf8')).toBe(before);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
