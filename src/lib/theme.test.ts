import test from 'node:test';
import assert from 'node:assert/strict';
import { isThemePreference, resolveTheme } from './theme';

test('theme preference validation only accepts supported values', () => {
  assert.equal(isThemePreference('light'), true);
  assert.equal(isThemePreference('dark'), true);
  assert.equal(isThemePreference('system'), true);
  assert.equal(isThemePreference('sepia'), false);
  assert.equal(isThemePreference(null), false);
});

test('system theme resolves from system preference', () => {
  assert.equal(resolveTheme('system', true), 'dark');
  assert.equal(resolveTheme('system', false), 'light');
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('dark', false), 'dark');
});
