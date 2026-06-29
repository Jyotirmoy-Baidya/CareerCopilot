import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals:     true,
    setupFiles:  ['./tests/setup.ts'],
    include:     ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include:  [
        'services/auth/src/**/*.ts',
        'services/recommendation/src/**/*.ts',
        'apps/web/src/lib/**/*.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@careercopliot/db':    path.resolve(__dirname, 'packages/db/index.ts'),
      '@careercopliot/types': path.resolve(__dirname, 'packages/types/index.ts'),
      '@careercopliot/utils': path.resolve(__dirname, 'packages/utils/index.ts'),
      '@':                    path.resolve(__dirname, 'apps/web/src'),
    },
  },
});
