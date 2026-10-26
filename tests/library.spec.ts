import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import type { Library } from '../src/model';

const published = JSON.parse(readFileSync('data/library.json', 'utf8')) as Library;

const date = '2026-10-26T12:00:00Z';
const fixture: Library = {
  version: 1,
  resources: [
    { id: 'vectors', title: 'Vectors and transformations', creator: 'Test author', format: 'Playlist', subject: 'Mathematics', url: 'https://example.com/vectors', description: 'A visual introduction.', notes: 'Linear transformations preserve addition and scaling.', status: 'completed', progress: 100, createdAt: date, updatedAt: date },
    { id: 'python', title: 'Python basics', creator: 'Test teacher', format: 'Course', subject: 'Computer science', url: 'https://example.com/python', description: '', notes: 'Functions and small programs.', status: 'learning', progress: 40, createdAt: date, updatedAt: date },
    { id: 'writing', title: 'Clear prose', creator: 'Test writer', format: 'Book', subject: 'Writing', url: '', description: '', notes: '', status: 'planned', progress: 0, createdAt: date, updatedAt: date },
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
  await page.getByRole('combobox', { name: 'Filter by subject' }).selectOption('Mathematics');
  await page.getByRole('combobox', { name: 'Filter by format' }).selectOption('Playlist');
  await page.getByRole('searchbox').fill('scaling');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody')).toContainText('Vectors and transformations');
  await page.getByRole('searchbox').fill('no matching entry');
  await expect(page.getByRole('heading', { name: 'No matches here' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByRole('combobox', { name: 'Sort collection' }).selectOption('title');
  await expect(page.locator('tbody tr').first()).toContainText('Clear prose');
  await page.getByRole('button', { name: 'Completed 1', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody')).toContainText('Vectors and transformations');
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
  await page.getByRole('combobox', { name: 'Filter by resource' }).selectOption('independent');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: 'Details for A recorded explanation' }).click();
  const link = page.getByRole('link', { name: 'Open work', exact: true });
  await expect(link).toHaveAttribute('href', 'https://example.com/my-video');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
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
  await page.keyboard.press('Control+k'); await expect(page.getByRole('searchbox')).toBeFocused();
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
