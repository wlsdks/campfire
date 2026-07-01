import { test } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** OG 카드(1200×630)를 public/og-image.jpg로 렌더. */
test('OG 카드 렌더', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.goto('file://' + path.resolve(__dirname, '../og-card.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200); // 폰트·그래디언트 안정화
  await page.screenshot({
    path: path.resolve(__dirname, '../../public/og-image.jpg'),
    type: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: 1200, height: 630 },
  });
});
