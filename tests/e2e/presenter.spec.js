import { test, expect } from '@playwright/test';
import {
  testSessionId,
  createTestSession,
  activateQuestion,
  cleanupTestSession,
  waitForSync,
  firebaseSet,
} from './helpers';

/**
 * 전자칠판(/live, PresentationView/VizRenderer) 렌더 경로 e2e.
 * god-component 분해 리팩터의 안전망 — 질문 유형별 렌더 + 이미지 슬라이드 advance 동작 고정.
 * (게임 모드 렌더는 games.spec.js가 커버)
 */
let sessionId;

// 1×1 투명 PNG data URI — 슬라이드 구분용(네트워크 불필요)
const IMG_A = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const IMG_B = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

test.describe('전자칠판 — 질문 유형별 렌더', () => {
  test.beforeAll(async () => {
    sessionId = testSessionId();
    await createTestSession(sessionId);
  });
  test.afterAll(async () => { await cleanupTestSession(sessionId); });

  test('객관식 질문 렌더 — 제목 + 선택지 표시', async ({ page }) => {
    await activateQuestion(sessionId, 'q1');
    await page.goto(`/live?s=${sessionId}`);
    await waitForSync(page, 3000);
    await expect(page.getByText('좋아하는 프로그래밍 언어는?')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('JavaScript')).toBeVisible();
    await expect(page.getByText('Python')).toBeVisible();
  });

  test('퀴즈 질문 렌더 — 제목 표시', async ({ page }) => {
    await activateQuestion(sessionId, 'q4');
    await page.goto(`/live?s=${sessionId}`);
    await waitForSync(page, 3000);
    await expect(page.getByText('수도 퀴즈: 한국의 수도는?')).toBeVisible({ timeout: 10000 });
  });

  test('워드클라우드 질문 렌더 — 제목 표시', async ({ page }) => {
    await activateQuestion(sessionId, 'q3');
    await page.goto(`/live?s=${sessionId}`);
    await waitForSync(page, 3000);
    await expect(page.getByText('수업에서 가장 좋았던 점은?')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('전자칠판 — 이미지 슬라이드 advance (currentSlide)', () => {
  test.beforeEach(async () => {
    sessionId = testSessionId();
    await createTestSession(sessionId);
    // imageSlide 질문 추가
    await firebaseSet(`sessions/${sessionId}/questions/qimg`, {
      title: '이미지 슬라이드',
      type: 'imageSlide',
      slideImages: [IMG_A, IMG_B],
      order: 5,
    });
    await firebaseSet(`sessions/${sessionId}/questions/qimg/currentSlide`, 0);
    await activateQuestion(sessionId, 'qimg');
  });
  test.afterEach(async () => { await cleanupTestSession(sessionId); });

  test('currentSlide=0 → 첫 이미지, Firebase로 1로 변경 → 두번째 이미지로 전환', async ({ page }) => {
    await page.goto(`/live?s=${sessionId}`);
    await waitForSync(page, 3000);

    // 첫 슬라이드(IMG_A) 표시
    await expect(page.locator(`img[src="${IMG_A}"]`)).toBeVisible({ timeout: 10000 });

    // 강사가 다음 슬라이드로 — Firebase 질문 하위 currentSlide 갱신
    await firebaseSet(`sessions/${sessionId}/questions/qimg/currentSlide`, 1);
    await waitForSync(page, 2500);

    // 두번째 슬라이드(IMG_B)로 전환됨
    await expect(page.locator(`img[src="${IMG_B}"]`)).toBeVisible({ timeout: 10000 });
  });
});
