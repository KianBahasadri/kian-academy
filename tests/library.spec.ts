import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { STORAGE_KEY } from '../src/model';

test('resource editing, notes, and progress survive a reload', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Add resource', exact: true }).click();
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('A course I chose');
  await page.getByRole('textbox', { name: 'Link optional' }).fill('https://example.com/course');
  await page.getByRole('combobox', { name: 'Subject', exact: true }).fill('Physics');
  await page.getByRole('dialog').getByRole('button', { name: 'Add resource', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('A course I chose');
  await page.getByRole('button', { name: 'Start learning' }).click();
  await expect(page.getByRole('combobox', { name: 'Resource status' })).toHaveValue('learning');
  await page.getByRole('textbox', { name: 'Your notes' }).fill('Continue at chapter two.');
  await page.getByRole('slider', { name: 'Resource progress' }).press('End');
  await expect(page.getByRole('combobox', { name: 'Resource status' })).toHaveValue('completed');
  await page.getByRole('button', { name: 'Edit details' }).click();
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('My physics course');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Details for My physics course' }).click();
  await expect(page.getByRole('slider', { name: 'Resource progress' })).toHaveValue('100');
  await expect(page.getByRole('textbox', { name: 'Your notes' })).toHaveValue('Continue at chapter two.');
  await expect(page.getByRole('link', { name: 'Open resource', exact: true })).toHaveAttribute('href', 'https://example.com/course');
  expect(errors).toEqual([]);
});

test('user writing links to a resource and survives removing and restoring that resource', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Practice', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Make something with what you learn' })).toBeVisible();
  await page.getByRole('link', { name: 'Resources', exact: true }).click();
  await page.getByRole('button', { name: 'Create practice for Essence of linear algebra' }).click();
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('Vectors in my own words');
  await page.getByRole('textbox', { name: 'Your writing' }).fill('A vector has both direction and magnitude.\n\nI can explain it with a drawing.');
  await page.getByRole('combobox', { name: 'Status', exact: true }).selectOption('finished');
  await page.getByRole('button', { name: 'Save practice' }).click();
  await expect(page.getByRole('dialog')).toContainText('A vector has both direction and magnitude.');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'View practice for Essence of linear algebra' }).click();
  await expect(page.getByRole('row')).toHaveCount(2);
  await expect(page.getByRole('row').last()).toContainText('Vectors in my own words');
  await page.reload();
  await page.getByRole('button', { name: 'Essence of linear algebra', exact: true }).click();
  await page.getByRole('button', { name: 'Remove resource', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Your related practice will stay');
  await page.getByRole('alert').getByRole('button', { name: 'Remove resource' }).click();
  await expect(page.getByRole('row').last()).toContainText('Independent');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByRole('row').last()).toContainText('Essence of linear algebra');
  await page.getByRole('button', { name: 'Details for Vectors in my own words' }).click();
  await expect(page.getByRole('dialog')).toContainText('I can explain it with a drawing.');
  await expect(page.getByRole('dialog')).toContainText('Finished');
});

test('independent video practice validates links and can be edited and removed', async ({ page }) => {
  await page.goto('/#/practice');
  await page.getByRole('button', { name: 'Create practice', exact: true }).click();
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('My explanation');
  await page.getByRole('combobox', { name: 'Format', exact: true }).selectOption('Video');
  await page.getByRole('combobox', { name: 'Status', exact: true }).selectOption('finished');
  await page.getByRole('button', { name: 'Save practice' }).click();
  await expect(page.getByRole('alert')).toContainText('before marking it finished');
  await page.getByRole('textbox', { name: 'Link to your work' }).fill('javascript:alert(1)');
  await page.getByRole('button', { name: 'Save practice' }).click();
  await expect(page.getByRole('alert')).toContainText('https:// or http://');
  await page.getByRole('textbox', { name: 'Link to your work' }).fill('https://example.com/my-video');
  await page.getByRole('button', { name: 'Save practice' }).click();
  await expect(page.getByRole('link', { name: 'Open work' })).toHaveAttribute('href', 'https://example.com/my-video');
  await page.getByRole('button', { name: 'Edit practice', exact: true }).click();
  await page.getByRole('textbox', { name: 'Notes about your work' }).fill('A demonstration I recorded.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Details for My explanation' }).click();
  await expect(page.getByRole('dialog')).toContainText('A demonstration I recorded.');
  await page.getByRole('button', { name: 'Remove practice', exact: true }).click();
  await page.getByRole('alert').getByRole('button', { name: 'Remove practice' }).click();
  await expect(page.getByRole('heading', { name: 'Make something with what you learn' })).toBeVisible();
});

