import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      input: {
        landing: resolve(import.meta.dirname, 'index.html'),
        game: resolve(import.meta.dirname, 'game/index.html'),
        learn: resolve(import.meta.dirname, 'learn/index.html'),
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/game/test/setup.ts'],
  },
});
