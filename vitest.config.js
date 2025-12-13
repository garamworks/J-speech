import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.js',
        '**/backup/',
        '**/*.backup'
      ]
    },
    include: ['src/**/*.test.js', 'server/**/*.test.js'],
    setupFiles: ['./test/setup.js']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@server': path.resolve(__dirname, './server')
    }
  }
});
