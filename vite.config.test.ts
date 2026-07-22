import { describe, expect, it } from 'vitest';
import { configDefaults } from 'vitest/config';
import config from './vite.config';

describe('Vitest configuration', () => {
  it('excludes nested worktrees while preserving default and E2E exclusions', () => {
    expect(config.test?.exclude).toEqual([
      ...configDefaults.exclude,
      'e2e/**',
      '.worktrees/**',
    ]);
  });
});
