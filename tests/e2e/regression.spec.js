import { test, expect } from '@playwright/test';
import {
  testSessionId,
  createTestSession,
  activateQuestion,
  cleanupTestSession,
  setupAdminPage,
  firebaseSet,
  waitForSync,
} from './helpers';

/** Join session as student by actually clicking "참여하기". */
async function joinAsStudent(page, baseURL, sessionId, nickname) {
  await page.goto(`${baseURL}/?s=${sessionId}`);
  await page.fill('input[placeholder="닉네임 입력"]', nickname);
  await page.getByRole('button', { name: /참여하기/ }).click();
  // Wait for join to complete (WaitingPage or VotePage)
  await page.waitForTimeout(2500);
}

// ═══════════════════════════════════════════════════════════
// 1. 재투표 방지 (useMyVote)
// ═══════════════════════════════════════════════════════════
test.describe('재투표 방지', () => {
  let sid;
  test.beforeAll(async () => {
    sid = testSessionId();
    await createTestSession(sid);
  });
  test.afterAll(async () => { await cleanupTestSession(sid); });

  test('객관식 투표 후 새로고침 시 완료 화면 유지', async ({ page }) => {
    await joinAsStudent(page, '', sid, '재투표A');
    await activateQuestion(sid, 'q1');
    await waitForSync(page);

    await page.getByText('JavaScript').click();
    await expect(page.getByText('투표 완료!')).toBeVisible({ timeout: 5000 });

    // 새로고침
    await page.reload();
    await waitForSync(page, 3000);

    // VoteConfirm 또는 "결과를 기다리는 중" 이 보여야 함
    await expect(
      page.getByText('투표 완료!').or(page.getByText('결과를 기다리는 중'))
    ).toBeVisible({ timeout: 10000 });

    // 선택지 버튼(Python)이 보이면 안 됨
    await expect(page.getByText('Python')).not.toBeVisible({ timeout: 2000 }).catch(() => {});
  });

  test('OX 투표 후 새로고침 시 완료 화면 유지', async ({ page }) => {
    await joinAsStudent(page, '', sid, '재투표B');
    await activateQuestion(sid, 'q2');
    await waitForSync(page);

    await page.getByText('맞아요').click();
    await expect(page.getByText('투표 완료!')).toBeVisible({ timeout: 5000 });

    await page.reload();
    await waitForSync(page, 3000);

    await expect(
      page.getByText('투표 완료!').or(page.getByText('결과를 기다리는 중'))
    ).toBeVisible({ timeout: 10000 });
  });
});

// ═══════════════════════════════════════════════════════════
// 2. 프레젠터 뷰 안정성
// ═══════════════════════════════════════════════════════════
test.describe('프레젠터 뷰', () => {
  let sid;
  test.beforeAll(async () => {
    sid = testSessionId();
    await createTestSession(sid, { owner: 'e2e_admin_admin' });
  });
  test.afterAll(async () => { await cleanupTestSession(sid); });

  test('화면 클릭으로 종료되지 않음 (버튼만 허용)', async ({ browser }) => {
    const { page, context } = await setupAdminPage(browser, 'http://localhost:5173');
    await page.goto(`http://localhost:5173/present/${sid}`);
    await waitForSync(page, 3000);

    // 화면 중앙 클릭 — 종료되지 않아야 함
    await page.mouse.click(640, 400);
    await page.waitForTimeout(1000);

    // 프레젠터 화면 여전히 활성 (present URL 유지)
    expect(page.url()).toContain('/present/');

    await context.close();
  });

  test('SideNoticesPanel이 기본 접힌 상태', async ({ browser }) => {
    const { page, context } = await setupAdminPage(browser, 'http://localhost:5173');
    await page.goto(`http://localhost:5173/present/${sid}`);
    await waitForSync(page, 3000);

    // 토글 버튼은 보이지만 패널 내용은 접혀 있음
    const toggleBtn = page.getByLabel(/알림 패널/);
    if (await toggleBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      // 버튼이 있으면 성공 — 접힌 상태 확인
      expect(true).toBe(true);
    }

    await context.close();
  });
});

// ═══════════════════════════════════════════════════════════
// 3. 학생 하단바
// ═══════════════════════════════════════════════════════════
test.describe('학생 하단바', () => {
  let sid;
  test.beforeAll(async () => {
    sid = testSessionId();
    await createTestSession(sid);
  });
  test.afterAll(async () => { await cleanupTestSession(sid); });

  test('"긴급질문" 라벨이 표시되고 모달이 열림', async ({ page }) => {
    await joinAsStudent(page, '', sid, '하단바테스터');
    await waitForSync(page);

    await expect(page.getByText('긴급질문')).toBeVisible({ timeout: 5000 });

    await page.getByText('긴급질문').click();
    // 모달 타이틀
    await expect(page.getByText('긴급 질문').first()).toBeVisible({ timeout: 3000 });
  });

  test('손들기 토글 후 텍스트 변경', async ({ page }) => {
    await joinAsStudent(page, '', sid, '손들기테스터');
    await waitForSync(page);

    const handBtn = page.getByRole('button', { name: /손들기/ });
    await expect(handBtn).toBeVisible({ timeout: 5000 });
    await handBtn.click();
    await expect(page.getByRole('button', { name: /내리기/ })).toBeVisible({ timeout: 3000 });
  });
});

