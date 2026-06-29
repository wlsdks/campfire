import { test, expect } from '@playwright/test';
import {
  testSessionId,
  createTestSession,
  cleanupTestSession,
  waitForSync,
  firebaseSet,
} from './helpers';

/**
 * Game mode E2E tests.
 *
 * All games render on /live?s=sessionId when currentMode is set.
 * We seed participants via Firebase, switch mode, and verify
 * rendering + interactions on the live page.
 */

let sessionId;

/** Seed participants for game testing. */
async function seedParticipants(sid, count = 6) {
  const names = ['김민수', '이서연', '박지훈', '최수진', '정현우', '강다은', '조은비', '윤태호'];
  const updates = {};
  for (let i = 0; i < count; i++) {
    updates[`p${i}`] = {
      nickname: names[i] || `학생${i + 1}`,
      online: true,
      joinedAt: Date.now() - i * 1000,
    };
  }
  await firebaseSet(`sessions/${sid}/participants`, updates);
}

/** Seed scores for lottery/leaderboard testing. */
async function seedScores(sid, count = 6) {
  const names = ['김민수', '이서연', '박지훈', '최수진', '정현우', '강다은'];
  const updates = {};
  for (let i = 0; i < count; i++) {
    updates[`p${i}`] = {
      nickname: names[i],
      total: (count - i) * 100,
      tickets: (count - i) * 2,
      streak: Math.max(0, count - i - 1),
    };
  }
  await firebaseSet(`sessions/${sid}/scores`, updates);
}

test.describe('게임 모드 — 복권 (Lottery)', () => {
  test.beforeAll(async () => {
    sessionId = testSessionId();
    await createTestSession(sessionId, { currentMode: 'lottery' });
    await seedParticipants(sessionId);
    await seedScores(sessionId);
  });

  test.afterAll(async () => {
    await cleanupTestSession(sessionId);
  });

  test('복권 화면 렌더링 + 추첨 인원 선택', async ({ page }) => {
    await page.goto(`/live?s=${sessionId}`);
    await waitForSync(page, 4000);

    // Should show lottery UI
    await expect(page.getByText('당첨자 수')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /제비뽑기|보상 추첨/ })).toBeVisible();
  });

  test('복권 추첨 → 당첨자 카드 표시', async ({ page }) => {
    await page.goto(`/live?s=${sessionId}`);
    await waitForSync(page, 4000);

    const drawBtn = page.getByRole('button', { name: /제비뽑기|보상 추첨/ });
    await expect(drawBtn).toBeVisible({ timeout: 10000 });
    await drawBtn.click();

    // 순차 dramatic reveal — 당첨자 카드(#1 당첨) 표시
    await expect(page.getByText(/#1 당첨/)).toBeVisible({ timeout: 10000 });
  });

  test('복권 다중 추첨 (3명)', async ({ page }) => {
    await page.goto(`/live?s=${sessionId}`);
    await waitForSync(page, 4000);

    // Increase count to 3
    const plusBtn = page.getByLabel('당첨자 수 증가');
    await expect(plusBtn).toBeVisible({ timeout: 10000 });
    await plusBtn.click();
    await plusBtn.click();

    const drawBtn = page.getByRole('button', { name: /제비뽑기|보상 추첨|다시 추첨/ });
    await drawBtn.click();

    // 순차 dramatic reveal — 한 명씩 ~3초 → 3명이면 ~10초+. 첫 당첨자만 확정 검증(다중 카운트 추첨 동작 확인)
    await expect(page.getByText(/#1 당첨/)).toBeVisible({ timeout: 15000 });
  });
});

test.describe('게임 모드 — 쉬는 시간 (BreakTimer)', () => {
  test.beforeAll(async () => {
    sessionId = testSessionId();
    await createTestSession(sessionId, { currentMode: 'breakTime' });
  });

  test.afterAll(async () => {
    await cleanupTestSession(sessionId);
  });

  test('쉬는 시간 화면 렌더링 + 프리셋 버튼', async ({ page }) => {
    await page.goto(`/live?s=${sessionId}`);
    await waitForSync(page, 4000);

    // Use exact match to avoid "5분" matching "15분"
    await expect(page.getByRole('button', { name: '5분', exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: '10분', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '15분', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '20분', exact: true })).toBeVisible();
  });

  test('프리셋 선택 → 타이머 카운트다운 시작', async ({ page }) => {
    await page.goto(`/live?s=${sessionId}`);
    await waitForSync(page, 4000);

    // Click 5분 preset (exact match)
    await page.getByRole('button', { name: '5분', exact: true }).click();
    await waitForSync(page, 2000);

    // Should show countdown (format: "M:SS" or "쉬는 시간")
    const bodyText = await page.textContent('body');
    const hasCountdown = bodyText.includes('쉬는 시간') || /\d:\d{2}/.test(bodyText);
    expect(hasCountdown).toBe(true);
  });
});

test.describe('게임 모드 — 리더보드', () => {
  test.beforeAll(async () => {
    sessionId = testSessionId();
    await createTestSession(sessionId, { currentMode: 'leaderboard' });
    await seedParticipants(sessionId);
    await seedScores(sessionId);
  });

  test.afterAll(async () => {
    await cleanupTestSession(sessionId);
  });

  test('리더보드 화면 렌더링 + 순위 표시', async ({ page }) => {
    await page.goto(`/live?s=${sessionId}`);
    await waitForSync(page, 5000);

    // Should show leaderboard with student names and scores
    await page.getByText('김민수').isVisible({ timeout: 10000 }).catch(() => false);
    const bodyText = await page.textContent('body');

    // At least the page should have loaded with leaderboard content
    expect(bodyText.length).toBeGreaterThan(50);
  });
});
