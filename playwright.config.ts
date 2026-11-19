import { defineConfig, devices } from '@playwright/test';

// Runs against the production build served by `vite preview` under the GitHub Pages base path.
// WebGL in headless Chromium uses SwiftShader (software rendering); fine for functional checks.
const BASE = '/human-atlas/';
export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  expect: { timeout: 30_000 },
  reporter: [['list']],
  workers: 1,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://localhost:4173${BASE}`,
    viewport: { width: 1280, height: 800 },
    launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  webServer: {
    command: 'npm run build && npm run preview',
    env: { BASE_PATH: BASE },
    url: `http://localhost:4173${BASE}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