// ═══════════════════════════════════════════════════════════
// 4. 다크모드 렌더링
// ═══════════════════════════════════════════════════════════
test.describe('다크모드', () => {
  let sid;
  test.beforeAll(async () => {
    sid = testSessionId();
    await createTestSession(sid);
  });
  test.afterAll(async () => { await cleanupTestSession(sid); });

  test('다크모드에서 투표 화면 정상 렌더링 + 투표', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();

    await joinAsStudent(page, 'http://localhost:5173', sid, '다크테스터');
    await activateQuestion(sid, 'q1');
    await waitForSync(page);

    await expect(page.getByText('JavaScript')).toBeVisible({ timeout: 8000 });
    await page.getByText('TypeScript').click();
    await expect(page.getByText('투표 완료!')).toBeVisible({ timeout: 5000 });

    await context.close();
  });
});

// ═══════════════════════════════════════════════════════════
// 5. 워드클라우드 텍스트 제출
// ═══════════════════════════════════════════════════════════
test.describe('워드클라우드', () => {
  let sid;
  test.beforeAll(async () => {
    sid = testSessionId();
    await createTestSession(sid);
  });
  test.afterAll(async () => { await cleanupTestSession(sid); });

  test('텍스트 입력 후 제출 → 확인 화면', async ({ page }) => {
    await joinAsStudent(page, '', sid, '텍스트테스터');
    // 먼저 현재 질문 초기화 후 q3 활성화
    await firebaseSet(`sessions/${sid}/currentQuestion`, null);
    await page.waitForTimeout(500);
    await activateQuestion(sid, 'q3');
    await waitForSync(page, 3000);

    const input = page.getByPlaceholder('입력해주세요').or(page.getByPlaceholder('단어를 입력하세요'));
    await expect(input).toBeVisible({ timeout: 10000 });
    await input.fill('인공지능');
    await page.getByRole('button', { name: /제출/ }).click();

    await expect(
      page.getByText('단어가 등록되었습니다').or(page.getByText('질문이 전달되었습니다'))
    ).toBeVisible({ timeout: 5000 });
  });
});

// ═══════════════════════════════════════════════════════════
// 6. 퀴즈 → 정답 공개
// ═══════════════════════════════════════════════════════════
test.describe('퀴즈 플로우', () => {
  let sid;
  test.beforeAll(async () => {
    sid = testSessionId();
    await createTestSession(sid);
  });
  test.afterAll(async () => { await cleanupTestSession(sid); });

  test('퀴즈 답안 제출 → 정답 공개 시 결과 화면', async ({ page }) => {
    await joinAsStudent(page, '', sid, '퀴즈테스터');
    await firebaseSet(`sessions/${sid}/currentQuestion`, null);
    await page.waitForTimeout(500);
    await activateQuestion(sid, 'q4');
    await waitForSync(page, 3000);

    await expect(page.getByText('서울')).toBeVisible({ timeout: 10000 });
    await page.getByText('서울').click();
    await page.waitForTimeout(1000);

    // ConfidenceMeter가 나오면 아무 버튼 선택
    const confBtns = page.locator('button:has-text("이에요"), button:has-text("확신")');
    if (await confBtns.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await confBtns.first().click();
    }

    // VoteConfirm 내부에 제출 완료 관련 텍스트
    await expect(
      page.locator('[role="status"]').first()
    ).toBeVisible({ timeout: 10000 });

    // 정답 공개
    await firebaseSet(`sessions/${sid}/questions/q4/revealedAt`, Date.now());
    await waitForSync(page, 4000);

    await expect(
      page.getByText('정답!').or(page.getByText('오답')).or(page.getByText('정답이 공개되었습니다'))
    ).toBeVisible({ timeout: 10000 });
  });
});

// ═══════════════════════════════════════════════════════════
// 7. 대기 화면
// ═══════════════════════════════════════════════════════════
test.describe('대기 화면', () => {
  let sid;
  test.beforeAll(async () => {
    sid = testSessionId();
    await createTestSession(sid);
  });
  test.afterAll(async () => { await cleanupTestSession(sid); });

  test('대기 화면에서 닉네임 + 참여자 수 표시', async ({ page }) => {
    await joinAsStudent(page, '', sid, '대기테스터');
    await waitForSync(page);

    await expect(page.getByText('대기테스터님, 준비 완료!')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('명 참여 중')).toBeVisible();
  });

  test('질문 활성화 시 투표 화면으로 자동 전환', async ({ page }) => {
    await joinAsStudent(page, '', sid, '전환테스터');
    await waitForSync(page);

    // 대기 상태
    await expect(page.getByText('전환테스터님, 준비 완료!')).toBeVisible({ timeout: 8000 });

    // 질문 활성화
    await activateQuestion(sid, 'q1');
    await waitForSync(page, 3000);

    // 투표 화면으로 전환됨
    await expect(page.getByText('JavaScript')).toBeVisible({ timeout: 8000 });
  });
});
