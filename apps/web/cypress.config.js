import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.js',
    video: false,
    // Retry flaky tests twice in CI; E2E depends on backend/frontend being up.
    retries: { runMode: 2, openMode: 0 },
    defaultCommandTimeout: 15000,
  },
});
