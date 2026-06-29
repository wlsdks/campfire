import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off', // ffmpeg 번들 미설치(다운로드 stall) — 영상 녹화 비활성화. 스크린샷으로 진단
    actionTimeout: 15_000,
  },
  projects: [
    {
      name: 'chromium',
      // 번들 크로미움 다운로드가 stall → 이미 설치된 시스템 Chrome 사용(다운로드 불필요)
      use: { browserName: 'chromium', channel: 'chrome' },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
