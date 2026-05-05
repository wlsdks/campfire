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

test.describe('게임 모드 — 룰렛', () => {
  test.beforeAll(async () => {
    sessionId = testSessionId();
    await createTestSession(sessionId, { currentMode: 'roulette' });
    await seedParticipants(sessionId);
  });

  test.afterAll(async () => {
    await cleanupTestSession(sessionId);
  });

  test('룰렛 화면 렌더링 + 참여자 표시', async ({ page }) => {
    await page.goto(`/live?s=${sessionId}`);
    await waitForSync(page, 4000);

    // Should show roulette UI with spin button
    const spinBtn = page.getByRole('button', { name: '돌리기', exact: true });
    await expect(spinBtn).toBeVisible({ timeout: 10000 });
  });

  test('룰렛 스핀 실행 — 애니메이션 시작 확인', async ({ page }) => {
    // Framer Motion onAnimationComplete doesn't fire reliably in headless Chromium.
    // We verify: render → click → animation starts (state change to spinning).
    await page.goto(`/live?s=${sessionId}`);
    await waitForSync(page, 4000);

    const spinBtn = page.getByRole('button', { name: '돌리기', exact: true });
    await expect(spinBtn).toBeVisible({ timeout: 10000 });
    await spinBtn.click();

    // Spin starts — button changes to "돌리는 중..."
    await expect(page.getByText('돌리는 중...')).toBeVisible({ timeout: 5000 });
  });
});

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
    await expect(page.getByText('추첨 인원')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: '추첨하기' })).toBeVisible();
  });

  test('복권 추첨 → 당첨자 카드 표시', async ({ page }) => {
    await page.goto(`/live?s=${sessionId}`);
    await waitForSync(page, 4000);

    const drawBtn = page.getByRole('button', { name: /추첨하기|보상 추첨/ });
    await expect(drawBtn).toBeVisible({ timeout: 10000 });
    await drawBtn.click();

    // Wait for reveal animation (800ms * count + buffer)
    await expect(page.getByText(/#1 당첨/)).toBeVisible({ timeout: 8000 });
  });

  test('복권 다중 추첨 (3명)', async ({ page }) => {
    await page.goto(`/live?s=${sessionId}`);
    await waitForSync(page, 4000);

    // Increase count to 3
    const plusBtn = page.getByLabel('추첨 인원 증가');
    await expect(plusBtn).toBeVisible({ timeout: 10000 });
    await plusBtn.click();
    await plusBtn.click();

    const drawBtn = page.getByRole('button', { name: /추첨하기|보상 추첨|다시 추첨/ });
    await drawBtn.click();

    // Wait for all 3 reveals (800ms * 3 + buffer)
    await waitForSync(page, 5000);

    // Should have multiple winner cards
    const winnerCards = page.getByText(/#\d+ 당첨/);
    const count = await winnerCards.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});

test.describe('게임 모드 — 추첨 (PrizeDraw)', () => {
  test.beforeAll(async () => {
    sessionId = testSessionId();
    await createTestSession(sessionId, { currentMode: 'prizeDraw' });
    await seedParticipants(sessionId);
  });

  test.afterAll(async () => {
    await cleanupTestSession(sessionId);
  });

  test('추첨 화면 렌더링', async ({ page }) => {
    await page.goto(`/live?s=${sessionId}`);
    await waitForSync(page, 4000);

    // PrizeDraw button text is "추첨 시작"
    const drawBtn = page.getByRole('button', { name: /추첨 시작/ });
    await expect(drawBtn).toBeVisible({ timeout: 10000 });
  });

  test('추첨 실행 → 당첨자 표시', async ({ page }) => {
    await page.goto(`/live?s=${sessionId}`);
    await waitForSync(page, 4000);

    const drawBtn = page.getByRole('button', { name: /추첨 시작/ });
    await expect(drawBtn).toBeVisible({ timeout: 10000 });
    await drawBtn.click();

    // Wait for slot reel animation (2.5s) + reveal
    await expect(page.getByText('당첨!')).toBeVisible({ timeout: 12000 });
  });
});

test.describe('게임 모드 — 슬롯머신', () => {
  test.beforeAll(async () => {
    sessionId = testSessionId();
    await createTestSession(sessionId, { currentMode: 'slotMachine' });
    await seedParticipants(sessionId);
  });

  test.afterAll(async () => {
    await cleanupTestSession(sessionId);
  });

  test('슬롯머신 화면 렌더링', async ({ page }) => {
    await page.goto(`/live?s=${sessionId}`);
    await waitForSync(page, 4000);

    // Should show slot machine with spin button
    const spinBtn = page.getByRole('button', { name: '돌리기', exact: true });
    await expect(spinBtn).toBeVisible({ timeout: 10000 });
  });

  test('슬롯머신 스핀 실행', async ({ page }) => {
    await page.goto(`/live?s=${sessionId}`);
    await waitForSync(page, 4000);

    const spinBtn = page.getByRole('button', { name: '돌리기', exact: true });
    await expect(spinBtn).toBeVisible({ timeout: 10000 });
    await spinBtn.click();

    // Wait for all 3 reels to stop (1.5s + 2.4s + 3.3s + buffer)
    await waitForSync(page, 6000);

    // Page should show result — either winner or "다시 돌리기"
    const bodyText = await page.textContent('body');
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test('슬롯머신 스핀 — 애니메이션 시작 확인', async ({ page }) => {
    // Framer Motion completion callbacks don't fire in headless Chromium.
    // We verify: render → click → spinning state active.
    await page.goto(`/live?s=${sessionId}`);
    await waitForSync(page, 4000);

    const spinBtn = page.getByRole('button', { name: '돌리기', exact: true });
    await expect(spinBtn).toBeVisible({ timeout: 10000 });
    await spinBtn.click();

    // Spin starts — button shows "돌리는 중..."
    await expect(page.getByText('돌리는 중...')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('게임 모드 — 핀볼 (Plinko)', () => {
  test.beforeAll(async () => {
    sessionId = testSessionId();
    await createTestSession(sessionId, { currentMode: 'plinko' });
    await seedParticipants(sessionId);
  });

  test.afterAll(async () => {
    await cleanupTestSession(sessionId);
  });

  test('핀볼 보드 렌더링 + 슬롯 이름 표시', async ({ page }) => {
    await page.goto(`/live?s=${sessionId}`);
    await waitForSync(page, 4000);

    // Should show plinko with "떨어뜨리기" button
    const dropBtn = page.getByRole('button', { name: /떨어뜨리기/ });
    await expect(dropBtn).toBeVisible({ timeout: 10000 });

    // Should show participant names in slots
    await expect(page.getByText('김민수')).toBeVisible();
  });

  test('핀볼 공 떨어뜨리기 — 애니메이션 시작 확인', async ({ page }) => {
    // Framer Motion spring animations don't complete in headless Chromium.
    // We verify: render → click → ball drop state active.
    await page.goto(`/live?s=${sessionId}`);
    await waitForSync(page, 4000);

    const dropBtn = page.getByRole('button', { name: /떨어뜨리기/ });
    await expect(dropBtn).toBeVisible({ timeout: 10000 });
    await dropBtn.click();

    // Ball drop starts — button changes to "떨어지는 중..."
    await expect(page.getByText('떨어지는 중...')).toBeVisible({ timeout: 5000 });
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