test('search, combined filters, sorting and empty results work', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('tbody tr')).toHaveCount(8);
  await page.getByRole('combobox', { name: 'Filter by subject' }).selectOption('Mathematics');
  await page.getByRole('combobox', { name: 'Filter by format' }).selectOption('Course');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody')).toContainText('Single Variable Calculus');
  await page.getByRole('searchbox').fill('does not exist');
  await expect(page.getByRole('heading', { name: 'No matches here' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByRole('combobox', { name: 'Sort collection' }).selectOption('title');
  await expect(page.locator('tbody tr').first()).toContainText('Biology 2e');
  await page.getByRole('button', { name: 'Completed 0', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No matches here' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.keyboard.press('/');
  await expect(page.getByRole('searchbox')).toBeFocused();
  await page.getByRole('searchbox').fill('3Blue1Brown');
  await expect(page.locator('tbody tr')).toHaveCount(1);
});

test('backup export and reviewed restore round-trip the library and reject invalid files', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'This device', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download backup' }).click();
  const download = await downloadPromise;
  const content = await readFile((await download.path())!, 'utf8');
  const exported = JSON.parse(content);
  expect(exported.resources).toHaveLength(8);
  expect(exported.practice).toHaveLength(0);
  await page.getByLabel('Choose backup', { exact: true }).setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"version":2}') });
  await expect(page.getByRole('alert')).toContainText('not a valid Kian Academy backup');
  await expect(page.getByRole('dialog')).toContainText('8 resources');
  const restored = { ...exported, resources: exported.resources.slice(0, 1) };
  await page.getByLabel('Choose backup', { exact: true }).setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(restored)) });
  await expect(page.getByRole('heading', { name: 'Restore this backup?' })).toBeVisible();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).resources.length, STORAGE_KEY)).toBe(8);
  await page.getByRole('button', { name: 'Restore library', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('tbody tr')).toHaveCount(1);
});

test('damaged saves are preserved instead of silently resetting the user library', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(key => localStorage.setItem(key, '{broken save'), STORAGE_KEY);
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('kept untouched');
  await expect(page.getByRole('button', { name: 'Add resource', exact: true })).toBeDisabled();
  expect(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)).toBe('{broken save');
});

test('failed saves stay visible and unsaved work can be downloaded', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Storage is full', 'QuotaExceededError'); };
  });
  await page.getByRole('button', { name: 'Details for Essence of linear algebra' }).click();
  await page.getByRole('textbox', { name: 'Your notes' }).fill('Keep this note even if storage is full.');
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('could not be saved');
  await expect(page.getByRole('dialog')).toContainText('Not saved to device');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('alert').getByRole('button', { name: 'Download backup' }).click();
  const download = await downloadPromise;
  const backup = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(backup.resources.find((resource: { id: string }) => resource.id === 'linear-algebra').notes).toBe('Keep this note even if storage is full.');
});

test('phone layout, theme persistence, modal focus and keyboard navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Details for Essence of linear algebra' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Details for Essence of linear algebra' })).toBeFocused();
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('searchbox')).toBeFocused();
  await page.getByRole('link', { name: 'Practice', exact: true }).click();
  await page.getByRole('button', { name: 'Create practice', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Title', exact: true })).toBeFocused();
  expect(await page.getByRole('dialog').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
});
