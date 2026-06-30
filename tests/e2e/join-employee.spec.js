import { test } from '@playwright/test';
import { testSessionId, createTestSession, cleanupTestSession, waitForSync } from './helpers';

/** 입장 화면 사번(선택) 옵션 캡처 — 닉네임만 입장 가능 + 사번 토글. */
test('입장 화면 — 닉네임 + 사번(선택) 토글', async ({ page, baseURL }) => {
  const sid = testSessionId();
  await createTestSession(sid);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseURL}/?s=${sid}`);
  await waitForSync(page, 1800);
  await page.screenshot({ path: 'test-results/responsive-extra/join-01-default.png' });

  // 닉네임 입력 + 사번 토글 펼치기
  await page.getByLabel('닉네임').fill('김참가');
  await page.getByRole('button', { name: /사번 입력하기/ }).click();
  await waitForSync(page, 600);
  await page.getByLabel('사번 (선택사항)').fill('20260042');
  await waitForSync(page, 400);
  await page.screenshot({ path: 'test-results/responsive-extra/join-02-employee.png' });
  await cleanupTestSession(sid);
});
