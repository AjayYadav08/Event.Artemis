import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 20000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://ajayyadav@localhost:5432/event_artemis_test?schema=public',
      JWT_ACCESS_SECRET: 'test-access-secret-123456',
      JWT_REFRESH_SECRET: 'test-refresh-secret-123456',
      UPLOAD_DIR: './uploads-test',
    },
  },
});

